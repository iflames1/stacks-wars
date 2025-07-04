import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import React, { useState } from "react";
import { claimPoolReward } from "@/lib/actions/claimReward";
import { waitForTxConfirmed } from "@/lib/actions/waitForTxConfirmed";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";

interface ClaimRewardModalProps {
	showPrizeModal: boolean;
	setShowPrizeModal: (show: boolean) => void;
	rank: string;
	prizeAmount: number;
	lobbyId: string;
	contractAddress: string | null;
}

export default function ClaimRewardModal({
	showPrizeModal,
	setShowPrizeModal,
	rank,
	prizeAmount,
	lobbyId,
	contractAddress,
}: ClaimRewardModalProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleClaim = async () => {
		try {
			setIsLoading(true);
			const walletAddress = await getClaimFromJwt<string>("wallet");
			if (!walletAddress) {
				throw new Error("User not logged in");
			}
			const contract = contractAddress as `${string}.${string}`;
			const claimTxId = await claimPoolReward(
				walletAddress,
				contract,
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

			await apiRequest({
				path: `/room/${lobbyId}/claim-state`,
				method: "PUT",
				body: {
					claim: {
						status: "Claimed",
						data: {
							tx_id: claimTxId,
						},
					},
				},
			});
		} catch (error) {
			console.error("Error claiming reward:", error);
			toast.error("Failed to claim reward. Please try again later.");
		}
	};
	return (
		<Dialog open={showPrizeModal} onOpenChange={setShowPrizeModal}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 justify-center text-xl">
						🏆 Claim Your Prize!
					</DialogTitle>
					<DialogDescription className="text-center">
						Your rank: <strong>{rank}</strong> <br />
						Reward: <strong>{prizeAmount} STX</strong>
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="flex flex-col space-y-2">
					<Button
						disabled={isLoading}
						onClick={handleClaim}
						className="w-full"
					>
						Claim Reward
					</Button>
					<Button
						variant="ghost"
						className="w-full text-muted-foreground"
						onClick={() => setShowPrizeModal(false)}
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
