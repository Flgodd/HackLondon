<script lang='ts'>
	import { onMount } from "svelte";
	import Button from "../lib/components/Button.svelte";
	import Textfield from "../lib/components/Textfield.svelte";
	import { faUser } from "@fortawesome/free-solid-svg-icons";
	import Web3, { Contract, type AbiItem } from 'web3';
	import type { PageProps } from "./$types";
	import abi from '$lib/ProductTrackerABI.json';

	let { data }: PageProps = $props();

	type metadataType = {
		history: [{[key: string]: string}]
		productName: string
	}

	let authenticated = $state(false);
	let hasMetamask = $state(false);
	let web3 = undefined;
	let contractAddress: string | undefined = undefined;
	let userAddress: string | undefined = undefined;
	let contract: Contract<AbiItem[]> | undefined = undefined;
	let token = $state('');
	let metadata: metadataType | undefined = $state(undefined);

	let buildContract = $derived(authenticated && web3 && contractAddress);

	$effect(() => {
		if(buildContract) {
			contract = new Contract<AbiItem[]>(
				abi,
				contractAddress!
			);
		}
	})

	$effect(() => console.log("token: ", token));

	onMount(async () => {
		// @ts-ignore
		if (window.ethereum) {
			hasMetamask = true;
		}

		if (data.userAddress) {
			userAddress = data.userAddress;
			authenticated = true;
			contractAddress = await fetchContract();
		}
	});

	const authWallet = async () => {
		//@ts-ignore
		web3 = new Web3(window.ethereum);

		// @ts-ignore
		await window.ethereum.request({ method: 'eth_requestAccounts' })

		const accounts = await web3.eth.getAccounts();
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

		//maybe swap user to correct network if necessary:
		//ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1' }] })
	}

	const fetchContract = async () => {
		const response = await fetch('../api/contractService', {
			method: 'GET',
		});
		const json = await response.json();

		return json.contractAddress;
	}

	const go = async () => {
		if(contract) {
			const uri: string = await contract.methods.getProductMetadata(token).call({from: userAddress})
			const resp = await fetch(uri, {
				method: 'GET',
			})

			metadata = await resp.json();
		}

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

	{#if metadata}
		{#each metadata.history as h}
			<p>{h}</p>
		{/each}
	{/if}

</div>
<div class='w-full h-96 bg-indigo-500'>
	
</div>
