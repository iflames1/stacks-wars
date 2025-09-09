import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import StacksSweepers from "./_components/stacks-sweepers";
import RequireAuth from "@/components/require-auth";

export default async function StacksSweepersPage({
	params,
}: {
	params: Promise<{ lobbyId: string }>;
}) {
	const lobbyId = (await params).lobbyId;
	const userId = await getClaimFromJwt<string>("sub");

	if (!userId) {
		return <RequireAuth />;
	}

	console.log(lobbyId);

	return <StacksSweepers userId={userId} />;
}
