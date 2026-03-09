const KEY = 'nexus_portfolio'

export function loadPortfolio() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch { return [] }
}

export function savePortfolio(holdings) {
  try { localStorage.setItem(KEY, JSON.stringify(holdings)) } catch {}
}

export function addHolding(holdings, asset, quantity, avgPrice, date) {
  const existing = holdings.find(h => h.id === asset.id)
  if (existing) {
    // Calcola prezzo medio ponderato
    const totalQty = existing.quantity + quantity
    const newAvg = (existing.quantity * existing.avgPrice + quantity * avgPrice) / totalQty
    return holdings.map(h => h.id === asset.id
      ? { ...h, quantity: totalQty, avgPrice: newAvg }
      : h
    )
  }
  return [...holdings, {
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    quantity,
    avgPrice,
    buyDate: date || new Date().toISOString().split('T')[0],
    currentPrice: avgPrice,
  }]
}

export function removeHolding(holdings, id) {
  return holdings.filter(h => h.id !== id)
}

export function updatePrices(holdings, quotes) {
  return holdings.map(h => {
    const q = quotes[h.id]
    if (!q?.ok) return h
    const currentPrice = q.current
    const pnl = (currentPrice - h.avgPrice) * h.quantity
    const pnlPct = ((currentPrice - h.avgPrice) / h.avgPrice) * 100
    return { ...h, currentPrice, pnl, pnlPct }
  })
}

export function portfolioStats(holdings) {
  const totalValue = holdings.reduce((s, h) => s + (h.currentPrice || h.avgPrice) * h.quantity, 0)
  const totalCost  = holdings.reduce((s, h) => s + h.avgPrice * h.quantity, 0)
  const totalPnl   = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const byType = holdings.reduce((acc, h) => {
    const val = (h.currentPrice || h.avgPrice) * h.quantity
    acc[h.type] = (acc[h.type] || 0) + val
    return acc
  }, {})

  return { totalValue, totalCost, totalPnl, totalPnlPct, byType }
}
