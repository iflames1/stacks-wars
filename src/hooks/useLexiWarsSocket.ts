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
	| { type: "finalstanding"; standing: PlayerStanding[] };

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
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttempts = useRef<number>(0);
	const manuallyDisconnectedRef = useRef(false);
	const messageHandlerRef = useRef<typeof onMessage | null>(null);
	const maxReconnectAttempts = 5;

	const [readyState, setReadyState] = useState<WebSocket["readyState"]>(
		WebSocket.CLOSED
	);
	const [error, setError] = useState<null | Event>(null);
	const [reconnecting, setReconnecting] = useState(false);

	useEffect(() => {
		messageHandlerRef.current = onMessage;
	}, [onMessage]);

	useEffect(() => {
		if (socketRef.current || manuallyDisconnectedRef.current) return;

		let mounted = true;

		const startConnection = () => {
			if (!lobbyId || !userId) return;

			console.log("🟢 Connecting WebSocket...");

			const ws = new WebSocket(
				`${process.env.NEXT_PUBLIC_WS_URL}/ws/lexiwars/${lobbyId}?user_id=${userId}`
			);
			socketRef.current = ws;

			ws.onopen = () => {
				if (!mounted) return;
				console.log("✅ LexiWars WebSocket connected");
				setReadyState(ws.readyState);
				setError(null);
				setReconnecting(false);
				reconnectAttempts.current = 0;
			};

			ws.onmessage = (event: MessageEvent<LexiWarsServerMessage>) => {
				try {
					const raw =
						typeof event.data === "string" ? event.data : "";
					const data = JSON.parse(raw) as LexiWarsServerMessage;
					console.log("[LexiWars WS] →", data);
					messageHandlerRef.current?.(data);
				} catch (err) {
					console.error("❌ Failed to parse LexiWars message", err);
				}
			};

			ws.onclose = (event: CloseEvent) => {
				console.warn(
					"🛑 LexiWars WebSocket closed:",
					event.code,
					event.reason
				);
				setReadyState(WebSocket.CLOSED);
				socketRef.current = null;

				if (
					mounted &&
					!manuallyDisconnectedRef.current &&
					reconnectAttempts.current < maxReconnectAttempts
				) {
					setReconnecting(true);
					const timeout =
						Math.pow(2, reconnectAttempts.current) * 1000;
					reconnectTimeoutRef.current = setTimeout(() => {
						reconnectAttempts.current++;
						startConnection();
					}, timeout);
				}
			};

			ws.onerror = (err: Event) => {
				console.error("⚠️ LexiWars WebSocket error", err);
				setError(err);
				setReadyState(WebSocket.CLOSED);
			};
		};

		startConnection();

		return () => {
			mounted = false;
			if (reconnectTimeoutRef.current)
				clearTimeout(reconnectTimeoutRef.current);
			if (socketRef.current) socketRef.current.close();
			socketRef.current = null;
		};
	}, [lobbyId, userId]);

	const sendMessage = useCallback((msg: LexiWarsClientMessage) => {
		const socket = socketRef.current;
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(msg));
		} else {
			console.warn("LexiWars WebSocket not ready to send");
		}
	}, []);

	const disconnect = useCallback(() => {
		manuallyDisconnectedRef.current = true;
		if (reconnectTimeoutRef.current)
			clearTimeout(reconnectTimeoutRef.current);
		socketRef.current?.close();
		socketRef.current = null;
		setReadyState(WebSocket.CLOSED);
	}, []);

	return {
		sendMessage,
		disconnect,
		readyState,
		error,
		reconnecting,
	};
}
