import ActiveLobbies from "@/components/home/active-lobbies";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
//import { getAvailableLobbies, getLobbies } from "@/lib/services/lobby";
import { apiRequest } from "@/lib/api";
import {
	JsonLobbyExtended,
	LobbyExtended,
	transLobbyExtended,
} from "@/types/schema";

export default async function PoolsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const error = params.error;

	const jsonLobbies = await apiRequest<JsonLobbyExtended[]>({
		path: `/rooms/extended?page=1&state=waiting,inprogress`,
		auth: false,
		tag: "lobby",
	});
	const lobbies: LobbyExtended[] = jsonLobbies.map(transLobbyExtended);

	if (!lobbies) {
		return <div>No lobbies found</div>;
	}

	return (
		<>
			{error === "wallet-required" && (
				<div className="py-3 flex items-center justify-center text-sm bg-red-400">
					<p>Please connect your wallet to access lobbies</p>
				</div>
			)}
			<section className="w-full py-12 md:py-24 lg:py-32">
				<div className="max-w-5xl mx-auto px-4 md:px-6">
					<div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center">
						<div>
							<h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
								{lobbies.length > 0
									? "Active Lobbies"
									: "There are no active lobbies"}
							</h1>
							<p className="mt-2 text-muted-foreground">
								Join a lobby to Battle
							</p>
						</div>
						<Button className="gap-1.5" asChild>
							<Link href="/games">
								<Plus className="h-4 w-4" />
								Create A Match
							</Link>
						</Button>
					</div>
					{/*<div className="mt-6 p-4 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-lg">
						<p className="text-yellow-500 text-sm font-medium flex items-center gap-2">
							🚧 This feature is currently under development.
							Check back soon for updates!
						</p>
					</div>*/}
					<div className="grid gap-6 pt-8 md:grid-cols-2 lg:grid-cols-3">
						<ActiveLobbies lobbies={lobbies} />
					</div>
				</div>
			</section>
		</>
	);
}
