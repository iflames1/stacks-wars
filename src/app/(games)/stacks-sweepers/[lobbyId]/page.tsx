import StacksSweepers from "./_components/stacks-sweepers";

export default async function StacksSweepersPage({
	params,
}: {
	params: Promise<{ lobbyId: string }>;
}) {
	const lobbyId = (await params).lobbyId;

	console.log(lobbyId);

	return <StacksSweepers />;
}
