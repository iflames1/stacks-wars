import { StxPostCondition } from "@stacks/transactions";
import { request } from "@stacks/connect";
import { getClaimFromJwt } from "../getClaimFromJwt";

export const joinGamePool = async (
	contract: `${string}.${string}`,
	amount: number
) => {
	const address = await getClaimFromJwt<string>("wallet");
	if (!address) {
		throw new Error("No wallet address found");
	}
	try {
		const stxPostCondition: StxPostCondition = {
			type: "stx-postcondition",
			address,
			condition: "eq",
			amount: amount * 1_000_000,
		};

		const response = await request("stx_callContract", {
			contract,
			functionName: "join-pool",
			functionArgs: [],
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

export const joinSponsoredGamePool = async (
	contract: `${string}.${string}`,
	isCreator: boolean,
	amount: number
) => {
	const address = await getClaimFromJwt<string>("wallet");
	if (!address) {
		throw new Error("No wallet address found");
	}
	try {
		let postConditions: StxPostCondition[] = [];

		if (isCreator) {
			const stxPostCondition: StxPostCondition = {
				type: "stx-postcondition",
				address,
				condition: "eq",
				amount: amount * 1_000_000,
			};
			postConditions = [stxPostCondition];
		}

		console.log(contract, postConditions);

		const response = await request("stx_callContract", {
			contract,
			functionName: "join-pool",
			functionArgs: [],
			network: "testnet",
			postConditionMode: "deny",
			postConditions,
		});
		return response.txid;
	} catch (error) {
		console.error("Wallet returned an error:", error);
		throw error;
	}
};
