import { getWalletAddress } from "@/lib/wallet";
import { User } from "lucide-react";
import { useEffect, useState } from "react";

interface TurnIndicatorProps {
	currentPlayer: string;
}

export default function TurnIndicator({ currentPlayer }: TurnIndicatorProps) {
	const [isCurrentPlayer, setIsCurrentPlayer] = useState<boolean>(false);
	const walletAddress = getWalletAddress();
	console.log("walletAddress:", walletAddress);

	useEffect(() => {
		if (currentPlayer && currentPlayer === walletAddress) {
			setIsCurrentPlayer(true);
		} else {
			setIsCurrentPlayer(false);
		}
	}, [currentPlayer, walletAddress]);

	console.log("currentPlayer:", currentPlayer);

	return (
		<div
			className={`p-3 sm:p-4 rounded-xl border-2
			${isCurrentPlayer ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10"}
			`}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="bg-green-500/10 size-8 rounded-full flex items-center justify-center">
						<User
							className={`size-4
							${isCurrentPlayer ? "text-green-500" : "text-yellow-500"}
							`}
						/>
					</div>
					<h3
						className={`text-base font-semibold
						${isCurrentPlayer ? "text-green-500" : "text-yellow-500"}
						`}
					>
						{isCurrentPlayer
							? "It's Your Turn!"
							: `Waiting for ${currentPlayer}`}
					</h3>
				</div>
			</div>
		</div>
	);
}
