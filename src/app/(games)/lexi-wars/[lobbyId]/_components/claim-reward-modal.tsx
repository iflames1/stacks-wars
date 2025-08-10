import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { claimPoolReward } from "@/lib/actions/claimReward";
import { waitForTxConfirmed } from "@/lib/actions/waitForTxConfirmed";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";

interface ClaimRewardModalProps {
	showPrizeModal: boolean;
	setShowPrizeModal: (show: boolean) => void;
	setIsClaimed: (claimed: boolean) => void;
	rank: string | null;
	prizeAmount: number | null;
	lobbyId: string;
	contractAddress: string | null;
	warsPoint: number | null;
}

export default function ClaimRewardModal({
	showPrizeModal,
	setShowPrizeModal,
	setIsClaimed,
	rank,
	prizeAmount,
	lobbyId,
	contractAddress,
	warsPoint,
}: ClaimRewardModalProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [countdown, setCountdown] = useState(10);

	// Determine if user has a prize to claim
	const hasPrize = contractAddress && prizeAmount && prizeAmount > 0;

	// Auto-close countdown for no-prize scenario
	useEffect(() => {
		if (!hasPrize && showPrizeModal) {
			const timer = setInterval(() => {
				setCountdown((prev) => {
					if (prev <= 1) {
						clearInterval(timer);
						setIsClaimed(true);
						setShowPrizeModal(false);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [hasPrize, setIsClaimed, setShowPrizeModal, showPrizeModal]);

	const handleClaim = async () => {
		try {
			if (!hasPrize) {
				toast.error("Something went wrong", {
					description: "Please contact support.",
				});
				return;
			}
			setIsLoading(true);
			const walletAddress = await getClaimFromJwt<string>("wallet");
			if (!walletAddress) {
				throw new Error("User not logged in");
			}
			if (!contractAddress) {
				throw new Error("Contract address is missing");
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

			await waitForTxConfirmed(claimTxId);

			await apiRequest({
				path: `/lobby/${lobbyId}/claim-state`,
				method: "PATCH",
				body: {
					claim: {
						status: "claimed",
						data: {
							tx_id: claimTxId,
						},
					},
				},
			});

			setIsClaimed(true);
			toast.success("Reward claimed successfully!");
			setShowPrizeModal(false);
		} catch (error) {
			console.error("Error claiming reward:", error);
			toast.error("Failed to claim reward. Please try again later.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={showPrizeModal} onOpenChange={setShowPrizeModal}>
			<DialogContent
				className="sm:max-w-[400px]"
				hideClose
				disableOutsideClose
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 justify-center text-xl">
						{hasPrize ? "🏆 Congratulations!" : "🎮 Game Complete!"}
					</DialogTitle>
					<DialogDescription className="text-center space-y-2">
						{rank && (
							<div>
								Your rank: <strong>{rank}</strong>
							</div>
						)}
						{hasPrize && (
							<div className="text-green-600 font-semibold">
								🎉 You won <strong>{prizeAmount} STX</strong>!
							</div>
						)}
						{warsPoint !== null && (
							<div>
								You earned{" "}
								<strong>
									{warsPoint} wars point
									{warsPoint !== 1 ? "s" : ""}
								</strong>
							</div>
						)}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="flex flex-col space-y-2">
					{hasPrize ? (
						<Button
							disabled={isLoading}
							onClick={handleClaim}
							className="w-full"
						>
							{isLoading ? "Claiming..." : "Claim Reward"}
						</Button>
					) : (
						<Button
							onClick={() => {
								setIsClaimed(true);
								setShowPrizeModal(false);
							}}
							className="w-full"
						>
							Okay ({countdown}s)
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
