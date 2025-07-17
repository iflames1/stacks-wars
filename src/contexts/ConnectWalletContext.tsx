"use client";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import { getWalletAddress, connectWallet } from "@/lib/wallet";
import { disconnect } from "@stacks/connect";
import { toast } from "sonner";
import { connectOrCreateUser, logoutUser } from "@/lib/actions/user";

interface ConnectUserContextType {
	isConnected: boolean;
	isConnecting: boolean;
	walletAddress?: string;
	handleConnect: () => Promise<void>;
	handleDisconnect: () => Promise<void>;
}

const ConnectUserContext = createContext<ConnectUserContextType | undefined>(
	undefined
);

export const ConnectUserProvider = ({ children }: { children: ReactNode }) => {
	const [isConnected, setIsConnected] = useState(false);
	const [walletAddress, setWalletAddress] = useState<string>();
	const [isConnecting, setIsConnecting] = useState(false);

	const checkConnection = useCallback(async () => {
		const jwtWalletAddress = await getClaimFromJwt<string>("wallet");

		if (!jwtWalletAddress || getWalletAddress() !== jwtWalletAddress) {
			console.warn("Wallet mismatch or not found");
			disconnect();
			setIsConnected(false);
			setWalletAddress(undefined);
			return;
		}

		setWalletAddress(jwtWalletAddress);
		setIsConnected(true);
	}, []);

	useEffect(() => {
		checkConnection();
	}, [checkConnection]);

	const handleConnect = useCallback(async () => {
		setIsConnecting(true);
		try {
			const address = await connectWallet();
			if (!address)
				throw new Error("No address returned from connectWallet");

			await connectOrCreateUser(address);
			await checkConnection();
			toast.success("Wallet connected successfully!");
		} catch (error) {
			toast.error("Something went wrong, try again later.");
			console.error("Error connecting wallet:", error);
		}
		setIsConnecting(false);
	}, [checkConnection]);

	const handleDisconnect = useCallback(async () => {
		setIsConnecting(true);
		try {
			await logoutUser();
			toast.info("Wallet disconnected successfully.");
			setIsConnected(false);
			setWalletAddress(undefined);
		} catch (error) {
			console.error(error);
			toast.error("Failed to disconnect wallet. Please try again.");
		}
		setIsConnecting(false);
	}, []);

	return (
		<ConnectUserContext.Provider
			value={{
				isConnected,
				isConnecting,
				walletAddress,
				handleConnect,
				handleDisconnect,
			}}
		>
			{children}
		</ConnectUserContext.Provider>
	);
};

export const useConnectUser = () => {
	const context = useContext(ConnectUserContext);
	if (!context)
		throw new Error(
			"useConnectUser must be used within a ConnectUserProvider"
		);
	return context;
};
