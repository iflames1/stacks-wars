import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PiTelegramLogo } from "react-icons/pi";
import { FaXTwitter } from "react-icons/fa6";
import { RxDiscordLogo } from "react-icons/rx";

export default function Community() {
	return (
		<section className="w-full py-12 text-center">
			<h2 className="text-2xl font-bold">Join the Community</h2>
			<div className="mt-6 flex flex-wrap justify-center gap-4">
				<Button asChild size="lg">
					<Link href="https://x.com/StacksWars" target="_blank">
						<FaXTwitter />
						Twitter
					</Link>
				</Button>
				<Button asChild size="lg">
					<Link href="" rel="noopener noreferrer">
						<PiTelegramLogo />
						Telegram
					</Link>
				</Button>
				<Button asChild size="lg">
					<Link href="" rel="noopener noreferrer">
						<RxDiscordLogo />
						Discord
					</Link>
				</Button>
			</div>
		</section>
	);
}
