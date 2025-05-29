import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/header";
import Footer from "@/components/footer";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL("https://stackswars.com"),
	title: {
		default: "Stacks Wars - Web3 Gaming Platform",
		template: "%s | Stacks Wars",
	},
	description:
		"Experience the future of competitive gaming on the Stacks blockchain. Join tournaments, compete in various games, and win STX rewards in our growing ecosystem of blockchain-powered games.",
	keywords: [
		"stacks blockchain",
		"web3 gaming",
		"blockchain games",
		"crypto gaming",
		"STX rewards",
		"play to earn",
		"multiplayer games",
		"blockchain tournaments",
		"gaming platform",
		"stacks ecosystem",
		"word games",
		"strategy games",
		"competitive platform",
		"lexi wars",
		"casino games",
		"GameFi",
		"GameFi on Stacks",
	],
	authors: [{ name: "SWE Hashiras" }],
	creator: "SWE Hashiras",
	publisher: "SWE Hashiras",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://stackswars.com",
		siteName: "Stacks Wars",
		title: "Stacks Wars - Web3 Gaming Platform",
		description:
			"Join the next generation of competitive gaming. Compete in various blockchain-powered games, participate in tournaments, and win STX rewards on the Stacks blockchain.",
		images: [
			{
				url: "https://stackswars.com/logo.png?height=1200&width=630",
				width: 1200,
				height: 630,
				alt: "Stacks Wars - Web3 Gaming Platform",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Stacks Wars - Web3 Gaming Platform",
		description:
			"Discover a new era of competitive gaming on the Stacks blockchain. Multiple games, exciting tournaments, and STX rewards await.",
		creator: "@stackswars",
		images: ["https://stackswars.com/logo.png?height=1200&width=630"],
	},
	icons: {
		icon: [
			{ url: "/favicon.ico" },
			{ url: "/logo.png?height=32&width=32", type: "image/png" },
		],
		apple: [
			{ url: "/logo.png" },
			{
				url: "/logo.png?height=72&width=72",
				sizes: "72x72",
				type: "image/png",
			},
			{
				url: "/logo.png?height=114&width=114",
				sizes: "114x114",
				type: "image/png",
			},
		],
	},
	manifest: "/site.webmanifest",
	applicationName: "Stacks Wars",
	category: "Gaming Platform",
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
					<div className="flex flex-col min-h-screen">
						<Header />
						<main className="flex-1">{children}</main>
						<Footer />
					</div>
					<Toaster richColors position="top-right" />
				</ThemeProvider>
			</body>
		</html>
	);
}
