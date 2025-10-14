"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RISK_LEVELS } from "@/data/stacks-sweeper";
import { RiskLevel } from "@/types/stacks-sweepers";

interface RiskSelectorProps {
	selectedRisk: RiskLevel;
	onRiskChange: (risk: RiskLevel) => void;
	wagerAmount: number;
}

export function RiskSelector({
	selectedRisk,
	onRiskChange,
	wagerAmount,
}: RiskSelectorProps) {
	return (
		<div className="space-y-4">
			<div className="text-center">
				<h3 className="text-lg font-semibold mb-2">
					Select Risk Level
				</h3>
				<p className="text-sm text-muted-foreground">
					Higher risk = more mines but better rewards
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3">
				{RISK_LEVELS.map((risk) => (
					<Card
						key={risk.percentage}
						className={cn(
							"cursor-pointer transition-all hover:scale-105",
							selectedRisk.percentage === risk.percentage
								? "ring-2 ring-secondary border-secondary"
								: "hover:border-accent"
						)}
						onClick={() => onRiskChange(risk)}
					>
						<CardContent className="p-4 text-center">
							<Badge className={cn("mb-2", risk.color)}>
								{risk.label}
							</Badge>

							<div className="space-y-1 text-sm">
								<div className="flex justify-between">
									<span>Mines:</span>
									<span className="font-semibold">
										{risk.mines}
									</span>
								</div>
								<div className="flex justify-between">
									<span>Multiplier:</span>
									<span className="font-semibold">
										{risk.minMultiplier}x -{" "}
										{risk.maxMultiplier}x
									</span>
								</div>
								<div className="flex justify-between">
									<span>Max Reward:</span>
									<span className="font-semibold text-secondary">
										{(
											wagerAmount * risk.maxMultiplier
										).toFixed(2)}{" "}
										STX
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
