import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => {
	return cookies.get('userAddress') ? { userAddress: cookies.get('userAddress') } : {};
};