<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    let tokenId;
    let metadata;
    let loading = true;

    // Get tokenId from the URL
    $: tokenId = $page.params.tokenId;

    async function fetchMetadata() {
        if (!tokenId) return;

        try {
            const response = await fetch(`https://localhost/products/${tokenId}`);
            metadata = await response.json();
        } catch (error) {
            console.error("Failed to fetch metadata:", error);
        } finally {
            loading = false;
        }
    }

    onMount(fetchMetadata);
</script>

<h1>Product Details for Token: {tokenId}</h1>

{#if loading}
    <p>Loading product details...</p>
{:else if metadata}
    <p>Product Name: {metadata.productName}</p>
    <p>Owner: {metadata.owner}</p>
    <p>Created On: {new Date(metadata.timestamp * 1000).toLocaleString()}</p>
{:else}
    <p>Product not found or metadata unavailable.</p>
{/if}
