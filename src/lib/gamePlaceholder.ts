import { GameType, Lobby } from "@/types/schema";

export const gamesData: GameType[] = [
	{
		id: "lexi-wars",
		name: "Lexi Wars",
		description:
			"A word battle game where players compete to form the longest words.",
		image: "/lexi-wars.webp",
		tags: ["word", "strategy", "multiplayer"],
		totalPrize: 1000,
		activeLobbies: 5,
	},
	//{
	//	id: "puzzle-challenge",
	//	name: "Puzzle Challenge",
	//	description:
	//		"Solve puzzles faster than your opponents to win STX rewards.",
	//	image: "/lexi-wars.webp",
	//	tags: ["puzzle", "strategy", "multiplayer"],
	//	totalPrize: 1500,
	//	activeLobbies: 3,
	//},
];

export const lobbiesData: Lobby[] = [
	{
		id: "lobby1",
		name: "Lexi Wars Lobby 1",
		creatorId: "user1",
		status: "open",
		//gameId: "lexi-wars",
		//amount: 100,
		//participants: ["user1", "user2"],
		//maxPlayers: 10,
		//description: "Join this lobby to compete in Lexi Wars!",
		//createdAt: new Date().toISOString(),
		//updatedAt: new Date().toISOString(),
	},
];
