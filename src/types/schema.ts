export interface GameType {
	id: string;
	name: string;
	description: string;
	image?: string;
	tags?: string[];
	totalPrize: number;
	activeLobbies: number;
	maxPlayers: number;
}

export interface Lobby {
	id: string;
	name: string;
	creatorId: string;
	status: "open" | "full";
}

interface Participant {
	username: string;
	amount: number;
	txId: string;
}

interface Pool {
	id: string;
	currentAmount: number;
	entryAmount: number;
}

export interface LobbyExtended {
	id: string;
	name: string;
	creatorId: string;
	status: "open" | "full";
	description: string;
	game: GameType;
	participants: Participant[];
	pool: Pool;
}
