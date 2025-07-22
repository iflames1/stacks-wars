import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function Back({ gameOver }: { gameOver: boolean }) {
	const [open, setOpen] = useState(false);

	return (
		<>
			{gameOver ? (
				<Button
					asChild
					variant={"link"}
					className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 sm:mb-6"
				>
					<Link href={"/lobby"} replace>
						<ArrowLeft className="h-4 w-4" />
						Back to Games
					</Link>
				</Button>
			) : (
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button
							variant={"link"}
							className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 sm:mb-6"
						>
							<ArrowLeft className="h-4 w-4" />
							<span>Quit game</span>
						</Button>
					</DialogTrigger>
					<DialogContent className="bg-gradient-to-b from-primary/90 to-primary/70 border-0 text-white">
						<DialogHeader>
							<DialogTitle>
								Are you sure you want to quit?
							</DialogTitle>
							<DialogDescription>
								You are going to lose game progress if you quit.
								This action cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								asChild
								onClick={() => setOpen(false)}
							>
								<Link href="/lobby">Quit Game</Link>
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
