"use client";
import { Loader } from "lucide-react";
import LobbyDetails from "./lobby-details";
import LobbyStats from "./lobby-stats";
import Participants from "./participants";
import JoinLobbyForm from "./join-lobby-form";
import GamePreview from "./game-preview";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
	GameType,
	lobbyStatus,
	Lobby as LobbyType,
	Participant,
	transParticipant,
} from "@/types/schema";
import {
	LobbyServerMessage,
	PendingJoin,
	useLobbySocket,
} from "@/hooks/useLobbySocket";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
	const [lobbyState, setLobbyState] = useState<lobbyStatus>(
		lobby.lobbyStatus
	);
	const [pendingPlayers, setPendingPlayers] = useState<PendingJoin[]>([]);
	const router = useRouter();

	const isParticipant = participantList.some((p) => p.id === userId);

	const handleMessage = useCallback(
		(message: LobbyServerMessage) => {
			console.log("WS message received:", message);

			switch (message.type) {
				case "playerjoined":
					setParticipantList(message.players.map(transParticipant));
					break;
				case "playerleft":
					setParticipantList(message.players.map(transParticipant));
					break;
				case "playerupdated":
					setParticipantList(message.players.map(transParticipant));
					break;
				case "playerkicked":
					toast.info(
						`${
							message.display_name ||
							truncateAddress(message.wallet_address)
						} was kicked from the lobby.`
					);
					router.refresh();
					break;
				case "notifykicked":
					toast.info("You were kicked from the lobby.");
					break;
				case "countdown":
					setCountdown(message.time);
					break;
				case "gamestate":
					setLobbyState(message.state);

					if (message.ready_players) {
						if (message.ready_players.includes(userId)) {
							router.push(`/lexi-wars/${lobbyId}`);
						} else {
							router.push(`/lobby`);
						}
					}
					break;
				case "pendingplayers":
					setPendingPlayers(message.pending_players);
					break;
				case "error":
					toast.error(`Error: ${message.message}`);
					break;
				default:
					console.warn("Unknown WS message type", message);
			}
		},
		[router, lobbyId, userId]
	);

	const disconnectRef = useRef<(() => void) | null>(null);

	const { disconnect, sendMessage } = useLobbySocket({
		roomId: lobbyId,
		userId,
		onMessage: handleMessage,
	});

	useEffect(() => {
		disconnectRef.current = disconnect;
	}, [disconnect]);

	useEffect(() => {
		if (isParticipant && !joined) {
			setJoined(true);
		} else if (!isParticipant && joined) {
			setJoined(false);
		}
	}, [isParticipant, joined]);

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
					lobbyState={lobbyState}
					sendMessage={sendMessage}
					userId={userId}
				/>
				<Participants
					lobby={lobby}
					players={participantList}
					pendingPlayers={pendingPlayers}
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
							pendingPlayers={pendingPlayers}
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
