<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    // Define types for metadata
    interface ProductMetadata {
        productName: string;
        owner: string;
        timestamp: number;
    }

    let tokenId = $state<string | undefined>(undefined);
    let metadata = $state<ProductMetadata | null>(null);
    let loading = $state(true);

    const derived = {
        tokenId: () => $page.params.tokenId
    };


    $effect(() => {
        tokenId = derived.tokenId();
    });

    $effect(() => {
        if (tokenId) {
            fetchMetadata();
        }
    });

    async function fetchMetadata() {
        if (!tokenId) return;

        loading = true;
        
        try {
            const response = await fetch(`https://localhost/products/${tokenId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            metadata = await response.json() as ProductMetadata;
        } catch (error) {
            console.error("Failed to fetch metadata:", error);
            metadata = null;
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        if (tokenId) {
            fetchMetadata();
        }
    });
</script>

<h1>Product Details for Token: {tokenId || 'Unknown'}</h1>

{#if loading}
    <p>Loading product details...</p>
{:else if metadata}
    <p>Product Name: {metadata.productName}</p>
    <p>Owner: {metadata.owner}</p>
    <p>Created On: {new Date(metadata.timestamp * 1000).toLocaleString()}</p>
{:else}
    <p>Product not found or metadata unavailable.</p>
{/if}
