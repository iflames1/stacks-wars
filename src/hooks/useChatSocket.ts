import { JsonParticipant } from "@/types/schema";
import { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";

export interface PlayerStanding {
	player: JsonParticipant;
	rank: number;
}

export interface JsonChatMessage {
	id: string;
	text: string;
	sender: JsonParticipant;
	timestamp: string;
}

export interface VoiceParticipant {
	player: JsonParticipant;
	mic_enabled: boolean;
	is_muted: boolean;
	is_speaking: boolean;
}

export type ChatServerMessage =
	| { type: "permitchat"; allowed: boolean }
	| { type: "chat"; message: JsonChatMessage }
	| { type: "chathistory"; messages: JsonChatMessage[] }
	| { type: "pong"; ts: number; pong: number }
	| { type: "error"; message: string }
	| { type: "voicepermit"; allowed: boolean }
	| { type: "voiceparticipants"; participants: VoiceParticipant[] }
	| { type: "voiceparticipantupdate"; participant: VoiceParticipant };

export type ChatClientMessage =
	| { type: "chat"; text: string }
	| { type: "ping"; ts: number }
	| { type: "mic"; enabled: boolean }
	| { type: "mute"; muted: boolean };

interface QueuedMessage {
	data: ChatClientMessage;
	resolve: () => void;
	reject: (error: Error) => void;
}

interface UseChatSocketProps {
	lobbyId: string;
	userId: string;
}

export interface VoiceState {
	micEnabled: boolean;
	isMuted: boolean;
	isRecording: boolean;
	isPlaying: boolean;
	participants: VoiceParticipant[];
	voicePermitted: boolean;
}

export interface UseChatSocketType {
	sendMessage: (data: ChatClientMessage) => Promise<void>;
	disconnectChat: () => void;
	readyState: WebSocket["readyState"];
	error: null | Event;
	reconnecting: boolean;
	forceReconnect: () => void;
	messages: JsonChatMessage[];
	unreadCount: number;
	chatPermitted: boolean;
	userId: string;
	setOpen: (open: boolean) => void;

	// Voice chat methods and state
	voiceState: VoiceState;
	toggleMic: () => Promise<void>;
	toggleMute: () => Promise<void>;
	startRecording: () => Promise<void>;
	stopRecording: () => void;
}

export function useChatSocket({
	lobbyId,
	userId,
}: UseChatSocketProps): UseChatSocketType {
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectAttempts = useRef(0);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const manuallyDisconnectedRef = useRef(false);
	const messageQueue = useRef<QueuedMessage[]>([]);
	const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const pingInProgress = useRef(false);
	const PING_INTERVAL = 10000; // 10 seconds

	// Audio refs
	const mediasoupDeviceRef = useRef<Device | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const gainNodeRef = useRef<GainNode | null>(null);

	// Basic state
	const [readyState, setReadyState] = useState<WebSocket["readyState"]>(
		WebSocket.CLOSED
	);
	const [error, setError] = useState<null | Event>(null);
	const [reconnecting, setReconnecting] = useState(false);
	const [messages, setMessages] = useState<JsonChatMessage[]>([]);
	const [chatPermitted, setChatPermitted] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const [open, setOpen] = useState(false);

	// Voice state
	const [voiceState, setVoiceState] = useState<VoiceState>({
		micEnabled: false,
		isMuted: false,
		isRecording: false,
		isPlaying: false,
		participants: [],
		voicePermitted: false,
	});

	const maxReconnectAttempts = 5;

	// Initialize mediasoup device
	const initializeMediasoupDevice = useCallback(async () => {
		if (!mediasoupDeviceRef.current) {
			try {
				const device = new Device();
				mediasoupDeviceRef.current = device;
				console.log("📱 Mediasoup device initialized");
			} catch (error) {
				console.error(
					"❌ Failed to initialize mediasoup device:",
					error
				);
			}
		}
	}, []);

	// Initialize audio context
	const initializeAudioContext = useCallback(async () => {
		if (!audioContextRef.current) {
			try {
				audioContextRef.current = new (window.AudioContext ||
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(window as any).webkitAudioContext)();
				gainNodeRef.current = audioContextRef.current.createGain();
				gainNodeRef.current.connect(
					audioContextRef.current.destination
				);
				console.log("🎵 Audio context initialized");
			} catch (error) {
				console.error("❌ Failed to initialize audio context:", error);
			}
		}
	}, []);

	// Start recording (get user media)
	const startRecording = useCallback(async () => {
		if (!voiceState.voicePermitted) {
			console.warn("⚠️ Voice not permitted");
			return;
		}

		try {
			await initializeAudioContext();
			await initializeMediasoupDevice();

			// Get user media
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});

			localStreamRef.current = stream;

			setVoiceState((prev) => ({
				...prev,
				isRecording: true,
			}));

			console.log("🎤 Recording started");

			// Note: In a full implementation, you would create a mediasoup producer here
			// and send the stream to the server
		} catch (error) {
			console.error("❌ Failed to start recording:", error);
			throw error;
		}
	}, [
		voiceState.voicePermitted,
		initializeAudioContext,
		initializeMediasoupDevice,
	]);

	// Stop recording
	const stopRecording = useCallback(() => {
		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => {
				track.stop();
			});
			localStreamRef.current = null;
		}

		setVoiceState((prev) => ({
			...prev,
			isRecording: false,
		}));

		console.log("🛑 Recording stopped");
	}, []);

	const sendMessage = useCallback(
		(data: ChatClientMessage): Promise<void> => {
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
					console.log("⏳ Queuing Chat message (socket not ready)");
					messageQueue.current.push({ data, resolve, reject });
				}
			});
		},
		[]
	);

	// Toggle microphone
	const toggleMic = useCallback(async () => {
		const newMicEnabled = !voiceState.micEnabled;

		setVoiceState((prev) => ({
			...prev,
			micEnabled: newMicEnabled,
		}));

		// Send mic state to server
		try {
			await sendMessage({ type: "mic", enabled: newMicEnabled });

			// Start/stop recording based on mic state
			if (newMicEnabled && !voiceState.isRecording) {
				await startRecording();
			} else if (!newMicEnabled && voiceState.isRecording) {
				stopRecording();
			}
		} catch (error) {
			console.error("❌ Failed to toggle mic:", error);
			// Revert state on error
			setVoiceState((prev) => ({
				...prev,
				micEnabled: !newMicEnabled,
			}));
		}
	}, [
		voiceState.micEnabled,
		voiceState.isRecording,
		startRecording,
		stopRecording,
		sendMessage,
	]);

	// Toggle mute (affects what user hears)
	const toggleMute = useCallback(async () => {
		const newMuted = !voiceState.isMuted;

		setVoiceState((prev) => ({
			...prev,
			isMuted: newMuted,
		}));

		// Mute/unmute audio output
		if (gainNodeRef.current) {
			gainNodeRef.current.gain.setValueAtTime(
				newMuted ? 0 : 1,
				audioContextRef.current?.currentTime || 0
			);
		}

		// Send mute state to server
		try {
			await sendMessage({ type: "mute", muted: newMuted });
		} catch (error) {
			console.error("❌ Failed to toggle mute:", error);
			// Revert state on error
			setVoiceState((prev) => ({
				...prev,
				isMuted: !newMuted,
			}));
		}
	}, [sendMessage, voiceState.isMuted]);

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

	const schedulePing = useCallback(async () => {
		if (pingInProgress.current || !socketRef.current) return;

		pingInProgress.current = true;
		try {
			await sendMessage({ type: "ping", ts: Date.now() });
		} catch (error) {
			console.error("❌ Chat Ping failed:", error);
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
		if (socketRef.current) return; // already connecting or connected

		console.log("🟢 Connecting ChatSocket...");

		const ws = new WebSocket(
			`${process.env.NEXT_PUBLIC_WS_URL}/ws/chat/${lobbyId}?user_id=${userId}`
		);

		socketRef.current = ws;

		ws.onopen = () => {
			console.log("✅ Chat connected");
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
				const data = JSON.parse(raw) as ChatServerMessage;

				switch (data.type) {
					case "permitchat":
						setChatPermitted(data.allowed);
						if (!data.allowed) setMessages([]);
						break;
					case "chat":
						setMessages((prev) => [...prev, data.message]);
						if (!open && data.message.sender.id !== userId) {
							setUnreadCount((prev) => prev + 1);
						}
						break;
					case "chathistory":
						setMessages(data.messages);
						break;
					case "pong":
						// Optional latency tracking
						break;
					case "error":
						console.error("Chat error:", data.message);
						break;
					case "voicepermit":
						setVoiceState((prev) => ({
							...prev,
							voicePermitted: data.allowed,
						}));
						if (!data.allowed) {
							// Stop recording if voice permission is revoked
							stopRecording();
							setVoiceState((prev) => ({
								...prev,
								micEnabled: false,
								isMuted: false,
								participants: [],
							}));
						}
						break;
					case "voiceparticipants":
						setVoiceState((prev) => ({
							...prev,
							participants: data.participants,
						}));
						break;
					case "voiceparticipantupdate":
						setVoiceState((prev) => ({
							...prev,
							participants: prev.participants.map((p) =>
								p.player.id === data.participant.player.id
									? data.participant
									: p
							),
						}));
						break;
					default:
						console.warn("Unknown chat message type", data);
				}
			} catch (err) {
				console.error("❌ Failed to parse Chat message", err);
			}
		};

		ws.onclose = (event) => {
			console.warn("🛑 Chat closed:", event.code, event.reason);
			setReadyState(WebSocket.CLOSED);
			socketRef.current = null;
			pingInProgress.current = false;

			// Stop recording on disconnect
			stopRecording();

			if (pingIntervalRef.current) {
				clearTimeout(pingIntervalRef.current);
				pingIntervalRef.current = null;
			}

			if (
				!manuallyDisconnectedRef.current &&
				reconnectAttempts.current < maxReconnectAttempts
			) {
				reconnectAttempts.current++;
				const timeout = Math.pow(2, reconnectAttempts.current) * 1000;
				console.log(`♻️ Chat Reconnecting in ${timeout / 1000}s...`);

				setReconnecting(true);
				reconnectTimeoutRef.current = setTimeout(() => {
					connectSocket();
				}, timeout);
			} else {
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
			console.error("⚠️ Chat error:", err);
			setError(err);
			setReadyState(WebSocket.CLOSED);

			// Stop recording on error
			stopRecording();

			// Close the broken socket to trigger reconnection
			if (socketRef.current) {
				socketRef.current.close();
				socketRef.current = null;
			}
		};
	}, [
		lobbyId,
		userId,
		schedulePing,
		processMessageQueue,
		open,
		stopRecording,
	]);

	const setOpenWithUnreadReset = useCallback((newOpen: boolean) => {
		setOpen(newOpen);
		if (newOpen) {
			setUnreadCount(0);
		}
	}, []);

	useEffect(() => {
		connectSocket();

		return () => {
			if (reconnectTimeoutRef.current)
				clearTimeout(reconnectTimeoutRef.current);
			stopRecording();
			socketRef.current?.close();
			socketRef.current = null;
		};
	}, [connectSocket, stopRecording]);

	const disconnectChat = useCallback(() => {
		manuallyDisconnectedRef.current = true;
		pingInProgress.current = false;

		// Stop recording
		stopRecording();

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
	}, [stopRecording]);

	const forceReconnect = useCallback(() => {
		// Clear any existing timeouts
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		// Stop recording
		stopRecording();

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
	}, [connectSocket, stopRecording]);

	return {
		sendMessage,
		disconnectChat,
		readyState,
		error,
		reconnecting,
		forceReconnect,
		messages,
		unreadCount,
		chatPermitted,
		userId,
		setOpen: setOpenWithUnreadReset,

		// Voice chat
		voiceState,
		toggleMic,
		toggleMute,
		startRecording,
		stopRecording,
	};
}
