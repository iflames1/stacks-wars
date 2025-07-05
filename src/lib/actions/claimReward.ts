import { STACKS_TESTNET } from "@stacks/network";
import {
	SignedContractCallOptions,
	ClarityType,
	makeContractCall,
	broadcastTransaction,
} from "@stacks/transactions";
import { generateSignature } from "./txSigner";
import { request } from "@stacks/connect";
export const NETWORK = STACKS_TESTNET;

export const claimPoolReward1 = async (
	claimerAddress: string,
	contract: `${string}.${string}`,
	amount: number,
	senderKey: string
) => {
	try {
		const signature = await generateSignature(amount, claimerAddress);

		const [contractAddress, contractName] = contract.split(".");
		const txOptions: SignedContractCallOptions = {
			contractAddress,
			contractName,
			functionName: "claim-reward",
			functionArgs: [
				{ type: ClarityType.UInt, value: amount },
				{ type: ClarityType.Buffer, value: signature },
			],
			senderKey,
			network: NETWORK,
			postConditionMode: "allow",
		};

		const transaction = await makeContractCall(txOptions);
		const txId = (await broadcastTransaction({ transaction })).txid;
		return txId;
	} catch (error) {
		console.error("Error claiming reward:", error);
		throw error;
	}
};

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
