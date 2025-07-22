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
import RequireAuth from "@/components/require-auth";
import NotFound from "@/app/not-found";

export default async function LobbyDetailPage({
	params,
}: {
	params: Promise<{ lobbyId: string }>;
}) {
	const lobbyId = (await params).lobbyId;

	const userId = await getClaimFromJwt<string>("sub");
	const userWalletAddress = await getClaimFromJwt<string>("wallet");

	if (!userId || !userWalletAddress) {
		// console.error("User ID not found in JWT claims");
		// toast.error("Something went wrong, try again later.");
		return <RequireAuth />;
	}

	const jsonLobby = await apiRequest<JsonLobbyExtended>({
		path: `/room/${lobbyId}/extended`,
		auth: false,
		tag: "lobbyExtended",
	});
	const lobby: LobbyExtended = transLobbyExtended(jsonLobby);

	if (!lobby) {
		return <NotFound />;
	}

	const jsonGame = await apiRequest<JsonGameType>({
		path: `/game/${lobby.lobby.gameId}`,
		auth: false,
		cache: "force-cache",
	});
	const game: GameType = await transGameType(jsonGame);

	return (
		<Lobby
			lobby={lobby.lobby}
			players={lobby.players}
			pool={lobby.pool}
			userId={userId}
			userWalletAddress={userWalletAddress}
			lobbyId={lobbyId}
			game={game}
		/>
	);
}
