import { json } from '@sveltejs/kit';
import { storage } from '$lib/firebase';

export const POST = async ({cookies, request}) => {
    const data = await request.json();
    const { token } = data;

    await storage.bucket('wrangler-5a833.appspot.com').file(`metadata/${token}.json`).download({ destination: `metadata/${token}.json` });

    return json({ success: true });
};