import { User } from "lucide-react";

interface GameRuleProps {
	currentRule: string;
	repeatCount?: number;
	requiredRepeats?: number;
}

export default function GameRule({ currentRule }: GameRuleProps) {
	return (
		<div className="bg-primary/10 border rounded-xl">
			<div className="flex items-center gap-2 p-3">
				<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
					<User className="size-6 text-primary" />
				</div>
				<div>
					<p className="text-base text-primary font-medium">
						Current Rule
						{/*({repeatCount}/{requiredRepeats})*/}
					</p>
					<p className="text-sm font-light">
						{currentRule}
					</p>
				</div>
			</div>
		</div>
	);
}
