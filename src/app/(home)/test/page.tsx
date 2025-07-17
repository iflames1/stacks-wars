"use client";
import { Button } from "@/components/ui/button";
import { claimPoolReward } from "@/lib/actions/claimReward";
import { createGamePool } from "@/lib/actions/createGamePool";
import { joinGamePool } from "@/lib/actions/joinGamePool";
//import { getSignerPublicKey } from "@/lib/actions/txSigner";
import { waitForTxConfirmed } from "@/lib/actions/waitForTxConfirmed";
import { apiRequest, ApiRequestProps } from "@/lib/api";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TestPage() {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const contract =
		"STF0V8KWBS70F0WDKTMY65B3G591NN52PR4Z71Y3.fhpKW-stacks-wars";
	const entry_amount = 5;
	const gameName = "Lexi Wars";
	const gameId = "096b7f01-aea6-46a0-be9f-d1ddf4c05786"; // lexi wars
	const lobbyId = "5bf95dce-3f2b-42cf-badc-6966663eae9f";

	useEffect(() => {});
	//console.log("public key", getSignerPublicKey());

	const deployContract = async () => {
		const walletAddress = await getClaimFromJwt<string>("wallet");
		setIsLoading(true);
		try {
			if (!walletAddress) {
				throw new Error("User not logged in");
			}
			const contractName = `${nanoid(5)}-stacks-wars`;
			const contract = `${walletAddress}.${contractName}`;

			const deployTx = await createGamePool(
				entry_amount,
				contractName,
				walletAddress
			);

			if (!deployTx.txid) {
				throw new Error(
					"Failed to deploy game pool: missing transaction ID"
				);
			}
			try {
				await waitForTxConfirmed(deployTx.txid);
				console.log("✅ Deploy Transaction confirmed!");
			} catch (err) {
				console.error("❌ TX failed or aborted:", err);
			}
		} catch (err) {
			console.error("Error deploying contract:", err);
			toast.error("Failed to deploy contract. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleJoinPool = async () => {
		setIsLoading(true);
		console.log("Joining game pool...");
		try {
			const joinTx = await joinGamePool(contract, entry_amount);
			if (!joinTx.txid) {
				throw new Error(
					"Failed to join game pool: missing transaction ID"
				);
			}
			try {
				await waitForTxConfirmed(joinTx.txid);
				console.log("✅ Join Transaction confirmed!");
			} catch (err) {
				console.error("❌ TX failed or aborted:", err);
			}

			//const tx_id = joinTx.txid;
			////const tx_id =
			////	"0x817f47664d47ede4b4fb289cc2039c0250c102aca1eb7453a559397111b2b6ff";
			//const apiParams: ApiRequestProps = {
			//	path: "room",
			//	method: "POST",
			//	body: {
			//		name: "Flames Test",
			//		description: "With pool",
			//		entry_amount,
			//		contract_address: contract,
			//		tx_id,
			//		game_id: gameId,
			//		game_name: gameName,
			//	},
			//	tag: "lobby",
			//	revalidateTag: "lobby",
			//	revalidatePath: "/lobby",
			//};
			//const lobbyId = await apiRequest<string>(apiParams);
			//toast.info("Please wait while we redirect you to your lobby");
			//router.replace(`/lobby/${lobbyId}`);
		} catch (error) {
			console.error("Error joining game pool:", error);
			toast.error("Failed to join game pool. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClaim = async () => {
		const walletAddress = await getClaimFromJwt<string>("wallet");
		try {
			setIsLoading(true);
			const prizeAmount = 5;
			if (!walletAddress) {
				throw new Error("User not logged in");
			}
			const contractAddress = contract as `${string}.${string}`;
			const claimTxId = await claimPoolReward(
				walletAddress,
				contractAddress,
				prizeAmount
			);
			if (!claimTxId) {
				throw new Error(
					"Failed to join game pool: missing transaction ID"
				);
			}
			try {
				await waitForTxConfirmed(claimTxId);
				console.log("✅ Claim Transaction confirmed!");
			} catch (err) {
				console.error("❌ TX failed or aborted:", err);
			}

			//await apiRequest({
			//	path: `/room/${lobbyId}/claim-state`,
			//	method: "PUT",
			//	body: {
			//		claim: {
			//			status: "Claimed",
			//			data: {
			//				tx_id: claimTxId,
			//			},
			//		},
			//	},
			//});
		} catch (error) {
			console.error("Error claiming reward:", error);
			toast.error("Failed to claim reward. Please try again later.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex gap-4 p-4">
			<Button disabled={isLoading} onClick={deployContract}>
				{isLoading ? "Deploying..." : "Deploy Contract"}
			</Button>
			<Button disabled={isLoading} onClick={handleJoinPool}>
				{isLoading ? "Joining..." : "Join Pool"}
			</Button>
			<Button disabled={isLoading} onClick={handleClaim}>
				{isLoading ? "Claiming..." : "Claim"}
			</Button>
		</div>
	);
}
