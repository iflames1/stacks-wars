"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	//CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Lobby, Participant } from "@/types/schema";
import { Loader } from "lucide-react";
import { isConnected } from "@stacks/connect";
import { apiRequest, ApiRequestProps } from "@/lib/api";
import { toast } from "sonner";

interface JoinPoolFormProps {
	lobby: Lobby;
	players: Participant[];
	lobbyId: string;
}

export default function JoinLobbyForm({
	lobby,
	players,
	lobbyId,
}: JoinPoolFormProps) {
	const isLoading = false;
	const isFull = players.length >= lobby.maxPlayers;

	const handleSubmit = async () => {
		try {
			const apiParams: ApiRequestProps = {
				path: `room/${lobbyId}/join`,
				method: "PUT",
				revalidatePath: `/lobby/${lobbyId}`,
				revalidateTag: "lobby",
			};
			await apiRequest(apiParams);
			toast.success("Joined lobby successfully!");
		} catch (error) {
			toast.error("Failed to join lobby", {
				description: "Please try again later.",
			});
			console.error("Join lobby error:", error);
		}
	};

	return (
		<Card className="bg-primary/10">
			<CardHeader>
				<CardTitle>Join Lobby</CardTitle>
				<CardDescription>
					Join this lobby to participate in the game
				</CardDescription>
			</CardHeader>
			{/*{lobby.pool && (
				<CardContent>
					<div className="space-y-4">
						<p className="text-sm font-medium mb-1">Entry Fee</p>
						<p className="text-2xl font-bold">
							{lobby.pool.entryAmount} STX
						</p>
					</div>
				</CardContent>
			)}*/}
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
