import { Badge } from "@/components/ui/badge";
import { Trophy, Brain, Target } from "lucide-react";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface GameHeaderProps {
	score: number;
	highScore: number;
}

export default function GameHeader({ score, highScore }: GameHeaderProps) {
	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
							<Brain className="h-6 w-6 text-primary" />
						</div>
						<div>
							<CardTitle className="text-2xl">Lexi War</CardTitle>
							<CardDescription>
								Word Battle Royale
							</CardDescription>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Badge variant="outline" className="text-lg px-3 py-1">
							<Target className="h-4 w-4 mr-1" />
							{score}
						</Badge>
						<Badge
							variant="outline"
							className="text-lg px-3 py-1 bg-primary/10"
						>
							<Trophy className="h-4 w-4 mr-1" />
							{highScore}
						</Badge>
					</div>
				</div>
			</CardHeader>
		</Card>
	);
}
