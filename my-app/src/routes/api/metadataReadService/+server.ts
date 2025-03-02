import { json } from '@sveltejs/kit';
import { storage } from '$lib/firebase';
import fs from 'fs';

export const POST = async ({cookies, request}) => {
    const data = await request.json();
    const { token } = data;

    await storage.bucket('wrangler-5a833.appspot.com').file(`${token}.json`).download({ destination: `${token}.json` });

    return json({ success: true });
};