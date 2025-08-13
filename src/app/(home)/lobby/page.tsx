import ActiveLobbies from "@/components/home/active-lobbies";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { LobbyExtended } from "@/types/schema/lobby";

export default async function LobbyPage() {
	const lobbies = await apiRequest<LobbyExtended[]>({
		path: `/lobby/extended?page=1&lobby_state=waiting,inProgress`,
		auth: false,
		cache: "no-store",
		tag: "lobby",
	});

	return (
		<>
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
