import { JsonGameType, GameType, transGameType } from "@/types/schema";
import GameCard from "./_components/game-card";
import { apiRequest } from "@/lib/api";

export default async function GamesPage() {
	const jsonGames = await apiRequest<JsonGameType[]>({
		path: "/games",
		auth: false,
	});
	const games: GameType[] = await Promise.all(jsonGames.map(transGameType));

	return (
		<section className="w-full min-h-dvh py-12 md:py-24 lg:py-32 bg-primary/10">
			<div className="px-4 md:px-6">
				<div className="flex flex-col items-center justify-center space-y-4 text-center">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
							Available Games
						</h1>
						<p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
							Choose from our selection of games to compete and
							win STX rewards
						</p>
					</div>
				</div>

				{games && games.length > 0 && (
					<div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12">
						{games.map((game) => (
							<GameCard key={game.id} game={game} />
						))}
					</div>
				)}
			</div>
		</section>
	);
}
