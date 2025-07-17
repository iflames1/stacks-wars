"use client";
import BackToGames from "@/components/back-to-games";
import GameHeader from "./game-header";
import GameRule from "./game-rule";
import GameTimer from "./game-timer";
import TurnIndicator from "./turn-indicator";
import LexiInputForm from "./lexi-input-form";
import GameOverModal from "./game-over-modal";
import Keyboard from "./keyboard";
import { FormEvent, useCallback, useRef, useState } from "react";
import {
	LexiWarsServerMessage,
	PlayerStanding,
	useLexiWarsSocket,
} from "@/hooks/useLexiWarsSocket";
import { Participant, transParticipant } from "@/types/schema";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/utils";
import ClaimRewardModal from "./claim-reward-modal";

interface LexiWarsProps {
	lobbyId: string;
	userId: string;
	contract: string | null;
}

export default function LexiWars({ lobbyId, userId, contract }: LexiWarsProps) {
	const [word, setWord] = useState<string>("");
	const [layoutName, setLayoutName] = useState<string>("default");
	const inputRef = useRef<HTMLInputElement>(null);

	const [currentTurn, setCurrentTurn] = useState<Participant | null>(null);
	const [rule, setRule] = useState<string>(
		"Word must be at least 4 characters!"
	);
	const [countdown, setCountdown] = useState<number>(30);
	const [rank, setRank] = useState<string | null>(null);
	const [finalStanding, setFinalStanding] = useState<PlayerStanding[]>();
	const [showPrizeModal, setShowPrizeModal] = useState(false);
	const [prizeAmount, setPrizeAmount] = useState<number | null>(null);
	const [isClaimed, setIsClaimed] = useState(false);

	const handleMessage = useCallback(
		(message: LexiWarsServerMessage) => {
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
					break;
				case "finalstanding":
					setFinalStanding(message.standing);
					break;
				case "prize":
					if (message.amount && message.amount > 0) {
						setPrizeAmount(message.amount);
						setShowPrizeModal(true);
					}
					break;
				default:
					console.warn("Unknown WS message type", message);
			}
		},
		[userId]
	);

	const { sendMessage, readyState, error } = useLexiWarsSocket({
		lobbyId,
		userId,
		onMessage: handleMessage,
	});

	const handleSubmit = (e?: FormEvent) => {
		e?.preventDefault();
		console.log("submitting", word);
		if (word.trim() && readyState === WebSocket.OPEN) {
			sendMessage({ type: "wordentry", word });
			setWord("");
		}
	};

	const getErrorMessage = (error: Event | Error | null): string => {
		if (!error) return "Connection failed";

		if (error instanceof Error) {
			return error.message;
		}

		return "Connection failed";
	};

	if (error) {
		console.log("getting error", getErrorMessage(error));
	}

	const handleShift = () => {
		const newLayoutName = layoutName === "default" ? "shift" : "default";
		setLayoutName(newLayoutName);
	};

	const handleKeyboardInput = (key: string) => {
		if (key === "{bksp}") {
			setWord((prev) => prev.slice(0, -1));
		} else if (key === "{shift}") {
			handleShift();
		} else if (key === "{enter}") {
			handleSubmit();
		} else {
			setWord((prev) => prev + key);
		}
	};

	const isTouchDevice =
		typeof window !== "undefined" && "ontouchstart" in window;

	return (
		<main className="min-h-screen bg-gradient-to-b from-background to-primary/30">
			<div className="max-w-3xl mx-auto p-4 sm:p-6 ">
				<BackToGames />

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
							isTouchDevice={isTouchDevice}
							inputRef={inputRef}
							handleSubmit={handleSubmit}
						/>
					</div>
				</div>

				{isTouchDevice && (
					<Keyboard
						onKeyPress={handleKeyboardInput}
						layoutName={layoutName}
					/>
				)}

				<GameOverModal
					standing={finalStanding}
					userId={userId}
					contractAddress={contract}
					isClaimed={isClaimed}
				/>
				{rank && prizeAmount && (
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
