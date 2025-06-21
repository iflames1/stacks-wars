import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { truncateAddress } from "@/lib/utils";
import { JsonUser, Lobby, transUser, User } from "@/types/schema";
import { apiRequest } from "@/lib/api";

interface LobbyProps {
	lobby: Lobby;
}
export default async function ActiveLobbyHeader({ lobby }: LobbyProps) {
	const jsonCreator = await apiRequest<JsonUser>({
		path: `/user/${lobby.creatorId}`,
		auth: false,
		cache: "force-cache",
	});
	const creator: User = transUser(jsonCreator);
	return (
		<CardHeader className="pb-3">
			<div className="flex justify-between items-start">
				<CardTitle>{lobby.name}</CardTitle>
				<Badge
					variant={
						lobby.status === "waiting" ? "default" : "secondary"
					}
				>
					{lobby.status === "waiting"
						? "Open"
						: lobby.status === "inprogress"
						? "In Progress"
						: "Closed"}
				</Badge>
			</div>
			<CardDescription>
				Created by{" "}
				{creator.username || truncateAddress(creator.walletAddress)}
			</CardDescription>
		</CardHeader>
	);
}
