import { JsonParticipant } from "@/types/schema";
import { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import {
	MediaKind,
	RtpCapabilities,
	RtpParameters,
	DtlsParameters,
	Transport,
	Producer,
	Consumer,
} from "mediasoup-client/types";

// Extend Window interface to include custom method
declare global {
	interface Window {
		createAudioElementForParticipant?: (
			participantId: string,
			stream: MediaStream
		) => void;
	}
}

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

export interface IceCandidate {
	foundation: string;
	ip: string;
	port: number;
	priority: number;
	protocol: "udp" | "tcp";
	type: "host" | "srflx" | "prflx" | "relay";
	address: string;
	tcpType?: "active" | "passive" | "so" | undefined;
}

export interface IceParameters {
	usernameFragment: string;
	password: string;
	iceLite?: boolean;
}

export interface TransportOptionsType {
	id: string;
	dtlsParameters: DtlsParameters;
	iceParameters: IceParameters;
	iceCandidates: IceCandidate[];
}

export type ChatServerMessage =
	| { type: "permitchat"; allowed: boolean }
	| { type: "chat"; message: JsonChatMessage }
	| { type: "chathistory"; messages: JsonChatMessage[] }
	| { type: "pong"; ts: number; pong: number }
	| { type: "error"; message: string }
	// Voice messages
	| {
			type: "voiceinit";
			consumer_transport_options: TransportOptionsType;
			producer_transport_options: TransportOptionsType;
			router_rtp_capabilities: RtpCapabilities;
	  }
	| { type: "connectedproducertransport" }
	| { type: "produced"; id: string }
	| { type: "connectedconsumertransport" }
	| {
			type: "consumed";
			id: string;
			producer_id: string;
			kind: MediaKind;
			rtp_parameters: RtpParameters;
			participant_id: string;
	  }
	| { type: "voiceparticipants"; participants: VoiceParticipant[] }
	| { type: "voiceparticipantupdate"; participant: VoiceParticipant }
	| { type: "newproducer"; producer_id: string; participant_id: string };

export type ChatClientMessage =
	| { type: "chat"; text: string }
	| { type: "ping"; ts: number }
	// Voice messages
	| { type: "voiceinit"; rtp_capabilities: RtpCapabilities }
	| { type: "connectproducertransport"; dtls_parameters: DtlsParameters }
	| { type: "connectconsumertransport"; dtls_parameters: DtlsParameters }
	| { type: "produce"; kind: MediaKind; rtp_parameters: RtpParameters }
	| { type: "consume"; producer_id: string }
	| { type: "consumerresume"; id: string }
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

// Type for transport response callbacks
type TransportConnectCallback = () => void;
type ProduceCallback = (data: { id: string }) => void;
type ResponseCallback = TransportConnectCallback | ProduceCallback;

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

	// Voice functions
	initializeVoice: () => Promise<void>;
	toggleMic: () => Promise<void>;
	toggleMute: () => Promise<void>;
	disconnectVoice: () => void;

	// Voice states
	voiceInitialized: boolean;
	voiceConnected: boolean;
	micEnabled: boolean;
	isMuted: boolean;
	voiceParticipants: VoiceParticipant[];
	localStream: MediaStream | null;
	voiceError: string | null;
	participantStreams: Map<string, MediaStream>;
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

	// Voice refs with proper typing
	const deviceRef = useRef<Device | null>(null);
	const producerTransportRef = useRef<Transport | null>(null);
	const consumerTransportRef = useRef<Transport | null>(null);
	const producersRef = useRef<Map<string, Producer>>(new Map());
	const consumersRef = useRef<Map<string, Consumer>>(new Map());
	const localStreamRef = useRef<MediaStream | null>(null);
	const waitingForResponseRef = useRef<Map<string, ResponseCallback>>(
		new Map()
	);

	// Chat states
	const [readyState, setReadyState] = useState<WebSocket["readyState"]>(
		WebSocket.CLOSED
	);
	const [error, setError] = useState<null | Event>(null);
	const [reconnecting, setReconnecting] = useState(false);
	const [messages, setMessages] = useState<JsonChatMessage[]>([]);
	const [chatPermitted, setChatPermitted] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const [open, setOpen] = useState(false);

	// Voice states
	const [voiceInitialized, setVoiceInitialized] = useState(false);
	const [voiceConnected, setVoiceConnected] = useState(false);
	const [micEnabled, setMicEnabled] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [voiceParticipants, setVoiceParticipants] = useState<
		VoiceParticipant[]
	>([]);
	const participantStreamsRef = useRef<Map<string, MediaStream>>(new Map());
	const [participantStreams, setParticipantStreams] = useState<
		Map<string, MediaStream>
	>(new Map());
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [voiceError, setVoiceError] = useState<string | null>(null);

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

	const initializeVoice = useCallback(async () => {
		try {
			if (!deviceRef.current) {
				deviceRef.current = new Device();
			}

			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: false,
			});

			localStreamRef.current = stream;
			setLocalStream(stream);
			setVoiceInitialized(true);
			setVoiceError(null);

			console.log("🎤 Voice initialized with microphone access");
		} catch (error) {
			console.error("❌ Failed to initialize voice:", error);
			setVoiceError("Failed to access microphone");
			throw error;
		}
	}, []);

	const handleVoiceInit = useCallback(
		async (data: {
			consumer_transport_options: TransportOptionsType;
			producer_transport_options: TransportOptionsType;
			router_rtp_capabilities: RtpCapabilities;
		}) => {
			try {
				console.log("🎙️ Handling voice init", data);

				if (!deviceRef.current) {
					deviceRef.current = new Device();
				}

				// Load device with router RTP capabilities
				await deviceRef.current.load({
					routerRtpCapabilities: data.router_rtp_capabilities,
				});

				// Send client RTP capabilities
				await sendMessage({
					type: "voiceinit",
					rtp_capabilities: deviceRef.current.rtpCapabilities,
				});

				// Create producer transport
				producerTransportRef.current =
					deviceRef.current.createSendTransport(
						data.producer_transport_options
					);

				// Create consumer transport
				consumerTransportRef.current =
					deviceRef.current.createRecvTransport(
						data.consumer_transport_options
					);

				// Set up producer transport events
				producerTransportRef.current.on(
					"connect",
					({ dtlsParameters }, success, errback) => {
						console.log("🔗 Producer transport connecting...");
						sendMessage({
							type: "connectproducertransport",
							dtls_parameters: dtlsParameters,
						})
							.then(() => {
								const callback: TransportConnectCallback =
									() => {
										success();
										console.log(
											"✅ Producer transport connected"
										);
									};

								waitingForResponseRef.current.set(
									"connectedproducertransport",
									callback
								);
							})
							.catch((error) => {
								console.error(
									"❌ Failed to send connect producer transport message:",
									error
								);
								errback(error);
							});
					}
				);

				producerTransportRef.current.on(
					"produce",
					({ kind, rtpParameters }, success, errback) => {
						console.log(`🎤 Producing ${kind}...`);
						sendMessage({
							type: "produce",
							kind,
							rtp_parameters: rtpParameters,
						})
							.then(() => {
								const callback: ProduceCallback = ({
									id,
								}: {
									id: string;
								}) => {
									success({ id });
									console.log(
										`✅ ${kind} producer created: ${id}`
									);
								};

								waitingForResponseRef.current.set(
									"produced",
									callback
								);
							})
							.catch((error) => {
								console.error(
									`❌ Failed to send produce message:`,
									error
								);
								errback(error);
							});
					}
				);

				// Set up consumer transport events
				consumerTransportRef.current.on(
					"connect",
					({ dtlsParameters }, success, errback) => {
						console.log("🔗 Consumer transport connecting...");
						sendMessage({
							type: "connectconsumertransport",
							dtls_parameters: dtlsParameters,
						})
							.then(() => {
								const callback: TransportConnectCallback =
									() => {
										success();
										console.log(
											"✅ Consumer transport connected"
										);
									};

								waitingForResponseRef.current.set(
									"connectedconsumertransport",
									callback
								);
							})
							.catch((error) => {
								console.error(
									"❌ Failed to send connect consumer transport message:",
									error
								);
								errback(error);
							});
					}
				);

				// **IMPORTANT: Only create producers if we have a local stream**
				if (localStreamRef.current && producerTransportRef.current) {
					console.log("🎵 Creating producers from local stream...");

					for (const track of localStreamRef.current.getTracks()) {
						console.log(
							`🎤 Creating producer for ${track.kind} track`
						);

						try {
							const producer =
								await producerTransportRef.current.produce({
									track,
								});

							producersRef.current.set(producer.id, producer);
							console.log(
								`✅ Producer created for ${track.kind}: ${producer.id}`
							);
						} catch (error) {
							console.error(
								`❌ Failed to create producer for ${track.kind}:`,
								error
							);
						}
					}
				} else {
					console.warn("⚠️ No local stream available for producing");
				}

				setVoiceConnected(true);
				console.log("✅ Voice chat fully initialized");
			} catch (error) {
				console.error("❌ Failed to handle voice init:", error);
				setVoiceError("Failed to initialize voice chat");
			}
		},
		[sendMessage]
	);

	const handleVoiceConsumed = useCallback(
		async (data: {
			id: string;
			producer_id: string;
			kind: MediaKind;
			rtp_parameters: RtpParameters;
			participant_id: string;
		}) => {
			try {
				console.log(
					`🔊 Handling consumed for participant: ${data.participant_id}, kind: ${data.kind}`
				);

				if (!consumerTransportRef.current) {
					console.error("❌ Consumer transport not available");
					return;
				}

				const consumer = await consumerTransportRef.current.consume({
					id: data.id,
					producerId: data.producer_id,
					kind: data.kind,
					rtpParameters: data.rtp_parameters,
				});

				consumersRef.current.set(consumer.id, consumer);

				// Resume the consumer
				await sendMessage({
					type: "consumerresume",
					id: consumer.id,
				});

				// Create audio stream from consumer track if it's audio
				if (data.kind === "audio" && consumer.track) {
					const stream = new MediaStream([consumer.track]);
					const participantId = data.participant_id;

					console.log(
						`🎵 Creating audio stream for participant: ${participantId}`
					);

					// Store the stream
					participantStreamsRef.current.set(participantId, stream);
					setParticipantStreams(
						new Map(participantStreamsRef.current)
					);

					// Create audio element for playback
					if (window.createAudioElementForParticipant) {
						window.createAudioElementForParticipant(
							participantId,
							stream
						);
					}

					console.log(
						`✅ Audio stream created for participant: ${participantId}`
					);
				}

				console.log(
					`🔊 Consumer created for ${data.kind}: ${consumer.id}`
				);
			} catch (error) {
				console.error("❌ Failed to handle voice consumed:", error);
			}
		},
		[sendMessage]
	);

	const handleNewProducer = useCallback(
		async (data: { producer_id: string; participant_id: string }) => {
			try {
				console.log(
					`🎵 New producer ${data.producer_id} from participant ${data.participant_id}`
				);

				// Add a small delay to ensure producer is ready on server
				await new Promise((resolve) => setTimeout(resolve, 50));

				// Automatically consume the new producer
				await sendMessage({
					type: "consume",
					producer_id: data.producer_id,
				});

				console.log(`📡 Consuming producer ${data.producer_id}`);
			} catch (error) {
				console.error("❌ Failed to consume new producer:", error);
			}
		},
		[sendMessage]
	);

	const toggleMic = useCallback(async () => {
		try {
			const newMicState = !micEnabled;
			setMicEnabled(newMicState);

			// Enable/disable audio tracks
			if (localStreamRef.current) {
				localStreamRef.current.getAudioTracks().forEach((track) => {
					track.enabled = newMicState;
				});
			}

			// If enabling mic and we don't have producers yet, create them
			if (
				newMicState &&
				localStreamRef.current &&
				producerTransportRef.current
			) {
				const hasAudioProducer = Array.from(
					producersRef.current.values()
				).some((producer) => producer.track?.kind === "audio");

				if (!hasAudioProducer) {
					console.log(
						"🎤 Creating audio producer when enabling mic..."
					);

					for (const track of localStreamRef.current.getAudioTracks()) {
						try {
							const producer =
								await producerTransportRef.current.produce({
									track,
								});

							producersRef.current.set(producer.id, producer);
							console.log(
								`✅ Audio producer created: ${producer.id}`
							);
						} catch (error) {
							console.error(
								"❌ Failed to create audio producer:",
								error
							);
						}
					}
				}
			}

			await sendMessage({
				type: "mic",
				enabled: newMicState,
			});

			console.log(
				`🎤 Microphone ${newMicState ? "enabled" : "disabled"}`
			);
		} catch (error) {
			console.error("❌ Failed to toggle mic:", error);
			setVoiceError("Failed to toggle microphone");
		}
	}, [micEnabled, sendMessage]);

	const toggleMute = useCallback(async () => {
		try {
			const newMuteState = !isMuted;
			setIsMuted(newMuteState);

			await sendMessage({
				type: "mute",
				muted: newMuteState,
			});

			console.log(`🔇 ${newMuteState ? "Muted" : "Unmuted"}`);
		} catch (error) {
			console.error("❌ Failed to toggle mute:", error);
			setVoiceError("Failed to toggle mute");
		}
	}, [isMuted, sendMessage]);

	const disconnectVoice = useCallback(() => {
		// Stop local stream
		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => track.stop());
			localStreamRef.current = null;
			setLocalStream(null);
		}

		// Close producers
		producersRef.current.forEach((producer) => {
			producer.close();
		});
		producersRef.current.clear();

		// Close consumers
		consumersRef.current.forEach((consumer) => {
			consumer.close();
		});
		consumersRef.current.clear();

		// Close transports
		if (producerTransportRef.current) {
			producerTransportRef.current.close();
			producerTransportRef.current = null;
		}

		if (consumerTransportRef.current) {
			consumerTransportRef.current.close();
			consumerTransportRef.current = null;
		}

		// Reset device
		deviceRef.current = null;

		// Clear waiting callbacks
		waitingForResponseRef.current.clear();

		// Reset states
		setVoiceInitialized(false);
		setVoiceConnected(false);
		setMicEnabled(false);
		setIsMuted(true);
		setVoiceParticipants([]);
		setVoiceError(null);

		// Clean up participant streams
		participantStreamsRef.current.forEach((stream) => {
			stream.getTracks().forEach((track) => track.stop());
		});
		participantStreamsRef.current.clear();
		setParticipantStreams(new Map());

		console.log("🔇 Voice chat disconnected");
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
						if (!data.allowed) {
							setMessages([]);
							disconnectVoice(); // Disconnect voice if chat not permitted
						}
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
						setVoiceError(data.message);
						break;

					// Voice message handlers
					case "voiceinit":
						handleVoiceInit(data);
						break;
					case "connectedproducertransport":
					case "connectedconsumertransport":
					case "produced":
						{
							const callback = waitingForResponseRef.current.get(
								data.type
							);
							if (callback) {
								waitingForResponseRef.current.delete(data.type);
								if (data.type === "produced" && "id" in data) {
									(callback as ProduceCallback)({
										id: data.id,
									});
								} else {
									(callback as TransportConnectCallback)();
								}
							}
						}
						break;
					case "consumed":
						handleVoiceConsumed(data);
						break;
					case "newproducer":
						handleNewProducer(data);
						break;
					case "voiceparticipants":
						setVoiceParticipants(data.participants);
						break;
					case "voiceparticipantupdate":
						setVoiceParticipants((prev) =>
							prev.map((p) =>
								p.player.id === data.participant.player.id
									? data.participant
									: p
							)
						);
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

			// Disconnect voice on socket close
			disconnectVoice();

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
		handleVoiceInit,
		handleVoiceConsumed,
		handleNewProducer,
		disconnectVoice,
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

			disconnectVoice();
			socketRef.current?.close();
			socketRef.current = null;
		};
	}, [connectSocket, disconnectVoice]);

	const disconnectChat = useCallback(() => {
		manuallyDisconnectedRef.current = true;
		pingInProgress.current = false;

		if (reconnectTimeoutRef.current)
			clearTimeout(reconnectTimeoutRef.current);

		if (pingIntervalRef.current) {
			clearTimeout(pingIntervalRef.current);
			pingIntervalRef.current = null;
		}

		disconnectVoice();

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
	}, [disconnectVoice]);

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

		disconnectVoice();

		// Reset reconnection attempts and flags
		reconnectAttempts.current = 0;
		manuallyDisconnectedRef.current = false;
		setReconnecting(false);

		// Reconnect immediately
		connectSocket();
	}, [connectSocket, disconnectVoice]);

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

		// Voice functions
		initializeVoice,
		toggleMic,
		toggleMute,
		disconnectVoice,

		// Voice states
		voiceInitialized,
		voiceConnected,
		micEnabled,
		isMuted,
		voiceParticipants,
		localStream,
		voiceError,
		participantStreams,
	};
}
