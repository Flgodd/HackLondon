<script lang='ts'>
	import { onMount } from "svelte";
	import Button from "../lib/components/Button.svelte";
	import Textfield from "../lib/components/Textfield.svelte";
	import { faUser,faArrowUp, faLink, faArrowRight, faBars} from "@fortawesome/free-solid-svg-icons";
	import Web3, { Contract, type AbiItem } from 'web3';
	import type { PageProps } from "./$types";
	import abi from '$lib/ProductTrackerABI.json';
	import QRCode from "qrcode-generator";
	import { storage } from "$lib/firebase-client";
    import { ref, getDownloadURL } from "firebase/storage";
	import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";

	let { data }: PageProps = $props();

	type metadataType = {
		history: [{[key: string]: string}]
		productName: string
		token: string
	}
	let currentView = $state('home');
	let authenticated = $state(false);
	let hasMetamask = $state(false);
	let web3: Web3 | undefined = $state(undefined);
	let contractAddress: string | undefined = $state(undefined);
	let userAddress: string | undefined = $state(undefined);
	let contract: Contract<AbiItem[]> | undefined = undefined;
	let token = $state('');
	let metadata: metadataType | undefined = $state(undefined);
	let toAddress = $state('');
	let productName = $state('');
	let successfulTransfer = $state(false);
	let successfulMint = $state(false);
	let loadingMint = $state(false);
	let loadingTransfer = $state(false);
	let qrCodeSrc = $state("");
	let isMenuOpen = $state(false);
	let isNavVisible = $state(false);
	let invalidTokenError = $state(false);


	let buildContract = $derived(authenticated && web3 && contractAddress);

	function sleep(ms: number): Promise<void> {
    	return new Promise(resolve => setTimeout(resolve, ms));
	}

	$effect(() => {
		console.log("buildContract: ", buildContract, authenticated, web3, contractAddress)
		if(buildContract) {
			buildContractFn();

			if (data.token){
				token = data.token;
				go();
			}
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

	const buildContractFn = () => {
		console.log("building contract")
			contract = new Contract<AbiItem[]>(
				abi,
				contractAddress!
			);
			contract.setProvider(web3?.currentProvider);
	}

	const toggleMenu = () => {
		isMenuOpen = !isMenuOpen;
		isNavVisible = !isNavVisible;
	}

	const navigateTo = (view: string) => {
		currentView = view;
		isMenuOpen = false; // Close menu after selection
	}

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
		try {
			// Reset states
			invalidTokenError = false;
			successfulTransfer = false;
			loadingTransfer = false;

			// Get metadata from Firebase using the token
			const metadataRef = ref(storage, `${token}.json`);
			const url = await getDownloadURL(metadataRef);

			const response = await fetch(url, {method: 'GET'});
			
			if (response.ok) {
				metadata = await response.json();
				console.log("metadata: ", metadata);
			} else {
				console.error("Failed to fetch metadata:", response.statusText);
				invalidTokenError = true;
				metadata = undefined;
			}
		} catch (error: any) {
			console.error("Error fetching metadata:", error);
			
			if (error.code === "storage/object-not-found") {
				console.log("Invalid token: object not found");
				invalidTokenError = true;
				metadata = undefined;
			} else {
				console.error("Other error occurred:", error);
			}
		}
	} else {
		console.warn("Contract not initialized");
	}
}

	const transferOwnership = async () => {
		if(contract) {
			loadingTransfer = true;

			contract.methods.transferProduct(toAddress, token).send({from: userAddress})
			.then(receipt => {
				console.log("Transaction Successful:", receipt);
				const token: any = receipt.events?.OwnershipTransferred.returnValues['0']
				const to: any = receipt.events?.OwnershipTransferred.returnValues['2']

				console.log("OwnershipTransferred with token id, ", token, to);
				loadingTransfer = false;
				successfulTransfer = true;

				fetch('../api/metadataReadService', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ token: token.toString() })
				});

				fetch('../api/metadataService', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ userAddress: to, token: token.toString(), productName })
				});
			})
			.catch(error => {
				console.error("trsanfer Failed:", error);
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
        qr.addData(`https://localhost?token=${tokenId}`);
        qr.make();
        qrCodeSrc = qr.createDataURL(6, 6);
    }

</script>

<div class='flex flex-col gap-5 items-center absolute top-1 left-[85%]'>
	<img src="/Chain_logo-r.png" alt="Menu" class="w-45 h-42 rounded-full" />
</div>

<div class='flex flex-col gap-5 items-center absolute top-10 left-10'>
	<div>
		<Button icon={faBars} click={toggleMenu}></Button>
	</div>
</div>

<!-- Navigation Bar (Hidden Initially) -->
{#if isMenuOpen}
    <div 
		class="absolute top-10 left-1/2 transform -translate-x-1/2 w-[50%] max-w-lg bg-blue-600 shadow-md p-2 rounded-lg z-40 transition-transform scale-95 animate-fadeIn flex justify-center"
    >
        <ul class="flex gap-6 text-white font-bold text-lg ">
            <li>
                <button class="py-2 px-4 hover:bg-indigo-700 rounded" onclick={() => navigateTo('home')}>Home</button>
            </li>
            <li>
                <button class="py-2 px-4 hover:bg-indigo-700 rounded" onclick={() => navigateTo('products')}>Products</button>
            </li>
            <li>
                <button class="py-2 px-4 hover:bg-indigo-700 rounded" onclick={() => navigateTo('profile')}>Profile</button>
            </li>
            <li>
                <button class="py-2 px-4 hover:bg-indigo-700 rounded" onclick={() => navigateTo('history')}>Get History</button>
            </li>
        </ul>
    </div>
{/if}

<style>
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .animate-fadeIn {
        animation: fadeIn 0.2s ease-out;
    }
    
    @keyframes bounce {
        0%, 100% {
            transform: translateY(5px);
        }
        50% {
            transform: translateY(-5px);
        }
    }
    
    .animate-bounce {
        animation: bounce 4.0s ease-in-out infinite;
    }
</style>

<!-- Home View -->
{#if currentView === 'home'}
<div class='flex flex-col gap-15 items-center justify-center w-full bg-indigo-900 p-20'>
	<h1 class='font-mono font-bold text-6xl pt-10 pl-10 text-white'>Welcome to ChainTrack!</h1>

	{#if authenticated}
		<div class='flex flex-col gap-10 items-center w-full'>
			<div class="animate-bounce">
				<Textfield name="tokenId" placeholder="Token ID" size="lg" id="tokenId" bind:value={token}/>
			</div>
			<Button click={go}>Go!</Button>
		</div>
	{:else if hasMetamask}
		<p class='font-mono font-bold text-3xl pt-10 pl-10 text-white'>Please authenticate your wallet. We need your address so you can own and transfer products! Please <a href='https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en&pli=1' >install the MetaMask chrome extension</a> to link your wallet.</p>
		<Button icon={faUser} click={authWallet}>Authenticate Wallet</Button>
	{:else}
		<p class='font-mono font-bold text-3xl pt-10 pl-10 text-white'>Please start by <a href='https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en&pli=1' >installing the MetaMask chrome extension</a> to link your wallet.</p>
	{/if}
</div>

<div class='w-full bg-indigo-500 p-20'>
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
			<p class='font-mono font-bold text-1xl pt-10 pl-10 text-white'>Transfer successful</p>
		{/if}
	{/if}
</div>
{/if}

{#if currentView === 'products'}
<div class='w-full bg-indigo-700 flex flex-col gap-15 items-center justify-center p-20'>
	{#if authenticated}
		<h1 class='font-mono font-bold text-5xl pt-10 pl-10 text-white'>Link a Product!</h1>
		<div class='flex flex-col gap-2 items-center w-full'>
			<div class="animate-bounce">
			<Textfield name="productName" placeholder="Product Name" size="lg" bind:value={productName}/>
			</div>
			<Button icon={faLink} click={mintProduct}>{loadingMint ? "Loading..." : "Link"}</Button>
		</div>
		{#if successfulMint}
			<p class='font-mono font-bold text-2xl p-5 text-white'>Link successful!</p>
			<p class='font-mono font-bold text-2xl p-5 text-white'>QR Code (scan to view product):</p>
            {#if qrCodeSrc}
                <img src={qrCodeSrc} alt="QR Code for product" />
            {/if}
		{/if}
	{/if}
</div>
{/if}

{#if currentView === 'profile'}
<div class='w-full bg-indigo-800 flex flex-col gap-15 items-center justify-center p-20'>
	<h1 class='font-mono font-bold text-5xl pt-10 pl-10 text-white'>Profile</h1>
	{#if authenticated}
		<p class='font-mono text-2xl text-white'>Connected Address: {userAddress}</p>
	{:else}
		<p class='font-mono font-bold text-3xl pt-10 pl-10 text-white'>Please authenticate your wallet to view your profile.</p>
		<Button icon={faUser} click={authWallet}>Authenticate Wallet</Button>
	{/if}
</div>
{/if}

{#if currentView === 'history'}
<div class='w-full min-h-screen bg-indigo-900 flex flex-col gap-15 items-center justify-center'>
    <h1 class='font-mono font-bold text-5xl pt-10 pl-10 text-white'>Get Product History</h1>
    <div class='flex flex-col gap-10 items-center w-full'>
        <div class="animate-bounce">
            <Textfield name="tokenId" placeholder="Token ID" size="lg" id="tokenId" bind:value={token}/>
        </div>
        <Button click={go}>Get History</Button>
    </div>
    
    {#if metadata && metadata.history && metadata.history.length > 0}
        <div class="flex flex-col items-center w-full max-w-lg my-8">
            <h2 class='font-mono font-bold text-3xl mb-6 text-white'>Product: {metadata.productName}</h2>
            
            {#each metadata.history as historyItem, index}
                <!-- Owner Address Capsule -->
                <div class="w-full max-w-md bg-blue-800 rounded-full py-3 px-6 flex flex-col items-center justify-center">
                    <p class='font-mono text-base text-white overflow-hidden text-ellipsis'>
                        {Object.keys(historyItem).length > 0 ? Object.keys(historyItem)[0] : 'Unknown'}
                    </p>
                    <p class="text-xs text-blue-200 mt-1">
                        {new Date(Number(Object.values(historyItem)[0])).toLocaleString()}
                    </p>
                </div>
                
                <!-- Timestamp with arrow (if not the last item) -->
                {#if index < metadata.history.length - 1}
                    <div class="flex flex-col items-center my-2">
                        <div class="h-16 w-2 bg-blue-700"></div>
                        <div class="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-blue-700"></div>
                    </div>
                    <div class="mb-4 text-white text-center">
                        {new Date(Number(Object.values(historyItem)[0])).toLocaleString()}
                    </div>
                {/if}
            {/each}
            
            {#if metadata.history.length > 0 && Object.keys(metadata.history.at(-1) || {}).at(0) === userAddress && !successfulTransfer}
				<div class="w-full max-w-md mt-8">
					<Textfield name="addressTo" placeholder="To Address" size="lg" bind:value={toAddress}/>
					<div class="mt-4 flex justify-center">
						<Button icon={faArrowUp} click={transferOwnership} disabled={loadingTransfer}>    
							{loadingTransfer ? "Loading..." : "Transfer Ownership"}
						</Button>
					</div>
				</div>
            {/if}
        </div>
        
        {#if successfulTransfer}
            <div class="mt-4 p-4 bg-green-600 rounded-lg text-white">
                <p>Transfer successful!</p>
            </div>
        {/if}
	{:else if invalidTokenError}
	<div class="mt-8 p-4 bg-red-600 rounded-lg">
		<p class='font-mono text-2xl text-white'>Invalid Token ID. Please enter a valid token.</p>
	</div>
    {:else if metadata}
        <p class='font-mono text-2xl text-white mt-8'>No history available for this product.</p>
    {:else}
        <p class='font-mono text-2xl text-white mt-8'>Enter a token ID to see its history.</p>
    {/if}
</div>
{/if}