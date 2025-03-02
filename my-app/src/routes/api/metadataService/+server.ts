import { json } from '@sveltejs/kit';
import { storage } from '$lib/firebase';
import fs from 'fs';

export const POST = async ({cookies, request}) => {
    const data = await request.json();
    const { userAddress, token, productName } = data;

    const oldMetadata = JSON.parse(fs.readFileSync(`metadata/${token}.json`, "utf8"));
    console.log("oldMetadata: ", oldMetadata, oldMetadata.history);
    
    const metadata = JSON.stringify({ token: token, history: oldMetadata.history.push({[userAddress]: Date.now().toString()}), productName });
    fs.writeFileSync(`metadata/${token}.json`, metadata, "utf8");

    await storage.bucket('wrangler-5a833.appspot.com').upload(`metadata/${token}.json`);

    return json({ success: true });
};