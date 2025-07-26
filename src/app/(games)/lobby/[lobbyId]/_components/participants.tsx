import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Loader2, User as UserIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lobby, Participant, Pool } from "@/types/schema";
import { truncateAddress } from "@/lib/utils";
import { LobbyClientMessage, PendingJoin } from "@/hooks/useLobbySocket";
import { useState } from "react";
import { EXPLORER_BASE_URL } from "@/lib/constants";

interface ParticipantProps {
	lobby: Lobby;
	pool: Pool | null;
	players: Participant[];
	pendingPlayers: PendingJoin[];
	userId: string;
	sendMessage: (msg: LobbyClientMessage) => Promise<void>;
}

export default function Participants({
	lobby,
	pool,
	players,
	pendingPlayers,
	userId,
	sendMessage,
}: ParticipantProps) {
	const currentPlayer = players.find((p) => p.id === userId);
	const isReady = currentPlayer?.playerStatus === "ready";
	const [isUpdating, setIsUpdating] = useState(false);
	const [isKicking, setIsKicking] = useState(false);
	const [isHandlingJoin, setIsHandlingJoin] = useState(false);

	const handleKickPlayer = async (
		playerId: string,
		wallet_address: string,
		display_name: string | null
	) => {
		setIsKicking(true);
		try {
			await sendMessage({
				type: "kickplayer",
				player_id: playerId,
				wallet_address: wallet_address,
				display_name: display_name,
			});
		} catch (error) {
			console.error("Error kicking player:", error);
		} finally {
			setIsKicking(false);
		}
	};

	type PlayerStatus = "ready" | "notready";

	const handleUpdatePlayerStatus = async (status: PlayerStatus) => {
		setIsUpdating(true);
		try {
			await sendMessage({
				type: "updateplayerstate",
				new_state: status,
			});
		} catch (error) {
			console.error("Error updating status:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleJoinRequest = async (userId: string, allow: boolean) => {
		setIsHandlingJoin(true);
		try {
			sendMessage({
				type: "permitjoin",
				user_id: userId,
				allow,
			});
		} catch (error) {
			console.error("Error handling join request:", error);
		} finally {
			setIsHandlingJoin(false);
		}
	};

	return (
		<Card className="overflow-hidden bg-primary/10">
			<CardHeader className="bg-muted/30 p-4 pb-3 sm:p-6 sm:pb-4">
				<div className="flex items-center justify-between min-w-0">
					<CardTitle className="flex items-center gap-2 text-base sm:text-lg min-w-0 flex-1">
						<Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
						<span className="truncate">Current Participants</span>
					</CardTitle>
					{userId !== lobby.creatorId &&
						!lobby.contractAddress &&
						players.some((p) => p.id === userId) && (
							<Button
								size="sm"
								variant={isReady ? "destructive" : "default"}
								disabled={isUpdating}
								onClick={() =>
									handleUpdatePlayerStatus(
										isReady ? "notready" : "ready"
									)
								}
								className="shrink-0 ml-2"
							>
								{isUpdating && (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								)}
								{isReady ? "Unready" : "Ready"}
							</Button>
						)}
				</div>
			</CardHeader>
			<CardContent className="p-4 sm:p-6">
				{players.length > 0 ? (
					<>
						<div className="space-y-2 sm:space-y-3">
							{players.map((player, index) => {
								const isCreator = player.id === lobby.creatorId;
								const isSelfCreator =
									userId === lobby.creatorId;
								const isSelf = userId === player.id;

								return (
									<div
										key={index}
										className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors min-w-0"
									>
										<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
											<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
												<UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2 flex-wrap">
													<p className="text-sm sm:text-base font-medium truncate min-w-0">
														{player.username ||
															truncateAddress(
																player.walletAddress
															)}
													</p>
													<div className="flex items-center gap-1 flex-wrap shrink-0">
														{isCreator && (
															<span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
																Creator
															</span>
														)}
														{isSelf && (
															<span className="text-xs px-2 py-0.5 rounded-full bg-accent/90 whitespace-nowrap">
																You
															</span>
														)}
														<span
															className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
																player.playerStatus ===
																"ready"
																	? "bg-green-500/10 text-green-500"
																	: "bg-yellow-500/10 text-yellow-500"
															}`}
														>
															{player.playerStatus ===
															"ready"
																? "Ready"
																: "Not Ready"}
														</span>
													</div>
												</div>
											</div>
										</div>
										<div className="shrink-0 ml-2 flex flex-col items-end gap-1">
											{player.txId && pool && (
												<>
													<span className="text-sm sm:text-base font-bold whitespace-nowrap">
														{pool.entryAmount} STX
													</span>
													<Button
														variant={"link"}
														asChild
														className="!p-0 text-right h-auto text-xs"
													>
														<Link
															href={`${EXPLORER_BASE_URL}txid/${player.txId}?chain=testnet`}
															target="_blank"
															className="truncate max-w-[80px] sm:max-w-none"
														>
															<span className="hidden sm:inline">
																View in explorer
															</span>
															<span className="sm:hidden">
																Explorer
															</span>
														</Link>
													</Button>
												</>
											)}
											{isSelfCreator &&
												!isCreator &&
												!lobby.contractAddress && (
													<Button
														variant="destructive"
														size="sm"
														className="text-xs"
														disabled={isKicking}
														onClick={() =>
															handleKickPlayer(
																player.id,
																player.walletAddress,
																player.username
															)
														}
													>
														{isKicking && (
															<Loader2 className="h-4 w-4 mr-2 animate-spin" />
														)}
														Kick
													</Button>
												)}
										</div>
									</div>
								);
							})}
						</div>
						{pendingPlayers.length > 0 && (
							<>
								<h4 className="text-sm sm:text-base mt-6 mb-2 text-muted-foreground font-semibold">
									Pending Join Requests
								</h4>
								<div className="space-y-2 sm:space-y-3">
									{pendingPlayers.map((pendingplayer) => {
										return (
											<div
												key={pendingplayer.user.id}
												className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors min-w-0"
											>
												<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
													<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
														<UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
													</div>
													<div className="min-w-0 flex-1">
														<p className="text-sm sm:text-base font-medium truncate">
															{pendingplayer.user
																.display_name ||
																truncateAddress(
																	pendingplayer
																		.user
																		.wallet_address
																)}
														</p>
														<p className="text-xs text-muted-foreground">
															Requesting to join
														</p>
													</div>
												</div>
												{userId === lobby.creatorId && (
													<div className="flex gap-2 shrink-0 ml-2">
														<Button
															size="sm"
															variant="outline"
															disabled={
																isHandlingJoin
															}
															onClick={() =>
																handleJoinRequest(
																	pendingplayer
																		.user
																		.id,
																	true
																)
															}
														>
															{isHandlingJoin && (
																<Loader2 className="h-4 w-4 mr-2 animate-spin" />
															)}
															Accept
														</Button>
														<Button
															size="sm"
															variant="destructive"
															disabled={
																isHandlingJoin
															}
															onClick={() =>
																handleJoinRequest(
																	pendingplayer
																		.user
																		.id,
																	false
																)
															}
														>
															{isHandlingJoin && (
																<Loader2 className="h-4 w-4 mr-2 animate-spin" />
															)}
															Decline
														</Button>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</>
						)}
					</>
				) : (
					<div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
						<div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted/50 flex items-center justify-center mb-3 sm:mb-4">
							<Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
						</div>
						<h3 className="text-base sm:text-lg font-medium mb-1">
							No participants yet
						</h3>
						<p className="text-xs sm:text-sm text-muted-foreground max-w-xs break-words">
							Trust me something is wrong if you see this. Where
							da creator at?
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
