const KEY = 'nexus_v2_portfolio'

export const loadPortfolio  = () => { try { return JSON.parse(localStorage.getItem(KEY)||'[]') } catch { return [] } }
export const savePortfolio  = (h) => { try { localStorage.setItem(KEY, JSON.stringify(h)) } catch {} }
export const removeHolding  = (h, id) => h.filter(x=>x.id!==id)

export function addHolding(holdings, asset, qty, price, date) {
  const ex = holdings.find(h=>h.id===asset.id)
  if (ex) {
    const tot = ex.quantity+qty
    return holdings.map(h=>h.id===asset.id?{...h,quantity:tot,avgPrice:(ex.quantity*ex.avgPrice+qty*price)/tot}:h)
  }
  return [...holdings,{id:asset.id,symbol:asset.symbol,name:asset.name,type:asset.type,quantity:qty,avgPrice:price,buyDate:date||new Date().toISOString().split('T')[0],currentPrice:price}]
}

export function updatePrices(holdings, quotes) {
  return holdings.map(h=>{
    const q=quotes[h.id]; if(!q?.ok) return h
    const pnl=(q.current-h.avgPrice)*h.quantity
    return {...h,currentPrice:q.current,pnl,pnlPct:(q.current-h.avgPrice)/h.avgPrice*100}
  })
}

export function portfolioStats(holdings) {
  const totalValue   = holdings.reduce((s,h)=>s+(h.currentPrice||h.avgPrice)*h.quantity,0)
  const totalCost    = holdings.reduce((s,h)=>s+h.avgPrice*h.quantity,0)
  const totalPnl     = totalValue-totalCost
  const totalPnlPct  = totalCost>0?totalPnl/totalCost*100:0
  const byType       = holdings.reduce((a,h)=>{const v=(h.currentPrice||h.avgPrice)*h.quantity;a[h.type]=(a[h.type]||0)+v;return a},{})
  return {totalValue,totalCost,totalPnl,totalPnlPct,byType}
}
