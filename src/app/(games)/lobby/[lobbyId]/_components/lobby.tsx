"use client";
import { ArrowLeft, Loader } from "lucide-react";
import LobbyDetails from "./lobby-details";
import LobbyStats from "./lobby-stats";
import Participants from "./participants";
import JoinLobbyForm from "./join-lobby-form";
import GamePreview from "./game-preview";
import { Suspense, useCallback, useEffect, useState } from "react";
import { LobbyServerMessage, useLobbySocket } from "@/hooks/useLobbySocket";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ConnectionStatus from "@/components/connection-status";
import ShareLinkButton from "./share-link-button";
import Link from "next/link";
import Loading from "@/app/(games)/lexi-wars/[lobbyId]/loading";
import { useChatSocketContext } from "@/contexts/ChatSocketProvider";
import { GameType } from "@/types/schema/game";
import {
	JoinState,
	lobbyState,
	Lobby as LobbyType,
	PendingJoin,
} from "@/types/schema/lobby";
import { Player } from "@/types/schema/player";

interface LobbyProps {
	lobby: LobbyType;
	players: Player[];
	userId: string;
	userWalletAddress: string;
	lobbyId: string;
	game: GameType;
}
export default function Lobby({
	lobby,
	players,
	userId,
	userWalletAddress,
	lobbyId,
	game,
}: LobbyProps) {
	const [joined, setJoined] = useState(false);
	const [participantList, setParticipantList] = useState<Player[]>(players);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [lobbyState, setLobbyState] = useState<lobbyState>(lobby.state);
	const [pendingPlayers, setPendingPlayers] = useState<PendingJoin[]>([]);
	const [joinState, setJoinState] = useState<JoinState>("idle");
	const [latency, setLatency] = useState<number | null>(null);
	const [readyPlayers, setReadyPlayers] = useState<string[] | null>(null);

	const router = useRouter();

	const isParticipant = participantList.some((p) => p.id === userId);

	const handleMessage = useCallback(
		(message: LobbyServerMessage) => {
			if (!(message.type === "pong")) {
				console.log("WS Lobby message received:", message);
			}

			switch (message.type) {
				case "playerUpdated":
					setParticipantList(message.players);
					break;
				case "playerKicked":
					toast.info(
						`${
							message.player.displayName ||
							message.player.username ||
							truncateAddress(message.player.walletAddress)
						} was kicked from the lobby.`
					);
					break;
				case "notifyKicked":
					toast.info("You were kicked from the lobby.");
					router.refresh();
					break;
				case "countdown":
					setCountdown(message.time);
					break;
				case "lobbyState":
					setLobbyState(message.state);
					setReadyPlayers(message.ready_players);
					break;
				case "pendingPlayers":
					setPendingPlayers(message.pending_players);
					const isInPending = message.pending_players.find(
						(p) => p.user.id === userId
					);
					if (isInPending) setJoinState(isInPending.state);
					break;
				case "playersNotReady":
					const notReadyPlayers = message.players;
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
		[router, userId]
	);

	const {
		sendMessage,
		readyState,
		reconnecting,
		forceReconnect,
		disconnect,
	} = useLobbySocket({
		lobbyId,
		userId,
		onMessage: handleMessage,
	});

	const { disconnectChat } = useChatSocketContext();

	useEffect(() => {
		if (isParticipant && !joined) {
			setJoined(true);
		} else if (!isParticipant && joined) {
			setJoined(false);
		}
	}, [isParticipant, joined]);

	useEffect(() => {
		if (readyPlayers && countdown === 0 && lobbyState === "inProgress") {
			disconnect();
			if (readyPlayers.includes(userId)) {
				router.replace(`/lexi-wars/${lobbyId}`);
			} else {
				router.replace(`/lobby`);
			}
			console.log("🔌 Lobby in progress, disconnecting...");
		} else if (lobbyState === "waiting") {
			//setCountdown(15);
		} else if (lobbyState === "finished") {
			disconnectChat();
			console.log("🔌 Game finished, disconnecting chat...");
		}
	}, [
		readyPlayers,
		countdown,
		lobbyState,
		userId,
		router,
		lobbyId,
		disconnect,
		disconnectChat,
	]);

	if (lobbyState === "inProgress" && countdown === 0) {
		return <Loading />;
	}

	return (
		<section className="bg-gradient-to-b from-primary/10 to-primary/30">
			<div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 ">
				<div className="flex items-center justify-between ">
					<Link
						href="/lobby"
						className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>Back to Lobby</span>
					</Link>
					<ShareLinkButton lobbyId={lobbyId} />
				</div>
				<ConnectionStatus
					readyState={readyState}
					latency={latency}
					reconnecting={reconnecting}
					onReconnect={forceReconnect}
				/>
				<div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3 mt-4 sm:mt-6">
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
									joinState={joinState}
									lobbyId={lobbyId}
									userId={userId}
									userWalletAddress={userWalletAddress}
									sendMessage={sendMessage}
									disconnect={disconnect}
									chatDisconnect={disconnectChat}
								/>
							</Suspense>
							<GamePreview game={game} />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
