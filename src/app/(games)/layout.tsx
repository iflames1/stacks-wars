import Chat from "@/components/games/chat";
import VoiceChat from "@/components/games/voice-chat";
import { ChatSocketProvider } from "@/contexts/ChatSocketProvider";
import { ConnectUserProvider } from "@/contexts/ConnectWalletContext";

interface LayoutProps {
	children: Readonly<React.ReactNode>;
}

export default function Layout({ children }: LayoutProps) {
	return (
		<ConnectUserProvider>
			<main className="flex-1 bg-primary/10">
				<ChatSocketProvider>
					{children}
					<VoiceChat />
					<Chat />
				</ChatSocketProvider>
			</main>
		</ConnectUserProvider>
	);
}
