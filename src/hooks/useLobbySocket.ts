import { useEffect, useRef, useState, useCallback } from "react";
import { JsonParticipant, JsonUser, lobbyStatus } from "@/types/schema";

interface UseLobbySocketProps {
	roomId: string;
	onMessage?: (data: LobbyServerMessage) => void;
	userId: string;
}

export type PlayerStatus = "ready" | "notready";

export type JoinState = "idle" | "pending" | "allowed" | "rejected";

export type PendingJoin = {
	user: JsonUser;
	state: JoinState;
};

export type LobbyClientMessage =
	| { type: "updateplayerstate"; new_state: PlayerStatus }
	| { type: "updategamestate"; new_state: lobbyStatus }
	| { type: "leaveroom" }
	| {
			type: "kickplayer";
			player_id: string;
			wallet_address: string;
			display_name: string | null;
	  }
	| { type: "requestjoin" }
	| {
			type: "permitjoin";
			user_id: string;
			allow: boolean;
	  }
	| {
			type: "joinlobby";
			tx_id: string | undefined;
	  }
	| {
			type: "ping";
			ts: number;
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
	| {
			type: "gamestate";
			state: lobbyStatus;
			ready_players: string[] | null;
	  }
	| {
			type: "pendingplayers";
			pending_players: PendingJoin[];
	  }
	| { type: "playersnotready"; players: JsonParticipant[] }
	| { type: "allowed" }
	| { type: "rejected" }
	| { type: "pending" }
	| {
			type: "error";
			message: string;
	  }
	| { type: "pong"; ts: number; pong: number };

export function useLobbySocket({
	roomId,
	userId,
	onMessage,
}: UseLobbySocketProps) {
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectAttempts = useRef(0);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const manuallyDisconnectedRef = useRef(false);
	const messageHandlerRef = useRef<typeof onMessage | null>(null);
	const messageQueue = useRef<LobbyClientMessage[]>([]);
	const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const PING_INTERVAL = 10000; // 10 seconds

	const [readyState, setReadyState] = useState<WebSocket["readyState"]>(
		WebSocket.CLOSED
	);
	const [error, setError] = useState<null | Event>(null);
	const [reconnecting, setReconnecting] = useState(false);

	const maxReconnectAttempts = 5;

	const processMessageQueue = useCallback(() => {
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			while (messageQueue.current.length > 0) {
				const message = messageQueue.current.shift();
				if (message) {
					socketRef.current.send(JSON.stringify(message));
				}
			}
		}
	}, []);

	useEffect(() => {
		messageHandlerRef.current = onMessage;
	}, [onMessage]);

	const sendMessage = useCallback((data: LobbyClientMessage) => {
		const socket = socketRef.current;
		if (socket?.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(data));
		} else {
			console.log("⏳ Queuing message (socket not ready)");
			messageQueue.current.push(data);
		}
	}, []);

	const connectSocket = useCallback(() => {
		if (!roomId || !userId) return;
		if (socketRef.current) return; // already connecting or connected

		console.log("🟢 Connecting LobbySocket...");

		const ws = new WebSocket(
			`${process.env.NEXT_PUBLIC_WS_URL}/ws/room/${roomId}?user_id=${userId}`
		);

		socketRef.current = ws;

		ws.onopen = () => {
			console.log("✅ LobbySocket connected");
			setReadyState(ws.readyState);
			setError(null);
			setReconnecting(false);
			reconnectAttempts.current = 0;
			pingIntervalRef.current = setInterval(() => {
				sendMessage({ type: "ping", ts: Date.now() });
			}, PING_INTERVAL);
			processMessageQueue();
		};

		ws.onmessage = (event) => {
			try {
				const raw = typeof event.data === "string" ? event.data : "";
				const data = JSON.parse(raw) as LobbyServerMessage;
				messageHandlerRef.current?.(data);
			} catch (err) {
				console.error("❌ Failed to parse WS message", err);
			}
		};

		ws.onclose = (event) => {
			console.warn("🛑 LobbySocket closed:", event.code, event.reason);
			setReadyState(WebSocket.CLOSED);
			socketRef.current = null;

			if (pingIntervalRef.current) {
				clearInterval(pingIntervalRef.current);
				pingIntervalRef.current = null;
			}

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
	}, [roomId, userId, processMessageQueue, sendMessage]);

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
		if (reconnectTimeoutRef.current)
			clearTimeout(reconnectTimeoutRef.current);

		if (pingIntervalRef.current) {
			clearInterval(pingIntervalRef.current);
			pingIntervalRef.current = null;
		}

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
