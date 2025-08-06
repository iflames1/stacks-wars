import { User } from "./user";

type txId = string;

interface ClaimState {
	status: "claimed" | "notClaimed";
	data: txId | null;
}

export type PlayerStatus = "ready" | "notReady";

export interface Player extends User {
	state: PlayerStatus;
	rank: number | null;
	usedWords: string[] | null;
	txId: string | null;
	claim: ClaimState | null;
	prize: number | null;
}
