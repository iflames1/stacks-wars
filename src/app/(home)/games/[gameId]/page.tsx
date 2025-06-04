import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ActiveLobbies from "./_components/active-lobbies";
import CreatePoolForm from "./_components/create-lobby-form";
import GameDetails from "./_components/game-details";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SinglePlayer from "./_components/single-player";
import { GameType, Lobby } from "@/types/schema";
import { gamesData, lobbiesData } from "@/lib/gamePlaceholder";

export default async function CreateGame({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const game: GameType = gamesData[0];
	const lobbies: Lobby[] = lobbiesData;

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
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="multiplayer">
							Multiplayer
						</TabsTrigger>
						<TabsTrigger value="singleplayer">
							Singleplayer
						</TabsTrigger>
					</TabsList>

					<TabsContent value="multiplayer" className="space-y-6">
						<CreatePoolForm gameId={id} />

						<div className="space-y-4">
							<h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">
								Active Lobbies
							</h2>
							<ActiveLobbies lobbies={lobbies} />
						</div>
					</TabsContent>

					<TabsContent value="singleplayer">
						<SinglePlayer game={game} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
