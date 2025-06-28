import { useEffect, useRef, useState, useCallback } from "react";
import { JsonParticipant } from "@/types/schema";

interface UseLobbySocketProps {
	roomId: string;
	enabled: boolean;
	onMessage?: (data: LobbyServerMessage) => void;
	userId: string;
}

export type PlayerStatus = "ready" | "notready";
export type GameState = "waiting" | "inprogress" | "finished";

export type LobbyClientMessage =
	| { type: "updateplayerstate"; new_state: PlayerStatus }
	| { type: "updategamestate"; new_state: GameState }
	| { type: "leaveroom" }
	| {
			type: "kickplayer";
			player_id: string;
			wallet_address: string;
			display_name: string | null;
	  };

export type LobbyServerMessage =
	| { type: "playerjoined"; players: JsonParticipant[] }
	| { type: "playerleft"; players: JsonParticipant[] }
	| { type: "playerupdated"; players: JsonParticipant[] }
	| {
			type: "playerkicked";
			player_id: string;
			wallet_address: string;
			display_name: string | null;
	  }
	| { type: "notifykicked" }
	| { type: "countdown"; time: number }
	| { type: "gamestarting"; state: "waiting" | "inprogress" | "finished" };

export function useLobbySocket({
	roomId,
	enabled,
	userId,
	onMessage,
}: UseLobbySocketProps) {
	const socketRef = useRef<WebSocket | null>(null);
	const messageHandlerRef = useRef<typeof onMessage | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttempts = useRef<number>(0);
	const manuallyDisconnectedRef = useRef(false);
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
		if (!enabled || socketRef.current || manuallyDisconnectedRef.current)
			return;

		let mounted = true;

		function startConnection() {
			if (!roomId || !userId) return;

			console.log("🟢 Connecting WebSocket...");

			const ws = new WebSocket(
				`${process.env.NEXT_PUBLIC_WS_URL}/ws/room/${roomId}?user_id=${userId}`
			);
			socketRef.current = ws;

			ws.onopen = () => {
				if (!mounted) return;
				console.log("✅ WebSocket connected");
				setReadyState(ws.readyState);
				setError(null);
				setReconnecting(false);
				reconnectAttempts.current = 0;
			};

			ws.onmessage = (event: MessageEvent<LobbyServerMessage>) => {
				try {
					const raw =
						typeof event.data === "string" ? event.data : "";
					const data = JSON.parse(raw) as LobbyServerMessage;
					messageHandlerRef.current?.(data);
				} catch (err) {
					console.error("❌ Failed to parse WS message", err);
				}
			};

			ws.onclose = (event: CloseEvent) => {
				console.warn("🛑 WebSocket closed:", event.code, event.reason);
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
				console.error("⚠️ WebSocket error", err);
				setError(err);
				setReadyState(WebSocket.CLOSED);
			};
		}

		startConnection();

		return () => {
			mounted = false;
			if (reconnectTimeoutRef.current)
				clearTimeout(reconnectTimeoutRef.current);
			if (socketRef.current) socketRef.current.close();
			socketRef.current = null;
		};
	}, [enabled, roomId, userId]);

	const sendMessage = useCallback((data: LobbyClientMessage) => {
		const socket = socketRef.current;
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(data));
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
