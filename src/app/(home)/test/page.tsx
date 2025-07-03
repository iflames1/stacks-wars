"use client";
import { Button } from "@/components/ui/button";
//import { joinGamePool } from "@/lib/actions/join-game-pool";
//import { waitForTxConfirmed } from "@/lib/actions/waitForTxConfirmed";
import { apiRequest, ApiRequestProps } from "@/lib/api";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export default function TestPage() {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const contract =
		"STF0V8KWBS70F0WDKTMY65B3G591NN52PR4Z71Y3.U0WxJ-stacks-wars";
	const entry_amount = 5;
	const gameName = "Lexi Wars";
	const gameId = "096b7f01-aea6-46a0-be9f-d1ddf4c05786"; // lexi wars

	const handleJoinPool = async () => {
		setIsLoading(true);
		console.log("Joining game pool...");
		try {
			//const joinTx = await joinGamePool(contract, entry_amount);
			//if (!joinTx.txid) {
			//	throw new Error(
			//		"Failed to join game pool: missing transaction ID"
			//	);
			//}
			//try {
			//	await waitForTxConfirmed(joinTx.txid);
			//	console.log("✅ Join Transaction confirmed!");
			//} catch (err) {
			//	console.error("❌ TX failed or aborted:", err);
			//}

			//const tx_id = joinTx.txid;
			const tx_id =
				"0x817f47664d47ede4b4fb289cc2039c0250c102aca1eb7453a559397111b2b6ff";
			const apiParams: ApiRequestProps = {
				path: "room",
				method: "POST",
				body: {
					name: "Flames Test",
					description: "With pool",
					entry_amount,
					contract_address: contract,
					tx_id,
					game_id: gameId,
					game_name: gameName,
				},
				tag: "lobby",
				revalidateTag: "lobby",
				revalidatePath: "/lobby",
			};
			const lobbyId = await apiRequest<string>(apiParams);
			toast.info("Please wait while we redirect you to your lobby");
			router.replace(`/lobby/${lobbyId}`);
		} catch (error) {
			console.error("Error joining game pool:", error);
			toast.error("Failed to join game pool. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};
	return (
		<div>
			<Button disabled={isLoading} onClick={handleJoinPool}>
				{isLoading ? "Joining..." : "Join Pool"}
			</Button>
		</div>
	);
}
