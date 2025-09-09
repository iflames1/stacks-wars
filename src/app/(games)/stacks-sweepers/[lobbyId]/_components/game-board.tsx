import { Flag, Bomb } from "lucide-react";
import Image from "next/image";
import { Cell } from "./stacks-sweepers";
import { GameState } from "@/hooks/useStacksSweepers";

interface GameBoardProps {
	board: Cell[];
	boardSize: number;
	blindMode: boolean;
	gameState: GameState;
	onCellClick: (x: number, y: number, isRightClick?: boolean) => void;
}

export default function GameBoard({
	board,
	boardSize,
	blindMode,
	gameState,
	onCellClick,
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
		return colors[count as keyof typeof colors] || "text-gray-600";
	};

	const getCellContent = (cell: Cell) => {
		switch (cell.state) {
			case "hidden":
				return (
					<div className="w-full h-full bg-primary/20 hover:bg-primary/30 transition-colors border border-primary/30 rounded cursor-pointer flex items-center justify-center">
						<div className="w-2 h-2 bg-primary/40 rounded-full" />
					</div>
				);

			case "flagged":
				return (
					<div className="w-full h-full bg-yellow-500/20 border border-yellow-500/40 rounded cursor-pointer flex items-center justify-center">
						<Flag className="h-4 w-4 text-yellow-600" />
					</div>
				);

			case "revealed":
				if (blindMode) {
					return (
						<div className="w-full h-full bg-background border border-border rounded flex items-center justify-center">
							<span className="text-sm text-muted-foreground">
								•
							</span>
						</div>
					);
				} else {
					return (
						<div className="w-full h-full bg-background border border-border rounded flex items-center justify-center">
							{cell.adjacentMines > 0 && (
								<span
									className={`text-sm font-bold ${getNumberColor(cell.adjacentMines)}`}
								>
									{cell.adjacentMines}
								</span>
							)}
						</div>
					);
				}

			case "mine":
				return (
					<div className="w-full h-full bg-red-500/20 border border-red-500/40 rounded flex items-center justify-center">
						<Bomb className="h-4 w-4 text-red-600" />
					</div>
				);

			case "gem":
				return (
					<div className="w-full h-full bg-green-500/20 border border-green-500/40 rounded flex items-center justify-center">
						<div className="relative w-5 h-5">
							<Image
								src="/logo.webp"
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

	const handleCellClick = (cellId: string, event: React.MouseEvent) => {
		event.preventDefault();
		if (gameState === "won" || gameState === "lost") return;

		const [x, y] = cellId.split("-").map(Number);
		onCellClick(x, y, false);
	};

	const handleCellRightClick = (cellId: string, event: React.MouseEvent) => {
		event.preventDefault();
		if (gameState === "won" || gameState === "lost") return;

		const [x, y] = cellId.split("-").map(Number);
		onCellClick(x, y, true);
	};

	// Calculate responsive grid sizing
	const getGridSizeClass = () => {
		// Ensure grid doesn't overflow on mobile
		return `gap-1`;
	};

	const getCellSizeClass = () => {
		// Optimized for mobile - smaller sizes, consistent across all board sizes
		return "h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12";
	};

	// Calculate dynamic max width including gaps for better centering
	const getMaxWidth = () => {
		// Base cell sizes in rem (converted to approximate px)
		const cellSizes = {
			mobile: 2, // 32px (h-8 w-8)
			sm: 2.5, // 40px (h-10 w-10)
			md: 3, // 48px (h-12 w-12)
		};

		const gapSize = 0.25; // 4px (gap-1)
		const gapCount = boardSize - 1;

		// Calculate in rem, then convert to pixels for max-width
		const totalWidthMobile =
			(boardSize * cellSizes.mobile + gapCount * gapSize) * 16;
		const totalWidthSm =
			(boardSize * cellSizes.sm + gapCount * gapSize) * 16;
		const totalWidthMd =
			(boardSize * cellSizes.md + gapCount * gapSize) * 16;

		// Use the largest size as the maximum to prevent overflow
		return Math.max(totalWidthMobile, totalWidthSm, totalWidthMd);
	};

	return (
		<div className="flex justify-center items-center w-full">
			<div
				className={`grid ${getGridSizeClass()} mx-auto w-fit`}
				style={{
					gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
					maxWidth: `min(90vw, ${getMaxWidth()}px)`,
				}}
			>
				{board.map((cell) => (
					<div
						key={cell.id}
						className={`${getCellSizeClass()} select-none`}
						onClick={(e) => handleCellClick(cell.id, e)}
						onContextMenu={(e) => handleCellRightClick(cell.id, e)}
						onTouchStart={() => {
							// Handle long press for mobile flagging
							const timer = setTimeout(() => {
								const mockEvent = {
									preventDefault: () => {},
								} as React.MouseEvent;
								handleCellRightClick(cell.id, mockEvent);
							}, 500);

							const handleTouchEnd = () => {
								clearTimeout(timer);
								document.removeEventListener(
									"touchend",
									handleTouchEnd
								);
							};

							document.addEventListener(
								"touchend",
								handleTouchEnd
							);
						}}
					>
						{getCellContent(cell)}
					</div>
				))}
			</div>
		</div>
	);
}
