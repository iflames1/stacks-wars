"use client";
import BackToGames from "@/components/back-to-games";
import GameHeader from "./game-header";
import GameRule from "./game-rule";
import GameTimer from "./game-timer";
import TurnIndicator from "./turn-indicator";
import LexiInputForm from "./lexi-input-form";
import KeyboardComp from "./keyboard-comp";
import GameOverModal from "./game-over-modal";

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
	isPlaying: false,
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

const isMobile = false;
const isPlaying = true;

const handleKeyboardInput = (input: string) => {
	if (input === "{enter}") {
		//handleSubmit();
	} else if (input === "{bksp}") {
		//setWord((prev) => prev.slice(0, -1));
	} else if (input === "{space}") {
		// Ignore space
		return;
	} else {
		//setWord((prev) => (prev + input).toLowerCase());
	}
};

export default function LexiWars() {
	return (
		<main className="min-h-screen bg-gradient-to-b from-background to-primary/30">
			<div className="max-w-3xl mx-auto p-4 sm:p-6">
				<BackToGames />

				<div className="space-y-3 sm:space-y-4">
					<GameHeader
						score={GameHeaderProps.score}
						highScore={GameHeaderProps.highScore}
					/>
					<GameTimer timeLeft={30} />

					<GameRule
						currentRule={GameRuleProps.currentRule}
						repeatCount={GameRuleProps.repeatCount}
						requiredRepeats={GameRuleProps.requiredRepeats}
					/>

					<div className="border border-primary/10 p-3 bg-primary/10 rounded-xl shadow-sm space-y-4">
						<TurnIndicator />
						<LexiInputForm
							isPlaying={LexiInputFormProps.isPlaying}
							word={LexiInputFormProps.word}
							setWord={() => {}}
							timeLeft={LexiInputFormProps.timeLeft}
							isMobile={LexiInputFormProps.isMobile}
							startGame={LexiInputFormProps.startGame}
							inputRef={LexiInputFormProps.inputRef}
						/>
					</div>
				</div>

				{isMobile && isPlaying && (
					<KeyboardComp handleKeyboardInput={handleKeyboardInput} />
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
