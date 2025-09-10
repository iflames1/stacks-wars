"use client";
import { useState, useCallback } from "react";
import ConnectionStatus from "@/components/connection-status";
import GameHeader from "./game-header";
import GameBoard from "./game-board";
import GameStatus from "./game-status";
import GameControls from "./game-controls";
import BackToGames from "@/components/back-to-games";
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
				setShowNewGameDialog(true);
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
			easy: 0.15,
			medium: 0.25,
			hard: 0.35,
		};

		sendMessage({
			type: "createBoard",
			size: currentBoardSize,
			risk: riskMap[difficulty],
			blind: blindMode,
		});
	}, [boardSize, difficulty, blindMode, sendMessage]);

	const handleDifficultyChange = useCallback(
		(newDifficulty: Difficulty) => {
			setDifficulty(newDifficulty);
			if (boardSize) {
				const mineCount = {
					easy: Math.floor(boardSize * boardSize * 0.15),
					medium: Math.floor(boardSize * boardSize * 0.25),
					hard: Math.floor(boardSize * boardSize * 0.35),
				};
				setTotalMines(mineCount[newDifficulty]);
			}
		},
		[boardSize]
	);

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

					{totalMines !== null && (
						<GameStatus
							gameState={gameState}
							timeLeft={timeLeft}
							totalMines={totalMines}
							flaggedCount={flaggedCount}
							onNewGame={() => setShowNewGameDialog(true)}
						/>
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
						onDifficultyChange={handleDifficultyChange}
						onBlindModeToggle={setBlindMode}
						onBoardSizeChange={setBoardSize}
						onNewGame={handleNewGame}
						onClose={() => setShowNewGameDialog(false)}
					/>
				)}
			</div>
		</main>
	);
}
