import { createClient } from "@stacks/blockchain-api-client";

const TESTNET_URL = "https://api.testnet.hiro.so";
// TODO: Switch to mainnet on launch
// const MAINNET_URL = "https://api.mainnet.hiro.so";
export const client = createClient({
	baseUrl: TESTNET_URL,
});

export const getBalamce = async (address: string) => {
	try {
		const { data } = await client.GET(
			"/extended/v1/address/{principal}/balances",
			{
				params: {
					path: { principal: address },
				},
			}
		);
		return data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};
