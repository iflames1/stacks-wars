"use client";
import BackToGames from "@/components/back-to-games";
import GameHeader from "./game-header";
import GameRule from "./game-rule";
import GameTimer from "./game-timer";
import TurnIndicator from "./turn-indicator";
import LexiInputForm from "./lexi-input-form";
import GameOverModal from "./game-over-modal";
import Keyboard from "./keyboard";
import { FormEvent, useRef, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getWalletAddress } from "@/lib/wallet";

const GameHeaderProps = {
	score: 0,
	highScore: 0,
};

const GameRuleProps = {
	currentRule: "Type the word shown below as fast as you can!",
	repeatCount: 0,
	requiredRepeats: 5,
};

const LexiInputFormProps = {
	isPlaying: true,
	word: "word",
	timeLeft: 30,
	isMobile: false,
	startGame: () => {},
	inputRef: { current: null } as React.RefObject<HTMLInputElement | null>,
};

const GameOverModalProps = {
	isOpen: false,
	onClose: () => {},
	score: 0,
	highScore: 0,
	isNewHighScore: false,
	onPlayAgain: () => {},
};

//interface ChatMessage {
//	type: string;
//	content: string;
//	timestamp: number;
//}

export default function LexiWars() {
	const [word, setWord] = useState<string>("");
	const [layoutName, setLayoutName] = useState<string>("default");
	const inputRef = useRef<HTMLInputElement>(null);
	const { sendMessage, readyState, error, countdown, rank, finalStanding } =
		useWebSocket(
			`ws://localhost:3001/ws/67e55044-10b1-426f-9247-bb680e5fe0c8?username=${getWalletAddress()}`
		);

	console.log("rank:", rank);
	console.log("finalStanding:", finalStanding);

	const handleSubmit = (e?: FormEvent) => {
		e?.preventDefault();
		console.log("submitting", word);
		if (word.trim() && readyState === WebSocket.OPEN) {
			if (sendMessage(word)) {
				setWord("");
			}
		}
	};

	const getConnectionStatus = (): string => {
		switch (readyState) {
			case WebSocket.CONNECTING:
				return "Connecting...";
			case WebSocket.OPEN:
				return "Connected";
			case WebSocket.CLOSING:
				return "Disconnecting...";
			case WebSocket.CLOSED:
				return "Disconnected";
			default:
				return "Unknown";
		}
	};

	console.log("ws is", getConnectionStatus());

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
					<GameHeader
						score={GameHeaderProps.score}
						highScore={GameHeaderProps.highScore}
					/>

					<GameTimer timeLeft={countdown} />

					<GameRule
						currentRule={GameRuleProps.currentRule}
						repeatCount={GameRuleProps.repeatCount}
						requiredRepeats={GameRuleProps.requiredRepeats}
					/>

					<div className="border border-primary/10 p-3 sm:p-4 bg-primary/10 rounded-xl shadow-sm space-y-4 sm:space-y-5">
						<TurnIndicator />
						<LexiInputForm
							isPlaying={LexiInputFormProps.isPlaying}
							word={word}
							setWord={setWord}
							timeLeft={LexiInputFormProps.timeLeft}
							isTouchDevice={isTouchDevice}
							startGame={LexiInputFormProps.startGame}
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
					isOpen={GameOverModalProps.isOpen}
					onClose={GameOverModalProps.onClose}
					score={GameOverModalProps.score}
					highScore={GameOverModalProps.highScore}
					isNewHighScore={GameOverModalProps.isNewHighScore}
					onPlayAgain={GameOverModalProps.onPlayAgain}
				/>

				<div className="sr-only" role="alert">
					This is a competitive typing game that requires manual
					keyboard input. Screen readers softwares are not supported
					for fair gameplay.
				</div>
			</div>
		</main>
	);
}
