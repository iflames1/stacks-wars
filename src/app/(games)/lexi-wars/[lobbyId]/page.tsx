import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import { notFound } from "next/navigation";
import LexiWars from "../_components/lexi-wars";
import { apiRequest } from "@/lib/api";
import { JsonLobby, transLobby } from "@/types/schema";

export default async function LexiWarsPage({
	params,
}: {
	params: Promise<{ lobbyId: string }>;
}) {
	const lobbyId = (await params).lobbyId;

	const userId = await getClaimFromJwt<string>("sub");
	const jsonLobby = await apiRequest<JsonLobby>({ path: `room/${lobbyId}` });

	const lobby = transLobby(jsonLobby);
	const contract = lobby.contractAddress;

	if (!userId) {
		console.error("User ID not found in JWT claims");
		return notFound();
	}

	return <LexiWars lobbyId={lobbyId} userId={userId} contract={contract} />;
}
