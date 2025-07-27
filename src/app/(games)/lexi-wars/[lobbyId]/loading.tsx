import Image from "next/image";

interface LoadingProps {
	startCountdown?: number;
	title?: string;
	img?: string;
	description?: string;
}

export default function Loading({
	startCountdown,
	img,
	title,
	description,
}: LoadingProps) {
	return (
		<main className="min-h-screen bg-gradient-to-b from-background to-primary/30">
			<div className="max-w-3xl mx-auto p-4 sm:p-6">
				<div className="min-h-[70vh] flex flex-col items-center justify-center space-y-8">
					<div className="animate-bounce">
						<Image
							src={img ? img : "/logos/lexi-wars.png"}
							alt="Lexi Wars"
							width={300}
							height={300}
							className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72"
							//priority
						/>
					</div>

					{/* Loading Content */}
					<div className="text-center space-y-4">
						<div className="space-y-2">
							<h2 className="text-2xl sm:text-3xl font-bold text-foreground">
								{title ? title : "Preparing Battle Arena"}
							</h2>
							{startCountdown && (
								<p className="text-lg sm:text-xl text-muted-foreground">
									Game starting in{" "}
									<span className="font-semibold text-primary">
										{startCountdown}
									</span>{" "}
									seconds
								</p>
							)}
						</div>

						{/* Game Tip */}
						<div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20 max-w-md mx-auto">
							<p className="text-sm text-muted-foreground">
								{description ? (
									description
								) : (
									<>
										<span className="font-semibold text-primary">
											💡 Game Tip:
										</span>
										<br />
										Always look at the turn indicator to
										know when it&apos;s your turn
									</>
								)}
							</p>
						</div>
					</div>

					<div className="flex space-x-2">
						<div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
						<div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
						<div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
					</div>
				</div>
			</div>
		</main>
	);
}
