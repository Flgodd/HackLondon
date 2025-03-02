import { json } from '@sveltejs/kit';
import { storage } from '$lib/firebase';
import fs from 'fs';

export const POST = async ({cookies, request}) => {
    const data = await request.json();
    const { userAddress, token, productName } = data;

    let fileString = '{}';
    try {
        fileString = fs.readFileSync(`metadata/${token}.json`, "utf8"); // Read file as string
    } catch (error: any) {
        if (error.code === "ENOENT") {
            console.log(`File not found:, contuninung`);
            
        }
        else{
            throw error; // If it's another error, rethrow it
        }
    }

    const oldMetadata = JSON.parse(fileString);
    console.log("oldMetadata: ", oldMetadata, oldMetadata.history);

    oldMetadata.history = oldMetadata.history ? oldMetadata.history : [];
    oldMetadata.history.push({[userAddress]: Date.now().toString()})

    const metadata = JSON.stringify({ token: token, history: oldMetadata.history, productName });

    fs.writeFileSync(`metadata/${token}.json`, metadata, "utf8");

    await storage.bucket('wrangler-5a833.appspot.com').upload(`metadata/${token}.json`);

    return json({ success: true });
};