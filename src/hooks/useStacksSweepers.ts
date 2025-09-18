import { Player, PlayerStanding } from "@/types/schema/player";
import { useCallback, useEffect, useRef, useState } from "react";

// Supporting types
export type CellState =
	| "hidden" // Cell is unrevealed and unflagged
	| "flagged" // Cell is flagged by a player
	| "mine" // Cell contains a mine (revealed)
	| "gem" // Cell is safe with no adjacent mines
	| "adjacent"; // Cell is safe with adjacent mines (count provided separately)

export type MaskedCell = {
	x: number;
	y: number;
	state: CellState; // Now always has a state (including "hidden")
	count?: number; // Only present when state is "adjacent"
};

export type EliminationReason =
	| "hitMine" // Player revealed a mine
	| "timeout"; // Player's turn timed out

export type StacksSweeperServerMessage =
	// Core multiplayer game flow messages
	| { type: "turn"; currentTurn: Player; countdown: number } // Indicates whose turn it is and remaining time
	| {
			type: "cellRevealed";
			x: number;
			y: number;
			cellState: CellState;
			count?: number; // Only present when cellState is "adjacent"
			revealedBy: string;
	  } // Broadcasts a cell reveal to all players
	| { type: "start"; time: number; started: boolean } // Game start countdown or confirmation that game has started
	| { type: "startFailed" } // Game failed to start (not enough players, etc.)
	| { type: "alreadyStarted" } // Sent when trying to start an already running game

	// Game ending and results messages
	| { type: "multiplayerGameOver" } // Game has ended
	| { type: "finalStanding"; standing: PlayerStanding[] } // Final rankings of all players
	| {
			type: "eliminated";
			player: Player;
			reason: EliminationReason;
			minePosition?: [number, number];
	  } // Player eliminated from game
	| { type: "rank"; rank: string } // Individual player's final rank
	| { type: "prize"; amount: number } // Prize amount awarded to player
	| { type: "warsPoint"; warsPoint: number } // Wars points earned by player

	// Utility messages
	| { type: "pong"; ts: number; pong: number } // Response to ping for latency measurement
	| { type: "error"; message: string }; // Error message for invalid actions

export type StacksSweeperClientMessage =
	| { type: "cellReveal"; x: number; y: number } // Player attempts to reveal a cell on their turn
	| { type: "ping"; ts: number }; // Ping for latency measurement

interface QueuedMessage {
	data: StacksSweeperClientMessage;
	resolve: () => void;
	reject: (error: Error) => void;
}

interface UseStacksSweeperProps {
	lobbyId: string;
	userId: string;
	onMessage?: (msg: StacksSweeperServerMessage) => void;
}

export function useStacksSweepers({
	lobbyId,
	userId,
	onMessage,
}: UseStacksSweeperProps) {
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectAttempts = useRef(0);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const manuallyDisconnectedRef = useRef(false);
	const messageHandlerRef = useRef<typeof onMessage | null>(null);
	const messageQueue = useRef<QueuedMessage[]>([]);
	const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const pingInProgress = useRef(false);
	const PING_INTERVAL = 5000; // 5 seconds
	const [readyState, setReadyState] = useState<WebSocket["readyState"]>(
		WebSocket.CLOSED
	);
	const [error, setError] = useState<null | Event>(null);
	const [reconnecting, setReconnecting] = useState(false);

	const maxReconnectAttempts = 5;

	const processMessageQueue = useCallback(() => {
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			while (messageQueue.current.length > 0) {
				const queuedMessage = messageQueue.current.shift();
				if (queuedMessage) {
					try {
						socketRef.current.send(
							JSON.stringify(queuedMessage.data)
						);
						queuedMessage.resolve();
					} catch (error) {
						queuedMessage.reject(error as Error);
					}
				}
			}
		}
	}, []);

	useEffect(() => {
		messageHandlerRef.current = onMessage;
	}, [onMessage]);

	const sendMessage = useCallback(
		(data: StacksSweeperClientMessage): Promise<void> => {
			return new Promise((resolve, reject) => {
				const socket = socketRef.current;
				if (socket?.readyState === WebSocket.OPEN) {
					try {
						socket.send(JSON.stringify(data));
						resolve();
					} catch (error) {
						reject(error as Error);
					}
				} else {
					console.log(
						"⏳ Queuing StacksSweeper message (socket not ready)"
					);
					messageQueue.current.push({ data, resolve, reject });
				}
			});
		},
		[]
	);

	const schedulePing = useCallback(async () => {
		if (pingInProgress.current || !socketRef.current) return;

		pingInProgress.current = true;
		try {
			await sendMessage({ type: "ping", ts: Date.now() });
		} catch (error) {
			console.error("❌ StacksSweeper Ping failed:", error);
		} finally {
			pingInProgress.current = false;

			// Schedule next ping only after current one completes
			if (socketRef.current?.readyState === WebSocket.OPEN) {
				pingIntervalRef.current = setTimeout(
					schedulePing,
					PING_INTERVAL
				);
			}
		}
	}, [sendMessage]);

	const connectSocket = useCallback(() => {
		if (!lobbyId || !userId) return;
		if (socketRef.current) return;

		console.log("🟢 Connecting StacksSweeperSocket...");

		const ws = new WebSocket(
			`${process.env.NEXT_PUBLIC_WS_URL}/ws/stacks-sweepers/${lobbyId}?user_id=${userId}`
		);

		socketRef.current = ws;

		ws.onopen = () => {
			console.log("✅ StacksSweeperSocket connected");
			setReadyState(ws.readyState);
			setError(null);
			setReconnecting(false);
			reconnectAttempts.current = 0;

			// Start the ping cycle
			pingIntervalRef.current = setTimeout(schedulePing, PING_INTERVAL);

			processMessageQueue();
		};

		ws.onmessage = (event) => {
			try {
				const raw = typeof event.data === "string" ? event.data : "";
				const data = JSON.parse(raw) as StacksSweeperServerMessage;
				messageHandlerRef.current?.(data);
			} catch (err) {
				console.error("❌ Failed to parse StacksSweeper message", err);
			}
		};

		ws.onclose = (event) => {
			console.warn(
				"🛑 StacksSweeperSocket closed:",
				event.code,
				event.reason
			);
			setReadyState(WebSocket.CLOSED);
			socketRef.current = null;
			pingInProgress.current = false;

			if (pingIntervalRef.current) {
				clearTimeout(pingIntervalRef.current);
				pingIntervalRef.current = null;
			}

			// Check if the close is due to game finished - if so, don't reconnect
			const isGameFinished =
				(event.reason &&
					event.reason.toLowerCase().includes("finished")) ||
				event.code === 1000; // Normal closure often indicates game end

			if (
				!manuallyDisconnectedRef.current &&
				!isGameFinished &&
				reconnectAttempts.current < maxReconnectAttempts
			) {
				reconnectAttempts.current++;
				const timeout = Math.pow(2, reconnectAttempts.current) * 1000;
				console.log(
					`♻️ StacksSweeper Reconnecting in ${timeout / 1000}s...`
				);

				setReconnecting(true);
				reconnectTimeoutRef.current = setTimeout(() => {
					connectSocket();
				}, timeout);
			} else {
				if (isGameFinished) {
					console.log(
						"🏁 Game finished, not reconnecting StacksSweeperSocket"
					);
				}
				// Reject all queued messages if we can't reconnect
				while (messageQueue.current.length > 0) {
					const queuedMessage = messageQueue.current.shift();
					if (queuedMessage) {
						queuedMessage.reject(new Error("Connection failed"));
					}
				}
			}
		};

		ws.onerror = (err) => {
			console.error("⚠️ StacksSweeperSocket error:", err);
			setError(err);
			setReadyState(WebSocket.CLOSED);

			// Close the broken socket to trigger reconnection
			if (socketRef.current) {
				socketRef.current.close();
				socketRef.current = null;
			}
		};
	}, [lobbyId, userId, processMessageQueue, schedulePing]);

	useEffect(() => {
		connectSocket();

		return () => {
			if (reconnectTimeoutRef.current)
				clearTimeout(reconnectTimeoutRef.current);
			socketRef.current?.close();
			socketRef.current = null;
		};
	}, [connectSocket]);

	const disconnect = useCallback(() => {
		manuallyDisconnectedRef.current = true;
		pingInProgress.current = false;

		if (reconnectTimeoutRef.current)
			clearTimeout(reconnectTimeoutRef.current);

		if (pingIntervalRef.current) {
			clearTimeout(pingIntervalRef.current);
			pingIntervalRef.current = null;
		}

		// Reject all queued messages
		while (messageQueue.current.length > 0) {
			const queuedMessage = messageQueue.current.shift();
			if (queuedMessage) {
				queuedMessage.reject(new Error("Socket disconnected"));
			}
		}

		socketRef.current?.close();
		socketRef.current = null;
		setReadyState(WebSocket.CLOSED);
		messageQueue.current = [];
	}, []);

	const forceReconnect = useCallback(() => {
		// Clear any existing timeouts
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		// Close existing connection
		if (socketRef.current) {
			socketRef.current.close();
			socketRef.current = null;
		}

		// Reset reconnection attempts and flags
		reconnectAttempts.current = 0;
		manuallyDisconnectedRef.current = false;
		setReconnecting(false);

		// Reconnect immediately
		connectSocket();
	}, [connectSocket]);

	return {
		sendMessage,
		disconnect,
		readyState,
		error,
		reconnecting,
		forceReconnect,
	};
}
