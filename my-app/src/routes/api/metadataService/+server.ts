import { json } from '@sveltejs/kit';
import { storage } from '$lib/firebase';
import fs from 'fs';

export const POST = async ({cookies, request}) => {
    const data = await request.json();
    const { userAddress, token, productName } = data;

    const metadata = JSON.stringify({ token: token, history: [{[userAddress]: Date.now().toString()}], productName });
    fs.writeFileSync(`${token}.json`, metadata, "utf8");

    await storage.bucket('wrangler-5a833.appspot.com').upload(`${token}.json`);

    return json({ success: true });
};