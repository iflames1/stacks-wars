import { ClarityType, StxPostCondition } from "@stacks/transactions";
import { request } from "@stacks/connect";
import { generateSignature } from "./txSigner";

export const leaveGamePool = async (
	walletAddress: string,
	contract: `${string}.${string}`,
	amount: number
) => {
	amount = amount * 1_000_000;

	try {
		const signature = await generateSignature(
			amount,
			walletAddress,
			contract
		);

		const stxPostCondition: StxPostCondition = {
			type: "stx-postcondition",
			address: contract,
			condition: "eq",
			amount,
		};

		const response = await request("stx_callContract", {
			contract,
			functionName: "leave-pool",
			functionArgs: [{ type: ClarityType.Buffer, value: signature }],
			network: "testnet",
			postConditionMode: "deny",
			postConditions: [stxPostCondition],
		});
		return response.txid;
	} catch (error) {
		console.error("Wallet returned an error:", error);
		throw error;
	}
};
