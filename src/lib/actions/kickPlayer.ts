import { ClarityType } from "@stacks/transactions";
import { request } from "@stacks/connect";

export const kickFromPool = async (
	contract: `${string}.${string}`,
	player: string
) => {
	try {
		const response = await request("stx_callContract", {
			contract,
			functionName: "kick",
			functionArgs: [
				{ type: ClarityType.PrincipalStandard, value: player },
			],
			network: "testnet",
		});
		return response.txid;
	} catch (error) {
		console.error("Wallet returned an error:", error);
		throw error;
	}
};
