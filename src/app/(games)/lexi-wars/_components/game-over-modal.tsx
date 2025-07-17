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

interface GameOverModalProps {
	standing: PlayerStanding[] | undefined;
	userId: string;
}

export default function GameOverModal({
	standing,
	userId,
}: GameOverModalProps) {
	const [open, setOpen] = useState(false);
	const [countdown, setCountdown] = useState(30);
	const router = useRouter();

	useEffect(() => {
		if (standing && standing.length > 0) {
			setOpen(true);
			// Start countdown when modal opens
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
			<DialogContent className="sm:max-w-md bg-primary/70" hideClose>
				<DialogHeader>
					<DialogTitle>🏁 Game Over!</DialogTitle>
					<DialogDescription>
						Here are the final standings:
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2">
					{standing?.map((s, i) => (
						<div
							key={s.player.id}
							className={`flex justify-between px-4 py-2 rounded-md ${
								s.player.id === userId
									? "bg-primary/20 font-bold"
									: "bg-muted"
							}`}
						>
							<span>
								{i + 1}.{" "}
								{s.player.display_name ??
									truncateAddress(s.player.wallet_address)}
							</span>
							<span>Rank {s.rank}</span>
						</div>
					))}
				</div>

				<DialogFooter className="mt-4">
					<Button
						onClick={() => {
							router.push("/lobby");
						}}
					>
						Back to Lobby ({countdown}s)
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
