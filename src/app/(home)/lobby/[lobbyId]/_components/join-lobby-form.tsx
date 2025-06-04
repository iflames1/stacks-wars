"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { LobbyExtended } from "@/types/schema";
import { Loader } from "lucide-react";
import { isConnected } from "@stacks/connect";

interface JoinPoolFormProps {
	lobby: LobbyExtended;
}

export default function JoinLobbyForm({ lobby }: JoinPoolFormProps) {
	const isLoading = false;
	const isFull = lobby.participants.length >= lobby.game.maxPlayers;

	const handleSubmit = async () => {
		console.log("lobby", lobby);
		//if (!user) {
		//	toast.info("you need to be logged in");
		//	return;
		//}
		//const isUserJoined = lobby.participants.some(
		//	(p) => p.userId === user.id
		//);

		//if (isUserJoined) {
		//	toast.info("you have already joined this lobby");
		//	return;
		//}

		//if (lobby.pool && lobby.pool.contract) {
		//	const response = await joinGamePool(
		//		lobby.pool.contract,
		//		user.stxAddress,
		//		Number(lobby.pool.entryAmount)
		//	);
		//	console.log("response", response.txid);
		//}
		//await joinLobby({
		//	userId: user.id,
		//	lobbyId: lobby.id,
		//	stxAddress: user?.stxAddress,
		//	username: user.stxAddress,
		//});
	};

	return (
		<Card className="bg-primary/10">
			<CardHeader>
				<CardTitle>Join Lobby</CardTitle>
				<CardDescription>
					Join this lobby to participate in the game
				</CardDescription>
			</CardHeader>
			{lobby.pool && (
				<CardContent>
					<div className="space-y-4">
						<p className="text-sm font-medium mb-1">Entry Fee</p>
						<p className="text-2xl font-bold">
							{lobby.pool.entryAmount} STX
						</p>
					</div>
				</CardContent>
			)}
			<CardFooter>
				<Button
					className="w-full"
					size="lg"
					disabled={isLoading || isFull || !isConnected()}
					onClick={handleSubmit}
				>
					{isLoading ? (
						<>
							<Loader className="mr-2 h-4 w-4 animate-spin" />
							Joining...
						</>
					) : !isConnected() ? (
						"Connect Wallet to Join"
					) : isFull ? (
						"Pool is Full"
					) : (
						"Join Lobby"
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
