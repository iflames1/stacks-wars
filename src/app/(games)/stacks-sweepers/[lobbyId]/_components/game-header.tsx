import { Bomb } from "lucide-react";

export default function GameHeader() {
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
		</div>
	);
}
