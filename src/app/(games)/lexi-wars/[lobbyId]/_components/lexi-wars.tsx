"use client";
import GameHeader from "./game-header";
import GameRule from "./game-rule";
import GameTimer from "./game-timer";
import TurnIndicator from "./turn-indicator";
import LexiInputForm from "./lexi-input-form";
import GameOverModal from "./game-over-modal";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
	LexiWarsServerMessage,
	useLexiWarsSocket,
} from "@/hooks/useLexiWarsSocket";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/utils";
import ClaimRewardModal from "./claim-reward-modal";
import ConnectionStatus from "@/components/connection-status";
import { useRouter } from "next/navigation";
import Loading from "../loading";
import Back from "./back";
import { useChatSocketContext } from "@/contexts/ChatSocketProvider";
import { Player, PlayerStanding } from "@/types/schema/player";

interface LexiWarsProps {
	lobbyId: string;
	userId: string;
	contract: string | null;
	entryAmount: number | null;
	tokenSymbol: string;
}

export default function LexiWars({
	lobbyId,
	userId,
	contract,
	entryAmount,
	tokenSymbol,
}: LexiWarsProps) {
	const [word, setWord] = useState<string>("");

	const [turnState, setTurnState] = useState<{
		currentPlayer: Player | null;
		countdown: number | null;
	}>({
		currentPlayer: null,
		countdown: null,
	});
	const [rule, setRule] = useState<string>(
		"Word must be at least 4 characters!"
	);
	const [countdown, setCountdown] = useState<number>(15);
	const [rank, setRank] = useState<string | null>(null);
	const [finalStanding, setFinalStanding] = useState<PlayerStanding[] | null>(
		null
	);
	const [showPrizeModal, setShowPrizeModal] = useState(false);
	const [prizeAmount, setPrizeAmount] = useState<number | null>(null);
	const [isClaimed, setIsClaimed] = useState(false);
	const [latency, setLatency] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [gameStarted, setGameStarted] = useState<boolean>(false);
	const [startCountdown, setStartCountdown] = useState<number>(15);
	const [gameOver, setGameOver] = useState<boolean>(false);
	const [alreadyStarted, setAlreadyStarted] = useState<boolean>(false);
	const [warsPoint, setWarsPoint] = useState<number | null>(null);
	const [startFailed, setStartFailed] = useState<boolean>(false);

	const router = useRouter();

	const handleMessage = useCallback(
		(message: LexiWarsServerMessage) => {
			switch (message.type) {
				case "turn":
					setTurnState({
						currentPlayer: message.currentTurn,
						countdown: message.countdown,
					});
					break;
				case "rule":
					setRule(message.rule);
					break;
				case "countdown":
					setCountdown(message.time);
					break;
				case "rank":
					setRank(message.rank);
					toast.info(`Time's up!`, {
						description: `Your rank was ${message.rank}.`,
					});
					break;
				case "validate":
					toast.info(`${message.msg}`);
					break;
				case "wordEntry":
					toast.info(
						`${
							userId === message.sender.id
								? "You"
								: message.sender.user.displayName ||
									message.sender.user.username ||
									truncateAddress(
										message.sender.user.walletAddress
									)
						} entered: ${message.word}`
					);
					break;
				case "usedWord":
					toast.info(`${message.word} has already been used!`);
					break;
				case "gameOver":
					toast.info(`🏁 Game Over!`);
					setGameOver(true);
					break;
				case "finalStanding":
					setFinalStanding(message.standing);
					break;
				case "prize":
					setPrizeAmount(message.amount);
					if (message.amount > 0) {
						setShowPrizeModal(true);
						setIsClaimed(false);
					} else if (message.amount === 0) {
						setIsClaimed(true);
					}
					break;
				case "warsPoint":
					setWarsPoint(message.warsPoint);
					setShowPrizeModal(true);
					if (!contract) {
						setPrizeAmount(0);
					}
					break;
				case "pong":
					setLatency(message.pong);
					break;
				case "start":
					setStartCountdown(message.time);
					setGameStarted(message.started);
					break;
				case "startFailed":
					setStartFailed(true);
					break;
				case "alreadyStarted":
					setAlreadyStarted(true);
					break;
				default:
					console.warn("Unknown WS message type", message);
			}
		},
		[userId, contract]
	);

	const {
		sendMessage,
		readyState,
		reconnecting,
		forceReconnect,
		disconnect,
	} = useLexiWarsSocket({
		lobbyId,
		userId,
		onMessage: handleMessage,
	});

	useEffect(() => {
		if (alreadyStarted) {
			disconnect();

			if (contract && entryAmount !== null && entryAmount > 0) {
				toast.error("Failed to join game: Game already started", {
					description: "Leave the lobby to withdraw your entry fee.",
				});
			} else {
				toast.error("Failed to join game: Game already started");
			}
			router.replace(`/lobby/${lobbyId}`);
		}
	}, [alreadyStarted, disconnect, contract, entryAmount, lobbyId, router]);

	useEffect(() => {
		if (startFailed) {
			toast.error("Failed to start the game.", {
				description: "Not enough players connected.",
			});
			disconnect();
			router.replace(`/lobby/${lobbyId}`);
		}
	}, [startFailed, disconnect, lobbyId, router]);

	const { disconnectChat } = useChatSocketContext();

	useEffect(() => {
		const shouldDisconnect =
			finalStanding &&
			gameOver &&
			(contract ? prizeAmount !== null : true);

		console.log(
			"finalStanding:",
			finalStanding,
			"gameOver:",
			gameOver,
			"prizeAmount:",
			prizeAmount,
			"contract:",
			contract
		);

		if (shouldDisconnect) {
			console.log("🔌 Game completed with prizes, disconnecting...");
			disconnect();
			disconnectChat();
		}
	}, [
		finalStanding,
		gameOver,
		prizeAmount,
		contract,
		disconnect,
		disconnectChat,
	]);

	const handleSubmit = async (e?: FormEvent) => {
		setIsLoading(true);
		try {
			e?.preventDefault();
			await sendMessage({ type: "wordEntry", word: word.trim() });
			setWord("");
		} catch (error) {
			console.error("Failed to send word:", error);
			toast.error("Failed to send word. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	if (!gameStarted) {
		return (
			<Loading
				startCountdown={startCountdown}
				readyState={readyState}
				reconnecting={reconnecting}
				latency={latency}
				onForceReconnect={forceReconnect}
			/>
		);
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-background to-primary/30">
			<div className="max-w-3xl mx-auto p-4 sm:p-6 ">
				<div className="flex justify-between">
					<Back
						isOut={
							rank !== null || finalStanding !== null
								? true
								: false
						}
						disconnect={disconnect}
						disconnectChat={disconnectChat}
					/>
					<ConnectionStatus
						className="mb-4 sm:mb-6"
						readyState={readyState}
						latency={latency}
						reconnecting={reconnecting}
						onReconnect={forceReconnect}
					/>
				</div>
				<div className="space-y-3 sm:space-y-4">
					<GameHeader />

					<GameTimer timeLeft={countdown} />

					{turnState.currentPlayer &&
						turnState.currentPlayer.id === userId && (
							<GameRule currentRule={rule} />
						)}

					<div className="border border-primary/10 p-3 sm:p-4 bg-primary/10 rounded-xl shadow-sm space-y-4 sm:space-y-5">
						<TurnIndicator
							currentPlayer={turnState.currentPlayer}
							userId={userId}
							countdown={turnState.countdown}
						/>
						<LexiInputForm
							word={word}
							setWord={setWord}
							handleSubmit={handleSubmit}
							isLoading={isLoading}
						/>
					</div>
				</div>

				{showPrizeModal && (
					<ClaimRewardModal
						showPrizeModal={showPrizeModal}
						setShowPrizeModal={setShowPrizeModal}
						setIsClaimed={setIsClaimed}
						rank={rank}
						prizeAmount={prizeAmount}
						lobbyId={lobbyId}
						contractAddress={contract}
						warsPoint={warsPoint}
						tokenSymbol={tokenSymbol}
					/>
				)}

				{finalStanding && !showPrizeModal && (
					<GameOverModal
						standing={finalStanding}
						userId={userId}
						contractAddress={contract}
						isClaimed={isClaimed}
					/>
				)}

				<div className="sr-only" role="alert">
					This is a competitive typing game that requires manual
					keyboard input. Screen readers softwares are not supported
					for fair gameplay.
				</div>
			</div>
		</main>
	);
}
