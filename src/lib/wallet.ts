import { connect, disconnect, getLocalStorage } from "@stacks/connect";
import { toast } from "sonner";

export const connectWallet = async () => {
	try {
		const response = await connect(); // stores users address in local storage by default
		return response.addresses[2].address; // returns stx address
	} catch (error) {
		toast.error("Failed to connect wallet. Please try again.");
		console.error("Error connecting wallet:", error);
	}
};

export const getWalletAddress = () => {
	const data = getLocalStorage();
	return data?.addresses.stx[0].address;
};

export const disconnectWallet = () => {
	try {
		disconnect();
		toast.info("Wallet disconnected successfully.");
	} catch (error) {
		toast.error("Failed to disconnect wallet. Please try again.");
		console.error("Error disconnecting wallet:", error);
	}
};
