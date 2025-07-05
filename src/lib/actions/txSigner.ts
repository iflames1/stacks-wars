import {
	principalCV,
	serializeCV,
	signMessageHashRsv,
	tupleCV,
	uintCV,
} from "@stacks/transactions";
import { generateWallet } from "@stacks/wallet-sdk";
import { createHash } from "crypto";

const secretKey = process.env.NEXT_PUBLIC_TRUSTED_SIGNER_SECRET_KEY;

const getSignerPrivateKey = async () => {
	if (!secretKey) {
		throw new Error("Secret key is not defined in environment variables");
	}
	const wallet = await generateWallet({ secretKey, password: "" });

	const privateKey = wallet.accounts[0].stxPrivateKey;

	return privateKey;
};

export const generateSignature = async (
	amount: number,
	claimerAddress: string
) => {
	const message = tupleCV({
		amount: uintCV(amount),
		winner: principalCV(claimerAddress),
	});
	const serialized = serializeCV(message); // Serializes the tuple
	const buffer = Buffer.from(serialized, "hex");
	const hash = createHash("sha256").update(buffer).digest(); // creates hashed clarity message

	const privateKey = await getSignerPrivateKey();

	return signMessageHashRsv({
		messageHash: hash.toString("hex"),
		privateKey,
	});
};
