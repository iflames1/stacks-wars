//import {
//	Dialog,
//	DialogContent,
//	DialogHeader,
//	DialogTitle,
//	DialogDescription,
//	DialogFooter,
//} from "@/components/ui/dialog";
//import { Button } from "@/components/ui/button";
//import { Target, ArrowRight, Trophy } from "lucide-react";

//interface GameOverModalProps {
//	isOpen: boolean;
//	onClose: () => void;
//	score: number;
//	highScore: number;
//	isNewHighScore: boolean;
//	onPlayAgain: () => void;
//}

//export default function GameOverModal({
//	isOpen,
//	onClose,
//	score,
//	highScore,
//	isNewHighScore,
//	onPlayAgain,
//}: GameOverModalProps) {
//	const improvement = isNewHighScore ? score - highScore : 0;

//	return (
//		<Dialog open={isOpen} onOpenChange={onClose}>
//			<DialogContent className="sm:max-w-md">
//				<DialogHeader>
//					<DialogTitle className="text-2xl font-bold text-center">
//						Game Over!
//					</DialogTitle>
//					<DialogDescription className="text-center pt-2 space-y-2">
//						{isNewHighScore && <p>🎉 New High Score! 🎉</p>}
//					</DialogDescription>
//				</DialogHeader>

//				<div className="flex flex-col items-center w-full gap-4 py-4">
//					{/* Personal Stats */}
//					<div className="flex items-center gap-6 ">
//						<div className="text-center flex flex-col items-center">
//							<p className="text-sm font-medium text-muted-foreground mb-1">
//								Your Score
//							</p>
//							<div className="flex items-center gap-2 text-2xl font-bold">
//								<Target className="h-6 w-6" />
//								{score}
//							</div>
//						</div>
//						<div className="text-center flex flex-col items-center">
//							<p className="text-sm font-medium text-muted-foreground mb-1">
//								{isNewHighScore
//									? "Previous Best"
//									: "High Score"}
//							</p>
//							<div className="flex items-center gap-2 text-2xl font-bold">
//								<Trophy className="h-6 w-6" />
//								{highScore}
//							</div>
//						</div>
//					</div>
//					{isNewHighScore && (
//						<div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-full text-sm font-medium">
//							+{improvement} improvement!
//						</div>
//					)}
//				</div>

//				<DialogFooter className="sm:justify-center gap-2">
//					<Button
//						onClick={() => {
//							onClose();
//							onPlayAgain();
//						}}
//						className="w-full sm:w-auto"
//					>
//						Play Again
//						<ArrowRight className="h-4 w-4 ml-2" />
//					</Button>
//				</DialogFooter>
//			</DialogContent>
//		</Dialog>
//	);
//}

// components/GameOverModal.tsx
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { PlayerStanding } from "@/hooks/useLexiWarsSocket";

interface GameOverModalProps {
	standing: PlayerStanding[] | undefined;
	userId: string;
}

export default function GameOverModal({
	standing,
	userId,
}: GameOverModalProps) {
	const [open, setOpen] = useState(true);

	useEffect(() => {
		if (standing && standing.length > 0) {
			setOpen(true);
		}
	}, [standing]);

	//const userRank = standing?.find((s) => s.player.id === userId)?.rank;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-md bg-primary">
				<DialogHeader>
					<DialogTitle>🏁 Game Over!</DialogTitle>
					<DialogDescription>
						Here are the final standings:
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2">
					{standing?.map((s, i) => (
						<div
							key={s.player.id}
							className={`flex justify-between px-4 py-2 rounded-md ${
								s.player.id === userId
									? "bg-primary/20 font-bold"
									: "bg-muted"
							}`}
						>
							<span>
								{i + 1}.{" "}
								{s.player.display_name ??
									s.player.wallet_address.slice(0, 6)}
							</span>
							<span>Rank {s.rank}</span>
						</div>
					))}
				</div>

				<DialogFooter className="mt-4">
					<Button onClick={() => setOpen(false)}>Close</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
