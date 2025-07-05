import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import {
	GameType,
	JsonGameType,
	JsonLobbyExtended,
	LobbyExtended,
	transGameType,
	transLobbyExtended,
} from "@/types/schema";
import { apiRequest } from "@/lib/api";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import Lobby from "./_components/lobby";

export default async function LobbyDetailPage({
	params,
}: {
	params: Promise<{ lobbyId: string }>;
}) {
	const lobbyId = (await params).lobbyId;
	console.log("Lobby ID:", lobbyId);

	const jsonLobby = await apiRequest<JsonLobbyExtended>({
		path: `/room/${lobbyId}/extended`,
		auth: false,
		tag: "lobbyExtended",
	});
	const lobby: LobbyExtended = transLobbyExtended(jsonLobby);

	if (!lobby) {
		notFound();
	}

	const jsonGame = await apiRequest<JsonGameType>({
		path: `/game/${lobby.lobby.gameId}`,
		auth: false,
		cache: "force-cache",
	});
	const game: GameType = await transGameType(jsonGame);

	const userId = await getClaimFromJwt<string>("sub");

	if (!userId) {
		console.error("User ID not found in JWT claims");
		return notFound(); // display connect wallet instead
	}

	return (
		<section className="bg-gradient-to-b from-primary/10 to-primary/30">
			<div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 ">
				<Link
					href="/lobby"
					className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 sm:mb-6"
				>
					<ArrowLeft className="h-4 w-4" />
					<span>Back to Lobby</span>
				</Link>
				<Lobby
					lobby={lobby.lobby}
					players={lobby.players}
					pool={lobby.pool}
					userId={userId}
					lobbyId={lobbyId}
					game={game}
				/>
			</div>
		</section>
	);
}
