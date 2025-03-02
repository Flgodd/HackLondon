<script lang='ts'>
	import { onMount } from "svelte";
	import Button from "../lib/components/Button.svelte";
	import Textfield from "../lib/components/Textfield.svelte";
	import { faUser,faArrowUp, faLink, faArrowRight } from "@fortawesome/free-solid-svg-icons";
	import Web3, { Contract, type AbiItem } from 'web3';
	import type { PageProps } from "./$types";
	import abi from '$lib/ProductTrackerABI.json';
	import QRCode from "qrcode-generator";
	import { storage } from "$lib/firebase-client";
    import { ref, getDownloadURL } from "firebase/storage";
	import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
	import { icon } from "@fortawesome/fontawesome-svg-core";

	let { data }: PageProps = $props();

	type metadataType = {
		history: [{[key: string]: string}]
		productName: string
		token: string
	}

	let authenticated = $state(false);
	let hasMetamask = $state(false);
	let web3: Web3 | undefined = $state(undefined);
	let contractAddress: string | undefined = $state(undefined);
	let userAddress: string | undefined = $state(undefined);
	let contract: Contract<AbiItem[]> | undefined = undefined;
	let token = $state('');
	let metadata: metadataType | undefined = $state(undefined);
	let toAddress = $state('');
	let transactionHash = $state('');
	let productName = $state('');
	let successfulTransfer = $state(false);
	let successfulMint = $state(false);
	let loadingMint = $state(false);
	let loadingTransfer = $state(false);
	let qrCodeSrc = $state("");

	let buildContract = $derived(authenticated && web3 && contractAddress);

	function sleep(ms: number): Promise<void> {
    	return new Promise(resolve => setTimeout(resolve, ms));
	}

	$effect(() => {
		console.log("buildContract: ", buildContract, authenticated, web3, contractAddress)
		if(buildContract) {
			console.log("building contract")
			contract = new Contract<AbiItem[]>(
				abi,
				contractAddress!
			);
			contract.setProvider(web3?.currentProvider);
		}
	})

	$effect(() => {
		if(successfulMint) {
			sleep(10000).then(() => {
				successfulMint = false;
			})
		}
	});

	$effect(() => {
		if(successfulTransfer) {
			sleep(10000).then(() => {
				successfulTransfer = false;
			})
		}
	});

	onMount(async () => {
		// @ts-ignore
		if (window.ethereum) {
			hasMetamask = true;
		}

		if (data.userAddress) {
			console.log("Exsiting address found")
			userAddress = data.userAddress;
			authenticated = true;
			//@ts-ignore
			web3 = new Web3(window.ethereum);

			contractAddress = await fetchContract();
			console.log("contractAddress: ", contractAddress)
		}
	});

	const authWallet = async () => {
		//@ts-ignore
		web3 = new Web3(window.ethereum);

		// @ts-ignore
		await window.ethereum.request({ method: 'eth_requestAccounts' })
		
		const accounts = await web3.eth.getAccounts()
		userAddress = accounts[0];
		
		console.log("Users address: ", userAddress);

		//make a post request to the /cookieService api endpoint with fetch
		const response = await fetch('../api/cookieService', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ userAddress })
		});

		console.log("Response from cookieService: ", response);

		if(response.ok) {
			authenticated = true;
			contractAddress = await fetchContract();
		}
	}

	const fetchContract = async () => {
		const response = await fetch('../api/contractService', {
			method: 'GET',
		});
		const json = await response.json();
		console.log("fetchContract json: ", json)
		return json.address;
	}

	const go = async () => {
		if(contract) {
			successfulTransfer = false;
			loadingTransfer = false;

			const metadataRef = ref(storage, `${token}.json`);
			const url = await getDownloadURL(metadataRef);

			const response = await fetch(url, {method: 'GET'})
			metadata = await response.json()
			console.log("metadata: ", metadata)


		}
	}

	const transferOwnership = async () => {
		if(contract) {
			loadingTransfer = true;

			const sendObj = contract.methods.transferProduct(toAddress, token).send({from: userAddress});
			sendObj.on('transactionHash', function(hash){
				transactionHash = hash;
			});

			sendObj.on('receipt', function (receipt) {
				console.log("Transaction confirmed in a block:", receipt);
				loadingTransfer = false;
				successfulTransfer = true;
			});
		}
	}

	const mintProduct = async () => {
		if(contract) {
			console.log("minting ", web3?.currentProvider)
			loadingMint = true;

		contract.methods.publicMint('0').send({from: userAddress})
			.then(receipt => {
				console.log("Transaction Successful:", receipt);
				const token: any = receipt.events?.ProductMinted.returnValues['0']

				console.log("ProductMinted with token id, ", token);
				loadingMint = false;
				successfulMint = true;

				generateQRCode(token);

				fetch('../api/metadataService', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ userAddress, token: token.toString(), productName })
				});
			})
			.catch(error => {
				console.error("Transaction Failed:", error);
			});
		}
	}

	function generateQRCode(tokenId: string) {
        const qr = QRCode(0, "L");
        qr.addData(`https://localhost/product/${tokenId}`);
        qr.make();
        qrCodeSrc = qr.createDataURL(6, 6);
    }

</script>

<div class='flex flex-col gap-15 items-center justify-center w-full bg-indigo-900 p-20'>
	<h1 class='font-mono font-bold text-6xl pt-10 pl-10 text-white'>Welcome to ChainTrack!</h1>

	{#if authenticated}
		<div class='flex flex-col gap-2 items-center w-full'>
			<Textfield name="tokenId" placeholder="Token ID" size="lg" id="tokenId" bind:value={token}/>
			<Button click={go}>Go!</Button>
		</div>
	{:else if hasMetamask}
		<p class='font-mono font-bold text-3xl pt-10 pl-10 text-white'>Please authenticate your wallet. We need your address so you can own and transfer products! Please <a href='https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en&pli=1' >install the MetaMask chrome extension</a> to link your wallet.</p>
		<Button icon={faUser} click={authWallet}>Authenticate Wallet</Button>
	{:else}
		<p class='font-mono font-bold text-3xl pt-10 pl-10 text-white'>Please start by <a href='https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en&pli=1' >installing the MetaMask chrome extension</a> to link your wallet.</p>
	{/if}
</div>

<div class='w-full h-96 bg-indigo-500'>
	{#if metadata}
		{#each metadata.history as h}
		<div class='flex flex-row gap-5 items-center'>
			<p class='font-mono font-bold text-1xl pt-10 pl-10 text-white'>{Object.keys(h)}</p><FontAwesomeIcon icon={faArrowRight} class='font-mono font-bold text-1xl pt-10 pl-10 text-white' /><p class='font-mono font-bold text-1xl pt-10 pl-10 text-white'> {new Date(Number(Object.values(h).at(0)!)).toLocaleString()}</p> 
		</div>
		{/each}
		{console.log(Object.keys(metadata.history.at(-1)!).at(0), Object.keys(metadata.history).at(-1), userAddress)}
		{#if metadata.history.length > 0 && Object.keys(metadata.history.at(-1)!).at(0) === userAddress && !successfulTransfer}
			<Textfield name="addressTo" placeholder="To Address" size="lg" bind:value={toAddress}/>
			<Button icon={faArrowUp} click={transferOwnership} disabled={loadingTransfer}>    
				{loadingTransfer ? "Loading..." : "Transfer Ownership"}
			</Button>
		{/if}

		{#if successfulTransfer}
			<p>Transfer successful! Transaction hash: {transactionHash}</p>
		{/if}
	{/if}
</div>

<div class='w-full h-96 bg-indigo-700 flex flex-col gap-15 items-center justify-center'>
	{#if authenticated}
		<h1 class='font-mono font-bold text-5xl pt-10 pl-10 text-white'>Link a Product!</h1>
		<div class='flex flex-col gap-2 items-center w-full'>
			<Textfield name="productName" placeholder="Product Name" size="lg" bind:value={productName}/>
			<Button icon={faLink} click={mintProduct}>{loadingMint ? "Loading..." : "Link"}</Button>
		</div>
		{#if successfulMint}
			<p>Link successful! Transaction hash: {transactionHash}</p>
			<p>QR Code (scan to view product):</p>
            {#if qrCodeSrc}
                <img src={qrCodeSrc} alt="QR Code for product" />
            {/if}
		{/if}
	{/if}
</div>