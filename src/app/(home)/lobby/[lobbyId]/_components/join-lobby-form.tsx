import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { Lobby, Participant, Pool } from "@/types/schema";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { JoinState, LobbyClientMessage } from "@/hooks/useLobbySocket";
import { joinGamePool } from "@/lib/actions/joinGamePool";
import { waitForTxConfirmed } from "@/lib/actions/waitForTxConfirmed";
import { leaveGamePool } from "@/lib/actions/leaveGamePool";

interface JoinLobbyFormProps {
	lobby: Lobby;
	players: Participant[];
	pool: Pool | null;
	joinState: JoinState;
	lobbyId: string;
	userId: string;
	userWalletAddress: string;
	sendMessage: (msg: LobbyClientMessage) => Promise<void>;
}

export default function JoinLobbyForm({
	lobby,
	players,
	pool,
	joinState,
	userId,
	userWalletAddress,
	sendMessage,
}: JoinLobbyFormProps) {
	const [joined, setJoined] = useState(false);
	const [loading, setLoading] = useState(false);
	const isParticipant = players.some((p) => p.id === userId);
	const isCreator = userId === lobby.creatorId;

	useEffect(() => {
		if (isParticipant) setJoined(true);
	}, [isParticipant]);

	const handleClick = async () => {
		setLoading(true);

		try {
			if (joined) {
				if (isCreator) {
					toast.error("You can't leave the lobby as the creator");
					return;
				}
				if (lobby.contractAddress) {
					if (!pool) {
						throw new Error("No pool found for this lobby");
					}
					const contract =
						lobby.contractAddress as `${string}.${string}`;
					const leaveTxId = await leaveGamePool(
						userWalletAddress,
						contract,
						pool.entryAmount
					);
					if (!leaveTxId) {
						throw new Error(
							"Failed to leave game pool: missing transaction ID"
						);
					}

					await waitForTxConfirmed(leaveTxId);
				}
				await sendMessage({ type: "leaveroom" });
				setJoined(false);
				toast.info("You left the lobby");
				return;
			}

			if (joinState === "pending") return;

			if (joinState === "idle" || joinState === "rejected") {
				await sendMessage({ type: "requestjoin" });
				return;
			}

			if (joinState === "allowed") {
				// ⛏ Check if this lobby has a pool contract
				if (pool) {
					const contract =
						pool.contractAddress as `${string}.${string}`;
					const amount = pool.entryAmount;

					const joinTx = await joinGamePool(contract, amount);
					if (!joinTx.txid) {
						throw new Error(
							"Failed to join game pool: missing transaction ID"
						);
					}

					await waitForTxConfirmed(joinTx.txid);

					await sendMessage({
						type: "joinlobby",
						tx_id: joinTx.txid,
					});
				} else {
					await sendMessage({ type: "joinlobby", tx_id: undefined });
				}
			}
		} catch (error) {
			console.error("An error occured:", error);
			toast.error("Failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="bg-primary/10">
			<CardHeader>
				<CardTitle>{joined ? "Leave Lobby" : "Join Lobby"}</CardTitle>
				<CardDescription>
					{joined
						? "You're currently in this lobby"
						: "Join this lobby to participate in the game"}
				</CardDescription>
			</CardHeader>
			<CardFooter>
				<Button
					className="w-full"
					size="lg"
					variant={joined ? "destructive" : "default"}
					onClick={handleClick}
					disabled={loading || (!joined && joinState === "pending")}
				>
					{loading || joinState === "pending" ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							{joined ? "Leaving..." : "Processing..."}
						</>
					) : joined ? (
						isCreator ? (
							"Creator can't leave"
						) : (
							"Leave Lobby"
						)
					) : joinState === "allowed" ? (
						"Join Lobby"
					) : joinState === "idle" || joinState === "rejected" ? (
						"Request to Join"
					) : (
						"huh?"
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
