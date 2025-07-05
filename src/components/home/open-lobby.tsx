"use client";
import { Lobby } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useConnectUser } from "@/hooks/useConnectUser";
import { Loader } from "lucide-react";

interface OpenLobbyProps {
	lobby: Lobby;
}

export default function OpenLobby({ lobby }: OpenLobbyProps) {
	const router = useRouter();
	const { isConnecting, isConnected, handleConnect } = useConnectUser();
	return (
		<>
			{isConnected ? (
				<Button
					variant={
						lobby.lobbyStatus === "waiting" ? "default" : "outline"
					}
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
			) : (
				<Button
					onClick={handleConnect}
					type="button"
					disabled={isConnecting}
					className="w-full gap-1.5 "
				>
					{isConnecting && (
						<Loader
							className="h-4 w-4 mr-1 animate-spin"
							size={17}
						/>
					)}
					{isConnecting
						? "Connecting..."
						: "Connect wallet to open lobby"}
				</Button>
			)}
		</>
	);
}
