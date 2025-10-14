type TileState = "hidden" | "revealed" | "flipping";

export interface Tile {
	id: number;
	state: TileState;
	reward: number;
	isMine: boolean;
}

export interface RiskLevel {
	percentage: number;
	mines: number;
	minMultiplier: number;
	maxMultiplier: number;
	label: string;
	color: string;
}
