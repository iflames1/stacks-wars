import { request } from "@stacks/connect";
import { getClarityCode } from "@/lib/poolClarityCode";
import { getSponsoredClarityCode } from "../sponsoredPoolClarityCode";
import { getSponsoredFtClarityCode } from "../sponsoredFtPoolClarityCode";

export const transferFee = async (feeWallet: string) => {
	const feeAmount = 0.2 * 1_000_000; // 0.2 STX in microSTX

	try {
		return await request("stx_transferStx", {
			recipient: feeWallet,
			amount: feeAmount,
			network: "testnet",
		});
	} catch (error) {
		console.error("Failed to transfer fee", error);
		throw error;
	}
};

export const createGamePool = async (
	amount: number,
	name: string,
	deployer: string
) => {
	const clarityCode = getClarityCode(amount, deployer);
	try {
		return await request("stx_deployContract", {
			name,
			clarityCode,
			network: "testnet",
		});
	} catch (error) {
		console.error("Failed to deploy contract", error);
		throw error;
	}
};

export const createSponsoredGamePool = async (
	poolSize: number,
	name: string,
	deployer: string
) => {
	const clarityCode = getSponsoredClarityCode(poolSize, deployer);
	try {
		return await request("stx_deployContract", {
			name,
			clarityCode,
			network: "testnet",
		});
	} catch (error) {
		console.error("Failed to deploy contract", error);
		throw error;
	}
};

export const createSponsoredFtGamePool = async (
	tokenContract: `'${string}.${string}`,
	tokenName: string,
	poolSize: number,
	contractName: string,
	deployer: string
) => {
	const clarityCode = getSponsoredFtClarityCode(
		tokenContract,
		tokenName,
		poolSize,
		deployer
	);
	try {
		return await request("stx_deployContract", {
			name: contractName,
			clarityCode,
			network: "testnet",
		});
	} catch (error) {
		console.error("Failed to deploy FT sponsored contract", error);
		throw error;
	}
};
