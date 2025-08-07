import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LobbyClientMessage } from "@/hooks/useLobbySocket";
import { joinGamePool } from "@/lib/actions/joinGamePool";
import { waitForTxConfirmed } from "@/lib/actions/waitForTxConfirmed";
import { leaveGamePool } from "@/lib/actions/leaveGamePool";
import { useRouter } from "next/navigation";
import { JoinState, Lobby } from "@/types/schema/lobby";
import { Player } from "@/types/schema/player";

interface JoinLobbyFormProps {
	lobby: Lobby;
	players: Player[];
	joinState: JoinState;
	lobbyId: string;
	userId: string;
	userWalletAddress: string;
	sendMessage: (msg: LobbyClientMessage) => Promise<void>;
	disconnect: () => void;
	chatDisconnect: () => void;
}

export default function JoinLobbyForm({
	lobby,
	players,
	joinState,
	userId,
	userWalletAddress,
	sendMessage,
	disconnect,
	chatDisconnect,
}: JoinLobbyFormProps) {
	const [joined, setJoined] = useState(false);
	const [loading, setLoading] = useState(false);
	const isParticipant = players.some((p) => p.id === userId);
	const isCreator = userId === lobby.creator.id;

	const router = useRouter();

	useEffect(() => {
		if (isParticipant) setJoined(true);
	}, [isParticipant]);

	const handleClick = async () => {
		setLoading(true);

		try {
			if (joined) {
				if (isCreator && players.length > 1) {
					toast.error("You can't leave the lobby with participants", {
						description:
							"Please remove all participants before leaving.",
					});
					return;
				}
				if (lobby.contractAddress && lobby.entryAmount) {
					const contract =
						lobby.contractAddress as `${string}.${string}`;
					const leaveTxId = await leaveGamePool(
						userWalletAddress,
						contract,
						lobby.entryAmount
					);
					if (!leaveTxId) {
						throw new Error(
							"Failed to leave game pool: missing transaction ID"
						);
					}

					await waitForTxConfirmed(leaveTxId);
				}
				await sendMessage({ type: "leaveLobby" });
				setJoined(false);
				toast.info("You left the lobby");
				if (isCreator) {
					disconnect();
					chatDisconnect();
					router.replace(`/lobby`);
				}
				return;
			}

			if (joinState === "pending") return;

			if (joinState === "idle" || joinState === "rejected") {
				await sendMessage({ type: "requestJoin" });
				return;
			}

			if (joinState === "allowed") {
				if (lobby.contractAddress && lobby.entryAmount) {
					const contract =
						lobby.contractAddress as `${string}.${string}`;
					const amount = lobby.entryAmount;

					const joinTx = await joinGamePool(contract, amount);
					if (!joinTx.txid) {
						throw new Error(
							"Failed to join game pool: missing transaction ID"
						);
					}

					await waitForTxConfirmed(joinTx.txid);

					await sendMessage({
						type: "joinLobby",
						tx_id: joinTx.txid,
					});
				} else {
					await sendMessage({ type: "joinLobby", tx_id: undefined });
				}
			}
		} catch (error) {
			console.error("An error occured:", error);
			toast.error("Failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const getButtonText = () => {
		if (loading || joinState === "pending") {
			return joined ? "Leaving..." : "Processing...";
		}

		if (joined) {
			return isCreator ? "Leave and Delete Lobby" : "Leave Lobby";
		}

		switch (joinState) {
			case "allowed":
				return "Join Lobby";
			case "idle":
			case "rejected":
				return "Request to Join";
			default:
				return "Unknown State";
		}
	};

	return (
		<Card className="bg-primary/10 overflow-hidden">
			<CardHeader className="pb-3">
				<CardTitle className="truncate">
					{joined ? "Leave Lobby" : "Join Lobby"}
				</CardTitle>
				<CardDescription className="break-words">
					{joined
						? "You're currently in this lobby"
						: "Join this lobby to participate in the game"}
				</CardDescription>
			</CardHeader>
			<CardFooter className="pt-3">
				<Button
					className="w-full"
					size="lg"
					variant={joined ? "destructive" : "default"}
					onClick={handleClick}
					disabled={loading || (!joined && joinState === "pending")}
				>
					{(loading || joinState === "pending") && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
					)}
					<span className="truncate">{getButtonText()}</span>
				</Button>
			</CardFooter>
		</Card>
	);
}
