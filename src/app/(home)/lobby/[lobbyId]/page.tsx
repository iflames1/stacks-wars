import Link from "next/link";
import { ArrowLeft, Loader } from "lucide-react";
import JoinLobbyForm from "./_components/join-lobby-form";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import LobbyStats from "./_components/lobby-stats";
import LobbyDetails from "./_components/lobby-details";
import Participants from "./_components/participants";
import GamePreview from "./_components/game-preview";
import {
	JsonLobbyExtended,
	NewLobbyExtended,
	transLobbyExtended,
} from "@/types/schema";
import { apiRequest } from "@/lib/api";

export default async function LobbyDetailPage({
	params,
}: {
	params: Promise<{ lobbyId: string }>;
}) {
	const id = (await params).lobbyId;
	console.log("Lobby ID:", id);

	const jsonLobby = await apiRequest<JsonLobbyExtended>({
		path: `/room/${id}/extended`,
		auth: false,
	});
	const lobby: NewLobbyExtended = transLobbyExtended(jsonLobby);

	if (!lobby) {
		notFound();
	}

	return (
		<section className="bg-gradient-to-b from-primary/10 to-primary/30">
			<div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 ">
				<Link
					href="/lobby"
					className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 sm:mb-6"
				>
					<ArrowLeft className="h-4 w-4" />
					<span>Back to Lobby</span>
				</Link>
				{/* Hero Section */}
				<div className="mb-6 sm:mb-8 space-y-2 sm:space-y-3">
					<div className="flex flex-wrap items-start justify-between gap-2">
						<h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words">
							{lobby.lobby.name}
						</h1>
					</div>
					<p className="text-sm sm:text-base text-muted-foreground max-w-3xl break-words">
						{lobby.lobby.description}
					</p>
				</div>
				<div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
						{/* Stats Cards */}
						<LobbyStats
							lobby={lobby.lobby}
							players={lobby.players}
						/>
						{/* Lobby Details */}
						<LobbyDetails
							lobby={lobby.lobby}
							players={lobby.players}
						/>
						<Participants
							lobby={lobby.lobby}
							players={lobby.players}
						/>
					</div>
					<div className="space-y-4 sm:space-y-6">
						<div className="lg:sticky lg:top-6 flex flex-col gap-4">
							<Suspense
								fallback={
									<div className="flex justify-center items-center py-6 sm:py-8">
										<Loader className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
									</div>
								}
							>
								<JoinLobbyForm
									lobby={lobby.lobby}
									players={lobby.players}
									lobbyId={id}
								/>
							</Suspense>
							<GamePreview lobby={lobby.lobby} />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
