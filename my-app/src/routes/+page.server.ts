import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies, url }) => {
	return cookies.get('userAddress') ? { userAddress: cookies.get('userAddress'), token: url.searchParams.get('token') } : {};
};