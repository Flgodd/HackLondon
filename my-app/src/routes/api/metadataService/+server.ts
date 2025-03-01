import { json } from '@sveltejs/kit';

export const POST = async ({cookies, request}) => {
    const data = await request.json();
    const { userAddress, tokenId, productName } = data;
    
    fetch
    return json({ success: true });
};
