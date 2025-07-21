import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import LexiWars from "./_components/lexi-wars";
import { apiRequest } from "@/lib/api";
import { JsonLobby, transLobby } from "@/types/schema";
import RequireAuth from "@/components/require-auth";

export default async function LexiWarsPage({
	params,
}: {
	params: Promise<{ lobbyId: string }>;
}) {
	const lobbyId = (await params).lobbyId;

	const userId = await getClaimFromJwt<string>("sub");

	if (!userId) {
		return <RequireAuth />;
	}

	const jsonLobby = await apiRequest<JsonLobby>({
		path: `room/${lobbyId}`,
		cache: "no-store",
	});

	const lobby = transLobby(jsonLobby);
	const contract = lobby.contractAddress;

	return <LexiWars lobbyId={lobbyId} userId={userId} contract={contract} />;
}
