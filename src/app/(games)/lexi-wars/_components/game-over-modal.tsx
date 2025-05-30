import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, Trophy } from "lucide-react";

interface GameOverModalProps {
	isOpen: boolean;
	onClose: () => void;
	score: number;
	highScore: number;
	isNewHighScore: boolean;
	onPlayAgain: () => void;
}

export default function GameOverModal({
	isOpen,
	onClose,
	score,
	highScore,
	isNewHighScore,
	onPlayAgain,
}: GameOverModalProps) {
	const improvement = isNewHighScore ? score - highScore : 0;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-center">
						Game Over!
					</DialogTitle>
					<DialogDescription className="text-center pt-2 space-y-2">
						{isNewHighScore && <p>🎉 New High Score! 🎉</p>}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center w-full gap-4 py-4">
					{/* Personal Stats */}
					<div className="flex items-center gap-6 ">
						<div className="text-center flex flex-col items-center">
							<p className="text-sm font-medium text-muted-foreground mb-1">
								Your Score
							</p>
							<div className="flex items-center gap-2 text-2xl font-bold">
								<Target className="h-6 w-6" />
								{score}
							</div>
						</div>
						<div className="text-center flex flex-col items-center">
							<p className="text-sm font-medium text-muted-foreground mb-1">
								{isNewHighScore
									? "Previous Best"
									: "High Score"}
							</p>
							<div className="flex items-center gap-2 text-2xl font-bold">
								<Trophy className="h-6 w-6" />
								{highScore}
							</div>
						</div>
					</div>
					{isNewHighScore && (
						<div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-full text-sm font-medium">
							+{improvement} improvement!
						</div>
					)}
				</div>

				<DialogFooter className="sm:justify-center gap-2">
					<Button
						onClick={() => {
							onClose();
							onPlayAgain();
						}}
						className="w-full sm:w-auto"
					>
						Play Again
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
