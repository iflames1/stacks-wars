"use client";
import { useState, useCallback, useEffect } from "react";
import ConnectionStatus from "@/components/connection-status";
import GameHeader from "./game-header";
import GameBoard from "./game-board";
import GameStatus from "./game-status";
import GameControls from "./game-controls";
import GameOverModal from "./game-over-modal";
import BackToGames from "@/components/back-to-games";

// Mock WebSocket hook - we'll implement this later
const useMockWebSocket = () => ({
	readyState: WebSocket.OPEN,
	reconnecting: false,
	latency: 45,
	forceReconnect: () => {},
	disconnect: () => {},
});

export type CellState = "hidden" | "revealed" | "flagged" | "mine" | "gem";
export type GameState = "waiting" | "playing" | "won" | "lost";
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

export default function StacksSweepers() {
	// Game state
	const [gameState, setGameState] = useState<GameState>("waiting");
	const [boardSize, setBoardSize] = useState(5); // 5x5 default
	const [difficulty, setDifficulty] = useState<Difficulty>("medium");
	const [blindMode, setBlindMode] = useState(false);
	const [timeLeft, setTimeLeft] = useState(60);
	const [totalMines, setTotalMines] = useState(6);
	const [flaggedCount, setFlaggedCount] = useState(0);
	const [isFirstMove, setIsFirstMove] = useState(true);
	const [board, setBoard] = useState<Cell[]>([]);
	const [showGameOverModal, setShowGameOverModal] = useState(false);
	const [showNewGameDialog, setShowNewGameDialog] = useState(false);

	// Mock WebSocket connection
	const { readyState, reconnecting, latency, forceReconnect } =
		useMockWebSocket();

	// Initialize empty board
	useEffect(() => {
		const newBoard: Cell[] = [];
		for (let row = 0; row < boardSize; row++) {
			for (let col = 0; col < boardSize; col++) {
				newBoard.push({
					id: `${row}-${col}`,
					row,
					col,
					state: "hidden",
					adjacentMines: 0,
					isMine: false,
					isGem: false,
				});
			}
		}
		setBoard(newBoard);
	}, [boardSize]);

	// Timer countdown
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (gameState === "playing" && timeLeft > 0) {
			interval = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						setGameState("lost");
						setShowGameOverModal(true);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [gameState, timeLeft]);

	const handleCellClick = useCallback(
		(cellId: string, isRightClick: boolean = false) => {
			if (gameState !== "playing" && gameState !== "waiting") return;

			setBoard((prevBoard) => {
				const newBoard = [...prevBoard];
				const cellIndex = newBoard.findIndex(
					(cell) => cell.id === cellId
				);
				const cell = newBoard[cellIndex];

				if (isRightClick) {
					// Flag/unflag cell
					if (cell.state === "hidden") {
						cell.state = "flagged";
						setFlaggedCount((prev) => prev + 1);
					} else if (cell.state === "flagged") {
						cell.state = "hidden";
						setFlaggedCount((prev) => prev - 1);
					}
				} else {
					// Reveal cell
					if (cell.state === "hidden") {
						if (isFirstMove) {
							setIsFirstMove(false);
							setGameState("playing");
						}

						cell.state = "revealed";

						// Mock game logic - randomly determine if it's a mine or gem
						if (Math.random() < 0.2) {
							// 20% chance of mine
							cell.isMine = true;
							cell.state = "mine";
							setGameState("lost");
							setShowGameOverModal(true);
						} else if (Math.random() < 0.3) {
							// 30% chance of gem
							cell.isGem = true;
							cell.state = "gem";
						} else {
							// Normal cell with adjacent mine count
							cell.adjacentMines = Math.floor(Math.random() * 4);
						}
					}
				}

				return newBoard;
			});
		},
		[gameState, isFirstMove]
	);

	const handleNewGame = useCallback(() => {
		setGameState("waiting");
		setTimeLeft(60);
		setFlaggedCount(0);
		setIsFirstMove(true);
		setShowGameOverModal(false);
		setShowNewGameDialog(false);

		// Reset board
		const newBoard: Cell[] = [];
		for (let row = 0; row < boardSize; row++) {
			for (let col = 0; col < boardSize; col++) {
				newBoard.push({
					id: `${row}-${col}`,
					row,
					col,
					state: "hidden",
					adjacentMines: 0,
					isMine: false,
					isGem: false,
				});
			}
		}
		setBoard(newBoard);
	}, [boardSize]);

	const handleDifficultyChange = useCallback(
		(newDifficulty: Difficulty) => {
			setDifficulty(newDifficulty);
			// Adjust mines based on difficulty
			const mineCount = {
				easy: Math.floor(boardSize * boardSize * 0.15),
				medium: Math.floor(boardSize * boardSize * 0.25),
				hard: Math.floor(boardSize * boardSize * 0.35),
			};
			setTotalMines(mineCount[newDifficulty]);
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

					<GameStatus
						gameState={gameState}
						timeLeft={timeLeft}
						totalMines={totalMines}
						flaggedCount={flaggedCount}
						isFirstMove={isFirstMove}
						onNewGame={() => setShowNewGameDialog(true)}
					/>

					<div className="flex-1 flex items-center justify-center">
						<GameBoard
							board={board}
							boardSize={boardSize}
							blindMode={blindMode}
							onCellClick={handleCellClick}
							gameState={gameState}
						/>
					</div>
				</div>

				{/* Game Over Modal */}
				{showGameOverModal && (
					<GameOverModal
						gameState={gameState}
						onNewGame={() => {
							setShowGameOverModal(false);
							setShowNewGameDialog(true);
						}}
						onClose={() => setShowGameOverModal(false)}
					/>
				)}

				{/* New Game Settings Dialog */}
				{showNewGameDialog && (
					<GameControls
						difficulty={difficulty}
						blindMode={blindMode}
						boardSize={boardSize}
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
