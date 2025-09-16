import { request } from "@stacks/connect";
import { ClarityType, StxPostCondition } from "@stacks/transactions";
import { getClaimFromJwt } from "../getClaimFromJwt";
import { generatePoolSignature } from "./txSigner";

const poolContract = process.env
	.NEXT_PUBLIC_POOL_CONTRACT as `${string}.${string}`;

if (!poolContract) {
	throw new Error(
		"NEXT_PUBLIC_POOL_CONTRACT environment variable is not set"
	);
}

/**
 * Deposit STX to the pool contract
 */
export const depositToPool = async (amount: number): Promise<string> => {
	const address = await getClaimFromJwt<string>("wallet");
	if (!address) {
		throw new Error("No wallet address found");
	}

	const amountInMicroStx = Math.floor(amount * 1_000_000);

	try {
		const stxPostCondition: StxPostCondition = {
			type: "stx-postcondition",
			address,
			condition: "eq",
			amount: amountInMicroStx,
		};

		const response = await request("stx_callContract", {
			contract: poolContract,
			functionName: "deposit",
			functionArgs: [{ type: ClarityType.UInt, value: amountInMicroStx }],
			network: "testnet",
			postConditionMode: "deny",
			postConditions: [stxPostCondition],
		});

		if (!response.txid) {
			throw new Error("Failed to get transaction ID from deposit");
		}

		return response.txid;
	} catch (error) {
		console.error("Failed to deposit to pool:", error);
		throw error;
	}
};

/**
 * Claim winnings from the pool contract
 */
export const claimFromPool = async (depositId: number, amount: number) => {
	const address = await getClaimFromJwt<string>("wallet");
	if (!address) {
		throw new Error("No wallet address found");
	}

	const amountInMicroStx = Math.floor(amount * 1_000_000);

	try {
		const signature = await generatePoolSignature(
			1,
			amountInMicroStx,
			address
		);

		const stxPostCondition: StxPostCondition = {
			type: "stx-postcondition",
			address: poolContract,
			condition: "lte",
			amount: amountInMicroStx,
		};

		const response = await request("stx_callContract", {
			contract: poolContract,
			functionName: "claim",
			functionArgs: [
				{ type: ClarityType.UInt, value: depositId },
				{ type: ClarityType.UInt, value: amountInMicroStx },
				{ type: ClarityType.Buffer, value: signature },
			],
			network: "testnet",
			postConditionMode: "deny",
			postConditions: [stxPostCondition],
		});

		if (!response.txid) {
			throw new Error("Failed to get transaction ID from claim");
		}

		return response.txid;
	} catch (error) {
		console.error("Failed to claim from pool:", error);
		throw error;
	}
};
