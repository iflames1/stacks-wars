import { Badge } from "@/components/ui/badge";
import { Trophy, Brain, Target } from "lucide-react";

interface GameHeaderProps {
	score: number;
	highScore: number;
}

export default function GameHeader({ score, highScore }: GameHeaderProps) {
	return (
		<div className="w-full border rounded-xl shadow-sm bg-primary/30">
			<div className="flex items-center justify-between gap-2 p-3">
				<div className="flex items-center gap-2">
					<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
						<Brain className="size-6 text-primary" />
					</div>
					<div>
						<p className="font-medium text-xl">Lexi War</p>
						<p className="text-muted-foreground text-sm">
							Word Battle Royale
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="text-lg px-3 py-1">
						<Target className="mr-1" />
						{score}
					</Badge>
					<Badge
						variant="outline"
						className="text-lg px-3 py-1 bg-primary/10"
					>
						<Trophy className="mr-1" />
						{highScore}
					</Badge>
				</div>
			</div>
		</div>
	);
}
