"use client";
import { Button } from "@/components/ui/button";
import { connectWallet, getWalletAddress } from "@/lib/wallet";
import { Loader, Wallet2 } from "lucide-react";
import { useEffect, useState } from "react";
import { truncateAddress } from "@/lib/utils";
import { connectOrCreateUser, logoutUser } from "@/lib/actions/user";
import { toast } from "sonner";
import { disconnect } from "@stacks/connect";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import { useRouter } from "next/navigation";

export default function ConnectWallet() {
	const [loading, setLoading] = useState<boolean>(false);
	const [loggedIn, setLoggedIn] = useState(false);
	const [walletAddress, setWalletAddress] = useState<string>("");
	const router = useRouter();

	useEffect(() => {
		const checkLoginStatus = async () => {
			const walletAddress = await getClaimFromJwt<string>("wallet");
			if (walletAddress) {
				if (getWalletAddress() !== walletAddress) {
					console.log("Wallet address does not match JWT claim");
					disconnect();
					setLoggedIn(false);
					throw new Error("Wallet address does not match JWT claim");
				} else {
					setWalletAddress(walletAddress);
					setLoggedIn(true);
				}
			}
		};

		checkLoginStatus();
	}, []);

	const handleConnect = async () => {
		setLoading(true);
		try {
			const address = await connectWallet();
			if (!address) {
				throw new Error("No address returned from connectWallet");
			}
			await connectOrCreateUser(address);
			setLoggedIn(true);
			router.refresh();
		} catch (error) {
			toast.error("Something went wrong try again later.");
			console.error("Error connecting wallet:", error);
		}
		setLoading(false);
	};

	const handleDisconnect = async () => {
		setLoading(true);
		try {
			await logoutUser();
			toast.info("Wallet disconnected successfully.");
			setLoggedIn(false);
		} catch (error) {
			console.error(error);
			toast.error("Failed to disconnect wallet. Please try again.");
		}
		setLoading(false);
	};

	return (
		<>
			{loggedIn ? (
				<Button
					variant={"outline"}
					onClick={handleDisconnect}
					disabled={loading}
				>
					<span>{truncateAddress(walletAddress)}</span>
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
