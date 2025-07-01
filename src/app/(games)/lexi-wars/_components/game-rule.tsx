import { User } from "lucide-react";

interface GameRuleProps {
	currentRule: string;
}

export default function GameRule({ currentRule }: GameRuleProps) {
	return (
		<div className="bg-primary/10 border rounded-xl">
			<div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
				<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
					<User className="size-6 text-primary" />
				</div>
				<div>
					<p className="text-base text-primary font-medium">
						Current Rule
						{/*({repeatCount}/{requiredRepeats})*/}
					</p>
					<p className="text-sm font-bold">{currentRule}</p>
				</div>
			</div>
		</div>
	);
}
