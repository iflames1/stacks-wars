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
	PlayerStanding,
	useLexiWarsSocket,
} from "@/hooks/useLexiWarsSocket";
import { Participant, transParticipant } from "@/types/schema";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/utils";
import ClaimRewardModal from "./claim-reward-modal";
import ConnectionStatus from "@/components/connection-status";
import { useRouter } from "next/navigation";
import Loading from "../loading";
import Back from "./back";
import { useChatSocketContext } from "@/contexts/ChatSocketProvider";

interface LexiWarsProps {
	lobbyId: string;
	userId: string;
	contract: string | null;
}

export default function LexiWars({ lobbyId, userId, contract }: LexiWarsProps) {
	const [word, setWord] = useState<string>("");

	const [currentTurn, setCurrentTurn] = useState<Participant | null>(null);
	const [rule, setRule] = useState<string>(
		"Word must be at least 4 characters!"
	);
	const [countdown, setCountdown] = useState<number>(30);
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
	const [startCountdown, setStartCountdown] = useState<number>(10);
	const [messageReceived, setMessageReceived] = useState<boolean>(false);
	const [gameOver, setGameOver] = useState<boolean>(false);
	const [alreadyStarted, setAlreadyStarted] = useState<boolean>(false);

	const router = useRouter();

	const handleMessage = useCallback(
		(message: LexiWarsServerMessage) => {
			if (
				message.type !== "startfailed" &&
				message.type !== "start" &&
				message.type !== "pong"
			) {
				setMessageReceived(true);
			}
			switch (message.type) {
				case "turn":
					setCurrentTurn(transParticipant(message.current_turn));
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
					if (Number(message.rank) > 3) {
						setIsClaimed(true);
					}
					break;
				case "validate":
					toast.info(`${message.msg}`);
					break;
				case "wordentry":
					toast.info(
						`${
							userId === message.sender.id
								? "You"
								: message.sender.display_name ||
									truncateAddress(
										message.sender.wallet_address
									)
						} entered: ${message.word}`
					);
					break;
				case "usedword":
					toast.info(`${message.word} has already been used!`);
					break;
				case "gameover":
					toast.info(`🏁 Game Over!`);
					setGameOver(true);
					break;
				case "finalstanding":
					setFinalStanding(message.standing);
					break;
				case "prize":
					if (message.amount > 0) {
						setPrizeAmount(message.amount);
						setShowPrizeModal(true);
						setIsClaimed(false);
					} else {
						setIsClaimed(true);
					}
					break;
				case "pong":
					setLatency(message.pong);
					break;
				case "start":
					setStartCountdown(message.time);
					setGameStarted(message.started);
					break;
				case "startfailed":
					toast.error("Failed to start the game.", {
						description: "Not enough players connected.",
					});
					router.replace(`/lobby/${lobbyId}`);
					break;
				case "alreadystarted":
					setAlreadyStarted(true);
					break;
				default:
					console.warn("Unknown WS message type", message);
			}
		},
		[userId, router, lobbyId]
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

			if (contract) {
				toast.error("Failed to join game: Game already started", {
					description: "Leave the lobby to withdraw your entry fee.",
				});
				router.replace(`/lobby/${lobbyId}`);
			} else {
				toast.error("Failed to join game: Game already started");
				router.replace(`/lobby`);
			}
		}
	}, [alreadyStarted, disconnect, contract, lobbyId, router]);

	const { disconnectChat } = useChatSocketContext();

	useEffect(() => {
		const shouldDisconnect =
			finalStanding &&
			gameOver &&
			(contract ? prizeAmount !== null : true);

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
			await sendMessage({ type: "wordentry", word: word.trim() });
			setWord("");
		} catch (error) {
			console.error("Failed to send word:", error);
		} finally {
			setIsLoading(false);
		}
	};

	if (!gameStarted && !messageReceived) {
		return <Loading startCountdown={startCountdown} />;
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-background to-primary/30">
			<div className="max-w-3xl mx-auto p-4 sm:p-6 ">
				<div className="flex justify-between">
					<Back gameOver={gameOver} />
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

					<GameRule currentRule={rule} />

					<div className="border border-primary/10 p-3 sm:p-4 bg-primary/10 rounded-xl shadow-sm space-y-4 sm:space-y-5">
						<TurnIndicator
							currentPlayer={currentTurn}
							userId={userId}
						/>
						<LexiInputForm
							word={word}
							setWord={setWord}
							handleSubmit={handleSubmit}
							isLoading={isLoading}
						/>
					</div>
				</div>

				{/*{isTouchDevice && (
					<Keyboard
						onKeyPress={handleKeyboardInput}
						layoutName={layoutName}
					/>
				)}*/}

				<GameOverModal
					standing={finalStanding}
					userId={userId}
					contractAddress={contract}
					isClaimed={isClaimed}
				/>
				{prizeAmount && (
					<ClaimRewardModal
						showPrizeModal={showPrizeModal}
						setShowPrizeModal={setShowPrizeModal}
						setIsClaimed={setIsClaimed}
						rank={rank}
						prizeAmount={prizeAmount}
						lobbyId={lobbyId}
						contractAddress={contract}
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
