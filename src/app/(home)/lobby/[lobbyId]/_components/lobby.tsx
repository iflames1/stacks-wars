"use client";
import { Loader } from "lucide-react";
import LobbyDetails from "./lobby-details";
import LobbyStats from "./lobby-stats";
import Participants from "./participants";
import JoinLobbyForm from "./join-lobby-form";
import GamePreview from "./game-preview";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
	GameType,
	lobbyStatus,
	Lobby as LobbyType,
	Participant,
	Pool,
	transParticipant,
} from "@/types/schema";
import {
	JoinState,
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
	pool: Pool | null;
	userId: string;
	userWalletAddress: string;
	lobbyId: string;
	game: GameType;
}
export default function Lobby({
	lobby,
	players,
	pool,
	userId,
	userWalletAddress,
	lobbyId,
	game,
}: LobbyProps) {
	const [joined, setJoined] = useState(false);
	const [participantList, setParticipantList] =
		useState<Participant[]>(players);
	const [countdown, setCountdown] = useState<number>(15);
	const [lobbyState, setLobbyState] = useState<lobbyStatus>(
		lobby.lobbyStatus
	);
	const [pendingPlayers, setPendingPlayers] = useState<PendingJoin[]>([]);
	const [joinState, setJoinState] = useState<JoinState>("idle");
	const [latency, setLatency] = useState<number | null>(null);

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
					router.refresh();
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
					if (message.state === "waiting") {
						setCountdown(15);
					}
					break;
				case "pendingplayers":
					setPendingPlayers(message.pending_players);
					const isInPending = message.pending_players.find(
						(p) => p.user.id === userId
					);
					if (isInPending) setJoinState(isInPending.state);
					break;
				case "playersnotready":
					const notReadyPlayers =
						message.players.map(transParticipant);
					notReadyPlayers.forEach((p) => {
						toast.error(
							`${p.username || truncateAddress(p.walletAddress)} is not ready`
						);
					});
					break;
				case "allowed":
					setJoinState(message.type);
					toast.success("Join request approved!");
					break;
				case "rejected":
					setJoinState(message.type);
					toast.info("Join request was dropped");
					break;
				case "pending":
					setJoinState(message.type);
					toast.info("Your join request is pending approval");
					break;
				case "error":
					toast.error(`Error: ${message.message}`);
					break;
				case "pong":
					setLatency(message.pong);
					break;
				default:
					console.warn("Unknown WS message type", message);
			}
		},
		[router, lobbyId, userId]
	);

	const { sendMessage } = useLobbySocket({
		roomId: lobbyId,
		userId,
		onMessage: handleMessage,
	});

	useEffect(() => {
		if (isParticipant && !joined) {
			setJoined(true);
		} else if (!isParticipant && joined) {
			setJoined(false);
		}
	}, [isParticipant, joined]);

	const getLatencyColor = (ms: number) => {
		if (ms <= 60) return "text-green-500"; // very good
		if (ms <= 120) return "text-yellow-500"; // good
		if (ms <= 250) return "text-orange-500"; // bad
		return "text-red-500"; // very bad
	};

	return (
		<>
			{latency !== null && (
				<span className={`text-xs ${getLatencyColor(latency)} `}>
					{Math.min(latency, 999)}ms
				</span>
			)}
			<div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3 mt-4 sm:mt-6">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
					{/* Stats Cards */}
					<LobbyStats
						lobby={lobby}
						players={participantList}
						pool={pool}
					/>
					{/* Lobby Details */}
					<LobbyDetails
						lobby={lobby}
						pool={pool}
						players={participantList}
						countdown={countdown}
						lobbyState={lobbyState}
						sendMessage={sendMessage}
						userId={userId}
					/>
					<Participants
						lobby={lobby}
						pool={pool}
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
							{userId !== lobby.creatorId && (
								<JoinLobbyForm
									lobby={lobby}
									players={participantList}
									pool={pool}
									joinState={joinState}
									lobbyId={lobbyId}
									userId={userId}
									userWalletAddress={userWalletAddress}
									sendMessage={sendMessage}
								/>
							)}
						</Suspense>
						<GamePreview game={game} />
					</div>
				</div>
			</div>
		</>
	);
}
