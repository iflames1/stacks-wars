// types/lexiwars.ts
import { JsonParticipant } from "@/types/schema";
import { useCallback, useEffect, useRef, useState } from "react";

export interface PlayerStanding {
	player: JsonParticipant;
	rank: number;
}

export type LexiWarsServerMessage =
	| { type: "turn"; current_turn: JsonParticipant }
	| { type: "rule"; rule: string }
	| { type: "countdown"; time: number }
	| { type: "rank"; rank: string }
	| { type: "validate"; msg: string }
	| { type: "wordentry"; word: string; sender: JsonParticipant }
	| { type: "usedword"; word: string }
	| { type: "gameover" }
	| { type: "finalstanding"; standing: PlayerStanding[] }
	| { type: "prize"; amount: number };

export type LexiWarsClientMessage = { type: "wordentry"; word: string };

interface UseLexiWarsSocketProps {
	lobbyId: string;
	userId: string;
	onMessage?: (msg: LexiWarsServerMessage) => void;
}

export function useLexiWarsSocket({
	lobbyId,
	userId,
	onMessage,
}: UseLexiWarsSocketProps) {
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectAttempts = useRef(0);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const manuallyDisconnectedRef = useRef(false);
	const messageHandlerRef = useRef<typeof onMessage | null>(null);
	const messageQueue = useRef<LexiWarsClientMessage[]>([]);

	const [readyState, setReadyState] = useState<WebSocket["readyState"]>(
		WebSocket.CLOSED
	);
	const [error, setError] = useState<null | Event>(null);
	const [reconnecting, setReconnecting] = useState(false);

	const maxReconnectAttempts = 5;

	useEffect(() => {
		messageHandlerRef.current = onMessage;
	}, [onMessage]);

	const processMessageQueue = useCallback(() => {
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			while (messageQueue.current.length > 0) {
				const msg = messageQueue.current.shift();
				if (msg) {
					socketRef.current.send(JSON.stringify(msg));
				}
			}
		}
	}, []);

	const connectSocket = useCallback(() => {
		if (!lobbyId || !userId) return;
		if (socketRef.current) return;

		console.log("🟢 Connecting LexiWarsSocket...");

		const ws = new WebSocket(
			`${process.env.NEXT_PUBLIC_WS_URL}/ws/lexiwars/${lobbyId}?user_id=${userId}`
		);

		socketRef.current = ws;

		ws.onopen = () => {
			console.log("✅ LexiWarsSocket connected");
			setReadyState(ws.readyState);
			setError(null);
			setReconnecting(false);
			reconnectAttempts.current = 0;
			processMessageQueue();
		};

		ws.onmessage = (event) => {
			try {
				const raw = typeof event.data === "string" ? event.data : "";
				const data = JSON.parse(raw) as LexiWarsServerMessage;
				messageHandlerRef.current?.(data);
			} catch (err) {
				console.error("❌ Failed to parse LexiWars message", err);
			}
		};

		ws.onclose = (event) => {
			console.warn("🛑 LexiWarsSocket closed:", event.code, event.reason);
			setReadyState(WebSocket.CLOSED);
			socketRef.current = null;

			if (
				!manuallyDisconnectedRef.current &&
				reconnectAttempts.current < maxReconnectAttempts
			) {
				reconnectAttempts.current++;
				const timeout = Math.pow(2, reconnectAttempts.current) * 1000;
				console.log(`♻️ Reconnecting in ${timeout / 1000}s...`);
				setReconnecting(true);

				reconnectTimeoutRef.current = setTimeout(() => {
					connectSocket();
				}, timeout);
			}
		};

		ws.onerror = (err) => {
			console.error("⚠️ LobbySocket error:", err);
			setError(err);
			setReadyState(WebSocket.CLOSED);

			// Close the broken socket to trigger reconnection
			if (socketRef.current) {
				socketRef.current.close();
				socketRef.current = null;
			}
		};
	}, [lobbyId, userId, processMessageQueue]);

	useEffect(() => {
		connectSocket();

		return () => {
			if (reconnectTimeoutRef.current)
				clearTimeout(reconnectTimeoutRef.current);
			socketRef.current?.close();
			socketRef.current = null;
		};
	}, [connectSocket]);

	const sendMessage = useCallback((data: LexiWarsClientMessage) => {
		const socket = socketRef.current;
		if (socket?.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(data));
		} else {
			console.log("⏳ Queuing message (socket not ready)");
			messageQueue.current.push(data);
		}
	}, []);

	const disconnect = useCallback(() => {
		manuallyDisconnectedRef.current = true;
		if (reconnectTimeoutRef.current)
			clearTimeout(reconnectTimeoutRef.current);
		socketRef.current?.close();
		socketRef.current = null;
		setReadyState(WebSocket.CLOSED);
		messageQueue.current = [];
	}, []);

	return {
		sendMessage,
		disconnect,
		readyState,
		error,
		reconnecting,
	};
}
