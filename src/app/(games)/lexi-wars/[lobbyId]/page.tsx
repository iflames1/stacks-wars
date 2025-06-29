import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import { notFound } from "next/navigation";

export default async function LexiWarsPage({
	params,
}: {
	params: Promise<{ lobbyId: string }>;
}) {
	const lobbyId = (await params).lobbyId;
	console.log("Lobby ID:", lobbyId);

	const userId = await getClaimFromJwt<string>("sub");

	if (!userId) {
		console.error("User ID not found in JWT claims");
		return notFound();
	}

	return <div>page</div>;
}
