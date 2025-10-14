import type { RiskLevel } from "@/lib/utils/stacks-sweepers";

export const RISK_LEVELS: RiskLevel[] = [
	{
		percentage: 25,
		mines: 4,
		minMultiplier: 0.8,
		maxMultiplier: 1.2,
		label: "Low Risk",
		color: "text-green-400",
	},
	{
		percentage: 50,
		mines: 5,
		minMultiplier: 1.0,
		maxMultiplier: 1.5,
		label: "Medium Risk",
		color: "text-yellow-400",
	},
	{
		percentage: 75,
		mines: 6,
		minMultiplier: 1.2,
		maxMultiplier: 2.0,
		label: "High Risk",
		color: "text-orange-400",
	},
	{
		percentage: 100,
		mines: 7,
		minMultiplier: 1.5,
		maxMultiplier: 3.0,
		label: "Extreme Risk",
		color: "text-red-400",
	},
];
