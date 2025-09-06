import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BackToGames() {
	return (
		<Link
			href="/games"
			className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
		>
			<ArrowLeft className="h-4 w-4" />
			<span>Back to Games</span>
		</Link>
	);
}
