import { json } from '@sveltejs/kit';
import fs from 'fs';
import { CONTRACT_ADDRESS } from '$env/static/private';
import Web3 from 'web3';

export const GET = async () => {
    const contract = {
        address: CONTRACT_ADDRESS,
    }

    return json(contract);
};
