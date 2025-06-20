import { apiRequest } from "@/lib/api";

export interface GameType {
	id: string;
	name: string;
	description: string;
	image?: string;
	tags: string[];
	totalPrize: number; // not added yet
	activeLobbies: number; // not added yet
}

export interface JsonGameType {
	id: string;
	name: string;
	description: string;
	image_url: string;
	tags?: string[];
	min_players: number;
}

export async function transGameType(game: JsonGameType): Promise<NewGameType> {
	const jsonLobbies = await apiRequest<JsonLobby[]>({
		path: `/rooms/${game.id}?state=waiting`,
		auth: false,
		tag: "lobby",
	});
	return {
		id: game.id,
		name: game.name,
		description: game.description,
		image: game.image_url,
		tags: game.tags ?? [],
		minPlayers: game.min_players,
		activeLobbies: jsonLobbies.length,
	};
}

export interface NewGameType {
	id: string;
	name: string;
	description: string;
	image?: string;
	tags: string[];
	minPlayers: number;
	activeLobbies: number;
}

export interface JsonLobby {
	id: string;
	name: string;
	creator_id: string;
	max_participants: number;
	state: "waiting" | "inprogress" | "finished";
	game_id: string;
	game_name: string;
}

export function transLobby(lobby: JsonLobby): Lobby {
	return {
		id: lobby.id,
		name: lobby.name,
		creatorId: lobby.creator_id,
		maxPlayers: lobby.max_participants,
		status: lobby.state,
		gameId: lobby.game_id,
		gameName: lobby.game_name,
	};
}

export interface Lobby {
	id: string;
	name: string;
	creatorId: string;
	maxPlayers: number;
	status: "waiting" | "inprogress" | "finished";
	gameId: string;
	gameName: string;
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
	maxPlayers: number;
}
