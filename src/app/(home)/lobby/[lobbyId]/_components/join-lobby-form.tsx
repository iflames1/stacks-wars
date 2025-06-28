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
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { isConnected } from "@stacks/connect";
import { LobbyClientMessage } from "@/hooks/useLobbySocket";

interface JoinLobbyFormProps {
	lobby: Lobby;
	players: Participant[];
	lobbyId: string;
	userId: string;
	sendMessage: (msg: LobbyClientMessage) => void;
	disconnect: () => void;
}

export default function JoinLobbyForm({
	lobby,
	players,
	lobbyId,
	userId,
	sendMessage,
	disconnect,
}: JoinLobbyFormProps) {
	const [joined, setJoined] = useState(false);
	const [loading, setLoading] = useState(false);

	const isFull = players.length >= lobby.maxPlayers;
	const isParticipant = players.some((p) => p.id === userId);

	useEffect(() => {
		if (isParticipant) setJoined(true);
	}, [isParticipant]);

	const handleJoin = async () => {
		setLoading(true);
		try {
			await apiRequest({
				path: `room/${lobbyId}/join`,
				method: "PUT",
				revalidatePath: `/lobby/${lobbyId}`,
				revalidateTag: "lobby",
			});
			setJoined(true);
			toast.success("Joined lobby successfully!");
		} catch (err) {
			toast.error("Failed to join lobby");
			console.error(err);
		}
		setLoading(false);
	};

	const handleLeave = () => {
		setLoading(true);
		sendMessage({ type: "leaveroom" });
		disconnect();
		setJoined(false);
		toast.info("You left the lobby");
		setLoading(false);
	};

	const handleClick = () => {
		if (loading) return;
		if (joined) {
			handleLeave();
		} else {
			handleJoin();
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
					disabled={
						loading || (!joined && (!isConnected() || isFull))
					}
				>
					{loading ? (
						<>
							<Loader className="mr-2 h-4 w-4 animate-spin" />
							{joined ? "Leaving..." : "Joining..."}
						</>
					) : joined ? (
						"Leave Lobby"
					) : isFull ? (
						"Lobby is Full"
					) : (
						"Join Lobby"
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
