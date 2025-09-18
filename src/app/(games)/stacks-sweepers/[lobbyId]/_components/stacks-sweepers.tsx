"use client";
import { useState, useCallback, useEffect } from "react";
import ConnectionStatus from "@/components/connection-status";
import GameHeader from "./game-header";
import GameBoard from "./game-board";
import BackToGames from "@/components/back-to-games";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import {
	useStacksSweepers,
	type StacksSweeperServerMessage,
	type MaskedCell,
	type EliminationReason,
} from "@/hooks/useStacksSweepers";
import { Player, PlayerStanding } from "@/types/schema/player";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { truncateAddress } from "@/lib/utils";
// import { useChatSocketContext } from "@/contexts/ChatSocketProvider"; // TODO: Add chat integration
import Loading from "../loading";

export interface Cell {
	id: string;
	row: number;
	col: number;
	state: "hidden" | "revealed" | "flagged" | "mine" | "gem";
	adjacentMines: number;
	isMine: boolean;
	isGem: boolean;
}

interface StacksSweeperProps {
	lobbyId: string;
	userId: string;
}

export default function StacksSweepers({
	lobbyId,
	userId,
}: StacksSweeperProps) {
	const router = useRouter();
	// const { sendMessage: sendChatMessage } = useChatSocketContext(); // TODO: Add chat integration

	// Game state
	const [board, setBoard] = useState<Cell[]>([]);
	const [gameStarted, setGameStarted] = useState(false);
	const [gameEnded, setGameEnded] = useState(false);
	const [countdown, setCountdown] = useState<number>(15);

	// Turn state
	const [turnState, setTurnState] = useState<{
		currentPlayer: Player | null;
		countdown: number | null;
	}>({
		currentPlayer: null,
		countdown: null,
	});

	// Results state
	const [rank, setRank] = useState<string | null>(null);
	const [finalStanding, setFinalStanding] = useState<PlayerStanding[] | null>(
		null
	);
	const [prize, setPrize] = useState<number | null>(null);
	const [warsPoint, setWarsPoint] = useState<number | null>(null);
	const [isEliminated, setIsEliminated] = useState(false);
	const [eliminationReason, setEliminationReason] =
		useState<EliminationReason | null>(null);

	// UI state
	const [latency, setLatency] = useState<number | null>(null);
	// const [showGameOverModal, setShowGameOverModal] = useState(false); // TODO: Add game over modal
	// const [showClaimModal, setShowClaimModal] = useState(false); // TODO: Add claim modal

	// Helper function to convert server cell to UI cell
	const convertServerCellToUICell = useCallback(
		(serverCell: MaskedCell): Cell => {
			let cellState: "hidden" | "revealed" | "flagged" | "mine" | "gem" =
				"hidden";
			let adjacentMines = 0;
			let isMine = false;
			let isGem = false;

			switch (serverCell.state) {
				case "hidden":
					cellState = "hidden";
					break;
				case "flagged":
					cellState = "flagged";
					break;
				case "mine":
					cellState = "mine";
					isMine = true;
					break;
				case "gem":
					cellState = "gem";
					isGem = true;
					break;
				case "adjacent":
					cellState = "revealed";
					adjacentMines = serverCell.count || 0;
					break;
			}

			return {
				id: `${serverCell.x}-${serverCell.y}`,
				row: serverCell.y,
				col: serverCell.x,
				state: cellState,
				adjacentMines,
				isMine,
				isGem,
			};
		},
		[]
	);

	// Handle WebSocket messages
	const handleMessage = useCallback(
		(message: StacksSweeperServerMessage) => {
			switch (message.type) {
				case "turn":
					setTurnState({
						currentPlayer: message.currentTurn,
						countdown: message.countdown,
					});
					break;

				case "cellRevealed":
					// Update the specific cell that was revealed
					setBoard((prevBoard) =>
						prevBoard.map((cell) => {
							if (
								cell.col === message.x &&
								cell.row === message.y
							) {
								// Create a MaskedCell from the message
								const maskedCell: MaskedCell = {
									x: message.x,
									y: message.y,
									state: message.cellState,
									count: message.count, // Include count for adjacent cells
								};
								return convertServerCellToUICell(maskedCell);
							}
							return cell;
						})
					);

					// Show toast for who revealed the cell
					if (message.revealedBy !== userId) {
						toast.info(
							`${truncateAddress(message.revealedBy)} revealed a cell`
						);
					}
					break;

				case "start":
					if (message.started) {
						setGameStarted(true);
						setCountdown(0);
						toast.success("Game started!");
					} else {
						setCountdown(message.time);
					}
					break;

				case "startFailed":
					toast.error("Failed to start game - not enough players");
					break;

				case "alreadyStarted":
					toast.info("Game has already started");
					setGameStarted(true);
					break;

				case "multiplayerGameOver":
					setGameEnded(true);
					// setShowGameOverModal(true); // TODO: Add game over modal
					toast.info("Game Over!");
					break;

				case "finalStanding":
					setFinalStanding(message.standing);
					break;

				case "eliminated":
					if (message.player.id === userId) {
						setIsEliminated(true);
						setEliminationReason(message.reason);

						const reasonText =
							message.reason === "hitMine"
								? "You hit a mine!"
								: "Your turn timed out!";
						toast.error(`Eliminated: ${reasonText}`);
					} else {
						const reasonText =
							message.reason === "hitMine"
								? "hit a mine"
								: "timed out";
						toast.info(
							`${truncateAddress(message.player.user.walletAddress)} was eliminated (${reasonText})`
						);
					}

					// If there's a mine position, update the board to show it
					if (message.minePosition) {
						const [mineX, mineY] = message.minePosition;
						setBoard((prevBoard) =>
							prevBoard.map((cell) => {
								if (cell.col === mineX && cell.row === mineY) {
									return {
										...cell,
										state: "mine",
										isMine: true,
									};
								}
								return cell;
							})
						);
					}
					break;

				case "rank":
					setRank(message.rank);
					break;

				case "prize":
					setPrize(message.amount);
					if (message.amount > 0) {
						// setShowClaimModal(true); // TODO: Add claim modal
						toast.success(`You won ${message.amount} STX!`);
					}
					break;

				case "warsPoint":
					setWarsPoint(message.warsPoint);
					break;

				case "pong":
					const now = Date.now();
					setLatency(now - message.ts);
					break;

				case "error":
					toast.error(message.message);
					break;

				default:
					console.warn("Unknown message type:", message);
			}
		},
		[userId, convertServerCellToUICell]
	);

	// Initialize WebSocket connection
	const { sendMessage, readyState, error, reconnecting } = useStacksSweepers({
		lobbyId,
		userId,
		onMessage: handleMessage,
	});

	// Handle cell click
	const handleCellClick = useCallback(
		async (cell: Cell) => {
			// Only allow moves during your turn and if game is active
			if (!gameStarted || gameEnded || isEliminated) return;
			if (
				!turnState.currentPlayer ||
				turnState.currentPlayer.id !== userId
			) {
				toast.warning("It's not your turn!");
				return;
			}

			// Only allow revealing hidden cells
			if (cell.state !== "hidden") return;

			try {
				await sendMessage({
					type: "cellReveal",
					x: cell.col,
					y: cell.row,
				});
			} catch (error) {
				console.error("Failed to send cell reveal:", error);
				toast.error("Failed to reveal cell");
			}
		},
		[gameStarted, gameEnded, isEliminated, turnState, userId, sendMessage]
	);

	// Initialize empty board (will be populated by server messages)
	useEffect(() => {
		// Create a default 10x10 board - will be updated by server
		const initialBoard: Cell[] = [];
		for (let row = 0; row < 10; row++) {
			for (let col = 0; col < 10; col++) {
				initialBoard.push({
					id: `${col}-${row}`,
					row,
					col,
					state: "hidden",
					adjacentMines: 0,
					isMine: false,
					isGem: false,
				});
			}
		}
		setBoard(initialBoard);
	}, []);

	// Loading state
	if (readyState === WebSocket.CONNECTING || reconnecting) {
		return <Loading />;
	}

	// Connection error state
	if (error) {
		return (
			<div className="container mx-auto p-4 space-y-4">
				<BackToGames />
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-red-500">
						Connection Error
					</h1>
					<p>Failed to connect to game server. Please try again.</p>
					<Button onClick={() => router.refresh()}>Retry</Button>
				</div>
			</div>
		);
	}

	const isMyTurn = turnState.currentPlayer?.id === userId;
	const canPlay = gameStarted && !gameEnded && !isEliminated && isMyTurn;

	return (
		<div className="container mx-auto p-4 space-y-4">
			<BackToGames />

			<div className="flex items-center justify-between">
				<GameHeader lobbyId={lobbyId} />
				<ConnectionStatus readyState={readyState} latency={latency} />
			</div>

			{/* Game Status */}
			<div className="flex flex-wrap gap-2 items-center justify-center">
				{!gameStarted && (
					<Badge variant="outline" className="text-yellow-600">
						Waiting to start... ({countdown}s)
					</Badge>
				)}

				{gameStarted && !gameEnded && !isEliminated && (
					<>
						<Badge variant={isMyTurn ? "default" : "outline"}>
							{isMyTurn
								? "Your Turn"
								: `${truncateAddress(turnState.currentPlayer?.user?.walletAddress || "")}'s Turn`}
						</Badge>
						{turnState.countdown && (
							<Badge variant="outline">
								{turnState.countdown}s remaining
							</Badge>
						)}
					</>
				)}

				{isEliminated && (
					<Badge variant="destructive">
						Eliminated (
						{eliminationReason === "hitMine"
							? "Hit mine"
							: "Timeout"}
						)
					</Badge>
				)}

				{gameEnded && (
					<Badge variant="outline" className="text-green-600">
						Game Finished
					</Badge>
				)}
			</div>

			{/* Turn indicator */}
			{gameStarted && !gameEnded && turnState.currentPlayer && (
				<div className="text-center">
					<p className="text-sm text-muted-foreground">
						Current Turn:{" "}
						<span className="font-medium">
							{truncateAddress(
								turnState.currentPlayer.user.walletAddress
							)}
						</span>
						{turnState.countdown &&
							` (${turnState.countdown}s remaining)`}
					</p>
				</div>
			)}

			{/* Game Board */}
			<div className="flex justify-center">
				<GameBoard
					board={board}
					onCellClick={handleCellClick}
					disabled={!canPlay}
				/>
			</div>

			{/* Game controls - only show before game starts */}
			{!gameStarted && (
				<div className="flex justify-center">
					<Button
						onClick={() => {
							// In multiplayer, games are started by the server/lobby system
							toast.info("Waiting for game to start...");
						}}
						disabled={true}
						className="flex items-center gap-2"
					>
						<Play className="w-4 h-4" />
						Waiting for Players...
					</Button>
				</div>
			)}

			{/* Results Display */}
			{(rank || prize !== null || warsPoint !== null) && (
				<div className="bg-muted/50 rounded-lg p-4 space-y-2">
					<h3 className="font-semibold text-center">Your Results</h3>
					{rank && (
						<p className="text-center">
							<strong>Rank:</strong> {rank}
						</p>
					)}
					{prize !== null && (
						<p className="text-center">
							<strong>Prize:</strong> {prize} STX
						</p>
					)}
					{warsPoint !== null && (
						<p className="text-center">
							<strong>Wars Points:</strong> {warsPoint}
						</p>
					)}
				</div>
			)}

			{/* Final Standing */}
			{finalStanding && (
				<div className="bg-muted/50 rounded-lg p-4">
					<h3 className="font-semibold text-center mb-3">
						Final Standing
					</h3>
					<div className="space-y-1">
						{finalStanding.map((standing) => (
							<div
								key={standing.player.id}
								className={`flex justify-between items-center p-2 rounded ${
									standing.player.id === userId
										? "bg-primary/10"
										: ""
								}`}
							>
								<span className="font-medium">
									#{standing.rank}
								</span>
								<span>
									{truncateAddress(
										standing.player.user.walletAddress
									)}
								</span>
								{standing.player.prize && (
									<span className="text-green-600">
										{standing.player.prize} STX
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Modals would go here - GameOverModal, ClaimRewardModal etc. */}
		</div>
	);
}
