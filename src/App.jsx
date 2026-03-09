import { useState, useEffect } from 'react'
import { ASSETS } from './services/assets'
import {
  getCryptoCandles, getCryptoQuote,
  getCommodityCandles, getCommodityQuote,
  getEtfCandles, getEtfQuote,
  calcIndicators, getFinnhubKey, setFinnhubKey
} from './services/market'
import {
  analyzeAsset, analyzePortfolio, getMacroOutlook, optimizePAC,
  isAIAvailable, setAnthropicKey, getAnthropicKey
} from './services/ai'
import './App.css'

const fmt = (n, d = 2) => n != null ? n.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—'
const fmtPct = (n) => n != null ? `${n > 0 ? '+' : ''}${fmt(n)}%` : '—'

function SignalBadge({ signal, confidence }) {
  const color = signal === 'BUY' ? '#00e59a' : signal === 'SELL' ? '#ff3d5a' : '#f0a500'
  return <span className="signal-badge" style={{ '--sc': color }}>{signal} {confidence ? `${confidence}%` : ''}</span>
}

function Sparkline({ data, positive }) {
  if (!data?.length) return null
  const w = 80, h = 32
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="sparkline">
      <polyline points={pts.join(' ')} fill="none" stroke={positive ? '#00e59a' : '#ff3d5a'} strokeWidth="1.5" />
    </svg>
  )
}

function AssetCard({ asset, onAnalyze, onAddPortfolio }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        let quote, candles
        if (asset.type === 'crypto') { [quote, candles] = await Promise.all([getCryptoQuote(asset.symbol), getCryptoCandles(asset.symbol)]) }
        else if (asset.type === 'commodity') { [quote, candles] = await Promise.all([getCommodityQuote(asset.symbol), getCommodityCandles(asset.symbol)]) }
        else { [quote, candles] = await Promise.all([getEtfQuote(asset.symbol), getEtfCandles(asset.symbol)]) }
        const indicators = calcIndicators(candles)
        if (!cancelled) setData({ quote, indicators })
      } catch (e) { if (!cancelled) setData({ error: e.message }) }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [asset.symbol])

  const changePos = data?.quote?.change >= 0

  return (
    <div className={`asset-card ${data?.indicators?.signal?.toLowerCase() || ''}`} onClick={() => setExpanded(e => !e)}>
      <div className="asset-card-top">
        <div className="asset-info">
          <span className="asset-symbol">{asset.symbol.replace('.MI', '')}</span>
          <span className="asset-name">{asset.name}</span>
          <span className="asset-category">{asset.category}</span>
        </div>
        <div className="asset-right">
          {loading ? <span className="loading-dot" /> : data?.error ? <span className="err" title={data.error}>ERR</span> : (
            <>
              <Sparkline data={data?.indicators?.sparkline} positive={changePos} />
              <div className="asset-price">
                <span className="price-main">{fmt(data?.quote?.current)}</span>
                <span className={`price-chg ${changePos ? 'pos' : 'neg'}`}>{fmtPct(data?.quote?.change)}</span>
              </div>
              {data?.indicators && <SignalBadge signal={data.indicators.signal} confidence={data.indicators.confidence} />}
            </>
          )}
        </div>
      </div>
      {expanded && data?.indicators && (
        <div className="asset-expanded" onClick={e => e.stopPropagation()}>
          <div className="indicators-grid">
            <div className="ind-item"><span>RSI(14)</span><strong style={{ color: data.indicators.rsi < 35 ? '#00e59a' : data.indicators.rsi > 65 ? '#ff3d5a' : '#ccc' }}>{fmt(data.indicators.rsi, 1)}</strong></div>
            <div className="ind-item"><span>SMA20</span><strong>{fmt(data.indicators.sma20)}</strong></div>
            <div className="ind-item"><span>SMA50</span><strong>{fmt(data.indicators.sma50)}</strong></div>
            <div className="ind-item"><span>MACD</span><strong style={{ color: data.indicators.macdLine > 0 ? '#00e59a' : '#ff3d5a' }}>{data.indicators.macdLine > 0 ? '▲ Bull' : '▼ Bear'}</strong></div>
            <div className="ind-item"><span>BB %B</span><strong>{data.indicators.bbPct}%</strong></div>
            <div className="ind-item"><span>Cross</span><strong style={{ color: data.indicators.goldenCross ? '#00e59a' : '#ff3d5a' }}>{data.indicators.goldenCross ? 'Golden' : 'Death'}</strong></div>
            <div className="ind-item"><span>52W Pos.</span><strong>{fmt(data.indicators.from52Low, 0)}%</strong></div>
            <div className="ind-item"><span>ATR</span><strong>{fmt(data.indicators.atr, 3)}</strong></div>
          </div>
          {asset.type === 'etf' && <div className="etf-meta"><span>TER: <strong>{asset.ter}%</strong></span><span>Tipo: <strong>{asset.acc ? 'Acc.' : 'Dist.'}</strong></span></div>}
          <div className="card-actions">
            <button className="btn-secondary" onClick={() => onAddPortfolio(asset, data.quote)}>+ Portafoglio</button>
            {isAIAvailable() && <button className="btn-ai" onClick={() => onAnalyze(asset, data.quote, data.indicators)}>🧠 Analisi AI</button>}
          </div>
        </div>
      )}
    </div>
  )
}

function PACSimulator() {
  const [monthly, setMonthly] = useState(300)
  const [years, setYears] = useState(10)
  const [rate, setRate] = useState(7)
  const [result, setResult] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  function simulate() {
    const months = years * 12, mr = rate / 100 / 12
    const fv = monthly * ((Math.pow(1 + mr, months) - 1) / mr)
    const invested = monthly * months
    setResult({ fv, invested, gain: fv - invested, gainPct: ((fv - invested) / invested) * 100 })
  }

  async function getAI() {
    setAiLoading(true)
    try { setAiResult(await optimizePAC({ monthly, assets: ['VWCE.MI', 'BTC-USD', 'GC=F'], horizon: years, riskProfile: 'moderato' })) }
    catch (e) { setAiResult('Errore: ' + e.message) }
    setAiLoading(false)
  }

  return (
    <div className="page-content">
      <h2 className="page-title">Simulatore PAC</h2>
      <div className="pac-grid">
        <div className="card-panel">
          <h3>Parametri</h3>
          <label className="field-label">Importo mensile (€)<input type="number" value={monthly} onChange={e => setMonthly(+e.target.value)} /></label>
          <label className="field-label">Orizzonte: <strong>{years} anni</strong><input type="range" min="1" max="30" value={years} onChange={e => setYears(+e.target.value)} /></label>
          <label className="field-label">Rendimento annuo: <strong>{rate}%</strong><input type="range" min="1" max="20" step="0.5" value={rate} onChange={e => setRate(+e.target.value)} /></label>
          <button className="btn-primary" onClick={simulate}>Calcola</button>
        </div>
        {result && (
          <div className="card-panel">
            <h3>Risultato</h3>
            <div className="pac-stat"><span>Versato</span><strong>€{fmt(result.invested)}</strong></div>
            <div className="pac-stat"><span>Valore finale</span><strong className="pos">€{fmt(result.fv)}</strong></div>
            <div className="pac-stat"><span>Guadagno</span><strong className="pos">+€{fmt(result.gain)} ({fmt(result.gainPct)}%)</strong></div>
            <div className="pac-bar-wrap"><div className="pac-bar-fill" style={{ width: `${Math.min(100,(result.invested/result.fv)*100)}%` }} /></div>
            <p className="setting-note">Simulazione a tasso fisso. I mercati sono variabili.</p>
          </div>
        )}
        {isAIAvailable() && (
          <div className="card-panel">
            <h3>🧠 Ottimizzazione AI</h3>
            <p className="setting-desc">Allocazione ottimale mensile su ETF, Gold, Crypto</p>
            <button className="btn-ai" onClick={getAI} disabled={aiLoading}>{aiLoading ? 'Analisi...' : 'Ottimizza'}</button>
            {aiResult && <div className="ai-text">{aiResult}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function Portfolio() {
  const [holdings, setHoldings] = useState(() => { try { return JSON.parse(localStorage.getItem('nexus_portfolio') || '[]') } catch { return [] } })
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ symbol: '', name: '', qty: '', buyPrice: '', type: 'etf' })

  function save(d) { setHoldings(d); localStorage.setItem('nexus_portfolio', JSON.stringify(d)) }
  function add() { save([...holdings, { ...form, qty: +form.qty, buyPrice: +form.buyPrice, id: Date.now() }]); setAdding(false); setForm({ symbol: '', name: '', qty: '', buyPrice: '', type: 'etf' }) }
  function remove(id) { save(holdings.filter(h => h.id !== id)) }
  const totalInvested = holdings.reduce((s, h) => s + h.qty * h.buyPrice, 0)

  async function getAI() {
    setAiLoading(true)
    try { setAiAnalysis(await analyzePortfolio(holdings.map(h => ({ ...h, signal: 'HOLD', pnlPct: 0, allocation: totalInvested ? (h.qty * h.buyPrice / totalInvested) * 100 : 0 })))) }
    catch (e) { setAiAnalysis('Errore: ' + e.message) }
    setAiLoading(false)
  }

  return (
    <div className="page-content">
      <h2 className="page-title">Portafoglio</h2>
      <div className="portfolio-header">
        <div className="portfolio-stat"><span>Investito</span><strong>€{fmt(totalInvested)}</strong></div>
        <div className="portfolio-stat"><span>Posizioni</span><strong>{holdings.length}</strong></div>
        <div className="port-actions">
          <button className="btn-secondary" onClick={() => setAdding(true)}>+ Aggiungi</button>
          {isAIAvailable() && holdings.length > 0 && <button className="btn-ai" onClick={getAI} disabled={aiLoading}>{aiLoading ? '...' : '🧠 Analisi'}</button>}
        </div>
      </div>
      {adding && (
        <div className="card-panel" style={{ marginBottom: '1rem' }}>
          <h3>Nuovo asset</h3>
          <div className="form-row">
            <input placeholder="Simbolo" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} />
            <input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input type="number" placeholder="Quantità" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} />
            <input type="number" placeholder="Prezzo acquisto" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="etf">ETF</option><option value="commodity">Commodity</option><option value="crypto">Crypto</option></select>
            <button className="btn-primary" onClick={add}>Salva</button>
            <button className="btn-ghost" onClick={() => setAdding(false)}>Annulla</button>
          </div>
        </div>
      )}
      <div className="holdings-list">
        {holdings.length === 0 && <p className="empty-state">Nessuna posizione. Aggiungi dal mercato o manualmente.</p>}
        {holdings.map(h => (
          <div key={h.id} className="holding-row">
            <div className="holding-left"><strong>{h.symbol}</strong><span className="asset-name">{h.name}</span></div>
            <div className="holding-details">
              <span>{h.qty} pz × €{fmt(h.buyPrice)}</span>
              <strong>€{fmt(h.qty * h.buyPrice)}</strong>
              <span className="asset-category">{totalInvested ? fmt((h.qty * h.buyPrice / totalInvested) * 100, 1) : 0}%</span>
            </div>
            <button className="btn-remove" onClick={() => remove(h.id)}>✕</button>
          </div>
        ))}
      </div>
      {aiAnalysis && <div className="card-panel ai-panel"><h3>🧠 Analisi AI Portafoglio</h3><div className="ai-text">{aiAnalysis}</div></div>}
    </div>
  )
}

function Alerts() {
  const [alerts, setAlerts] = useState(() => { try { return JSON.parse(localStorage.getItem('nexus_alerts') || '[]') } catch { return [] } })
  const [form, setForm] = useState({ symbol: '', name: '', price: '', direction: 'above' })
  function save(d) { setAlerts(d); localStorage.setItem('nexus_alerts', JSON.stringify(d)) }
  function add() { save([...alerts, { ...form, price: +form.price, id: Date.now() }]); setForm({ symbol: '', name: '', price: '', direction: 'above' }) }
  function remove(id) { save(alerts.filter(a => a.id !== id)) }
  return (
    <div className="page-content">
      <h2 className="page-title">Alert Prezzi</h2>
      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Nuovo Alert</h3>
        <div className="form-row">
          <input placeholder="Simbolo" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} />
          <input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input type="number" placeholder="Prezzo target" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}><option value="above">Sopra</option><option value="below">Sotto</option></select>
          <button className="btn-primary" onClick={add}>+ Aggiungi</button>
        </div>
      </div>
      <div className="alerts-list">
        {alerts.length === 0 && <p className="empty-state">Nessun alert configurato.</p>}
        {alerts.map(a => (
          <div key={a.id} className="alert-row">
            <span className="asset-symbol">{a.symbol}</span><span>{a.name}</span>
            <span className={a.direction === 'above' ? 'pos' : 'neg'}>{a.direction === 'above' ? '▲' : '▼'} €{fmt(a.price)}</span>
            <button className="btn-remove" onClick={() => remove(a.id)}>✕</button>
          </div>
        ))}
      </div>
      <p className="setting-note" style={{ marginTop: '1rem' }}>⚠️ Alert locali — richiedono app aperta per funzionare.</p>
    </div>
  )
}

function Settings() {
  const [fhKey, setFhKeyState] = useState(getFinnhubKey())
  const [aiKey, setAiKeyState] = useState(getAnthropicKey())
  const [saved, setSaved] = useState(false)
  function save() { setFinnhubKey(fhKey); setAnthropicKey(aiKey); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  return (
    <div className="page-content">
      <h2 className="page-title">Impostazioni</h2>
      <div className="settings-grid">
        <div className="card-panel">
          <h3>🔑 Finnhub API Key</h3>
          <p className="setting-desc">Per dati ETF real-time. Gratuita su <a href="https://finnhub.io/register" target="_blank" rel="noreferrer" style={{ color: '#00cfa8' }}>finnhub.io</a></p>
          <input type="password" value={fhKey} onChange={e => setFhKeyState(e.target.value)} placeholder="Inserisci Finnhub API key..." />
          <p className="setting-note">Crypto e Commodity funzionano senza questa chiave (Binance + Yahoo).</p>
        </div>
        <div className="card-panel">
          <h3>🧠 Anthropic API Key <span className="optional-badge">Opzionale</span></h3>
          <p className="setting-desc">Abilita analisi AI avanzata. Tutte le funzionalità base funzionano senza.</p>
          <input type="password" value={aiKey} onChange={e => setAiKeyState(e.target.value)} placeholder="sk-ant-..." />
          <div className="ai-status"><span className={`status-dot ${aiKey ? 'active' : 'inactive'}`} />{aiKey ? 'AI attiva — analisi complete disponibili' : 'AI disattivata — funzionalità base disponibili'}</div>
        </div>
        <button className="btn-primary" style={{ gridColumn: '1/-1' }} onClick={save}>{saved ? '✓ Salvato!' : 'Salva chiavi'}</button>
      </div>
    </div>
  )
}

function AIAnalyst() {
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('etf')
  const [horizon, setHorizon] = useState('medio termine (3-12 mesi)')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [macroResult, setMacroResult] = useState(null)
  const [macroLoading, setMacroLoading] = useState(false)

  async function analyze() {
    setLoading(true); setResult(null)
    try {
      let quote, candles
      if (type === 'crypto') { [quote, candles] = await Promise.all([getCryptoQuote(symbol), getCryptoCandles(symbol)]) }
      else if (type === 'commodity') { [quote, candles] = await Promise.all([getCommodityQuote(symbol), getCommodityCandles(symbol)]) }
      else { [quote, candles] = await Promise.all([getEtfQuote(symbol), getEtfCandles(symbol)]) }
      setResult(await analyzeAsset({ symbol, name: name || symbol, type, quote, indicators: calcIndicators(candles), horizon }))
    } catch (e) { setResult('Errore: ' + e.message) }
    setLoading(false)
  }

  async function getMacro() {
    setMacroLoading(true)
    try { setMacroResult(await getMacroOutlook()) } catch (e) { setMacroResult('Errore: ' + e.message) }
    setMacroLoading(false)
  }

  if (!isAIAvailable()) return (
    <div className="page-content">
      <h2 className="page-title">AI Analyst</h2>
      <div className="card-panel ai-disabled">
        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠</p>
        <p>Funzionalità AI non attiva.</p>
        <p>Inserisci la tua Anthropic API key in <strong>Impostazioni</strong> per abilitare analisi avanzate, briefing macro e ottimizzazione PAC.</p>
        <p className="setting-note">Mercato, Portafoglio, PAC e Alert funzionano sempre senza AI.</p>
      </div>
    </div>
  )

  return (
    <div className="page-content">
      <h2 className="page-title">AI Analyst</h2>
      <div className="analyst-grid">
        <div className="card-panel">
          <h3>Analisi Asset</h3>
          <div className="form-row">
            <input placeholder="Simbolo (es. VWCE.MI, BTC-USD, GC=F)" value={symbol} onChange={e => setSymbol(e.target.value)} />
            <input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-row">
            <select value={type} onChange={e => setType(e.target.value)}><option value="etf">ETF</option><option value="commodity">Commodity</option><option value="crypto">Crypto</option></select>
            <select value={horizon} onChange={e => setHorizon(e.target.value)}>
              <option value="breve termine (1-4 settimane)">Breve termine</option>
              <option value="medio termine (3-12 mesi)">Medio termine</option>
              <option value="lungo termine (1-3 anni)">Lungo termine</option>
            </select>
            <button className="btn-ai" onClick={analyze} disabled={loading || !symbol}>{loading ? 'Analisi...' : '🧠 Analizza'}</button>
          </div>
          {result && <div className="ai-text">{result}</div>}
        </div>
        <div className="card-panel">
          <h3>🌍 Briefing Macro</h3>
          <p className="setting-desc">Contesto macro e geopolitico aggiornato — Fed, BCE, inflazione, commodity, crypto.</p>
          <button className="btn-ai" onClick={getMacro} disabled={macroLoading}>{macroLoading ? 'Caricamento...' : 'Genera Briefing'}</button>
          {macroResult && <div className="ai-text">{macroResult}</div>}
        </div>
      </div>
    </div>
  )
}

function AIModal({ asset, quote, indicators, onClose }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [horizon, setHorizon] = useState('medio termine (3-12 mesi)')

  useEffect(() => { doAnalyze('medio termine (3-12 mesi)') }, [])

  async function doAnalyze(h) {
    setLoading(true); setResult(null)
    try { setResult(await analyzeAsset({ symbol: asset.symbol, name: asset.name, type: asset.type, quote, indicators, horizon: h })) }
    catch (e) { setResult('Errore: ' + e.message) }
    setLoading(false)
  }

  const horizons = ['breve termine (1-4 settimane)', 'medio termine (3-12 mesi)', 'lungo termine (1-3 anni)']
  const labels = ['Breve', 'Medio', 'Lungo']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🧠 {asset.name} <span className="asset-symbol">{asset.symbol}</span></h3>
          <div className="modal-tabs">
            {horizons.map((h, i) => (
              <button key={h} className={`tab-btn ${horizon === h ? 'active' : ''}`} onClick={() => { setHorizon(h); doAnalyze(h) }}>{labels[i]}</button>
            ))}
          </div>
          <button className="btn-remove" onClick={onClose} style={{ marginLeft: 'auto' }}>✕</button>
        </div>
        <div className="modal-body">
          {loading ? <div className="loading-spinner"><div className="spinner" />Analisi AI in corso...</div> : <div className="ai-text">{result}</div>}
        </div>
      </div>
    </div>
  )
}

function MarketTab({ onAnalyze, onAddPortfolio }) {
  const [tab, setTab] = useState('etf')
  const [search, setSearch] = useState('')
  const lists = { etf: ASSETS.etf.map(a => ({ ...a, type: 'etf' })), commodities: ASSETS.commodities.map(a => ({ ...a, type: 'commodity' })), crypto: ASSETS.crypto.map(a => ({ ...a, type: 'crypto' })) }
  const filtered = lists[tab].filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.symbol.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="page-content">
      <h2 className="page-title">Mercato</h2>
      <div className="market-controls">
        <div className="tab-group">
          {[['etf', 'ETF'], ['commodities', 'Materie Prime'], ['crypto', 'Crypto']].map(([t, l]) => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>
          ))}
        </div>
        <input className="search-input" placeholder="Cerca asset..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="assets-list">{filtered.map(a => <AssetCard key={a.symbol} asset={a} onAnalyze={onAnalyze} onAddPortfolio={onAddPortfolio} />)}</div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('market')
  const [aiModal, setAiModal] = useState(null)
  const [time, setTime] = useState(new Date())

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t) }, [])

  function handleAddPortfolio(asset, quote) {
    const portfolio = JSON.parse(localStorage.getItem('nexus_portfolio') || '[]')
    if (portfolio.find(h => h.symbol === asset.symbol)) return
    portfolio.push({ id: Date.now(), symbol: asset.symbol, name: asset.name, type: asset.type, qty: 1, buyPrice: quote?.current || 0 })
    localStorage.setItem('nexus_portfolio', JSON.stringify(portfolio))
  }

  const navItems = [
    { id: 'market', icon: '📊', label: 'Mercato' },
    { id: 'analyst', icon: '🧠', label: 'AI' },
    { id: 'portfolio', icon: '💼', label: 'Portfolio' },
    { id: 'pac', icon: '📈', label: 'PAC' },
    { id: 'alerts', icon: '⚡', label: 'Alert' },
    { id: 'settings', icon: '⚙️', label: 'Config' },
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">NEXUS</span>
          <span className="logo-sub">Investment Intelligence</span>
        </div>
        <div className="header-right">
          {isAIAvailable() && <span className="ai-badge">AI ON</span>}
          <span className="clock">{time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </header>
      <nav className="app-nav">
        {navItems.map(n => (
          <button key={n.id} className={`nav-btn ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
      </nav>
      <main className="app-main">
        {page === 'market' && <MarketTab onAnalyze={setAiModal} onAddPortfolio={handleAddPortfolio} />}
        {page === 'analyst' && <AIAnalyst />}
        {page === 'portfolio' && <Portfolio />}
        {page === 'pac' && <PACSimulator />}
        {page === 'alerts' && <Alerts />}
        {page === 'settings' && <Settings />}
      </main>
      {aiModal && <AIModal asset={aiModal.asset} quote={aiModal.quote} indicators={aiModal.indicators} onClose={() => setAiModal(null)} />}
    </div>
  )
}
