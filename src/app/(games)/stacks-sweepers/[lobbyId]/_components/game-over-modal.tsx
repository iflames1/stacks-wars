import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { GameState } from "@/hooks/useStacksSweepers";
import { Trophy, Skull, RotateCcw, Home } from "lucide-react";

interface GameOverModalProps {
	gameState: GameState;
	onNewGame: () => void;
	onClose: () => void;
}

export default function GameOverModal({
	gameState,
	onNewGame,
	onClose,
}: GameOverModalProps) {
	const isWon = gameState === "won";

	const handleNewGame = () => {
		onNewGame();
		onClose();
	};

	return (
		<Dialog
			open={gameState === "won" || gameState === "lost"}
			onOpenChange={onClose}
		>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader className="text-center">
					<div className="flex justify-center mb-4">
						<div
							className={`size-16 rounded-full flex items-center justify-center ${
								isWon ? "bg-yellow-500/20" : "bg-red-500/20"
							}`}
						>
							{isWon ? (
								<Trophy className="size-8 text-yellow-500" />
							) : (
								<Skull className="size-8 text-red-500" />
							)}
						</div>
					</div>
					<DialogTitle
						className={`text-2xl ${isWon ? "text-yellow-500" : "text-red-500"}`}
					>
						{isWon ? "Congratulations!" : "Game Over!"}
					</DialogTitle>
					<DialogDescription className="text-base mt-2">
						{isWon
							? "You successfully found all the gems and avoided the mines!"
							: "You hit a mine! Better luck next time."}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-3 mt-6">
					<Button onClick={handleNewGame} className="w-full">
						<RotateCcw className="h-4 w-4 mr-2" />
						Play Again
					</Button>
					<Button
						variant="outline"
						onClick={onClose}
						className="w-full"
					>
						<Home className="h-4 w-4 mr-2" />
						Back to Lobby
					</Button>
				</div>

				{isWon && (
					<div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
						<p className="text-sm text-yellow-700 dark:text-yellow-300">
							🎉 Well done! You&apos;ve mastered this board
							configuration.
						</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
