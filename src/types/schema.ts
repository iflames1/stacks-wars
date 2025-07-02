import { apiRequest } from "@/lib/api";

export interface JsonUser {
	id: string;
	wallet_address: string;
	display_name: string | null;
}

export function transUser(user: JsonUser): User {
	return {
		id: user.id,
		walletAddress: user.wallet_address,
		username: user.display_name,
	};
}

export interface User {
	id: string;
	walletAddress: string;
	username: string | null;
}

export interface JsonGameType {
	id: string;
	name: string;
	description: string;
	image_url: string;
	tags?: string[];
	min_players: number;
}

export async function transGameType(game: JsonGameType): Promise<GameType> {
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

export interface GameType {
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
	description: string | null;
	creator_id: string;
	state: lobbyStatus;
	game_id: string;
	game_name: string;
	participants: number;
	contract_address: string | null;
}

export function transLobby(lobby: JsonLobby): Lobby {
	return {
		id: lobby.id,
		name: lobby.name,
		description: lobby.description,
		creatorId: lobby.creator_id,
		lobbyStatus: lobby.state,
		gameId: lobby.game_id,
		gameName: lobby.game_name,
		players: lobby.participants,
		contractAddress: lobby.contract_address,
	};
}

export type lobbyStatus = "waiting" | "inprogress" | "finished";

export interface Lobby {
	id: string;
	name: string;
	description: string | null;
	creatorId: string;
	lobbyStatus: lobbyStatus;
	gameId: string;
	gameName: string;
	players: number;
	contractAddress: string | null;
}

export interface JsonParticipant {
	id: string;
	wallet_address: string;
	display_name: string | null;
	state: "ready" | "notready";
	rank: number | null;
	used_words: string[];
	tx_id: string | null;
}

export interface Participant extends User {
	playerStatus: "ready" | "notready";
	rank: number | null;
	usedWords: string[];
	txId: string | null;
}

export function transParticipant(
	jsonParticipant: JsonParticipant
): Participant {
	return {
		...transUser({
			id: jsonParticipant.id,
			wallet_address: jsonParticipant.wallet_address,
			display_name: jsonParticipant.display_name,
		}),
		playerStatus: jsonParticipant.state,
		rank: jsonParticipant.rank,
		usedWords: jsonParticipant.used_words,
		txId: jsonParticipant.tx_id,
	};
}

export interface JsonPool {
	entry_amount: number;
	contract_address: string;
	current_amount: number;
}

export function transPool(jsonPool: JsonPool): Pool {
	return {
		entryAmount: jsonPool.entry_amount,
		contractAddress: jsonPool.contract_address,
		currentAmount: jsonPool.current_amount,
	};
}

export interface Pool {
	entryAmount: number;
	contractAddress: string;
	currentAmount: number;
}

export interface LobbyExtended {
	id: string;
	name: string;
	creatorId: string;
	lobbyStatus: "open" | "full";
	description: string;
	game: GameType;
	participants: Participant[];
	pool: Pool;
}

export interface JsonLobbyExtended {
	info: JsonLobby;
	players: JsonParticipant[];
}

export interface NewLobbyExtended {
	lobby: Lobby;
	players: Participant[];
}

export function transLobbyExtended(
	jsonLobby: JsonLobbyExtended
): NewLobbyExtended {
	const lobby: Lobby = transLobby(jsonLobby.info);

	const players: Participant[] = jsonLobby.players.map((p) => ({
		...transUser({
			id: p.id,
			wallet_address: p.wallet_address,
			display_name: p.display_name,
		}),
		playerStatus: p.state,
		rank: p.rank,
		usedWords: p.used_words,
		txId: p.tx_id,
	}));

	return { lobby, players };
}
