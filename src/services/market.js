// ============================================================
// MARKET SERVICE — Finnhub API
// Completamente indipendente dall'AI. Funziona sempre.
// ============================================================

const FINNHUB_BASE = 'https://finnhub.io/api/v1'

let _apiKey = ''
export const setFinnhubKey = (k) => { _apiKey = k; localStorage.setItem('nexus_finnhub', k) }
export const getFinnhubKey = () => _apiKey || localStorage.getItem('nexus_finnhub') || ''

async function fhFetch(path) {
  const key = getFinnhubKey()
  if (!key) throw new Error('Finnhub API key mancante')
  const res = await fetch(`${FINNHUB_BASE}${path}&token=${key}`)
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`)
  return res.json()
}

// Quote real-time
export async function getQuote(symbol) {
  const data = await fhFetch(`/quote?symbol=${encodeURIComponent(symbol)}`)
  return {
    symbol,
    current: data.c,
    change: data.dp,       // % change
    changeAbs: data.d,
    high: data.h,
    low: data.l,
    open: data.o,
    prevClose: data.pc,
    ok: data.c > 0,
  }
}

// Candles storici (per calcolo indicatori)
export async function getCandles(symbol, resolution = 'D', days = 120) {
  const to = Math.floor(Date.now() / 1000)
  const from = to - days * 86400
  const data = await fhFetch(`/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}`)
  if (data.s !== 'ok') throw new Error('No candle data')
  return data.c.map((c, i) => ({
    t: data.t[i], o: data.o[i], h: data.h[i], l: data.l[i], c, v: data.v[i]
  }))
}

// Crypto candles via Binance (gratuito, no key)
export async function getCryptoCandles(symbol, days = 120) {
  const map = { 'BTC-USD': 'BTCUSDT', 'ETH-USD': 'ETHUSDT', 'SOL-USD': 'SOLUSDT', 'BNB-USD': 'BNBUSDT' }
  const pair = map[symbol] || symbol
  const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1d&limit=${days}`)
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`)
  const data = await res.json()
  return data.map(d => ({ t: d[0] / 1000, o: +d[1], h: +d[2], l: +d[3], c: +d[4], v: +d[5] }))
}

// Crypto quote via Binance
export async function getCryptoQuote(symbol) {
  const map = { 'BTC-USD': 'BTCUSDT', 'ETH-USD': 'ETHUSDT', 'SOL-USD': 'SOLUSDT', 'BNB-USD': 'BNBUSDT' }
  const pair = map[symbol] || symbol
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`)
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`)
  const d = await res.json()
  return {
    symbol, current: +d.lastPrice, change: +d.priceChangePercent,
    changeAbs: +d.priceChange, high: +d.highPrice, low: +d.lowPrice,
    open: +d.openPrice, prevClose: +d.prevClosePrice, ok: true,
  }
}

// Commodities via Yahoo Finance diretto (no key)
export async function getCommodityCandles(symbol, days = 120) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=6mo`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  )
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)
  const data = await res.json()
  const r = data?.chart?.result?.[0]
  if (!r) throw new Error('No Yahoo data')
  return r.timestamp.map((t, i) => ({
    t, c: r.indicators.quote[0].close[i],
    h: r.indicators.quote[0].high[i], l: r.indicators.quote[0].low[i],
    o: r.indicators.quote[0].open[i], v: r.indicators.quote[0].volume[i],
  })).filter(d => d.c)
}

export async function getCommodityQuote(symbol) {
  const candles = await getCommodityCandles(symbol, 5)
  const last = candles[candles.length - 1]
  const prev = candles[candles.length - 2]
  const change = prev ? ((last.c - prev.c) / prev.c) * 100 : 0
  return { symbol, current: last.c, change, changeAbs: last.c - (prev?.c || last.c), high: last.h, low: last.l, ok: true }
}

// ETF via Yahoo (no key)
export async function getEtfCandles(symbol, days = 120) {
  return getCommodityCandles(symbol, days)
}
export async function getEtfQuote(symbol) {
  return getCommodityQuote(symbol)
}

// ---- INDICATORI TECNICI (puri, nessuna dipendenza) ----

export function calcIndicators(candles) {
  const closes = candles.map(c => c.c).filter(Boolean)
  const volumes = candles.map(c => c.v).filter(Boolean)
  if (closes.length < 20) return null

  const sma = (arr, n) => arr.length >= n ? arr.slice(-n).reduce((a, b) => a + b, 0) / n : null
  const ema = (arr, n) => {
    if (arr.length < n) return null
    const k = 2 / (n + 1)
    let e = arr.slice(0, n).reduce((a, b) => a + b, 0) / n
    for (let i = n; i < arr.length; i++) e = arr[i] * k + e * (1 - k)
    return e
  }

  const sma20 = sma(closes, 20)
  const sma50 = sma(closes, 50)
  const sma200 = sma(closes, 200)
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  const macdLine = (ema12 && ema26) ? ema12 - ema26 : null

  // RSI
  let gains = 0, losses = 0
  const rsiPeriod = 14
  for (let i = closes.length - rsiPeriod; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    if (d > 0) gains += d; else losses += Math.abs(d)
  }
  const rsi = closes.length > rsiPeriod ? 100 - 100 / (1 + gains / (losses || 0.001)) : null

  // Bollinger Bands
  const bb20 = closes.slice(-20)
  const bbMean = bb20.reduce((a, b) => a + b, 0) / 20
  const bbStd = Math.sqrt(bb20.reduce((s, v) => s + (v - bbMean) ** 2, 0) / 20)
  const bbUpper = bbMean + 2 * bbStd
  const bbLower = bbMean - 2 * bbStd
  const cur = closes[closes.length - 1]
  const bbPct = Math.round(((cur - bbLower) / (bbUpper - bbLower)) * 100)

  // ATR (Average True Range)
  const atrPeriod = 14
  const atrs = []
  for (let i = candles.length - atrPeriod; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1]
    if (!p) continue
    atrs.push(Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c)))
  }
  const atr = atrs.length ? atrs.reduce((a, b) => a + b, 0) / atrs.length : null

  // Volume avg
  const avgVol = volumes.length >= 20 ? sma(volumes, 20) : null
  const lastVol = volumes[volumes.length - 1]
  const volRatio = avgVol ? lastVol / avgVol : null

  // Sparkline ultimi 30
  const sparkline = closes.slice(-30)

  // Segnale tecnico puro
  let score = 0
  if (rsi !== null) {
    if (rsi < 25) score += 3
    else if (rsi < 35) score += 2
    else if (rsi < 45) score += 1
    else if (rsi > 75) score -= 3
    else if (rsi > 65) score -= 2
    else if (rsi > 55) score -= 1
  }
  if (sma20 && cur > sma20) score += 1; else if (sma20) score -= 1
  if (sma20 && sma50) { if (sma20 > sma50) score += 2; else score -= 2 }
  if (sma50 && sma200) { if (sma50 > sma200) score += 1; else score -= 1 }
  if (macdLine !== null) { if (macdLine > 0) score += 1; else score -= 1 }
  if (bbPct < 15) score += 2; else if (bbPct > 85) score -= 2
  if (volRatio && volRatio > 1.5 && cur > (closes[closes.length - 2] || cur)) score += 1

  const signal = score >= 3 ? 'BUY' : score <= -3 ? 'SELL' : 'HOLD'
  const confidence = Math.min(95, 50 + Math.abs(score) * 5)

  const high52 = Math.max(...closes.slice(-252))
  const low52 = Math.min(...closes.slice(-252))
  const from52Low = ((cur - low52) / (high52 - low52)) * 100

  return {
    sma20, sma50, sma200, ema12, ema26, macdLine,
    rsi, bbUpper, bbLower, bbMean, bbPct,
    atr, volRatio, sparkline,
    signal, score, confidence,
    high52, low52, from52Low,
    trendUp: sma20 ? cur > sma20 : null,
    goldenCross: sma20 && sma50 ? sma20 > sma50 : null,
    deathCross: sma20 && sma50 ? sma20 < sma50 : null,
  }
}
