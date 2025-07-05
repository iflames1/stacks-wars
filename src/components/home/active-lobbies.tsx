import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Lobby } from "@/types/schema";
import OpenLobby from "./open-lobby";
import ActiveLobbyHeader from "./active-lobby-header";

export default async function ActiveLobbies({ lobbies }: { lobbies: Lobby[] }) {
	return (
		<>
			{lobbies.map((lobby) => (
				<Card key={lobby.id} className="overflow-hidden bg-primary/30">
					<ActiveLobbyHeader lobby={lobby} />
					<CardContent className="pb-3">
						<div className="grid gap-2">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Stakes:
								</span>
								{/* <span className="font-medium">{lobby.amount} STX</span> */}
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Game:
								</span>
								<span className="font-medium">
									{lobby.gameName}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">
									Players:
								</span>
								<div className="flex items-center gap-1">
									<Users className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">
										{lobby.players}
										{/*/{lobby.maxPlayers}*/}
									</span>
								</div>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<OpenLobby lobby={lobby} />
					</CardFooter>
				</Card>
			))}
		</>
	);
}
