import { ArrowLeft } from "lucide-react";
import Link from "next/link";
//import ActiveLobbies from "@/components/home/active-lobbies";
import CreateLobbyForm from "./_components/create-lobby-form";
import GameDetails from "./_components/game-details";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SinglePlayer from "./_components/single-player";
import { JsonGameType, GameType, transGameType } from "@/types/schema";
import { apiRequest } from "@/lib/api";

export default async function CreateGame({
	params,
}: {
	params: Promise<{ gameId: string }>;
}) {
	const { gameId } = await params;

	const jsonGame = await apiRequest<JsonGameType>({
		path: `/game/${gameId}`,
		auth: false,
		cache: "force-cache",
	});
	const game: GameType = await transGameType(jsonGame);

	return (
		<div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
			<Link
				href="/games"
				className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 sm:mb-6"
			>
				<ArrowLeft className="h-4 w-4" />
				<span>Back to Games</span>
			</Link>

			<div className="space-y-6 sm:space-y-8">
				<GameDetails game={game} />

				<Tabs defaultValue="multiplayer" className="w-full">
					<TabsList className="bg-primary/30 grid w-full grid-cols-2">
						<TabsTrigger value="multiplayer">
							Multiplayer
						</TabsTrigger>
						{/*<TabsTrigger value="singleplayer">
							Singleplayer
						</TabsTrigger>*/}
					</TabsList>

					<TabsContent value="multiplayer" className="space-y-6">
						<CreateLobbyForm gameId={gameId} gameName={game.name} />
					</TabsContent>

					<TabsContent value="singleplayer">
						<SinglePlayer game={game} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
