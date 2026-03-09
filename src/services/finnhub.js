// Finnhub API — gratuita, 60 req/min, nessun proxy CORS necessario
// Registrati su https://finnhub.io/register per la chiave gratuita

const BASE = 'https://finnhub.io/api/v1'

async function get(path, key) {
  const res = await fetch(`${BASE}${path}&token=${key}`)
  if (!res.ok) throw new Error(`Finnhub ${res.status}`)
  return res.json()
}

// Quote in tempo reale
export async function fetchQuote(symbol, key) {
  try {
    const data = await get(`/quote?symbol=${encodeURIComponent(symbol)}`, key)
    return {
      current: data.c,
      change: data.dp,          // % change
      changePct: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      prevClose: data.pc,
      ok: true,
    }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

// Candele storiche per calcoli tecnici
export async function fetchCandles(symbol, key, days = 90) {
  try {
    const to = Math.floor(Date.now() / 1000)
    const from = to - days * 86400
    const data = await get(
      `/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}`,
      key
    )
    if (data.s !== 'ok' || !data.c?.length) return { ok: false, error: 'No candles' }

    const closes = data.c
    const highs  = data.h
    const lows   = data.l
    const volumes= data.v

    const sma20 = closes.length >= 20 ? avg(closes.slice(-20)) : null
    const sma50 = closes.length >= 50 ? avg(closes.slice(-50)) : null
    const current = closes[closes.length - 1]
    const rsi   = calcRSI(closes)
    const macd  = calcMACD(closes)
    const bb    = calcBB(closes)
    const atr   = calcATR(highs, lows, closes)
    const trendUp = sma20 ? current > sma20 : null
    const goldenCross = sma20 && sma50 ? sma20 > sma50 : null
    const high52 = Math.max(...closes.slice(-252))
    const low52  = Math.min(...closes.slice(-252))
    const sparkline = closes.slice(-30).map((v, i) => ({ i, v }))

    return {
      ok: true, closes, sparkline,
      sma20, sma50, rsi, macd, bb, atr,
      trendUp, goldenCross, high52, low52,
      avgVolume: avg(volumes.slice(-20)),
    }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

// Notizie per un simbolo
export async function fetchNews(symbol, key) {
  try {
    const to = new Date().toISOString().split('T')[0]
    const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const data = await get(
      `/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`,
      key
    )
    return (data || []).slice(0, 8).map(n => ({
      headline: n.headline,
      summary: n.summary,
      url: n.url,
      source: n.source,
      datetime: new Date(n.datetime * 1000).toLocaleDateString('it-IT'),
      sentiment: n.sentiment,
    }))
  } catch { return [] }
}

// Market status
export async function fetchMarketStatus(key) {
  try {
    const data = await get('/stock/market-status?exchange=US', key)
    return data
  } catch { return null }
}

// ── Indicatori tecnici ────────────────────────────────

function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length }

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    if (d > 0) gains += d; else losses += Math.abs(d)
  }
  return 100 - 100 / (1 + gains / (losses || 0.001))
}

function calcEMA(closes, period) {
  const k = 2 / (period + 1)
  let ema = avg(closes.slice(0, period))
  for (let i = period; i < closes.length; i++) ema = closes[i] * k + ema * (1 - k)
  return ema
}

function calcMACD(closes) {
  if (closes.length < 26) return null
  const macdLine = calcEMA(closes, 12) - calcEMA(closes, 26)
  const prev = closes.slice(0, -1)
  const signalLine = prev.length >= 26 ? calcEMA(Array(9).fill(calcEMA(prev, 12) - calcEMA(prev, 26)), 9) : 0
  const histogram = macdLine - signalLine
  return {
    macdLine,
    signalLine,
    histogram,
    signal: macdLine > signalLine ? 'bullish' : 'bearish',
  }
}

function calcBB(closes, period = 20) {
  if (closes.length < period) return null
  const slice = closes.slice(-period)
  const mean = avg(slice)
  const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period)
  const upper = mean + 2 * std
  const lower = mean - 2 * std
  const current = closes[closes.length - 1]
  const pct = Math.round(((current - lower) / ((upper - lower) || 1)) * 100)
  const squeeze = (upper - lower) / mean < 0.04
  return { upper, lower, mean, pct, squeeze }
}

function calcATR(highs, lows, closes, period = 14) {
  if (highs.length < period + 1) return null
  const trs = []
  for (let i = 1; i < highs.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])))
  }
  return avg(trs.slice(-period))
}

// Segnale tecnico puro (usato quando AI è disattivata)
export function calcTechnicalSignal(quote, candles) {
  if (!candles?.ok || !quote?.ok) return null

  const { rsi, trendUp, goldenCross, macd, bb, high52, low52 } = candles
  const { current, changePct } = quote
  let score = 0
  const signals = []

  // RSI
  if (rsi != null) {
    if (rsi < 28)      { score += 3; signals.push({ label: 'RSI', value: rsi.toFixed(0), note: 'Ipervenduto estremo', type: 'buy' }) }
    else if (rsi < 38) { score += 2; signals.push({ label: 'RSI', value: rsi.toFixed(0), note: 'Ipervenduto', type: 'buy' }) }
    else if (rsi < 45) { score += 1; signals.push({ label: 'RSI', value: rsi.toFixed(0), note: 'Neutro-debole', type: 'neutral' }) }
    else if (rsi < 55) { score += 0; signals.push({ label: 'RSI', value: rsi.toFixed(0), note: 'Neutro', type: 'neutral' }) }
    else if (rsi < 65) { score -= 1; signals.push({ label: 'RSI', value: rsi.toFixed(0), note: 'Neutro-forte', type: 'neutral' }) }
    else if (rsi < 75) { score -= 2; signals.push({ label: 'RSI', value: rsi.toFixed(0), note: 'Ipercomprato', type: 'sell' }) }
    else               { score -= 3; signals.push({ label: 'RSI', value: rsi.toFixed(0), note: 'Ipercomprato estremo', type: 'sell' }) }
  }

  // Trend SMA
  if (trendUp != null) {
    if (trendUp) { score += 1; signals.push({ label: 'SMA20', value: candles.sma20?.toFixed(2), note: 'Prezzo sopra → rialzista', type: 'buy' }) }
    else         { score -= 1; signals.push({ label: 'SMA20', value: candles.sma20?.toFixed(2), note: 'Prezzo sotto → ribassista', type: 'sell' }) }
  }

  // Golden/Death cross
  if (goldenCross != null) {
    if (goldenCross) { score += 2; signals.push({ label: 'Cross', value: '☀', note: 'Golden cross (SMA20>SMA50)', type: 'buy' }) }
    else             { score -= 2; signals.push({ label: 'Cross', value: '☽', note: 'Death cross (SMA20<SMA50)', type: 'sell' }) }
  }

  // MACD
  if (macd) {
    if (macd.signal === 'bullish' && macd.histogram > 0) { score += 2; signals.push({ label: 'MACD', value: macd.macdLine.toFixed(2), note: 'Momentum rialzista', type: 'buy' }) }
    else if (macd.signal === 'bullish')                  { score += 1; signals.push({ label: 'MACD', value: macd.macdLine.toFixed(2), note: 'Incrocio bullish', type: 'buy' }) }
    else if (macd.signal === 'bearish' && macd.histogram < 0) { score -= 2; signals.push({ label: 'MACD', value: macd.macdLine.toFixed(2), note: 'Momentum ribassista', type: 'sell' }) }
    else                                                 { score -= 1; signals.push({ label: 'MACD', value: macd.macdLine.toFixed(2), note: 'Incrocio bearish', type: 'sell' }) }
  }

  // Bollinger Bands
  if (bb) {
    if (bb.pct < 10)      { score += 2; signals.push({ label: 'BB', value: `${bb.pct}%`, note: 'Sotto banda inferiore', type: 'buy' }) }
    else if (bb.pct < 25) { score += 1; signals.push({ label: 'BB', value: `${bb.pct}%`, note: 'Zona bassa banda', type: 'buy' }) }
    else if (bb.pct > 90) { score -= 2; signals.push({ label: 'BB', value: `${bb.pct}%`, note: 'Sopra banda superiore', type: 'sell' }) }
    else if (bb.pct > 75) { score -= 1; signals.push({ label: 'BB', value: `${bb.pct}%`, note: 'Zona alta banda', type: 'sell' }) }
    else signals.push({ label: 'BB', value: `${bb.pct}%`, note: 'Centro banda', type: 'neutral' })
    if (bb.squeeze) signals.push({ label: 'BB Squeeze', value: '⚡', note: 'Compressione — breakout imminente', type: 'neutral' })
  }

  // 52W position
  if (high52 && low52) {
    const range = high52 - low52
    const pos = range > 0 ? (current - low52) / range : 0.5
    if (pos < 0.15)      { score += 2; signals.push({ label: '52W', value: `${(pos*100).toFixed(0)}%`, note: 'Vicino ai minimi annuali', type: 'buy' }) }
    else if (pos > 0.90) { score -= 1; signals.push({ label: '52W', value: `${(pos*100).toFixed(0)}%`, note: 'Vicino ai massimi annuali', type: 'sell' }) }
  }

  const maxScore = 12
  const confidence = Math.round(50 + (Math.max(-maxScore, Math.min(maxScore, score)) / maxScore) * 42)
  const signal = score >= 3 ? 'BUY' : score <= -3 ? 'SELL' : 'HOLD'

  // Short vs long term signal
  const shortTerm = rsi != null ? (rsi < 35 ? 'BUY' : rsi > 68 ? 'SELL' : 'HOLD') : null
  const longTerm = goldenCross != null ? (goldenCross && trendUp ? 'BUY' : !goldenCross ? 'SELL' : 'HOLD') : null

  return { signal, score, confidence, signals, shortTerm, longTerm }
}
