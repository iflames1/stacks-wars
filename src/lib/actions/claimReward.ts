import { STACKS_TESTNET } from "@stacks/network";
import { ClarityType } from "@stacks/transactions";
import { generateSignature } from "./txSigner";
import { request } from "@stacks/connect";
export const NETWORK = STACKS_TESTNET;

export const claimPoolReward = async (
	walletAddress: string,
	contract: `${string}.${string}`,
	amount: number
) => {
	try {
		const signature = await generateSignature(amount, walletAddress);

		const response = await request("stx_callContract", {
			contract,
			functionName: "claim-reward",
			//functionName: "leave-pool",
			functionArgs: [
				{ type: ClarityType.UInt, value: amount },
				{ type: ClarityType.Buffer, value: signature },
			],
			network: "testnet",
		});
		return response.txid;
	} catch (error) {
		console.error("Error claiming reward:", error);
		throw error;
	}
};
