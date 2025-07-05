import { StxPostCondition } from "@stacks/transactions";
import { request } from "@stacks/connect";
import { toast } from "sonner";
import { getClaimFromJwt } from "../getClaimFromJwt";

export const joinGamePool = async (
	contract: `${string}.${string}`,
	amount: number
) => {
	const address = await getClaimFromJwt<string>("wallet");
	if (!address) {
		toast.error("No wallet address found", {
			description: "Please connect your wallet",
		});
		throw new Error("No wallet address found");
	}
	try {
		const stxPostCondition: StxPostCondition = {
			type: "stx-postcondition",
			address,
			condition: "eq",
			amount: amount * 1000000,
		};

		return await request("stx_callContract", {
			contract,
			functionName: "join-pool",
			functionArgs: [],
			network: "testnet",
			postConditionMode: "deny",
			postConditions: [stxPostCondition],
		});
	} catch (error) {
		toast.error("Failed to join pool", {
			description: "Please try again",
		});
		console.error("Wallet returned an error:", error);
		throw error;
	}
};
