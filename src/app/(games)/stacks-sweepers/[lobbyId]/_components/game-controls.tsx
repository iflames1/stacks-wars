import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RotateCcw, Eye, EyeOff, Settings } from "lucide-react";
import { Difficulty } from "./stacks-sweepers";

interface GameControlsProps {
	difficulty: Difficulty;
	blindMode: boolean;
	boardSize: number;
	onDifficultyChange: (difficulty: Difficulty) => void;
	onBlindModeToggle: (enabled: boolean) => void;
	onBoardSizeChange: (size: number) => void;
	onNewGame: () => void;
	onClose: () => void;
}

export default function GameControls({
	difficulty,
	blindMode,
	boardSize,
	onDifficultyChange,
	onBlindModeToggle,
	onBoardSizeChange,
	onNewGame,
	onClose,
}: GameControlsProps) {
	const difficultyConfig = {
		easy: {
			label: "Easy",
			description: "15% mines",
			color: "bg-green-500/20 text-green-700 border-green-500/30",
		},
		medium: {
			label: "Medium",
			description: "25% mines",
			color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
		},
		hard: {
			label: "Hard",
			description: "35% mines",
			color: "bg-red-500/20 text-red-700 border-red-500/30",
		},
	};

	const boardSizes = [3, 4, 5, 6, 7, 8, 9, 10];

	return (
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						New Game Settings
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Difficulty Selector */}
					<div className="space-y-3">
						<Label className="text-sm font-medium">
							Difficulty
						</Label>
						<div className="grid gap-2">
							{Object.entries(difficultyConfig).map(
								([key, config]) => (
									<button
										key={key}
										onClick={() =>
											onDifficultyChange(
												key as Difficulty
											)
										}
										className={`w-full p-3 rounded-lg text-sm font-medium border transition-all ${
											difficulty === key
												? config.color
												: "bg-background hover:bg-primary/5 border-border"
										}`}
									>
										<div className="flex justify-between items-center">
											<span>{config.label}</span>
											<span className="text-xs opacity-75">
												{config.description}
											</span>
										</div>
									</button>
								)
							)}
						</div>
					</div>

					{/* Board Size Selector */}
					<div className="space-y-3">
						<Label className="text-sm font-medium">
							Board Size
						</Label>
						<div className="grid grid-cols-3 gap-2">
							{boardSizes.map((size) => (
								<button
									key={size}
									onClick={() => onBoardSizeChange(size)}
									className={`p-3 rounded-lg text-sm font-medium border transition-all ${
										boardSize === size
											? "bg-primary text-primary-foreground border-primary"
											: "bg-background hover:bg-primary/5 border-border"
									}`}
								>
									{size}×{size}
								</button>
							))}
						</div>
					</div>

					{/* Blind Mode Toggle */}
					<div className="space-y-3">
						<Label className="text-sm font-medium">Game Mode</Label>
						<div className="flex items-center justify-between p-3 rounded-lg border bg-background">
							<div className="flex items-center gap-2">
								{blindMode ? (
									<EyeOff className="h-4 w-4 text-primary" />
								) : (
									<Eye className="h-4 w-4 text-primary" />
								)}
								<Label
									htmlFor="blind-mode"
									className="text-sm cursor-pointer"
								>
									Blind Mode
								</Label>
							</div>
							<Switch
								id="blind-mode"
								checked={blindMode}
								onCheckedChange={onBlindModeToggle}
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							{blindMode
								? "No adjacent mine counts shown - find gems directly!"
								: "Normal mode with adjacent mine counts"}
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-2 pt-4">
						<Button
							variant="outline"
							onClick={onClose}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button
							onClick={onNewGame}
							className="flex-1 flex items-center gap-2"
						>
							<RotateCcw className="h-4 w-4" />
							Start Game
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
