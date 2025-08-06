import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Users } from "lucide-react";
import OpenLobby from "./open-lobby";
import ActiveLobbyHeader from "./active-lobby-header";
import { LobbyExtended } from "@/types/schema/lobby";

export default async function ActiveLobbies({
	lobbies,
}: {
	lobbies: LobbyExtended[];
}) {
	return (
		<>
			{lobbies.map((lobby) => (
				<Card
					key={lobby.lobby.id}
					className="overflow-hidden bg-primary/30"
				>
					<ActiveLobbyHeader lobby={lobby.lobby} />
					<div className="flex flex-col justify-between h-full">
						<CardContent className="pb-3">
							<div className="grid gap-2">
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Game:
									</span>
									<span className="font-medium">
										{lobby.lobby.game.name}
									</span>
								</div>
								{lobby.pool && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Pool entry:
										</span>
										<span className="font-medium">
											{lobby.pool.entryAmount} STX
										</span>
									</div>
								)}
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">
										Players:
									</span>
									<div className="flex items-center gap-1">
										<Users className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">
											{lobby.lobby.participants}
											{/*/{lobby.maxPlayers}*/}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
						<CardFooter>
							<OpenLobby lobby={lobby.lobby} />
						</CardFooter>
					</div>
				</Card>
			))}
		</>
	);
}
