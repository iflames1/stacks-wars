"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Mic,
	MicOff,
	Volume2,
	VolumeX,
	Phone,
	PhoneOff,
	Users,
	AlertCircle,
	Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatSocket } from "@/hooks/useChatSocket";

interface VoiceChatProps {
	className?: string;
}

export function VoiceChat({ className }: VoiceChatProps) {
	const [isInitializing, setIsInitializing] = useState(false);
	const [audioElements, setAudioElements] = useState<
		Map<string, HTMLAudioElement>
	>(new Map());

	// Ref to track remote audio streams
	const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
	const audioContainerRef = useRef<HTMLDivElement>(null);

	const chatSocket = useChatSocket({
		lobbyId: "5bf95dce-3f2b-42cf-badc-6966663eae9f",
		userId: "68f14695-ae04-46f7-8954-cd1e7c2a46dd",
	});

	const {
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
		chatPermitted,
		userId,
	} = chatSocket;

	// Create audio element for remote participant
	//const createAudioElement = useCallback(
	//	(participantId: string, stream: MediaStream) => {
	//		const audio = new Audio();
	//		audio.srcObject = stream;
	//		audio.autoplay = true;
	//		audio.playsInline = true;
	//		audio.volume = 1.0;

	//		// Add to DOM (hidden) to ensure proper playback
	//		if (audioContainerRef.current) {
	//			audio.style.display = "none";
	//			audioContainerRef.current.appendChild(audio);
	//		}

	//		setAudioElements((prev) => {
	//			const newMap = new Map(prev);
	//			// Clean up previous audio element if exists
	//			const existingAudio = newMap.get(participantId);
	//			if (existingAudio) {
	//				existingAudio.pause();
	//				existingAudio.srcObject = null;
	//				existingAudio.remove();
	//			}
	//			newMap.set(participantId, audio);
	//			return newMap;
	//		});

	//		// Store the stream reference
	//		remoteStreamsRef.current.set(participantId, stream);

	//		console.log(
	//			`🔊 Audio element created for participant: ${participantId}`
	//		);
	//		return audio;
	//	},
	//	[]
	//);

	// Initialize voice chat
	const handleInitializeVoice = useCallback(async () => {
		if (!chatPermitted) {
			return;
		}

		setIsInitializing(true);
		try {
			await initializeVoice();
		} catch (error) {
			console.error("Failed to initialize voice:", error);
		} finally {
			setIsInitializing(false);
		}
	}, [initializeVoice, chatPermitted]);

	// Handle mic toggle
	const handleMicToggle = useCallback(async () => {
		try {
			await toggleMic();
		} catch (error) {
			console.error("Failed to toggle mic:", error);
		}
	}, [toggleMic]);

	// Handle mute toggle
	const handleMuteToggle = useCallback(async () => {
		try {
			await toggleMute();
		} catch (error) {
			console.error("Failed to toggle mute:", error);
		}
	}, [toggleMute]);

	// Handle disconnect
	const handleDisconnect = useCallback(() => {
		disconnectVoice();
		// Clean up audio elements
		audioElements.forEach((audio) => {
			audio.pause();
			audio.srcObject = null;
			audio.remove();
		});
		setAudioElements(new Map());
		remoteStreamsRef.current.clear();
	}, [disconnectVoice, audioElements]);

	// Clean up audio elements when participants leave
	useEffect(() => {
		const participantIds = new Set(
			voiceParticipants.map((p) => p.player.id)
		);

		setAudioElements((prev) => {
			const newMap = new Map();
			prev.forEach((audio, id) => {
				if (participantIds.has(id)) {
					newMap.set(id, audio);
				} else {
					// Clean up audio for participants who left
					console.log(`🔇 Cleaning up audio for participant: ${id}`);
					audio.pause();
					audio.srcObject = null;
					audio.remove();
					remoteStreamsRef.current.delete(id);
				}
			});
			return newMap;
		});
	}, [voiceParticipants]);

	// Auto-initialize voice when chat is permitted and not already initialized
	useEffect(() => {
		if (chatPermitted && !voiceInitialized && !isInitializing) {
			handleInitializeVoice();
		}
	}, [
		chatPermitted,
		voiceInitialized,
		isInitializing,
		handleInitializeVoice,
	]);

	// Get current user's participant data
	const currentUserParticipant = voiceParticipants.find(
		(p) => p.player.id === userId
	);
	const otherParticipants = voiceParticipants.filter(
		(p) => p.player.id !== userId
	);

	if (!chatPermitted) {
		return (
			<Card className={cn("w-full", className)}>
				<CardContent className="p-6">
					<div className="text-center text-muted-foreground">
						<Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
						<p>Voice chat not available</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={cn("w-full", className)}>
			{/* Hidden container for audio elements */}
			<div ref={audioContainerRef} style={{ display: "none" }} />

			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<Users className="h-5 w-5" />
					Voice Chat
					{voiceConnected && (
						<Badge variant="outline" className="ml-auto">
							Connected
						</Badge>
					)}
				</CardTitle>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Error Display */}
				{voiceError && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{voiceError}</AlertDescription>
					</Alert>
				)}

				{/* Voice Controls */}
				<div className="space-y-3">
					{!voiceInitialized ? (
						<Button
							onClick={handleInitializeVoice}
							disabled={isInitializing}
							className="w-full"
						>
							{isInitializing ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Initializing...
								</>
							) : (
								<>
									<Phone className="h-4 w-4 mr-2" />
									Join Voice Chat
								</>
							)}
						</Button>
					) : (
						<div className="grid grid-cols-3 gap-2">
							{/* Microphone Toggle */}
							<Button
								variant={micEnabled ? "default" : "secondary"}
								size="sm"
								onClick={handleMicToggle}
								disabled={!voiceConnected}
								className={cn(
									"flex-1",
									micEnabled
										? "bg-green-600 hover:bg-green-700"
										: "bg-red-600 hover:bg-red-700"
								)}
							>
								{micEnabled ? (
									<Mic className="h-4 w-4" />
								) : (
									<MicOff className="h-4 w-4" />
								)}
							</Button>

							{/* Mute Toggle */}
							<Button
								variant={isMuted ? "secondary" : "default"}
								size="sm"
								onClick={handleMuteToggle}
								disabled={!voiceConnected}
								className={cn(
									"flex-1",
									isMuted
										? "bg-red-600 hover:bg-red-700"
										: "bg-green-600 hover:bg-green-700"
								)}
							>
								{isMuted ? (
									<VolumeX className="h-4 w-4" />
								) : (
									<Volume2 className="h-4 w-4" />
								)}
							</Button>

							{/* Disconnect */}
							<Button
								variant="destructive"
								size="sm"
								onClick={handleDisconnect}
								className="flex-1"
							>
								<PhoneOff className="h-4 w-4" />
							</Button>
						</div>
					)}

					{/* Connection Status */}
					{voiceInitialized && (
						<div className="text-sm text-center">
							<span
								className={cn(
									"inline-flex items-center gap-1",
									voiceConnected
										? "text-green-600"
										: "text-yellow-600"
								)}
							>
								<div
									className={cn(
										"w-2 h-2 rounded-full",
										voiceConnected
											? "bg-green-600"
											: "bg-yellow-600"
									)}
								/>
								{voiceConnected ? "Connected" : "Connecting..."}
							</span>
						</div>
					)}
				</div>

				{/* Current User Status */}
				{currentUserParticipant && (
					<>
						<Separator />
						<div className="space-y-2">
							<h4 className="text-sm font-medium">You</h4>
							<div className="flex items-center justify-between p-2 bg-muted rounded-lg">
								<div className="flex items-center gap-2">
									<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
										<span className="text-sm font-medium">
											{currentUserParticipant.player.wallet_address
												.charAt(0)
												.toUpperCase()}
										</span>
									</div>
									<span className="text-sm font-medium">
										{
											currentUserParticipant.player
												.wallet_address
										}
									</span>
								</div>
								<div className="flex items-center gap-1">
									{currentUserParticipant.mic_enabled ? (
										<Mic className="h-4 w-4 text-green-600" />
									) : (
										<MicOff className="h-4 w-4 text-red-600" />
									)}
									{currentUserParticipant.is_muted ? (
										<VolumeX className="h-4 w-4 text-red-600" />
									) : (
										<Volume2 className="h-4 w-4 text-green-600" />
									)}
									{currentUserParticipant.is_speaking && (
										<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
									)}
								</div>
							</div>
						</div>
					</>
				)}

				{/* Other Participants */}
				{otherParticipants.length > 0 && (
					<>
						<Separator />
						<div className="space-y-2">
							<h4 className="text-sm font-medium">
								Participants ({otherParticipants.length})
							</h4>
							<div className="space-y-1">
								{otherParticipants.map((participant) => {
									const hasAudio = audioElements.has(
										participant.player.id
									);
									return (
										<div
											key={participant.player.id}
											className="flex items-center justify-between p-2 bg-muted rounded-lg"
										>
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
													<span className="text-sm font-medium">
														{participant.player.wallet_address
															.charAt(0)
															.toUpperCase()}
													</span>
												</div>
												<span className="text-sm">
													{
														participant.player
															.wallet_address
													}
												</span>
												{hasAudio && (
													<Badge
														variant="outline"
														className="text-xs"
													>
														🔊
													</Badge>
												)}
											</div>
											<div className="flex items-center gap-1">
												{participant.mic_enabled ? (
													<Mic className="h-4 w-4 text-green-600" />
												) : (
													<MicOff className="h-4 w-4 text-muted-foreground" />
												)}
												{participant.is_speaking && (
													<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</>
				)}

				{/* Audio Status */}
				<div className="text-xs text-muted-foreground space-y-1">
					{localStream && (
						<div className="text-center">
							Microphone:{" "}
							{localStream.getAudioTracks().length > 0
								? "Active"
								: "Inactive"}
						</div>
					)}
					{audioElements.size > 0 && (
						<div className="text-center">
							Listening to {audioElements.size} participant
							{audioElements.size !== 1 ? "s" : ""}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default VoiceChat;
