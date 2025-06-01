import { useEffect, useState, useRef, useCallback } from "react";

interface UseWebSocketReturn {
	sendMessage: (message: string | object) => boolean;
	lastMessage: string;
	readyState: number;
	error: Event | Error | null;
	disconnect: () => void;
	reconnect: () => void;
}

export function useWebSocket(url: string): UseWebSocketReturn {
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttempts = useRef<number>(0);
	const maxReconnectAttempts = 5;

	const [lastMessage, setLastMessage] = useState<string>("");
	const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
	const [error, setError] = useState<Event | Error | null>(null);

	const connect = useCallback(() => {
		console.log("connect attempt");
		if (
			socketRef.current &&
			socketRef.current.readyState === WebSocket.OPEN
		)
			return;

		const ws = new WebSocket(url);
		socketRef.current = ws;

		ws.onopen = () => {
			console.log("WebSocket connected");
			setReadyState(WebSocket.OPEN);
			setError(null);
			reconnectAttempts.current = 0;
		};

		ws.onmessage = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				setLastMessage(data);
			} catch (err) {
				setLastMessage(event.data);
				console.error("Error parsing message:", err);
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
			console.error("WebSocket error:", err);
			setError(err);
			setReadyState(WebSocket.CLOSED);
		};
	}, [url]);

	useEffect(() => {
		connect();
		return () => {
			if (reconnectTimeoutRef.current)
				clearTimeout(reconnectTimeoutRef.current);
			if (socketRef.current) socketRef.current.close();
		};
	}, [connect]);

	const sendMessage = useCallback((message: string | object): boolean => {
		const socket = socketRef.current;
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(
				typeof message === "string" ? message : JSON.stringify(message)
			);
			return true;
		}
		console.warn("WebSocket not ready to send");
		return false;
	}, []);

	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current)
			clearTimeout(reconnectTimeoutRef.current);
		if (socketRef.current) socketRef.current.close();
	}, []);

	return {
		sendMessage,
		lastMessage,
		readyState,
		error,
		disconnect,
		reconnect: connect,
	};
}
