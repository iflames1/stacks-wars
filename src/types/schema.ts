export interface GameType {
	id: string;
	name: string;
	description: string;
	image?: string;
	tags?: string[];
	totalPrize: number;
	activeLobbies: number;
}
