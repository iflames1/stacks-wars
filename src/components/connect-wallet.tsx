import { isConnected } from "@stacks/connect";
import { Button } from "./ui/button";
import {
	connectWallet,
	disconnectWallet,
	getWalletAddress,
} from "@/lib/wallet";
import { Loader, Wallet2 } from "lucide-react";
import { useState } from "react";
import { truncateAddress } from "@/lib/utils";

export default function ConnectWallet() {
	const [loading, setLoading] = useState<boolean>(false);
	const handleConnect = () => {
		setLoading(true);
		const addy = connectWallet();
		console.log("address", addy);
		setLoading(false);
	};

	const handleDisconnect = () => {
		setLoading(true);
		disconnectWallet();
		setLoading(false);
	};

	return (
		<>
			{isConnected() ? (
				<Button
					variant={"outline"}
					onClick={handleDisconnect}
					disabled={loading}
				>
					<span>{truncateAddress(getWalletAddress())}</span>
					Disconnect
				</Button>
			) : (
				<Button
					variant={"outline"}
					onClick={handleConnect}
					disabled={loading}
				>
					{loading ? (
						<Loader className="size-4 mr-1 animate-spin" />
					) : (
						<Wallet2 className="size-4 mr-1" />
					)}
					{loading ? "Connecting ..." : "Connect wallet"}
				</Button>
			)}
		</>
	);
}
