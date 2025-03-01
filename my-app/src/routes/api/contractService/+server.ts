import { json } from '@sveltejs/kit';

export const GET = async () => {
    const contract = {
        address: '0x20948b8138073FE1e86E6432cD69Fe77B5cD8B9D',
    }

    return json(contract);
};
