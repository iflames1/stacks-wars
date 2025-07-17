import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { PlayerStanding } from "@/hooks/useLexiWarsSocket";
import { truncateAddress } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";

interface GameOverModalProps {
	standing: PlayerStanding[] | undefined;
	userId: string;
	contractAddress: string | null;
	isClaimed: boolean;
}

export default function GameOverModal({
	standing,
	userId,
	contractAddress,
	isClaimed,
}: GameOverModalProps) {
	const [open, setOpen] = useState(false);
	const [countdown, setCountdown] = useState(30);
	const router = useRouter();

	useEffect(() => {
		const shouldOpen =
			standing &&
			standing.length > 0 &&
			(contractAddress ? isClaimed : true);

		if (shouldOpen) {
			setOpen(true);
			const timer = setInterval(() => {
				setCountdown((prev) => {
					if (prev <= 1) {
						clearInterval(timer);
						router.push("/lobby");
						return 0;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [standing, router]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent
				className="sm:max-w-md bg-gradient-to-b from-primary/90 to-primary/70 border-0 text-white"
				hideClose
			>
				<DialogHeader className="text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 p-2">
						<Trophy className="h-8 w-8 text-yellow-300" />
					</div>
					<DialogTitle className="text-2xl font-bold">
						Game Over!
					</DialogTitle>
					<DialogDescription className="text-white/80">
						Tournament results are in
					</DialogDescription>
				</DialogHeader>

				<div className="mt-6 space-y-3">
					{standing?.map((s, i) => (
						<div
							key={s.player.id}
							className={`flex items-center justify-between rounded-lg px-4 py-3 transition-all ${
								s.player.id === userId
									? "bg-white/20 shadow-lg"
									: "bg-white/10"
							}`}
						>
							<div className="flex items-center space-x-3">
								<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-medium">
									{i + 1}
								</span>
								<span className="font-medium">
									{s.player.display_name ??
										truncateAddress(
											s.player.wallet_address
										)}
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<span className="text-sm text-white/70">
									Rank
								</span>
								<span className="font-bold">{s.rank}</span>
							</div>
						</div>
					))}
				</div>

				<DialogFooter className="mt-8">
					<Button
						onClick={() => router.push("/lobby")}
						className="w-full bg-white text-primary hover:bg-white/90 hover:text-primary/90"
						size="lg"
					>
						<div className="flex items-center justify-center space-x-2">
							<ArrowLeft className="h-4 w-4" />
							<span>Back to Lobby ({countdown}s)</span>
						</div>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
