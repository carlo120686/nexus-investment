// ============================================================
// AI SERVICE — Claude (Anthropic)
// COMPLETAMENTE OPZIONALE. Se la chiave non è presente,
// l'app funziona normalmente senza AI.
// ============================================================

let _aiKey = ''
export const setAnthropicKey = (k) => { _aiKey = k; localStorage.setItem('nexus_anthropic', k) }
export const getAnthropicKey = () => _aiKey || localStorage.getItem('nexus_anthropic') || ''
export const isAIAvailable = () => !!getAnthropicKey()

async function callClaude(systemPrompt, userPrompt) {
  const key = getAnthropicKey()
  if (!key) throw new Error('AI non configurata')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `AI HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.content[0].text
}

export async function analyzeAsset({ symbol, name, type, quote, indicators, horizon }) {
  const system = `Sei un analista finanziario senior specializzato in ${type}. 
Profilo investitore: avanzato, rischio moderato.
Rispondi SEMPRE in italiano con analisi concisa ma densa di contenuto.
Struttura la risposta con sezioni: SEGNALE, TECNICO, MACRO/GEOPOLITICA, RISCHI, CONCLUSIONE.
Sii diretto e professionale. Usa bullet points. Max 400 parole.`

  const user = `Analizza ${name} (${symbol}) per orizzonte ${horizon}.

Dati tecnici attuali:
- Prezzo: ${quote?.current?.toFixed(2)}
- Variazione 24h: ${quote?.change?.toFixed(2)}%
- RSI(14): ${indicators?.rsi?.toFixed(1) || 'N/D'}
- SMA20: ${indicators?.sma20?.toFixed(2) || 'N/D'} | SMA50: ${indicators?.sma50?.toFixed(2) || 'N/D'}
- MACD: ${indicators?.macdLine > 0 ? 'Bullish' : 'Bearish'}
- Bollinger %B: ${indicators?.bbPct || 'N/D'}%
- Cross: ${indicators?.goldenCross ? 'Golden Cross' : 'Death Cross'}
- Segnale tecnico: ${indicators?.signal} (score: ${indicators?.score}, confidence: ${indicators?.confidence}%)
- 52W: ${indicators?.from52Low?.toFixed(0)}% dal minimo

Fornisci analisi completa includendo contesto macro e geopolitico attuale.`

  return callClaude(system, user)
}

export async function analyzePortfolio(holdings) {
  const system = `Sei un gestore di portafoglio senior. Analizza il portafoglio con visione professionale.
Profilo: avanzato, rischio moderato, orizzonti misti. Risposta in italiano, max 500 parole.`

  const summary = holdings.map(h =>
    `${h.symbol}: ${h.allocation?.toFixed(1)}% del portafoglio, P&L: ${h.pnlPct?.toFixed(2)}%, segnale: ${h.signal}`
  ).join('\n')

  const user = `Portafoglio:\n${summary}\n\nValuta: rischio complessivo, diversificazione, ribilanciamento, outlook 3-6 mesi.`
  return callClaude(system, user)
}

export async function getMacroOutlook() {
  const system = `Sei un analista macro. Briefing conciso sul contesto globale. Italiano. Max 300 parole.`
  const user = `Briefing macro di oggi ${new Date().toLocaleDateString('it-IT')} per investitore con portafoglio ETF/commodity/crypto.`
  return callClaude(system, user)
}

export async function optimizePAC({ monthly, assets, horizon, riskProfile }) {
  const system = `Sei un consulente finanziario specializzato in PAC. Risposta pratica e numerica. Italiano. Max 350 parole.`
  const user = `PAC mensile: €${monthly}, orizzonte: ${horizon} anni, profilo: ${riskProfile}
Asset: ${assets.join(', ')}
Suggerisci allocazione ottimale motivando con dati storici e contesto attuale.`
  return callClaude(system, user)
}
