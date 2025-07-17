import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { User as UserIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lobby, Participant } from "@/types/schema";
import { truncateAddress } from "@/lib/utils";
import { LobbyClientMessage, PendingJoin } from "@/hooks/useLobbySocket";

const EXPLORER_BASE_URL = "https://explorer.hiro.so/";

interface ParticipantProps {
	lobby: Lobby;
	players: Participant[];
	pendingPlayers: PendingJoin[];
	userId: string;
	sendMessage: (msg: LobbyClientMessage) => void;
}

export default function Participants({
	lobby,
	players,
	pendingPlayers,
	userId,
	sendMessage,
}: ParticipantProps) {
	//const currentPlayer = players.find((p) => p.id === userId);
	//const isReady = currentPlayer?.playerStatus === "ready";

	const handleKickPlayer = (
		playerId: string,
		wallet_address: string,
		display_name: string | null
	) => {
		sendMessage({
			type: "kickplayer",
			player_id: playerId,
			wallet_address: wallet_address,
			display_name: display_name,
		});
	};

	//type PlayerStatus = "ready" | "notready";

	//const handleUpdatePlayerStatus = (status: PlayerStatus) => {
	//	sendMessage({
	//		type: "updateplayerstate",
	//		new_state: status,
	//	});
	//};

	return (
		<Card className="overflow-hidden bg-primary/10">
			<CardHeader className="bg-muted/30 p-4 pb-3 sm:p-6 sm:pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
						<Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
						Current Participants
					</CardTitle>
					{/*{userId !== lobby.creatorId && (
						<Button
							size="sm"
							variant={isReady ? "destructive" : "default"}
							onClick={() =>
								handleUpdatePlayerStatus(
									isReady ? "notready" : "ready"
								)
							}
						>
							{isReady ? "Unready" : "Ready"}
						</Button>
					)}*/}
				</div>
				<p className="text-xs text-muted-foreground mt-2">
					After the game has started, participants who aren&apos;t
					ready will be dropped
				</p>
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
										className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
									>
										<div className="flex items-center gap-2 sm:gap-3">
											<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
												<UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
											</div>
											<div className="overflow-hidden">
												<div className="flex items-center gap-2">
													<p className="text-sm sm:text-base font-medium truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] md:max-w-[300px]">
														{player.username ||
															truncateAddress(
																player.walletAddress
															)}
													</p>
													{isCreator && (
														<span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
															Creator
														</span>
													)}
													{isSelf && (
														<span className="text-xs px-2 py-0.5 rounded-full bg-accent/90">
															You
														</span>
													)}
													<span
														className={`text-xs px-2 py-0.5 rounded-full ${
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
										<div className="text-right flex flex-col">
											{player.txId && (
												<>
													<span className="text-sm sm:text-base font-bold">
														{/*{player.amount}*/}
														STX
													</span>
													<Button
														variant={"link"}
														asChild
														className="!p-0 text-right"
													>
														<Link
															href={`${EXPLORER_BASE_URL}txid/${player.txId}?chain=testnet`}
															target="_blank"
														>
															View in explorer
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
														onClick={() =>
															handleKickPlayer(
																player.id,
																player.walletAddress,
																player.username
															)
														}
													>
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
												className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
											>
												<div className="flex items-center gap-2 sm:gap-3">
													<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
														<UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
													</div>
													<div>
														<p className="text-sm sm:text-base font-medium">
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
													<div className="flex gap-2">
														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																sendMessage({
																	type: "permitjoin",
																	user_id:
																		pendingplayer
																			.user
																			.id,
																	allow: true,
																})
															}
														>
															Accept
														</Button>
														<Button
															size="sm"
															variant="destructive"
															onClick={() =>
																sendMessage({
																	type: "permitjoin",
																	user_id:
																		pendingplayer
																			.user
																			.id,
																	allow: false,
																})
															}
														>
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
						<p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
							Trust me something is wrong if you see this. Where
							da creator at?
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
