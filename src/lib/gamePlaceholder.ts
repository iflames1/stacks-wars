import { GameType } from "@/types/schema";

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
