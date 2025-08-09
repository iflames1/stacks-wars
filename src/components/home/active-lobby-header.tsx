import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { truncateAddress } from "@/lib/utils";
import { Lobby } from "@/types/schema/lobby";

interface LobbyProps {
	lobby: Lobby;
}
export default async function ActiveLobbyHeader({ lobby }: LobbyProps) {
	return (
		<CardHeader className="pb-3">
			<div className="flex justify-between items-start">
				<CardTitle>{lobby.name}</CardTitle>
				<Badge
					variant={
						lobby.state === "waiting" ? "default" : "secondary"
					}
				>
					{lobby.state === "waiting"
						? "Open"
						: lobby.state === "inProgress"
							? "In Progress"
							: "Closed"}
				</Badge>
			</div>
			<CardDescription>
				Created by{" "}
				{lobby.creator.username ||
					truncateAddress(lobby.creator.walletAddress)}
			</CardDescription>
		</CardHeader>
	);
}
