// ─── Unified market data + technical indicators ───────────────────────────────
// Crypto  → Finnhub  (BINANCE:BTCUSDT)
// ETF     → Yahoo Finance (VWCE.DE)
// Commodity → Yahoo Finance (GC=F futures)

// ── Symbol routing ────────────────────────────────────────────────────────────
const YAHOO_MAP = {
  'VWCE:XETRA':'VWCE.DE','SWDA:XETRA':'SWDA.L','WEBG:XETRA':'WEBG.DE',
  'ISAC:XETRA':'ISAC.L','IMWD:XETRA':'IMWD.L','IUSQ:XETRA':'IUSQ.DE',
  'CSPX:XETRA':'CSPX.L','VUAA:XETRA':'VUAA.DE','SXR8:XETRA':'SXR8.DE',
  'IUSP:XETRA':'IUSP.L','ZPRV:XETRA':'ZPRV.DE','EQQQ:XETRA':'EQQQ.DE',
  'CSNDX:XETRA':'CSNDX.SW','SUSA:XETRA':'SUSA.L','EXSA:XETRA':'EXS2.DE',
  'MEUD:XETRA':'MEUD.PA','EXS1:XETRA':'EXS1.DE','SPYW:XETRA':'SPYW.DE',
  'XEON:XETRA':'XEON.DE','ISF:XETRA':'ISF.L','IMEA:XETRA':'IMEA.L',
  'IEMA:XETRA':'IEMA.L','VFEM:XETRA':'VFEM.L','AEEM:XETRA':'AEEM.PA',
  'XCHA:XETRA':'XCHA.DE','CJPA:XETRA':'CJPA.L','PAASI:XETRA':'PAASI.L',
  'VNAM:XETRA':'VNAM.L','QDVE:XETRA':'QDVE.DE','IUFS:XETRA':'IUFS.L',
  'IUHS:XETRA':'IUHS.L','IUES:XETRA':'IUES.L','IUCM:XETRA':'IUCM.L',
  'IUIS:XETRA':'IUIS.L','EXV1:XETRA':'EXV1.DE','IPRP:XETRA':'IPRP.L',
  'WTAI:XETRA':'WTAI.L','LOCK:XETRA':'LOCK.L','ROBO:XETRA':'ROBO.L',
  'IQQH:XETRA':'IQQH.DE','CEMG:XETRA':'SMH','BATE:XETRA':'BATE.L',
  'ESPO:XETRA':'ESPO','RENW:XETRA':'RENW.L',
  'BTCE:XETRA':'BTCE.DE','ZETH:XETRA':'ZETH.DE',
  // Commodities
  'OANDA:XAUUSD':'GC=F','OANDA:XAGUSD':'SI=F','OANDA:XPTUSD':'PL=F',
  'OANDA:XPDUSD':'PA=F','OANDA:BCOUSD':'BZ=F','OANDA:WTICOUSD':'CL=F',
  'OANDA:NATGASUSD':'NG=F','COAL:NYMEX':'MTF=F','OANDA:XCUUSD':'HG=F',
  'OANDA:ALUUSD':'ALI=F','OANDA:XNIUSD':'NI=F','OANDA:XZNUSD':'ZNC=F',
  'OANDA:WHEATUSD':'ZW=F','OANDA:CORNUSD':'ZC=F','OANDA:SOYBNUSD':'ZS=F',
  'OANDA:COFFEEUSD':'KC=F','OANDA:COCOAUSD':'CC=F','OANDA:SUGARUSD':'SB=F',
}

const isCrypto  = s => s.startsWith('BINANCE:') || s.startsWith('COINBASE:')
const yahooTick = s => YAHOO_MAP[s] || null

// ── Yahoo Finance ─────────────────────────────────────────────────────────────
async function yahooFetch(ticker, range='6mo') {
  const bases = [
    'https://query1.finance.yahoo.com/v8/finance/chart/',
    'https://query2.finance.yahoo.com/v8/finance/chart/',
  ]
  for (const base of bases) {
    try {
      const r = await fetch(`${base}${encodeURIComponent(ticker)}?interval=1d&range=${range}`, {
        headers:{ 'Accept':'application/json', 'User-Agent':'Mozilla/5.0' }
      })
      if (!r.ok) continue
      const d = await r.json()
      const res = d?.chart?.result?.[0]
      if (!res) continue
      return res
    } catch { continue }
  }
  return null
}

// ── Finnhub ───────────────────────────────────────────────────────────────────
async function finnhubGet(path, key) {
  const r = await fetch(`https://finnhub.io/api/v1${path}&token=${key}`)
  if (!r.ok) throw new Error(`Finnhub ${r.status}`)
  return r.json()
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchQuote(symbol, key) {
  try {
    if (isCrypto(symbol)) {
      const d = await finnhubGet(`/quote?symbol=${encodeURIComponent(symbol)}`, key)
      if (!d.c) return { ok:false, error:'No data' }
      return { ok:true, current:d.c, change:d.dp, high:d.h, low:d.l, open:d.o, prevClose:d.pc }
    }
    const ticker = yahooTick(symbol)
    if (!ticker) return { ok:false, error:'Symbol not mapped' }
    const res = await yahooFetch(ticker, '5d')
    if (!res) return { ok:false, error:'Yahoo unavailable' }
    const meta = res.meta
    const cur  = meta.regularMarketPrice
    const prev = meta.chartPreviousClose || meta.previousClose || cur
    return {
      ok:true, current:cur,
      change: prev ? (cur-prev)/prev*100 : 0,
      high:   meta.regularMarketDayHigh   || cur,
      low:    meta.regularMarketDayLow    || cur,
      open:   meta.regularMarketOpen      || cur,
      prevClose: prev,
      currency: meta.currency || 'USD',
    }
  } catch(e) { return { ok:false, error:e.message } }
}

export async function fetchCandles(symbol, key, days=120) {
  try {
    let closes=[], highs=[], lows=[], volumes=[], timestamps=[], ohlc=[]

    if (isCrypto(symbol)) {
      const to   = Math.floor(Date.now()/1000)
      const from = to - days*86400
      const d = await finnhubGet(`/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}`, key)
      if (d.s !== 'ok' || !d.c?.length) return { ok:false, error:'No candles' }
      closes = d.c; highs = d.h; lows = d.l; volumes = d.v||[]; timestamps = d.t||[]
      ohlc = closes.map((_,i)=>({ t:timestamps[i], o:d.o[i], h:highs[i], l:lows[i], c:closes[i], v:volumes[i]||0 }))
    } else {
      const ticker = yahooTick(symbol)
      if (!ticker) return { ok:false, error:'Symbol not mapped' }
      const range = days > 180 ? '1y' : days > 60 ? '6mo' : '3mo'
      const res = await yahooFetch(ticker, range)
      if (!res) return { ok:false, error:'Yahoo unavailable' }
      const q = res.indicators?.quote?.[0]
      if (!q?.close) return { ok:false, error:'No candle data' }
      timestamps = res.timestamp || []
      closes  = q.close.map((v,i)=>v??closes[i-1]??0).filter(Boolean)
      highs   = q.high.map((v,i)=>v??highs[i-1]??0).filter(Boolean)
      lows    = q.low.map((v,i)=>v??lows[i-1]??0).filter(Boolean)
      volumes = q.volume||[]
      ohlc = closes.map((_,i)=>({ t:timestamps[i], o:q.open?.[i]||closes[i], h:highs[i]||closes[i], l:lows[i]||closes[i], c:closes[i], v:volumes[i]||0 }))
    }

    if (closes.length < 2) return { ok:false, error:'Insufficient data' }

    // ── Compute all indicators ─────────────────────────────────────────────
    const ind = computeIndicators(closes, highs, lows, volumes, ohlc)
    const cur = closes[closes.length-1]

    return {
      ok: true,
      closes, highs, lows, volumes, ohlc,
      sparkline: closes.slice(-30).map((v,i)=>({i,v})),
      candleData: ohlc.slice(-60).map(c=>({
        t: c.t ? new Date(c.t*1000).toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit'}) : '',
        o: +c.o.toFixed(4), h: +c.h.toFixed(4),
        l: +c.l.toFixed(4), c: +c.c.toFixed(4),
      })),
      high52: Math.max(...closes.slice(-252)),
      low52:  Math.min(...closes.slice(-252)),
      current: cur,
      ...ind,
    }
  } catch(e) { return { ok:false, error:e.message } }
}

// ── All 14 indicators ─────────────────────────────────────────────────────────
function computeIndicators(closes, highs, lows, volumes, ohlc) {
  const sma20 = sma(closes, 20)
  const sma50 = sma(closes, 50)
  const ema9  = ema(closes, 9)
  const ema21 = ema(closes, 21)
  const cur   = closes[closes.length-1]
  const macdR = calcMACD(closes)
  const bbR   = calcBB(closes, 20)
  const rsiV  = calcRSI(closes, 14)
  const stochR= calcStoch(closes, highs, lows, 14, 3)
  const atrV  = calcATR(highs, lows, closes, 14)
  const obvV  = calcOBV(closes, volumes)
  const vwapV = calcVWAP(closes, highs, lows, volumes)
  const ichiR = calcIchimoku(highs, lows, closes)
  const srR   = calcSupportResistance(closes, highs, lows)
  const willR = calcWilliamsR(highs, lows, closes, 14)
  const cciV  = calcCCI(closes, highs, lows, 20)

  const trendUp    = sma20 != null ? cur > sma20 : null
  const goldenCross= sma20 != null && sma50 != null ? sma20 > sma50 : null
  const emaGolden  = ema9  != null && ema21 != null ? ema9  > ema21 : null

  return {
    sma20, sma50, ema9, ema21,
    rsi: rsiV,
    macd: macdR,
    bb: bbR,
    stoch: stochR,
    atr: atrV,
    obv: obvV,
    vwap: vwapV,
    ichimoku: ichiR,
    sr: srR,
    williamsR: willR,
    cci: cciV,
    trendUp, goldenCross, emaGolden,
  }
}

// ── Math helpers ─────────────────────────────────────────────────────────────
const avg = a => a.length ? a.reduce((s,v)=>s+v,0)/a.length : null

function sma(c, p) {
  if (c.length < p) return null
  return avg(c.slice(-p))
}

function ema(c, p) {
  if (c.length < p) return null
  const k = 2/(p+1)
  let e = avg(c.slice(0, p))
  for (let i = p; i < c.length; i++) e = c[i]*k + e*(1-k)
  return e
}

function emaArr(c, p) {
  if (c.length < p) return []
  const k = 2/(p+1)
  const out = new Array(c.length).fill(null)
  let e = avg(c.slice(0, p))
  out[p-1] = e
  for (let i = p; i < c.length; i++) { e = c[i]*k + e*(1-k); out[i] = e }
  return out
}

function calcRSI(c, p=14) {
  if (c.length < p+1) return null
  let g=0, l=0
  for (let i = c.length-p; i < c.length; i++) {
    const d = c[i]-c[i-1]; d>0 ? g+=d : l+=Math.abs(d)
  }
  const rs = g/(l||0.0001)
  return Math.round(100 - 100/(1+rs))
}

function calcMACD(c) {
  if (c.length < 26) return null
  const e12 = emaArr(c, 12)
  const e26 = emaArr(c, 26)
  const macdLine = e12.map((v,i) => v!=null&&e26[i]!=null ? v-e26[i] : null)
  const validMacd = macdLine.filter(Boolean)
  if (validMacd.length < 9) return null
  const signal = ema(validMacd, 9)
  const ml = macdLine[macdLine.length-1]
  const histogram = ml - signal
  // Return last 30 points for chart
  const chartData = macdLine.slice(-30).map((v,i)=>({ i, macd:v, signal:null, hist:null }))
  return { macdLine:ml, signalLine:signal, histogram, signal:ml>signal?'bullish':'bearish', chartData }
}

function calcBB(c, p=20) {
  if (c.length < p) return null
  const sl = c.slice(-p)
  const m = avg(sl)
  const std = Math.sqrt(sl.reduce((s,v)=>s+(v-m)**2,0)/p)
  const upper = m+2*std, lower = m-2*std
  const cur = c[c.length-1]
  const pct = Math.round((cur-lower)/((upper-lower)||1)*100)
  return { upper, lower, mean:m, std, pct, squeeze:(upper-lower)/m<0.04 }
}

function calcStoch(c, h, l, kp=14, dp=3) {
  if (c.length < kp) return null
  const recentH = Math.max(...h.slice(-kp))
  const recentL = Math.min(...l.slice(-kp))
  const k = Math.round((c[c.length-1]-recentL)/((recentH-recentL)||1)*100)
  // Simple D: average of last dp K values
  const ks = []
  for (let i = Math.max(0, c.length-dp-kp); i <= c.length-kp; i++) {
    const sh = Math.max(...h.slice(i, i+kp))
    const sl = Math.min(...l.slice(i, i+kp))
    ks.push(Math.round((c[i+kp-1]-sl)/((sh-sl)||1)*100))
  }
  const d = ks.length >= dp ? Math.round(avg(ks.slice(-dp))) : k
  const sig = k<20?'oversold':k>80?'overbought':'neutral'
  return { k, d, signal:sig }
}

function calcATR(h, l, c, p=14) {
  if (h.length < p+1) return null
  const trs = []
  for (let i = 1; i < h.length; i++) {
    trs.push(Math.max(h[i]-l[i], Math.abs(h[i]-c[i-1]), Math.abs(l[i]-c[i-1])))
  }
  const atr = avg(trs.slice(-p))
  const atrPct = (atr / c[c.length-1]) * 100
  return { value: atr, pct: atrPct.toFixed(2) }
}

function calcOBV(c, v) {
  if (!v?.length || v.length < 2) return null
  let obv = 0
  const obvArr = [0]
  for (let i = 1; i < c.length; i++) {
    if (c[i] > c[i-1])      obv += (v[i]||0)
    else if (c[i] < c[i-1]) obv -= (v[i]||0)
    obvArr.push(obv)
  }
  const trend = obvArr.length >= 5
    ? (obvArr[obvArr.length-1] > obvArr[obvArr.length-5] ? 'rising' : 'falling')
    : 'neutral'
  return { value: obv, trend, signal: trend==='rising'?'bullish':'bearish' }
}

function calcVWAP(c, h, l, v) {
  if (!v?.length) return null
  let cumPV = 0, cumV = 0
  const n = Math.min(20, c.length)
  for (let i = c.length-n; i < c.length; i++) {
    const tp = (h[i]+l[i]+c[i])/3
    cumPV += tp*(v[i]||0)
    cumV  += (v[i]||0)
  }
  if (!cumV) return null
  const vwap = cumPV/cumV
  const cur  = c[c.length-1]
  return { value: vwap, aboveVwap: cur > vwap, diff: ((cur-vwap)/vwap*100).toFixed(2) }
}

function calcIchimoku(h, l, c) {
  if (h.length < 52) return null
  const mid = (arr, p) => (Math.max(...arr.slice(-p)) + Math.min(...arr.slice(-p))) / 2
  const tenkan  = mid(h.length>=9  ? h.slice(-9)  : h, Math.min(9,  h.length))  // Conversion line
  const kijun   = mid(h.length>=26 ? h.slice(-26) : h, Math.min(26, h.length))  // Base line
  const senkouA = (tenkan + kijun) / 2                                            // Leading span A
  const senkouB = mid(h.length>=52 ? h.slice(-52) : h, Math.min(52, h.length))  // Leading span B
  const cur = c[c.length-1]
  const aboveCloud = cur > Math.max(senkouA, senkouB)
  const belowCloud = cur < Math.min(senkouA, senkouB)
  const signal = aboveCloud ? 'bullish' : belowCloud ? 'bearish' : 'neutral'
  return { tenkan, kijun, senkouA, senkouB, aboveCloud, belowCloud, signal }
}

function calcSupportResistance(c, h, l) {
  if (c.length < 20) return null
  const window = 5
  const pivotHighs = [], pivotLows = []
  for (let i = window; i < h.length-window; i++) {
    if (h[i] === Math.max(...h.slice(i-window, i+window+1))) pivotHighs.push(h[i])
    if (l[i] === Math.min(...l.slice(i-window, i+window+1))) pivotLows.push(l[i])
  }
  const cur = c[c.length-1]
  const resistances = [...new Set(pivotHighs)].filter(v=>v>cur).sort((a,b)=>a-b).slice(0,3)
  const supports    = [...new Set(pivotLows)].filter(v=>v<cur).sort((a,b)=>b-a).slice(0,3)
  return { supports, resistances }
}

function calcWilliamsR(h, l, c, p=14) {
  if (h.length < p) return null
  const hh = Math.max(...h.slice(-p))
  const ll = Math.min(...l.slice(-p))
  const wr = Math.round((hh-c[c.length-1])/((hh-ll)||1)*-100)
  const signal = wr < -80 ? 'oversold' : wr > -20 ? 'overbought' : 'neutral'
  return { value: wr, signal }
}

function calcCCI(c, h, l, p=20) {
  if (c.length < p) return null
  const tps = c.map((_,i)=>(h[i]+l[i]+c[i])/3)
  const slTp = tps.slice(-p)
  const m = avg(slTp)
  const md = avg(slTp.map(v=>Math.abs(v-m)))
  const cci = Math.round((tps[tps.length-1]-m)/(0.015*(md||1)))
  const signal = cci < -100 ? 'oversold' : cci > 100 ? 'overbought' : 'neutral'
  return { value: cci, signal }
}

// ── Signal engine ─────────────────────────────────────────────────────────────
export function calcSignal(quote, candles) {
  if (!candles?.ok || !quote?.ok) return null
  const { rsi, trendUp, goldenCross, emaGolden, macd, bb, stoch, williamsR, cci, ichimoku, obv, vwap, high52, low52 } = candles
  const { current, change } = quote
  let score = 0
  const signals = []

  // RSI
  if (rsi != null) {
    if      (rsi < 25) { score+=3; signals.push({l:'RSI',     v:`${rsi}`,      n:'Ipervenduto estremo',  t:'buy'})  }
    else if (rsi < 35) { score+=2; signals.push({l:'RSI',     v:`${rsi}`,      n:'Ipervenduto',          t:'buy'})  }
    else if (rsi < 45) { score+=1; signals.push({l:'RSI',     v:`${rsi}`,      n:'Zona debole',          t:'buy'})  }
    else if (rsi < 55) {           signals.push({l:'RSI',     v:`${rsi}`,      n:'Neutro',               t:'neutral'}) }
    else if (rsi < 65) { score-=1; signals.push({l:'RSI',     v:`${rsi}`,      n:'Zona forte',           t:'neutral'}) }
    else if (rsi < 75) { score-=2; signals.push({l:'RSI',     v:`${rsi}`,      n:'Ipercomprato',         t:'sell'}) }
    else               { score-=3; signals.push({l:'RSI',     v:`${rsi}`,      n:'Ipercomprato estremo', t:'sell'}) }
  }
  // SMA trend
  if (trendUp != null) {
    if (trendUp) { score+=1; signals.push({l:'SMA20',  v:'↑ sopra', n:'Prezzo sopra SMA20',   t:'buy'})  }
    else         { score-=1; signals.push({l:'SMA20',  v:'↓ sotto', n:'Prezzo sotto SMA20',   t:'sell'}) }
  }
  // Golden/Death cross SMA
  if (goldenCross != null) {
    if (goldenCross) { score+=2; signals.push({l:'Cross SMA', v:'☀ Golden', n:'SMA20 > SMA50',  t:'buy'})  }
    else             { score-=2; signals.push({l:'Cross SMA', v:'☽ Death',  n:'SMA20 < SMA50',  t:'sell'}) }
  }
  // EMA cross
  if (emaGolden != null) {
    if (emaGolden) { score+=1; signals.push({l:'Cross EMA', v:'↑ EMA9>21',  n:'Momentum rialzista', t:'buy'})  }
    else           { score-=1; signals.push({l:'Cross EMA', v:'↓ EMA9<21',  n:'Momentum ribassista',t:'sell'}) }
  }
  // MACD
  if (macd) {
    if (macd.signal==='bullish'&&macd.histogram>0)  { score+=2; signals.push({l:'MACD', v:`hist ${macd.histogram?.toFixed(3)}`, n:'Momentum rialzista', t:'buy'})  }
    else if (macd.signal==='bullish')               { score+=1; signals.push({l:'MACD', v:'↑ cross',                          n:'Incrocio bullish',    t:'buy'})  }
    else if (macd.signal==='bearish'&&macd.histogram<0){score-=2;signals.push({l:'MACD', v:`hist ${macd.histogram?.toFixed(3)}`,n:'Momentum ribassista', t:'sell'}) }
    else                                            { score-=1; signals.push({l:'MACD', v:'↓ cross',                          n:'Incrocio bearish',    t:'sell'}) }
  }
  // Bollinger
  if (bb) {
    if      (bb.pct < 10) { score+=2; signals.push({l:'BB',  v:`${bb.pct}%`, n:'Sotto banda inferiore', t:'buy'})  }
    else if (bb.pct < 25) { score+=1; signals.push({l:'BB',  v:`${bb.pct}%`, n:'Zona bassa',            t:'buy'})  }
    else if (bb.pct > 90) { score-=2; signals.push({l:'BB',  v:`${bb.pct}%`, n:'Sopra banda superiore', t:'sell'}) }
    else if (bb.pct > 75) { score-=1; signals.push({l:'BB',  v:`${bb.pct}%`, n:'Zona alta',             t:'sell'}) }
    else                  {           signals.push({l:'BB',  v:`${bb.pct}%`, n:'Centro banda',          t:'neutral'}) }
    if (bb.squeeze)       {           signals.push({l:'Squeeze',v:'⚡',       n:'Breakout imminente',    t:'neutral'}) }
  }
  // Stocastico
  if (stoch) {
    if      (stoch.k < 20) { score+=1; signals.push({l:'Stoch', v:`K:${stoch.k}`, n:'Zona ipervenduta',   t:'buy'})  }
    else if (stoch.k > 80) { score-=1; signals.push({l:'Stoch', v:`K:${stoch.k}`, n:'Zona ipercomprata',  t:'sell'}) }
    else                   {           signals.push({l:'Stoch', v:`K:${stoch.k} D:${stoch.d}`, n:stoch.signal,t:'neutral'}) }
  }
  // Williams %R
  if (williamsR) {
    if      (williamsR.value < -80) { score+=1; signals.push({l:'Williams %R', v:`${williamsR.value}`, n:'Ipervenduto', t:'buy'})  }
    else if (williamsR.value > -20) { score-=1; signals.push({l:'Williams %R', v:`${williamsR.value}`, n:'Ipercomprato',t:'sell'}) }
    else                            {           signals.push({l:'Williams %R', v:`${williamsR.value}`, n:'Neutro',      t:'neutral'}) }
  }
  // CCI
  if (cci) {
    if      (cci.value < -100) { score+=1; signals.push({l:'CCI', v:`${cci.value}`, n:'Ipervenduto CCI', t:'buy'})  }
    else if (cci.value >  100) { score-=1; signals.push({l:'CCI', v:`${cci.value}`, n:'Ipercomprato CCI',t:'sell'}) }
    else                       {           signals.push({l:'CCI', v:`${cci.value}`, n:'Neutro',          t:'neutral'}) }
  }
  // Ichimoku
  if (ichimoku) {
    if      (ichimoku.signal==='bullish') { score+=2; signals.push({l:'Ichimoku', v:'☁ sopra', n:'Prezzo sopra nuvola', t:'buy'})  }
    else if (ichimoku.signal==='bearish') { score-=2; signals.push({l:'Ichimoku', v:'☁ sotto', n:'Prezzo sotto nuvola', t:'sell'}) }
    else                                  {           signals.push({l:'Ichimoku', v:'☁ dentro',n:'Dentro la nuvola',    t:'neutral'}) }
  }
  // OBV
  if (obv) {
    if      (obv.signal==='bullish') { score+=1; signals.push({l:'OBV', v:'↑ crescente', n:'Volume confermante', t:'buy'})  }
    else if (obv.signal==='bearish') { score-=1; signals.push({l:'OBV', v:'↓ calante',   n:'Volume divergente',  t:'sell'}) }
  }
  // VWAP
  if (vwap) {
    if      (vwap.aboveVwap) { score+=1; signals.push({l:'VWAP', v:`+${vwap.diff}%`, n:'Sopra VWAP',  t:'buy'})  }
    else                     { score-=1; signals.push({l:'VWAP', v:`${vwap.diff}%`,  n:'Sotto VWAP', t:'sell'}) }
  }
  // 52W position
  if (high52 && low52) {
    const pos = (current-low52)/((high52-low52)||1)
    if      (pos < 0.15) { score+=2; signals.push({l:'52W', v:`${(pos*100).toFixed(0)}%`, n:'Vicino ai minimi', t:'buy'})  }
    else if (pos > 0.90) { score-=1; signals.push({l:'52W', v:`${(pos*100).toFixed(0)}%`, n:'Vicino ai massimi',t:'sell'}) }
  }
  // Day change spike
  if (change >  4) { score-=1; signals.push({l:'∆Day', v:`+${change?.toFixed(1)}%`, n:'Spike rialzista', t:'sell'}) }
  if (change < -4) { score+=1; signals.push({l:'∆Day', v:`${change?.toFixed(1)}%`,  n:'Spike ribassista',t:'buy'})  }

  const clamped   = Math.max(-16, Math.min(16, score))
  const signal    = clamped >= 4 ? 'BUY' : clamped <= -4 ? 'SELL' : 'HOLD'
  const confidence= Math.round(50 + (clamped/16)*42)
  const shortTerm = rsi != null ? (rsi<35?'BUY':rsi>68?'SELL':'HOLD') : null
  const longTerm  = goldenCross != null ? (goldenCross&&trendUp?'BUY':!goldenCross?'SELL':'HOLD') : null

  return { signal, score:clamped, confidence, signals, shortTerm, longTerm }
}
