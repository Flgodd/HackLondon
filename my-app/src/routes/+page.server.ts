import type { Actions, PageServerLoad } from './$types';

export const actions = {
		go: async ({ cookies, request }) => {
			const data = await request.formData();
			const token = data.get("tokenId");

			//get current token mapping to uri
	
			return { go: true };
		},
		auth: async ({ cookies, request }) => {
			const data = await request.formData();

			//get current token mapping to uri
			
			return { auth: true };
		}
	
} satisfies Actions;

export const load: PageServerLoad = ({ cookies }) => {
	return cookies.get('userAddress') ? { userAddress: cookies.get('userAddress') } : {};
};