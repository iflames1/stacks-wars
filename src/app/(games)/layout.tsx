import Chat from "@/components/games/chat";
import { ConnectUserProvider } from "@/contexts/ConnectWalletContext";

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ConnectUserProvider>
			<main className="flex-1 bg-primary/10">
				{children}
				<Chat />
			</main>
		</ConnectUserProvider>
	);
}
