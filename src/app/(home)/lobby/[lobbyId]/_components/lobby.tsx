"use client";
import { Loader } from "lucide-react";
import LobbyDetails from "./lobby-details";
import LobbyStats from "./lobby-stats";
import Participants from "./participants";
import JoinLobbyForm from "./join-lobby-form";
import GamePreview from "./game-preview";
import { Suspense, useEffect, useState } from "react";
import {
	GameType,
	Lobby as LobbyType,
	Participant,
	transParticipant,
} from "@/types/schema";
import { useLobbySocket } from "@/hooks/useLobbySocket";
import { toast } from "sonner";

interface LobbyProps {
	lobby: LobbyType;
	players: Participant[];
	userId: string;
	lobbyId: string;
	game: GameType;
}
export default function Lobby({
	lobby,
	players,
	userId,
	lobbyId,
	game,
}: LobbyProps) {
	const [joined, setJoined] = useState(false);
	const [participantList, setParticipantList] =
		useState<Participant[]>(players);
	const [countdown, setCountdown] = useState<number>(30);

	const isParticipant = participantList.some((p) => p.id === userId);

	const { disconnect, sendMessage } = useLobbySocket({
		roomId: lobbyId,
		enabled: joined,
		userId,
		onMessage: (message) => {
			console.log("WS message received:", message);

			switch (message.type) {
				case "playerjoined":
				case "playerleft":
				case "playerupdated":
					setParticipantList(message.players.map(transParticipant));
					break;
				case "playerkicked":
					console.log("Someone was kicked:", message.player_id);
					break;
				case "notifykicked":
					toast.error("You were kicked from the lobby.");
					setJoined(false);
					disconnect();
					break;
				case "countdown":
					setCountdown(message.time);
					break;
				case "gamestarting":
					// todo: trigger game start
					break;
				default:
					console.warn("Unknown WS message type", message);
			}
		},
	});

	useEffect(() => {
		if (isParticipant) {
			setJoined(true);
		}
	}, [isParticipant]);

	return (
		<div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
			{/* Main Content */}
			<div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
				{/* Stats Cards */}
				<LobbyStats lobby={lobby} players={participantList} />
				{/* Lobby Details */}
				<LobbyDetails
					lobby={lobby}
					players={participantList}
					countdown={countdown}
				/>
				<Participants
					lobby={lobby}
					players={participantList}
					userId={userId}
					sendMessage={sendMessage}
				/>
			</div>
			<div className="space-y-4 sm:space-y-6">
				<div className="lg:sticky lg:top-6 flex flex-col gap-4">
					<Suspense
						fallback={
							<div className="flex justify-center items-center py-6 sm:py-8">
								<Loader className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
							</div>
						}
					>
						<JoinLobbyForm
							lobby={lobby}
							players={participantList}
							lobbyId={lobbyId}
							userId={userId}
							sendMessage={sendMessage}
							disconnect={disconnect}
						/>
					</Suspense>
					<GamePreview game={game} />
				</div>
			</div>
		</div>
	);
}
