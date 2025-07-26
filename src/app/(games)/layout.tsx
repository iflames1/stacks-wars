import Chat from "@/components/games/chat";
import RequireAuth from "@/components/require-auth";
import { ChatSocketProvider } from "@/contexts/ChatSocketProvider";
import { ConnectUserProvider } from "@/contexts/ConnectWalletContext";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";

interface LayoutProps {
	children: Readonly<React.ReactNode>;
}

export default async function Layout({ children }: LayoutProps) {
	const userId = await getClaimFromJwt<string>("sub");

	if (!userId) {
		return <RequireAuth />;
	}

	return (
		<ConnectUserProvider>
			<main className="flex-1 bg-primary/10">
				<ChatSocketProvider userId={userId}>
					{children}
					<Chat />
				</ChatSocketProvider>
			</main>
		</ConnectUserProvider>
	);
}
