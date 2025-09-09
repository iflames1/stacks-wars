import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameState } from "@/hooks/useStacksSweepers";
import { Clock, Flag, Play, Trophy, Skull, Settings } from "lucide-react";

interface GameStatusProps {
	gameState: GameState;
	timeLeft: number | null;
	totalMines: number;
	flaggedCount: number;
	isFirstMove: boolean;
	onNewGame: () => void;
}

export default function GameStatus({
	gameState,
	timeLeft,
	totalMines,
	flaggedCount,
	isFirstMove,
	onNewGame,
}: GameStatusProps) {
	const getGameStateConfig = () => {
		switch (gameState) {
			case "waiting":
				return {
					icon: <Play className="h-4 w-4" />,
					text: isFirstMove
						? "Click any cell to start"
						: "Waiting...",
					variant: "secondary" as const,
					color: "text-blue-500",
				};
			case "playing":
				return {
					icon: <Play className="h-4 w-4" />,
					text: "Playing",
					variant: "default" as const,
					color: "text-green-500",
				};
			case "won":
				return {
					icon: <Trophy className="h-4 w-4" />,
					text: "You Won!",
					variant: "secondary" as const,
					color: "text-yellow-500",
				};
			case "lost":
				return {
					icon: <Skull className="h-4 w-4" />,
					text: "Game Over",
					variant: "destructive" as const,
					color: "text-red-500",
				};
		}
	};

	const gameStateConfig = getGameStateConfig();

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="bg-primary/10 border rounded-xl p-3">
			{/* Mobile: Stack layout, Desktop: Side by side */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				{/* Game stats - responsive layout */}
				<div className="flex items-center gap-2 sm:gap-4 flex-wrap">
					{/* Game State */}
					<div className="flex items-center gap-1 sm:gap-2">
						<div
							className={`size-5 sm:size-6 rounded-full bg-primary/10 flex items-center justify-center ${gameStateConfig.color}`}
						>
							{gameStateConfig.icon}
						</div>
						<Badge
							variant={gameStateConfig.variant}
							className="text-xs whitespace-nowrap"
						>
							{gameStateConfig.text}
						</Badge>
					</div>

					{/* Timer */}
					{timeLeft !== null && (
						<div className="flex items-center gap-1">
							<Clock
								className={`h-3 w-3 sm:h-4 sm:w-4 ${timeLeft <= 10 ? "text-red-500" : "text-primary"}`}
							/>
							<span
								className={`text-xs sm:text-sm font-bold ${timeLeft <= 10 ? "text-red-500" : "text-foreground"}`}
							>
								{formatTime(timeLeft)}
							</span>
						</div>
					)}

					{/* Flags */}
					<div className="flex items-center gap-1">
						<Flag className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
						<span className="text-xs sm:text-sm font-bold text-foreground">
							{flaggedCount}/{totalMines}
						</span>
					</div>
				</div>

				{/* New Game button */}
				{(gameState === "won" || gameState === "lost") && (
					<Button
						variant="outline"
						size="sm"
						onClick={onNewGame}
						className="flex items-center gap-1 self-start sm:self-auto"
					>
						<Settings className="h-3 w-3" />
						<span className="text-xs">New Game</span>
					</Button>
				)}
			</div>
		</div>
	);
}
