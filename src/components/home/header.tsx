"use client";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";
import { FiMenu } from "react-icons/fi";
import { ThemeToggle } from "../theme/theme-toggle";
import ConnectWallet from "./connect-wallet";

export default function Header() {
	const navLinks = [
		//{ href: "/", label: "Home" },
		{ href: "/games", label: "Games" },
		{ href: "/lobby", label: "Lobby" },
		{ href: "/leaderboard", label: "Leaderboard" },
	];

	return (
		<header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-primary/30">
			<div className="max-w-8xl mx-auto flex h-16 items-center justify-between px-6">
				<Link href={"/"}>
					<div className="flex items-center gap-2">
						<Image
							src="/logo.png?height=32&width=32"
							alt="Stacks Wars Logo"
							width={32}
							height={32}
							className="rounded-md"
						/>
						<span className="text-xl font-bold hidden md:inline-block">
							Stacks Wars
						</span>
						<span className="text-xl font-bold md:hidden">SW</span>
					</div>
				</Link>

				{/* Desktop Navigation */}
				<nav className="hidden md:flex items-center gap-6">
					{navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="text-sm font-medium transition-colors hover:text-primary"
						>
							{link.label}
						</Link>
					))}
				</nav>

				<div className="flex items-center md:hidden gap-4">
					<Sheet>
						<SheetTrigger asChild className="md:hidden">
							<Button variant="ghost" size="icon">
								<FiMenu className="size-8" />
								<span className="sr-only">Toggle menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="backdrop-blur supports-[backdrop-filter]:bg-primary/30"
						>
							<SheetHeader>
								<SheetTitle>Stacks Wars</SheetTitle>
							</SheetHeader>
							<nav className="flex flex-col gap-4 px-4 mt-6">
								{navLinks.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										className="text-sm font-medium transition-colors hover:text-primary"
									>
										{link.label}
									</Link>
								))}
								<ConnectWallet />
							</nav>
							<ThemeToggle className="w-fit" />
						</SheetContent>
					</Sheet>
				</div>
				<div className="hidden md:flex">
					<ConnectWallet />
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
