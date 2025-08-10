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
	entryAmount: number | null;
	currentAmount: number | null;
}

export interface LobbyExtended {
	lobby: Lobby;
	players: Player[];
}

export type JoinState = "idle" | "pending" | "allowed" | "rejected";

export type PendingJoin = {
	user: User;
	state: JoinState;
};
