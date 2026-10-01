export const calculatePosition = (quantity: number, averageCost: number, price?: number | null) => {
  const currentPrice = price != null && Number.isFinite(price) && price >= 0 ? price : null
  const invested = quantity * averageCost
  const value = currentPrice === null ? null : quantity * currentPrice
  const profitLoss = value === null ? null : value - invested
  const profitLossPercentage =
    profitLoss === null || invested === 0 ? null : (profitLoss / invested) * 100

  return { currentPrice, invested, value, profitLoss, profitLossPercentage }
}

export const calculatePortfolioTotals = (
  positions: { invested: number; value: number | null }[],
) => {
  const invested = positions.reduce((sum, position) => sum + position.invested, 0)
  const missingPrices = positions.filter((position) => position.value === null).length
  const value =
    missingPrices > 0 ? null : positions.reduce((sum, position) => sum + (position.value ?? 0), 0)
  const profitLoss = value === null ? null : value - invested
  const totalReturn =
    profitLoss === null
      ? null
      : invested > 0
        ? (profitLoss / invested) * 100
        : positions.length === 0
          ? 0
          : null

  return { invested, value, profitLoss, totalReturn, missingPrices }
}
