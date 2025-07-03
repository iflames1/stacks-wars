import { Card, CardContent } from "@/components/ui/card";
import {
	Gamepad2,
	Trophy,
	//Trophy,
	Users,
} from "lucide-react";
import { Lobby, Participant, Pool } from "@/types/schema";

interface LobbyStatsProps {
	lobby: Lobby;
	players: Participant[];
	pool: Pool | null;
}

export default function LobbyStats({ lobby, players, pool }: LobbyStatsProps) {
	return (
		<div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
			{pool && (
				<Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-colors">
					<CardContent className="p-3 sm:p-4 md:p-6">
						<div className="flex items-center gap-2 sm:gap-3 md:gap-4">
							<div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
								<Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
							</div>
							<div>
								<p className="text-xs sm:text-sm font-medium text-muted-foreground">
									Pool Size
								</p>
								<p className="text-base sm:text-xl md:text-2xl font-bold">
									{pool.currentAmount} STX
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			<Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-colors">
				<CardContent className="p-3 sm:p-4 md:p-6">
					<div className="flex items-center gap-2 sm:gap-3 md:gap-4">
						<div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
							<Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
						</div>
						<div>
							<p className="text-xs sm:text-sm font-medium text-muted-foreground">
								Players
							</p>
							<p className="text-base sm:text-xl md:text-2xl font-bold">
								{players.length}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-colors xs:col-span-2 sm:col-span-1">
				<CardContent className="p-3 sm:p-4 md:p-6">
					<div className="flex items-center gap-2 sm:gap-3 md:gap-4">
						<div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
							<Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
						</div>
						<div>
							<p className="text-xs sm:text-sm font-medium text-muted-foreground">
								Game
							</p>
							<p className="text-base sm:text-xl md:text-2xl font-bold">
								{lobby.name}
							</p>
							<p className="text-sm sm:text-base text-muted-foreground max-w-3xl break-words">
								{lobby.description}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
