import { STACKS_TESTNET } from "@stacks/network";
import {
	SignedContractCallOptions,
	ClarityType,
	makeContractCall,
	broadcastTransaction,
} from "@stacks/transactions";
import { generateSignature } from "./txSigner";
export const NETWORK = STACKS_TESTNET;

export const claimPoolReward = async (
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
