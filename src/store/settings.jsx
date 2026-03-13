const URL = 'https://api.anthropic.com/v1/messages'

async function claude(prompt, key, max = 800) {
  const r = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,                          // ← aggiunto
      'anthropic-version': '2023-06-01',          // ← aggiunto
      'anthropic-dangerous-allow-browser': 'true' // ← aggiunto
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: max,
      system: 'Sei un analista finanziario senior. Rispondi SOLO con JSON valido senza backtick.',
      messages: [{ role: 'user', content: prompt }]
    })
  })
  if (!r.ok) throw new Error(`Anthropic ${r.status}`)
  const d = await r.json()
  return JSON.parse(d.content.map(b => b.text || '').join('').trim())
}
