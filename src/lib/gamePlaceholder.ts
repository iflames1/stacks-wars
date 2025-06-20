import { GameType, Lobby, LobbyExtended } from "@/types/schema";

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
		maxPlayers: 10,
		//description: "Join this lobby to compete in Lexi Wars!",
		//createdAt: new Date().toISOString(),
		//updatedAt: new Date().toISOString(),
	},
];

export const lobbiesDataExtended: LobbyExtended[] = [
	{
		id: "lobby1",
		name: "Lexi Wars Lobby 1",
		creatorId: "user1",
		status: "open",
		//gameId: "lexi-wars",
		//amount: 100,
		//participants: ["user1", "user2"],
		maxPlayers: 10,
		description: "Join this lobby to compete in Lexi Wars!",
		//createdAt: new Date().toISOString(),
		//updatedAt: new Date().toISOString(),
		game: {
			id: "lexi-wars",
			name: "Lexi Wars",
			description:
				"A word battle game where players compete to form the longest words.",
			image: "/lexi-wars.webp",
			tags: ["word", "strategy", "multiplayer"],
			totalPrize: 1000,
			activeLobbies: 5,
		},
		participants: [
			{
				username: "user1",
				amount: 100,
				txId: "tx1",
			},
			{
				username: "user2",
				amount: 50,
				txId: "tx2",
			},
		],
		pool: {
			id: "pool1",
			currentAmount: 150,
			entryAmount: 50,
		},
	},
];
