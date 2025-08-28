import { ClarityType, StxPostCondition } from "@stacks/transactions";
import { request } from "@stacks/connect";

export const kickFromPool = async (
	contract: `${string}.${string}`,
	playerAddress: string,
	amount: number
) => {
	try {
		amount = amount * 1_000_000;

		console.log(contract);

		const stxPostCondition: StxPostCondition = {
			type: "stx-postcondition",
			address: contract,
			condition: "eq",
			amount,
		};

		const response = await request("stx_callContract", {
			contract,
			functionName: "kick",
			functionArgs: [
				{ type: ClarityType.PrincipalStandard, value: playerAddress },
			],
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
