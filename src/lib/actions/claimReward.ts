import { ClarityType, StxPostCondition } from "@stacks/transactions";
import { generateSignature } from "./txSigner";
import { request } from "@stacks/connect";

export const claimPoolReward = async (
	walletAddress: string,
	contract: `${string}.${string}`,
	amount: number
) => {
	amount = Math.floor(amount * 1_000_000);

	try {
		const signature = await generateSignature(
			amount,
			walletAddress,
			contract
		);

		const stxPostCondition: StxPostCondition = {
			type: "stx-postcondition",
			address: contract,
			condition: "lte",
			amount,
		};

		const response = await request("stx_callContract", {
			contract,
			functionName: "claim-reward",
			functionArgs: [
				{ type: ClarityType.UInt, value: amount },
				{ type: ClarityType.Buffer, value: signature },
			],
			network: "testnet",
			postConditionMode: "deny",
			postConditions: [stxPostCondition],
		});
		return response.txid;
	} catch (error) {
		console.error("Error claiming reward:", error);
		throw error;
	}
};
