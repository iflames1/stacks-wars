"use client";
import { useState, useCallback, useEffect } from "react";
import ConnectionStatus from "@/components/connection-status";
import GameHeader from "./game-header";
import GameBoard from "./game-board";
import GameStatus from "./game-status";
import GameControls from "./game-controls";
import BackToGames from "@/components/back-to-games";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Settings } from "lucide-react";
import {
	GameState,
	useStacksSweepers,
	type StacksSweeperServerMessage,
} from "@/hooks/useStacksSweepers";
import { toast } from "sonner";

export type CellState = "hidden" | "revealed" | "flagged" | "mine" | "gem";
export type Difficulty = "easy" | "medium" | "hard";

export interface Cell {
	id: string;
	row: number;
	col: number;
	state: CellState;
	adjacentMines: number;
	isMine: boolean;
	isGem: boolean;
}

interface StacksSweeperProps {
	userId: string;
}

export default function StacksSweepers({ userId }: StacksSweeperProps) {
	const [gameState, setGameState] = useState<GameState>("waiting");
	const [boardSize, setBoardSize] = useState<number | null>(null);
	const [difficulty, setDifficulty] = useState<Difficulty>("medium");
	const [blindMode, setBlindMode] = useState(false);
	const [timeLeft, setTimeLeft] = useState<number | null>(null);
	const [totalMines, setTotalMines] = useState<number | null>(null);
	const [flaggedCount, setFlaggedCount] = useState(0);
	const [board, setBoard] = useState<Cell[]>([]);
	const [showNewGameDialog, setShowNewGameDialog] = useState(false);
	const [latency, setLatency] = useState<number | null>(null);
	const [stakeAmount, setStakeAmount] = useState(10); // Default 10 STX
	const [maxMultiplier, setMaxMultiplier] = useState<number | null>(null);
	const [currentMultiplier, setCurrentMultiplier] = useState<number | null>(
		null
	);
	const [revealedCount, setRevealedCount] = useState(0);

	// Handle WebSocket messages
	const handleMessage = useCallback((message: StacksSweeperServerMessage) => {
		switch (message.type) {
			case "gameBoard":
				setBoardSize(message.boardSize);
				setTotalMines(message.mines);

				// Calculate flagged count from server data
				const flagged = message.cells.filter(
					(cell) => cell.state === "flagged"
				).length;
				setFlaggedCount(flagged);

				const convertedBoard: Cell[] = message.cells.map((cell) => {
					let cellState: CellState = "hidden";
					let adjacentMines = 0;
					let isMine = false;

					if (cell.state === "flagged") {
						cellState = "flagged";
					} else if (cell.state === "mine") {
						cellState = "mine";
						isMine = true;
					} else if (cell.state === "gem") {
						cellState = "gem";
					} else if (
						cell.state &&
						typeof cell.state === "object" &&
						"adjacent" in cell.state
					) {
						cellState = "revealed";
						adjacentMines = cell.state.adjacent.count;
					} else if (cell.state === null) {
						cellState = "hidden";
					}

					return {
						id: `${cell.x}-${cell.y}`,
						row: cell.y,
						col: cell.x,
						state: cellState,
						adjacentMines,
						isMine,
						isGem: cellState === "gem",
					};
				});
				setBoard(convertedBoard);
				setGameState(message.gameState);
				setTimeLeft(message.timeRemaining || null);
				break;
			case "boardCreated":
				setBoardSize(message.boardSize);
				setTotalMines(message.mines);

				// Reset multiplier states for new game
				setCurrentMultiplier(null);
				setRevealedCount(0);

				// Convert and set initial board
				const initialBoard: Cell[] = message.cells.map((cell) => ({
					id: `${cell.x}-${cell.y}`,
					row: cell.y,
					col: cell.x,
					state: "hidden",
					adjacentMines: 0,
					isMine: false,
					isGem: false,
				}));
				setBoard(initialBoard);
				setGameState(message.gameState);
				toast.success("New board created! Start playing!");
				break;
			case "noBoard":
				toast.info(message.message);
				// Just open the dialog, don't auto-create board
				handleOpenGameControls();
				break;
			case "gameOver":
				setGameState(message.won ? "won" : "lost");
				setTimeLeft(0);

				setBoardSize(message.boardSize);
				setTotalMines(message.mines);

				// Calculate flagged count from server data
				const gameOverFlagged = message.cells.filter(
					(cell) => cell.state === "flagged"
				).length;
				setFlaggedCount(gameOverFlagged);

				// Update final board state with unmasked data
				const finalBoard: Cell[] = message.cells.map((cell) => {
					let cellState: CellState = "revealed";
					let adjacentMines = 0;
					let isMine = false;

					if (cell.state === "flagged") {
						cellState = "flagged";
					} else if (cell.state === "mine") {
						cellState = "mine";
						isMine = true;
					} else if (cell.state === "gem") {
						cellState = "gem";
					} else if (
						cell.state &&
						typeof cell.state === "object" &&
						"adjacent" in cell.state
					) {
						cellState = "revealed";
						adjacentMines = cell.state.adjacent.count;
					}

					return {
						id: `${cell.x}-${cell.y}`,
						row: cell.y,
						col: cell.x,
						state: cellState,
						adjacentMines,
						isMine,
						isGem: cellState === "gem",
					};
				});
				setBoard(finalBoard);
				toast.info(message.won ? "🎉 You won!" : "💥 Game over!");
				break;
			case "countdown":
				setTimeLeft(message.timeRemaining);
				break;
			case "multiplierTarget":
				setMaxMultiplier(message.maxMultiplier);
				break;
			case "cashout":
				setCurrentMultiplier(message.currentMultiplier);
				setRevealedCount(message.revealedCount);
				break;
			case "timeUp":
				setGameState("lost");
				setTimeLeft(0);

				setBoardSize(message.boardSize);
				setTotalMines(message.mines);

				// Calculate flagged count from server data
				const timeUpFlagged = message.cells.filter(
					(cell) => cell.state === "flagged"
				).length;
				setFlaggedCount(timeUpFlagged);

				// Update board with revealed mines (unmasked data)
				const timeUpBoard: Cell[] = message.cells.map((cell) => {
					let cellState: CellState = "revealed";
					let adjacentMines = 0;
					let isMine = false;

					if (cell.state === "flagged") {
						cellState = "flagged";
					} else if (cell.state === "mine") {
						cellState = "mine";
						isMine = true;
					} else if (cell.state === "gem") {
						cellState = "gem";
					} else if (
						cell.state &&
						typeof cell.state === "object" &&
						"adjacent" in cell.state
					) {
						cellState = "revealed";
						adjacentMines = cell.state.adjacent.count;
					}

					return {
						id: `${cell.x}-${cell.y}`,
						row: cell.y,
						col: cell.x,
						state: cellState,
						adjacentMines,
						isMine,
						isGem: cellState === "gem",
					};
				});
				setBoard(timeUpBoard);
				toast.error("⏰ Time's up!");
				break;
			case "error":
				toast.error("Game Error", { description: message.message });
				break;
			case "pong":
				setLatency(message.pong);
				break;
		}
	}, []);

	// WebSocket connection
	const { sendMessage, readyState, reconnecting, forceReconnect } =
		useStacksSweepers({
			userId,
			onMessage: handleMessage,
		});

	const handleCellClick = useCallback(
		(x: number, y: number, isRightClick: boolean = false) => {
			console.log(
				"called with x:",
				x,
				"y:",
				y,
				"isRightClick:",
				isRightClick
			);
			console.log("gameState:", gameState, "readyState:", readyState);

			if (isRightClick) {
				console.log("Sending flag message");
				sendMessage({
					type: "cellFlag",
					x,
					y,
				});
			} else {
				console.log("Sending reveal message");
				sendMessage({
					type: "cellReveal",
					x,
					y,
				});
			}
		},
		[gameState, readyState, sendMessage]
	);

	const handleNewGame = useCallback(() => {
		setShowNewGameDialog(false);

		// Use default board size if not set
		const currentBoardSize = boardSize || 5;

		// Convert difficulty to risk value (0-100)
		const riskMap = {
			easy: 0.2,
			medium: 0.3,
			hard: 0.4,
		};

		const riskValue = riskMap[difficulty];

		// First request the multiplier target
		sendMessage({
			type: "multiplierTarget",
			size: currentBoardSize,
			risk: riskValue,
		});

		// Then create the board
		sendMessage({
			type: "createBoard",
			size: currentBoardSize,
			risk: riskValue,
			blind: blindMode,
		});
	}, [boardSize, difficulty, blindMode, sendMessage]);

	const handleDifficultyChange = useCallback(
		(newDifficulty: Difficulty) => {
			setDifficulty(newDifficulty);

			const currentBoardSize = boardSize || 5;

			const mineCount = {
				easy: Math.floor(currentBoardSize * currentBoardSize * 0.2),
				medium: Math.floor(currentBoardSize * currentBoardSize * 0.3),
				hard: Math.floor(currentBoardSize * currentBoardSize * 0.4),
			};
			setTotalMines(mineCount[newDifficulty]);

			// Always request new multiplier target when difficulty changes
			const riskMap = {
				easy: 0.2,
				medium: 0.3,
				hard: 0.4,
			};

			console.log(
				"🎯 Requesting multiplier target on difficulty change:",
				{
					size: currentBoardSize,
					risk: riskMap[newDifficulty],
					difficulty: newDifficulty,
				}
			);

			sendMessage({
				type: "multiplierTarget",
				size: currentBoardSize,
				risk: riskMap[newDifficulty],
			});
		},
		[boardSize, sendMessage]
	);

	const handleBoardSizeChange = useCallback(
		(newSize: number) => {
			setBoardSize(newSize);

			// Request new multiplier target when board size changes
			const riskMap = {
				easy: 0.2,
				medium: 0.3,
				hard: 0.4,
			};

			console.log(
				"🎯 Requesting multiplier target on board size change:",
				{
					size: newSize,
					risk: riskMap[difficulty],
					difficulty,
				}
			);

			sendMessage({
				type: "multiplierTarget",
				size: newSize,
				risk: riskMap[difficulty],
			});
		},
		[difficulty, sendMessage]
	);

	const handleOpenGameControls = useCallback(() => {
		setShowNewGameDialog(true);

		// Request multiplier target for current settings when dialog opens
		const currentBoardSize = boardSize || 5;
		const riskMap = {
			easy: 0.2,
			medium: 0.3,
			hard: 0.4,
		};
		const riskValue = riskMap[difficulty];

		console.log("🎯 Requesting multiplier target on dialog open:", {
			size: currentBoardSize,
			risk: riskValue,
			difficulty,
		});

		sendMessage({
			type: "multiplierTarget",
			size: currentBoardSize,
			risk: riskValue,
		});
	}, [boardSize, difficulty, sendMessage]);

	// Request multiplier target when dialog opens
	useEffect(() => {
		if (showNewGameDialog && sendMessage) {
			const currentBoardSize = boardSize || 5;
			const riskMap = {
				easy: 0.2,
				medium: 0.3,
				hard: 0.4,
			};
			const riskValue = riskMap[difficulty];

			console.log(
				"🎯 Requesting multiplier target on dialog open (effect):",
				{
					size: currentBoardSize,
					risk: riskValue,
					difficulty,
				}
			);

			sendMessage({
				type: "multiplierTarget",
				size: currentBoardSize,
				risk: riskValue,
			});
		}
	}, [showNewGameDialog, boardSize, difficulty, sendMessage]);

	return (
		<main className="min-h-screen bg-gradient-to-b from-background to-primary/30 flex flex-col">
			<div className="max-w-4xl mx-auto w-full p-3 sm:p-4 flex flex-col min-h-screen">
				{/* Header - Fixed at top */}
				<div className="flex justify-between items-center mb-3">
					<BackToGames />
					{/*<Back onBack={handleDisconnect} />*/}
					<ConnectionStatus
						readyState={readyState}
						latency={latency}
						reconnecting={reconnecting}
						onReconnect={forceReconnect}
						className="mb-0"
					/>
				</div>

				{/* Game Content - Flexible */}
				<div className="flex-1 flex flex-col space-y-3">
					<GameHeader />

					{totalMines !== null ? (
						<GameStatus
							gameState={gameState}
							timeLeft={timeLeft}
							totalMines={totalMines}
							flaggedCount={flaggedCount}
							stakeAmount={stakeAmount}
							currentMultiplier={currentMultiplier}
							revealedCount={revealedCount}
							onNewGame={handleOpenGameControls}
						/>
					) : (
						<div className="bg-primary/10 border rounded-xl p-3">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div className="flex items-center gap-2">
									<div className="size-5 sm:size-6 rounded-full bg-primary/10 flex items-center justify-center text-blue-500">
										<Play className="h-4 w-4" />
									</div>
									<Badge
										variant="secondary"
										className="text-xs whitespace-nowrap"
									>
										No active game
									</Badge>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={handleOpenGameControls}
									className="flex items-center gap-1 self-start sm:self-auto"
								>
									<Settings className="h-3 w-3" />
									<span className="text-xs">New Game</span>
								</Button>
							</div>
						</div>
					)}

					<div className="flex-1 flex items-center justify-center">
						{boardSize !== null && board.length > 0 ? (
							<GameBoard
								board={board}
								boardSize={boardSize}
								blindMode={blindMode}
								onCellClick={handleCellClick}
								gameState={gameState}
							/>
						) : (
							<div className="text-center text-muted-foreground">
								<p>Connecting to game...</p>
							</div>
						)}
					</div>
				</div>

				{/* New Game Settings Dialog */}
				{showNewGameDialog && (
					<GameControls
						difficulty={difficulty}
						blindMode={blindMode}
						boardSize={boardSize || 5}
						stakeAmount={stakeAmount}
						maxMultiplier={maxMultiplier}
						onDifficultyChange={handleDifficultyChange}
						onBlindModeToggle={setBlindMode}
						onBoardSizeChange={handleBoardSizeChange}
						onStakeAmountChange={setStakeAmount}
						onNewGame={handleNewGame}
						onClose={() => setShowNewGameDialog(false)}
					/>
				)}
			</div>
		</main>
	);
}
