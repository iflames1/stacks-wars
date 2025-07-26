"use client";
import { useChatSocket, UseChatSocketType } from "@/hooks/useChatSocket";
import { useParams } from "next/navigation";
import { createContext, useContext } from "react";

const ChatSocketContext = createContext<UseChatSocketType | undefined>(
	undefined
);

interface ChatProviderProps {
	children: Readonly<React.ReactNode>;
	userId: string;
}

export const ChatSocketProvider = ({ userId, children }: ChatProviderProps) => {
	const params = useParams();
	const lobbyId = typeof params.lobbyId === "string" ? params.lobbyId : "";
	const socketData = useChatSocket({ lobbyId, userId });
	return (
		<ChatSocketContext.Provider value={socketData}>
			{children}
		</ChatSocketContext.Provider>
	);
};

export const useChatSocketContext = () => {
	const context = useContext(ChatSocketContext);
	if (!context) {
		throw new Error(
			"useChatSocketContext must be used within a ChatSocketProvider"
		);
	}
	return context;
};
