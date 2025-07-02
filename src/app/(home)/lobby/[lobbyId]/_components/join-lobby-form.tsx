import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { Lobby, Participant } from "@/types/schema";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { isConnected } from "@stacks/connect";
import { LobbyClientMessage, PendingJoin } from "@/hooks/useLobbySocket";

interface JoinLobbyFormProps {
	lobby: Lobby;
	players: Participant[];
	pendingPlayers: PendingJoin[];
	lobbyId: string;
	userId: string;
	sendMessage: (msg: LobbyClientMessage) => void;
	disconnect: () => void;
}

export default function JoinLobbyForm({
	lobby,
	players,
	pendingPlayers,
	userId,
	sendMessage,
	disconnect,
}: JoinLobbyFormProps) {
	const [joined, setJoined] = useState(false);
	const [loading, setLoading] = useState(false);
	const isParticipant = players.some((p) => p.id === userId);
	const isCreator = userId === lobby.creatorId;

	const userRequest = pendingPlayers.find((p) => p.user.id === userId);
	const userJoinState = userRequest?.state || "idle";

	useEffect(() => {
		if (isParticipant) setJoined(true);
	}, [isParticipant]);

	const handleClick = () => {
		setLoading(true);

		if (joined) {
			if (isCreator) {
				toast.error("You can't leave the lobby as the creator");
				setLoading(false);
				return;
			}

			sendMessage({ type: "leaveroom" });
			disconnect();
			setJoined(false);
			toast.info("You left the lobby");
			return;
		}

		if (userJoinState === "idle" || userJoinState === "rejected") {
			sendMessage({ type: "requestjoin" });
			toast.info("Join request sent");
			return;
		}

		if (userJoinState === "allowed") {
			sendMessage({ type: "joinlobby" });
			return;
		}

		setLoading(false);
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
					disabled={
						loading ||
						(!joined &&
							(!isConnected() || userJoinState === "pending"))
					}
				>
					{loading ? (
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
					) : userJoinState === "pending" ? (
						"Request Sent"
					) : userJoinState === "allowed" ? (
						"Join Lobby"
					) : (
						"Request to Join"
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
