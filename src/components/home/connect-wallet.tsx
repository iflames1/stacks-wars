"use client";
import { Button } from "@/components/ui/button";
import { Loader, Wallet2 } from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { useConnectUser } from "@/contexts/ConnectWalletContext";

export default function ConnectWallet() {
	const {
		isConnecting,
		isConnected,
		walletAddress,
		handleConnect,
		handleDisconnect,
	} = useConnectUser();

	return (
		<>
			{isConnected ? (
				<Button
					variant={"outline"}
					onClick={handleDisconnect}
					disabled={isConnecting}
				>
					<span>{truncateAddress(walletAddress)}</span>
					Disconnect
				</Button>
			) : (
				<Button
					variant={"outline"}
					onClick={handleConnect}
					disabled={isConnecting}
				>
					{isConnecting ? (
						<Loader className="size-4 mr-1 animate-spin" />
					) : (
						<Wallet2 className="size-4 mr-1" />
					)}
					{isConnecting ? "Connecting ..." : "Connect wallet"}
				</Button>
			)}
		</>
	);
}
