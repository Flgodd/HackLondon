import type { Actions, PageServerLoad } from './$types';

export const actions = {
		transferOwnership: async ({ cookies, request }) => {
			const data = await request.formData();
			const token = data.get("token");
			const toAddress = data.get("toAddress");

			return { go: true };
		}
	
} satisfies Actions;

export const load: PageServerLoad = ({ cookies }) => {
	return cookies.get('userAddress') ? { userAddress: cookies.get('userAddress') } : {};
};