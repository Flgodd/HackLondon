import { json } from '@sveltejs/kit';

export const POST = async ({cookies, request}) => {
    const data = await request.json();
	const { userAddress } = data;

    cookies.set('userAddress', userAddress, {
        path: '/',          // Makes the cookie available site-wide
        httpOnly: true,     // Prevents client-side JavaScript access
        sameSite: 'lax',    // Helps prevent CSRF
        maxAge: 60 * 60 * 24 * 7 // 7 days (in seconds)
    })

    return json({ success: true });
};
