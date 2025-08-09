export interface GameType {
	id: string;
	name: string;
	description: string;
	imageUrl: string;
	minPlayers: number;
	activeLobbies: number;
	tags: string[] | null;
}
