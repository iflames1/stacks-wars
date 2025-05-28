import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/header";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		default: "Stacks Wars - Web3 Gaming Platform",
		template: "%s | Stacks Wars",
	},
	description:
		"Experience the future of competitive gaming on the Stacks blockchain. Join tournaments, compete in various games, and win STX rewards in our growing ecosystem of blockchain-powered games.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange={false}
				>
					<Header />
					{children}
					<Toaster richColors position="top-right" />
				</ThemeProvider>
			</body>
		</html>
	);
}
