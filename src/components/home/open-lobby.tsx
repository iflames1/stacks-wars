"use client";
import { Lobby } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

interface OpenLobbyProps {
	lobby: Lobby;
}

export default function OpenLobby({ lobby }: OpenLobbyProps) {
	const router = useRouter();
	return (
		<Button
			variant={lobby.status === "waiting" ? "default" : "outline"}
			className="w-full gap-1.5 "
			disabled={lobby.status !== "waiting"}
			onClick={() => router.push(`/lobby/${lobby.id}`)}
		>
			{lobby.status === "waiting"
				? "Open Lobby"
				: lobby.status === "inprogress"
				? "In Progress"
				: "Closed"}
		</Button>
	);
}
