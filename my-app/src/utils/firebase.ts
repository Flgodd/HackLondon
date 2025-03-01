import { getStorage, ref, uploadString } from "firebase/storage";

/**
 * Generate a unique URI for token metadata storage in Firebase Storage without persisting any data
 * @param tokenId - The unique token ID
 * @returns A promise resolving to the URI for the metadata
 */
export async function generateTokenMetadataURI(tokenId: string): Promise<string> {
  try {
    const storage = getStorage();
    const metadataRef = ref(storage, `token-metadata/${tokenId}.json`);

    const metadata = JSON.stringify({ name: tokenId });
    await uploadString(metadataRef, metadata, "raw");
  
    return `gs://ChainTrack.appspot.com/${metadataRef.fullPath}`;
  } catch (error) {
    console.error("Error generating metadata URI:", error);
    throw error;
  }
}