const BASE = 'https://finnhub.io/api/v1'

async function get(path, key) {
  const r = await fetch(`${BASE}${path}&token=${key}`)
  if (!r.ok) throw new Error(`Finnhub ${r.status}`)
  return r.json()
}

export async function fetchQuote(symbol, key) {
  try {
    const d = await get(`/quote?symbol=${encodeURIComponent(symbol)}`, key)
    if (!d.c) return { ok: false, error: 'No data' }
    return { ok:true, current:d.c, change:d.dp, high:d.h, low:d.l, open:d.o, prevClose:d.pc }
  } catch(e) { return { ok:false, error:e.message } }
}

export async function fetchCandles(symbol, key, days=90) {
  try {
    const to   = Math.floor(Date.now()/1000)
    const from = to - days*86400
    const d    = await get(`/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}`, key)
    if (d.s !== 'ok' || !d.c?.length) return { ok:false, error:'No candles' }

    const closes = d.c
    const highs  = d.h
    const lows   = d.l
    const volumes= d.v
    const cur    = closes[closes.length-1]
    const sma20  = closes.length>=20 ? avg(closes.slice(-20)) : null
    const sma50  = closes.length>=50 ? avg(closes.slice(-50)) : null

    return {
      ok:true, closes,
      sparkline: closes.slice(-30).map((v,i)=>({i,v})),
      sma20, sma50,
      rsi:  calcRSI(closes),
      macd: calcMACD(closes),
      bb:   calcBB(closes),
      atr:  calcATR(highs,lows,closes),
      trendUp:    sma20 ? cur>sma20 : null,
      goldenCross:sma20&&sma50 ? sma20>sma50 : null,
      high52: Math.max(...closes.slice(-252)),
      low52:  Math.min(...closes.slice(-252)),
      avgVol: avg((volumes||[]).slice(-20)),
    }
  } catch(e) { return { ok:false, error:e.message } }
}

export function calcSignal(quote, candles) {
  if (!candles?.ok || !quote?.ok) return null
  const { rsi,trendUp,goldenCross,macd,bb,high52,low52 } = candles
  const { current,changePct } = quote
  let score=0, signals=[]

  if (rsi!=null) {
    if      (rsi<28) { score+=3; signals.push({l:'RSI',v:rsi.toFixed(0),n:'Ipervenduto estremo',t:'buy'}) }
    else if (rsi<38) { score+=2; signals.push({l:'RSI',v:rsi.toFixed(0),n:'Ipervenduto',t:'buy'}) }
    else if (rsi<48) { score+=1; signals.push({l:'RSI',v:rsi.toFixed(0),n:'Neutro-debole',t:'neutral'}) }
    else if (rsi<58) {           signals.push({l:'RSI',v:rsi.toFixed(0),n:'Neutro',t:'neutral'}) }
    else if (rsi<68) { score-=1; signals.push({l:'RSI',v:rsi.toFixed(0),n:'Neutro-forte',t:'neutral'}) }
    else if (rsi<78) { score-=2; signals.push({l:'RSI',v:rsi.toFixed(0),n:'Ipercomprato',t:'sell'}) }
    else             { score-=3; signals.push({l:'RSI',v:rsi.toFixed(0),n:'Ipercomprato estremo',t:'sell'}) }
  }
  if (trendUp!=null) {
    if (trendUp) { score+=1; signals.push({l:'SMA20',v:candles.sma20?.toFixed(2),n:'Prezzo sopra media',t:'buy'}) }
    else         { score-=1; signals.push({l:'SMA20',v:candles.sma20?.toFixed(2),n:'Prezzo sotto media',t:'sell'}) }
  }
  if (goldenCross!=null) {
    if (goldenCross) { score+=2; signals.push({l:'Cross',v:'☀',n:'Golden cross',t:'buy'}) }
    else             { score-=2; signals.push({l:'Cross',v:'☽',n:'Death cross',t:'sell'}) }
  }
  if (macd) {
    if (macd.signal==='bullish'&&macd.histogram>0) { score+=2; signals.push({l:'MACD',v:'↑↑',n:'Momentum rialzista',t:'buy'}) }
    else if (macd.signal==='bullish')              { score+=1; signals.push({l:'MACD',v:'↑',n:'Incrocio bullish',t:'buy'}) }
    else if (macd.signal==='bearish'&&macd.histogram<0) { score-=2; signals.push({l:'MACD',v:'↓↓',n:'Momentum ribassista',t:'sell'}) }
    else                                           { score-=1; signals.push({l:'MACD',v:'↓',n:'Incrocio bearish',t:'sell'}) }
  }
  if (bb) {
    if      (bb.pct<10)  { score+=2; signals.push({l:'BB',v:`${bb.pct}%`,n:'Sotto banda inf.',t:'buy'}) }
    else if (bb.pct<25)  { score+=1; signals.push({l:'BB',v:`${bb.pct}%`,n:'Zona bassa',t:'buy'}) }
    else if (bb.pct>90)  { score-=2; signals.push({l:'BB',v:`${bb.pct}%`,n:'Sopra banda sup.',t:'sell'}) }
    else if (bb.pct>75)  { score-=1; signals.push({l:'BB',v:`${bb.pct}%`,n:'Zona alta',t:'sell'}) }
    else                 {           signals.push({l:'BB',v:`${bb.pct}%`,n:'Centro banda',t:'neutral'}) }
    if (bb.squeeze)      {           signals.push({l:'Squeeze',v:'⚡',n:'Breakout imminente',t:'neutral'}) }
  }
  if (high52&&low52) {
    const pos=(current-low52)/(high52-low52)
    if      (pos<0.15) { score+=2; signals.push({l:'52W',v:`${(pos*100).toFixed(0)}%`,n:'Vicino ai minimi',t:'buy'}) }
    else if (pos>0.90) { score-=1; signals.push({l:'52W',v:`${(pos*100).toFixed(0)}%`,n:'Vicino ai massimi',t:'sell'}) }
  }
  if (changePct>3)       { score-=1; signals.push({l:'∆Day',v:`+${changePct?.toFixed(1)}%`,n:'Spike rialzista',t:'sell'}) }
  else if (changePct<-3) { score+=1; signals.push({l:'∆Day',v:`${changePct?.toFixed(1)}%`,n:'Spike ribassista',t:'buy'}) }

  const signal = score>=3?'BUY':score<=-3?'SELL':'HOLD'
  const confidence = Math.round(50+(Math.max(-12,Math.min(12,score))/12)*42)
  const shortTerm = rsi!=null?(rsi<35?'BUY':rsi>68?'SELL':'HOLD'):null
  const longTerm  = goldenCross!=null?(goldenCross&&trendUp?'BUY':!goldenCross?'SELL':'HOLD'):null

  return { signal, score, confidence, signals, shortTerm, longTerm }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const avg = a => a.reduce((s,v)=>s+v,0)/a.length

function calcRSI(c,p=14) {
  if(c.length<p+1) return null
  let g=0,l=0
  for(let i=c.length-p;i<c.length;i++){const d=c[i]-c[i-1];d>0?g+=d:l+=Math.abs(d)}
  return 100-100/(1+g/(l||0.001))
}
function calcEMA(c,p){const k=2/(p+1);let e=avg(c.slice(0,p));for(let i=p;i<c.length;i++)e=c[i]*k+e*(1-k);return e}
function calcMACD(c){
  if(c.length<26)return null
  const ml=calcEMA(c,12)-calcEMA(c,26)
  const sl=calcEMA(c.slice(0,-1),12)-calcEMA(c.slice(0,-1),26)
  return{macdLine:ml,signalLine:sl,histogram:ml-sl,signal:ml>sl?'bullish':'bearish'}
}
function calcBB(c,p=20){
  if(c.length<p)return null
  const sl=c.slice(-p),m=avg(sl)
  const std=Math.sqrt(sl.reduce((s,v)=>s+(v-m)**2,0)/p)
  const u=m+2*std,l=m-2*std,cur=c[c.length-1]
  return{upper:u,lower:l,mean:m,pct:Math.round((cur-l)/((u-l)||1)*100),squeeze:(u-l)/m<0.04}
}
function calcATR(h,l,c,p=14){
  if(h.length<p+1)return null
  const trs=[]
  for(let i=1;i<h.length;i++)trs.push(Math.max(h[i]-l[i],Math.abs(h[i]-c[i-1]),Math.abs(l[i]-c[i-1])))
  return avg(trs.slice(-p))
}
