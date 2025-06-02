import { getWalletAddress } from "@/lib/wallet";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";

interface Standing {
	username: string;
	rank: number;
}

interface UseWebSocketReturn {
	sendMessage: (message: string | object) => boolean;
	readyState: number;
	error: Event | Error | null;
	disconnect: () => void;
	reconnect: () => void;
	countdown: number;
	rank: string | null;
	finalStanding: [Standing] | null;
}

export function useWebSocket(url: string): UseWebSocketReturn {
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttempts = useRef<number>(0);
	const maxReconnectAttempts = 5;

	const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
	const [error, setError] = useState<Event | Error | null>(null);
	const [countdown, setCountdown] = useState<number>(10);
	const [rank, setRank] = useState<string | null>(null);
	const [finalStanding, setFinalStanding] = useState<[Standing] | null>(null);

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
				const message = JSON.parse(event.data);
				switch (message.type) {
					case "countdown":
						setCountdown(Number(message.data));
						break;
					case "rank":
						setRank(message.data);
						break;
					case "validation_msg":
						toast.info(`${message.data}`);
						break;
					case "word_entry":
						toast.info(
							`${
								getWalletAddress() === message.sender
									? "You"
									: message.sender
							} entered: ${message.data}`
						);
						break;
					case "game_over":
						toast.info(`🏁 Game Over!`);
						break;
					case "final_standing":
						setFinalStanding(message.data);
					default:
						toast.info("Uncaugth message:", message);
				}
			} catch (err) {
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
		readyState,
		error,
		disconnect,
		reconnect: connect,
		countdown,
		rank,
		finalStanding,
	};
}
