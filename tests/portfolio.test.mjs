import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadTypeScript } from './helpers/load-typescript.mjs'

const { calculatePosition, calculatePortfolioTotals } = loadTypeScript(
  new URL('../src/lib/portfolio.ts', import.meta.url),
)

test('missing and invalid prices do not create a fictional loss', () => {
  for (const price of [undefined, null, NaN, Infinity, -1]) {
    const position = calculatePosition(1, 50_000, price)
    assert.equal(position.invested, 50_000)
    assert.equal(position.value, null)
    assert.equal(position.profitLoss, null)
    assert.equal(position.profitLossPercentage, null)
  }
})

test('a genuine zero price is distinct from a missing quote', () => {
  const position = calculatePosition(2, 100, 0)
  assert.equal(position.value, 0)
  assert.equal(position.profitLoss, -200)
  assert.equal(position.profitLossPercentage, -100)
})

test('partial valuation preserves invested capital without publishing incomplete returns', () => {
  const totals = calculatePortfolioTotals([
    calculatePosition(2, 100, 150),
    calculatePosition(1, 500, null),
  ])
  assert.equal(totals.invested, 700)
  assert.equal(totals.missingPrices, 1)
  assert.equal(totals.value, null)
  assert.equal(totals.profitLoss, null)
  assert.equal(totals.totalReturn, null)
})

test('complete prices calculate gains and losses correctly', () => {
  const totals = calculatePortfolioTotals([
    calculatePosition(2, 100, 150),
    calculatePosition(1, 500, 450),
  ])
  assert.equal(totals.value, 750)
  assert.equal(totals.profitLoss, 50)
  assert.equal(totals.totalReturn, (50 / 700) * 100)
  assert.equal(totals.missingPrices, 0)
})

test('empty portfolio is zero while a zero-cost position has no percentage return', () => {
  assert.equal(calculatePortfolioTotals([]).totalReturn, 0)
  const position = calculatePosition(1, 0, 100)
  assert.equal(position.profitLoss, 100)
  assert.equal(position.profitLossPercentage, null)
  assert.equal(calculatePortfolioTotals([position]).totalReturn, null)
})
