import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Info, Timer } from "lucide-react";
import { Lobby, lobbyStatus, Participant } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { LobbyClientMessage } from "@/hooks/useLobbySocket";
import { useState } from "react";
import { toast } from "sonner";

interface LobbyDetailsProps {
	lobby: Lobby;
	players: Participant[];
	countdown?: number;
	lobbyState: lobbyStatus;
	sendMessage: (msg: LobbyClientMessage) => void;
	userId: string;
}

export default function LobbyDetails({
	lobby,
	players,
	countdown,
	lobbyState,
	sendMessage,
	userId,
}: LobbyDetailsProps) {
	//const participationPercentage = (players.length / lobby.maxPlayers) * 100;
	const timeLeft = countdown ?? 30;
	const [loading, setLoading] = useState<boolean>(false);

	const handleLobbyState = (state: lobbyStatus) => {
		setLoading(true);
		sendMessage({
			type: "updategamestate",
			new_state: state,
		});
		setTimeout(() => setLoading(false), 300);
	};

	const readyPlayers = players.filter((p) => p.playerStatus === "ready");

	const buttonLabel =
		lobbyState === "waiting"
			? "Start Game"
			: lobbyState === "inprogress" && timeLeft > 0
				? "Wait"
				: "Ended";

	const isDisabled =
		loading ||
		lobbyState === "finished" ||
		(lobbyState === "inprogress" && timeLeft === 0);

	return (
		<Card className="overflow-hidden bg-primary/10">
			<CardHeader className="bg-muted/30 p-4 pb-3 sm:p-6 sm:pb-4">
				<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
					<Info className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
					Lobby Details
				</CardTitle>
			</CardHeader>
			<CardContent className="sm:p-6">
				{/*<div>
					<h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
						Pool Progress
					</h3>
					<div className="space-y-2">
						<div className="flex justify-between text-xs sm:text-sm">
							<span>{players.length} joined</span>
							<span>{lobby.maxPlayers} max</span>
						</div>
						<Progress
							value={participationPercentage}
							className="h-2"
						/>
					</div>
				</div>*/}

				<>
					{/*<div className="mt-3">
						<h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
							Created by
						</h3>
						<div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2 sm:gap-3">
									<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
										<User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
									</div>
									<div className="overflow-hidden">
										<p className="text-sm sm:text-base font-medium truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] md:max-w-[300px]">
											{
												pool.creator
													.stxAddress
											}
										</p>
									</div>
								</div>
								<div>
									<Button
										variant={"link"}
										asChild
									>
										<a
											href={`${EXPLORER_BASE_URL}txid/${
												deployTx?.tx_status ===
												"success"
													? pool
															.creator
															.stxAddress +
														"." +
														slugify(
															pool.name
														) +
														"-stacks-wars"
													: pool.txID
											}`}
											target="_blank"
										>
											{deployTx?.tx_status ===
											"success"
												? "View Pool Contract"
												: "TX ID"}
										</a>
									</Button>
								</div>
							</div>
						</div>
					</div>*/}
				</>

				{/* Countdown Timer */}
				<div className="mt-6 p-4 rounded-md bg-muted/40 border border-muted space-x-2 flex items-center justify-center">
					<Timer className="h-5 w-5 text-muted-foreground" />
					<span className="text-lg sm:text-xl font-semibold text-primary">
						Game starting in {timeLeft} seconds
					</span>
				</div>

				{userId === lobby.creatorId && (
					<Button
						variant={
							lobbyState === "waiting" ? "default" : "destructive"
						}
						disabled={isDisabled}
						className="w-full mt-6"
						onClick={() => {
							if (
								lobbyState === "waiting" &&
								readyPlayers.length < 2
							) {
								toast.info(
									"At least 2 players are required to start the game."
								);
							} else if (lobbyState === "waiting")
								handleLobbyState("inprogress");
							else if (lobbyState === "inprogress")
								handleLobbyState("waiting");
						}}
					>
						{buttonLabel}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
