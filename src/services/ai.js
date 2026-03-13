// AI service — completamente opzionale
const WORKER = 'https://nexus-proxy.carlo-fabi86.workers.dev'

async function claude(prompt, key, max = 800) {
  const target = 'https://api.anthropic.com/v1/messages'
  const r = await fetch(`${WORKER}/?url=${encodeURIComponent(target)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: max,
      system: 'Sei un analista finanziario senior. Rispondi SOLO con JSON valido senza backtick.',
      messages: [{ role: 'user', content: prompt }]
    })
  })
  if (!r.ok) throw new Error(`Anthropic ${r.status}`)
  const d = await r.json()
  return JSON.parse(d.content.map(b => b.text || '').join('').trim())
}

export async function analyzeAsset(asset, quote, candles, signal, key) {
  if (!key) return null
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
  try {
    return await claude(`Data: ${today}
Asset: ${asset.name} (${asset.symbol}) — ${asset.type} — categoria: ${asset.cat}
Prezzo: ${quote?.current?.toFixed(2)} | Variazione: ${quote?.change?.toFixed(2)}%
RSI: ${candles?.rsi?.toFixed(1) ?? 'n/d'} | SMA20: ${candles?.sma20?.toFixed(2) ?? 'n/d'} | SMA50: ${candles?.sma50?.toFixed(2) ?? 'n/d'}
Golden Cross: ${candles?.goldenCross ? 'SÌ' : 'NO'} | MACD: ${candles?.macd?.signal ?? 'n/d'} | BB%: ${candles?.bb?.pct ?? 'n/d'}%
Segnale tecnico: ${signal?.signal ?? 'n/d'} (${signal?.confidence ?? '-'}%)
Analizza considerando contesto macro e geopolitico attuale (${today}).
{"short_signal":"BUY"|"HOLD"|"SELL","long_signal":"BUY"|"HOLD"|"SELL","short_confidence":<40-92>,"long_confidence":<40-92>,"short_rationale":"<2-3 frasi>","long_rationale":"<2-3 frasi>","geopolitical":"<2-3 frasi>","macro":"<2-3 frasi>","risks":["<r1>","<r2>","<r3>"],"opportunities":["<o1>","<o2>"],"pac_suggestion":"<consiglio PAC>"}`, key)
  } catch (e) { console.warn('AI asset failed:', e.message); return null }
}

export async function analyzePortfolio(holdings, key) {
  if (!key || !holdings?.length) return null
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
  const summary = holdings.map(h => `${h.name}: ${h.quantity}u @ €${h.avgPrice} → €${((h.currentPrice || h.avgPrice) * h.quantity).toFixed(0)} (${h.pnlPct?.toFixed(1) ?? 0}%)`).join('\n')
  try {
    return await claude(`Data: ${today}\nPortafoglio:\n${summary}\n\nProfilo: moderato, esperienza avanzata.\n{"overall_health":"excellent"|"good"|"neutral"|"poor","diversification_score":<0-100>,"risk_score":<0-100>,"summary":"<3-4 frasi>","rebalancing":"<consiglio>","alerts":["<a1>","<a2>"],"suggestions":["<s1>","<s2>","<s3>"]}`, key, 600)
  } catch (e) { return null }
}
