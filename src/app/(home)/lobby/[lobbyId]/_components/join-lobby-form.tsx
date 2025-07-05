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
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { JoinState, LobbyClientMessage } from "@/hooks/useLobbySocket";
import { joinGamePool } from "@/lib/actions/joinGamePool";
import { waitForTxConfirmed } from "@/lib/actions/waitForTxConfirmed";

interface JoinLobbyFormProps {
	lobby: Lobby;
	players: Participant[];
	pool: Pool | null;
	joinState: JoinState;
	lobbyId: string;
	userId: string;
	sendMessage: (msg: LobbyClientMessage) => void;
	disconnect: () => void;
}

export default function JoinLobbyForm({
	lobby,
	players,
	pool,
	joinState,
	userId,
	sendMessage,
	disconnect,
}: JoinLobbyFormProps) {
	const [joined, setJoined] = useState(false);
	const [loading, setLoading] = useState(false);
	const isParticipant = players.some((p) => p.id === userId);
	const isCreator = userId === lobby.creatorId;

	useEffect(() => {
		if (isParticipant) setJoined(true);
	}, [isParticipant]);

	const handleClick = async () => {
		if (loading) return;
		setLoading(true);

		try {
			if (joined) {
				if (isCreator) {
					toast.error("You can't leave the lobby as the creator");
					return;
				}
				sendMessage({ type: "leaveroom" });
				disconnect();
				setJoined(false);
				toast.info("You left the lobby");
				return;
			}

			if (joinState === "pending") return;

			if (joinState === "idle" || joinState === "rejected") {
				sendMessage({ type: "requestjoin" });
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

					sendMessage({ type: "joinlobby", tx_id: joinTx.txid });
				} else {
					sendMessage({ type: "joinlobby", tx_id: undefined });
				}
			}
		} catch (error) {
			console.error("Join failed:", error);
			toast.error("Join failed. Please try again.");
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
							<Loader className="mr-2 h-4 w-4 animate-spin" />
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
