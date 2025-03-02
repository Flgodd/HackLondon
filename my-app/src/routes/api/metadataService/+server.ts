import { json } from '@sveltejs/kit';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { db } from '$lib/firebase';

export const POST = async ({cookies, request}) => {
    const data = await request.json();
    const { userAddress, token, productName } = data;

    const metadataRef = ref(getStorage(), `token-metadata/${token}.json`);
    
    const metadata = JSON.stringify({ token: token, history: [{[userAddress]: Date.now().toString()}], productName });
    await uploadString(metadataRef, metadata, "raw");

    return json({ success: true });
};
