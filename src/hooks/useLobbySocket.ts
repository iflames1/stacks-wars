import { JsonParticipant } from "@/types/schema";
import { useEffect, useRef, useState, useCallback } from "react";

interface UseLobbySocketProps {
	roomId: string;
	enabled: boolean;
	onMessage?: (data: LobbyServerMessage) => void;
	userId: string;
}

export type PlayerStatus = "ready" | "notready";
export type GameState = "waiting" | "inprogress" | "finished";

export type LobbyClientMessage =
	| {
			type: "updateplayerstate";
			new_state: PlayerStatus;
	  }
	| {
			type: "updategamestate";
			new_state: GameState;
	  }
	| {
			type: "leaveroom";
	  }
	| {
			type: "kickplayer";
			player_id: string;
	  };

export type LobbyServerMessage =
	| {
			type: "playerjoined";
			players: JsonParticipant[];
	  }
	| {
			type: "playerleft";
			players: JsonParticipant[];
	  }
	| {
			type: "playerupdated";
			players: JsonParticipant[];
	  }
	| {
			type: "playerkicked";
			player_id: string;
			reason: string;
	  }
	| {
			type: "notifykicked";
			reason: string;
	  }
	| {
			type: "countdown";
			time: number;
	  }
	| {
			type: "gamestarting";
	  };

export function useLobbySocket({
	roomId,
	enabled,
	userId,
	onMessage,
}: UseLobbySocketProps) {
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttempts = useRef<number>(0);
	const maxReconnectAttempts = 5;

	const [readyState, setReadyState] = useState<WebSocket["readyState"]>(
		WebSocket.CLOSED
	);
	const [error, setError] = useState<null | Event>(null);

	const connect = useCallback(() => {
		console.log("connect attempt");
		if (
			!enabled ||
			(socketRef.current &&
				socketRef.current.readyState === WebSocket.OPEN)
		) {
			console.log("not enabled", enabled);
			return;
		}

		if (!roomId || !userId) {
			console.error("Room ID or User ID is missing");
			return;
		}

		const ws = new WebSocket(
			`${process.env.NEXT_PUBLIC_WS_URL}/ws/room/${roomId}?user_id=${userId}`
		);
		socketRef.current = ws;

		ws.onopen = () => {
			console.log("Lobby WebSocket connected");
			setReadyState(ws.readyState);
			setError(null);
			reconnectAttempts.current = 0;
		};

		ws.onmessage = (event: MessageEvent<LobbyServerMessage>) => {
			try {
				const raw = typeof event.data === "string" ? event.data : "";
				const data = JSON.parse(raw) as LobbyServerMessage;
				if (process.env.NODE_ENV === "development")
					switch (data.type) {
						case "playerjoined":
							console.log("🔵 Player joined:", data.players);
							break;
						case "playerleft":
							console.log("🟡 Player left:", data.players);
							break;
						case "playerupdated":
							console.log("🟢 Player updated:", data.players);
							break;
						case "playerkicked":
							console.log(
								"🔴 Player kicked:",
								data.player_id,
								"Reason:",
								data.reason
							);
							break;
						case "notifykicked":
							console.log("⚠️ You were kicked:", data.reason);
							break;
						case "countdown":
							console.log(
								"⏳ Countdown started:",
								data.time,
								"seconds"
							);
							break;
						case "gamestarting":
							console.log("🚀 Game is starting!");
							break;
						default:
							console.warn("❓ Unknown message type:", data);
					}
				onMessage?.(data);
			} catch (err) {
				console.error("Failed to parse WS message", err);
			}
		};

		ws.onclose = (event: CloseEvent) => {
			console.log("WebSocket disconnected:", event.code, event.reason);
			setReadyState(WebSocket.CLOSED);
			socketRef.current = null;

			if (reconnectAttempts.current < maxReconnectAttempts) {
				const timeout = Math.pow(2, reconnectAttempts.current) * 1000;
				reconnectTimeoutRef.current = setTimeout(() => {
					reconnectAttempts.current++;
					console.log(
						`Reconnecting... Attempt ${reconnectAttempts.current}`
					);
					connect();
				}, timeout);
			}
		};

		ws.onerror = (err: Event) => {
			console.error("WebSocket error", err);
			setError(err);
			setReadyState(WebSocket.CLOSED);
		};
	}, [roomId, enabled, userId, onMessage]);

	useEffect(() => {
		if (enabled) connect();
		return () => {
			if (reconnectTimeoutRef.current)
				clearTimeout(reconnectTimeoutRef.current);
			if (socketRef.current) socketRef.current.close();
		};
	}, [enabled, connect]);

	const sendMessage = useCallback((data: LobbyClientMessage) => {
		const socket = socketRef.current;
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(data));
		}
	}, []);

	return {
		sendMessage,
		disconnect: () => socketRef.current?.close(),
		readyState,
		error,
	};
}
