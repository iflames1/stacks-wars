import { Bomb } from "lucide-react";

interface GameHeaderProps {
	lobbyId?: string;
}

export default function GameHeader({ lobbyId }: GameHeaderProps) {
	return (
		<div className="text-center space-y-2">
			<div className="flex items-center justify-center gap-3">
				<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
					<Bomb className="size-6 text-primary" />
				</div>
				<h1 className="text-3xl sm:text-4xl font-bold text-foreground">
					Stacks Sweepers
				</h1>
			</div>
			<p className="text-muted-foreground">
				Find the gems while avoiding the mines!
			</p>
			{lobbyId && (
				<p className="text-sm text-muted-foreground">
					Lobby: {lobbyId}
				</p>
			)}
		</div>
	);
}
