"use client";

import React from "react";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lobby, Participant } from "@/types/schema";
import { truncateAddress } from "@/lib/utils";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

const EXPLORER_BASE_URL = "https://explorer.hiro.so/";

interface ParticipantProps {
	lobby: Lobby;
	players: Participant[];
	userId: string;
}

export default function Participants({
	lobby,
	players,
	userId,
}: ParticipantProps) {
	const handleKickPlayer = async (playerId: string) => {
		try {
			await apiRequest({
				path: `/room/${lobby.id}/kick`,
				method: "POST",
				body: { player_id: playerId },
				revalidatePath: `/lexi-wars/${lobby.id}`,
				revalidateTag: "lobbyExtended",
			});
			toast.success("Player kicked.");
		} catch (error) {
			toast.error("Failed to kick player.");
			console.error("Kick player error:", error);
		}
	};

	return (
		<Card className="overflow-hidden bg-primary/10">
			<CardHeader className="bg-muted/30 p-4 pb-3 sm:p-6 sm:pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
						<Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
						Current Participants
					</CardTitle>
					<Button size="sm" asChild>
						<Link href={`/lexi-wars/${lobby.id}`}>Ready</Link>
					</Button>
				</div>
				<p className="text-xs text-muted-foreground mt-2">
					After the game has started, participants who aren&apos;t
					ready will be dropped
				</p>
			</CardHeader>
			<CardContent className="p-4 sm:p-6">
				{players.length > 0 ? (
					<div className="space-y-2 sm:space-y-3">
						{players.map((player, index) => {
							const isCreator = player.id === lobby.creatorId;
							const isSelfCreator = userId === lobby.creatorId;
							const isSelf = userId === player.id;

							return (
								<div
									key={index}
									className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
								>
									<div className="flex items-center gap-2 sm:gap-3">
										<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
											<User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
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
											<p className="text-xs text-muted-foreground">
												Joined{" "}
												{new Date().toLocaleDateString()}
											</p>
										</div>
									</div>
									<div className="text-right flex flex-col">
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
												href={`${EXPLORER_BASE_URL}txid/${player.walletAddress}?chain=testnet`}
												target="_blank"
											>
												View in explorer
											</Link>
										</Button>
										{isSelfCreator && !isCreator && (
											<Button
												variant="destructive"
												size="sm"
												className="text-xs px-2 py-1"
												onClick={() =>
													handleKickPlayer(player.id)
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
				) : (
					<div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
						<div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted/50 flex items-center justify-center mb-3 sm:mb-4">
							<Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
						</div>
						<h3 className="text-base sm:text-lg font-medium mb-1">
							No participants yet
						</h3>
						<p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
							Be the first to join this pool!
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
