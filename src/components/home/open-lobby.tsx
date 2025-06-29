"use client";
import { Lobby } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface OpenLobbyProps {
	lobby: Lobby;
}

export default function OpenLobby({ lobby }: OpenLobbyProps) {
	const router = useRouter();
	return (
		<Button
			variant={lobby.lobbyStatus === "waiting" ? "default" : "outline"}
			className="w-full gap-1.5 "
			disabled={lobby.lobbyStatus !== "waiting"}
			onClick={() => router.push(`/lobby/${lobby.id}`)}
		>
			{lobby.lobbyStatus === "waiting"
				? "Open Lobby"
				: lobby.lobbyStatus === "inprogress"
				? "In Progress"
				: "Closed"}
		</Button>
	);
}
