"use client";
import { disconnect, isConnected } from "@stacks/connect";
import { Button } from "@/components/ui/button";
import { connectWallet, getWalletAddress } from "@/lib/wallet";
import { Loader, Wallet2 } from "lucide-react";
import { useState } from "react";
import { truncateAddress } from "@/lib/utils";
import { connectOrCreateUser, logoutUser } from "@/lib/actions/user";
import { toast } from "sonner";

export default function ConnectWallet() {
	const [loading, setLoading] = useState<boolean>(false);
	const handleConnect = async () => {
		setLoading(true);
		try {
			const address = await connectWallet();
			if (!address) {
				throw new Error("No address returned from connectWallet");
			}
			await connectOrCreateUser(address);
		} catch (error) {
			toast.error("Something went wrong try again later.");
			console.error("Error connecting wallet:", error);
		}
		setLoading(false);
	};

	const handleDisconnect = async () => {
		setLoading(true);
		try {
			disconnect();
			await logoutUser();
			toast.info("Wallet disconnected successfully.");
		} catch (error) {
			console.error(error);
			toast.error("Failed to disconnect wallet. Please try again.");
		}
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
