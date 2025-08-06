import { GameType } from "./game";
import { Player } from "./player";
import { User } from "./user";

export type lobbyState = "waiting" | "inProgress" | "finished";

export interface Lobby {
	id: string;
	name: string;
	creator: User;
	state: lobbyState;
	game: GameType;
	participants: number;
	createdAt: string;
	description: string | null;
	contractAddress: string | null;
}

export interface LobbyPool {
	entryAmount: number;
	contractAddress: string;
	currentAmount: number;
}

export interface LobbyExtended {
	lobby: Lobby;
	players: Player[];
	pool: LobbyPool | null;
}
