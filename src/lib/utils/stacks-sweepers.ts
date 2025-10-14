// export interface TileReward {
//   amount: number
//   multiplier: number
// }

// export function generateTileRewards(
//   wagerAmount: number,
//   riskLevel: RiskLevel,
//   boardSize = 16,
// ): Map<number, TileReward> {
//   const rewards = new Map<number, TileReward>()
//   const safePositions = new Set<number>()

//   // Generate safe positions (excluding mines)
//   const minePositions = new Set<number>()
//   while (minePositions.size < riskLevel.mines) {
//     const randomPos = Math.floor(Math.random() * boardSize)
//     minePositions.add(randomPos)
//   }

//   // All non-mine positions are safe and have rewards
//   for (let i = 0; i < boardSize; i++) {
//     if (!minePositions.has(i)) {
//       safePositions.add(i)
//     }
//   }

//   // Generate random rewards for safe positions
//   safePositions.forEach((position) => {
//     const multiplier = riskLevel.minMultiplier + Math.random() * (riskLevel.maxMultiplier - riskLevel.minMultiplier)

//     const amount = wagerAmount * multiplier

//     rewards.set(position, {
//       amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
//       multiplier: Math.round(multiplier * 100) / 100,
//     })
//   })

//   return rewards
// }

// export function calculateCashoutAmount(revealedRewards: TileReward[]): number {
//   return revealedRewards.reduce((total, reward) => total + reward.amount, 0)
// }

// export { type RiskLevel, RISK_LEVELS }
