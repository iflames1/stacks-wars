import { Flag, Bomb } from "lucide-react";
import Image from "next/image";
import { Cell } from "./stacks-sweepers";

interface GameBoardProps {
	board: Cell[];
	onCellClick: (cell: Cell) => void;
	disabled?: boolean;
}

export default function GameBoard({
	board,
	onCellClick,
	disabled = false,
}: GameBoardProps) {
	const getNumberColor = (count: number) => {
		const colors = {
			1: "text-blue-600",
			2: "text-green-600",
			3: "text-red-600",
			4: "text-purple-600",
			5: "text-yellow-600",
			6: "text-pink-600",
			7: "text-gray-800",
			8: "text-gray-900",
		};
		return colors[count as keyof typeof colors] || "text-gray-900";
	};

	const getCellContent = (cell: Cell) => {
		switch (cell.state) {
			case "hidden":
				return (
					<div className="w-full h-full bg-gray-300 border-2 border-gray-400 hover:bg-gray-200 cursor-pointer transition-colors" />
				);

			case "flagged":
				return (
					<div className="w-full h-full bg-yellow-200 border-2 border-gray-400 flex items-center justify-center">
						<Flag className="w-4 h-4 text-red-500" />
					</div>
				);

			case "revealed":
				return (
					<div className="w-full h-full bg-gray-100 border border-gray-300 flex items-center justify-center">
						{cell.adjacentMines > 0 && (
							<span
								className={`font-bold text-sm ${getNumberColor(
									cell.adjacentMines
								)}`}
							>
								{cell.adjacentMines}
							</span>
						)}
					</div>
				);

			case "mine":
				return (
					<div className="w-full h-full bg-red-500 border-2 border-red-600 flex items-center justify-center">
						<Bomb className="w-4 h-4 text-white" />
					</div>
				);

			case "gem":
				return (
					<div className="w-full h-full bg-green-200 border-2 border-green-400 flex items-center justify-center relative">
						<div className="w-4 h-4 relative">
							<Image
								src="/logo.png"
								alt="Gem"
								fill
								className="object-contain"
								sizes="20px"
							/>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	const handleCellClick = (cell: Cell, event: React.MouseEvent) => {
		event.preventDefault();
		if (disabled) return;
		onCellClick(cell);
	};

	// Calculate board size from board array
	const boardSize = board.length > 0 ? Math.sqrt(board.length) : 10;

	const getCellSizeClass = () => {
		return "h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12";
	};

	return (
		<div className="flex justify-center items-center w-full">
			<div
				className="grid gap-1 mx-auto w-fit"
				style={{
					gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
					maxWidth: "90vw",
				}}
			>
				{board.map((cell) => (
					<div
						key={cell.id}
						className={`${getCellSizeClass()} select-none ${
							disabled ? "cursor-not-allowed" : "cursor-pointer"
						}`}
						onClick={(e) => handleCellClick(cell, e)}
					>
						{getCellContent(cell)}
					</div>
				))}
			</div>
		</div>
	);
}
