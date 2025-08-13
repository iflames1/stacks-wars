import { request } from "@stacks/connect";
import { getClarityCode } from "@/lib/poolClarityCode";
import { getSponsoredClarityCode } from "../sponsoredPoolClarityCode";

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
