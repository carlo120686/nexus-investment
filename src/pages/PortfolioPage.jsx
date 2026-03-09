import { useState, useEffect } from 'react'
import { useStore } from '../store/index.jsx'
import { ALL_ASSETS } from '../services/assets.js'
import { loadPortfolio, savePortfolio, addHolding, removeHolding, updatePrices, portfolioStats } from '../services/portfolio.js'
import { fetchQuote } from '../services/finnhub.js'
import { analyzePortfolio } from '../services/ai.js'
import SignalBadge from '../components/SignalBadge.jsx'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import styles from './PortfolioPage.module.css'

const COLORS = ['#3b82f6', '#10d98a', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4']

export default function PortfolioPage() {
  const { settings, aiActive } = useStore()
  const [holdings, setHoldings] = useState(() => loadPortfolio())
  const [showAdd, setShowAdd] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Add form state
  const [form, setForm] = useState({ assetId: '', quantity: '', avgPrice: '', date: '' })

  const stats = portfolioStats(holdings)

  useEffect(() => { savePortfolio(holdings) }, [holdings])

  const refreshPrices = async () => {
    if (!settings.finnhubKey || !holdings.length) return
    setRefreshing(true)
    const quotes = {}
    await Promise.allSettled(holdings.map(async h => {
      const asset = ALL_ASSETS.find(a => a.id === h.id)
      if (asset) {
        const q = await fetchQuote(asset.symbol, settings.finnhubKey)
        if (q.ok) quotes[h.id] = q
      }
    }))
    setHoldings(prev => updatePrices(prev, quotes))
    setRefreshing(false)
  }

  const handleAI = async () => {
    if (!aiActive || !holdings.length) return
    setAiLoading(true)
    const result = await analyzePortfolio(holdings, settings.anthropicKey)
    setAiAnalysis(result)
    setAiLoading(false)
  }

  const handleAdd = () => {
    const asset = ALL_ASSETS.find(a => a.id === form.assetId)
    if (!asset || !form.quantity || !form.avgPrice) return
    const updated = addHolding(holdings, asset, parseFloat(form.quantity), parseFloat(form.avgPrice), form.date)
    setHoldings(updated)
    setForm({ assetId: '', quantity: '', avgPrice: '', date: '' })
    setShowAdd(false)
  }

  const handleRemove = (id) => {
    setHoldings(removeHolding(holdings, id))
  }

  const pieData = Object.entries(stats.byType || {}).map(([name, value]) => ({ name, value: Math.round(value) }))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Portfolio</h1>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={refreshPrices} disabled={refreshing}>
            {refreshing ? '⟳ Aggiornamento...' : '⟳ Aggiorna prezzi'}
          </button>
          <button className={styles.btnPrimary} onClick={() => setShowAdd(s => !s)}>
            {showAdd ? '✕ Chiudi' : '+ Aggiungi'}
          </button>
        </div>
      </div>

      {/* Stats summary */}
      {holdings.length > 0 && (
        <div className={styles.stats}>
          <StatCard label="Valore totale" value={`€ ${stats.totalValue.toLocaleString('it-IT')}`} />
          <StatCard label="Investito" value={`€ ${stats.totalCost.toLocaleString('it-IT')}`} />
          <StatCard
            label="P&L totale"
            value={`${stats.totalPnl >= 0 ? '+' : ''}€ ${stats.totalPnl.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`}
            sub={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnlPct.toFixed(2)}%`}
            color={stats.totalPnl >= 0 ? 'var(--buy)' : 'var(--sell)'}
          />
          <StatCard label="Posizioni" value={holdings.length} />
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className={styles.addForm}>
          <div className="label-row"><span className="label">Aggiungi posizione</span></div>
          <div className={styles.formGrid}>
            <select
              className={styles.select}
              value={form.assetId}
              onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
            >
              <option value="">Seleziona asset...</option>
              {ALL_ASSETS.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.symbol.split(':')[0]})</option>
              ))}
            </select>
            <input className={styles.input} type="number" placeholder="Quantità" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            <input className={styles.input} type="number" placeholder="Prezzo medio €" value={form.avgPrice} onChange={e => setForm(f => ({ ...f, avgPrice: e.target.value }))} />
            <input className={styles.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <button className={styles.btnPrimary} onClick={handleAdd}>Aggiungi</button>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {/* Holdings list */}
        <div className={styles.holdingsList}>
          {holdings.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>◉</div>
              <div>Nessuna posizione nel portfolio</div>
              <div style={{ color: 'var(--muted)', fontSize: 11 }}>Aggiungi i tuoi investimenti per tracciarli</div>
            </div>
          )}
          {holdings.map(h => (
            <HoldingRow key={h.id} holding={h} onRemove={() => handleRemove(h.id)} />
          ))}
        </div>

        {/* Chart */}
        {pieData.length > 1 && (
          <div className={styles.chartBox}>
            <div className="label-row"><span className="label">Allocazione</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `€ ${v.toLocaleString('it-IT')}`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              {pieData.map((d, i) => (
                <div key={d.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }} />
                  <span>{d.name}</span>
                  <span className={styles.legendPct}>{((d.value / stats.totalValue) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Portfolio Analysis */}
      {aiActive && holdings.length > 0 && (
        <div className={styles.aiSection}>
          <div className={styles.aiHeader}>
            <span className="label">◈ Analisi AI portafoglio</span>
            <button className={styles.btn} onClick={handleAI} disabled={aiLoading}>
              {aiLoading ? '⟳ Analisi in corso...' : '▶ Analizza portafoglio'}
            </button>
          </div>
          {aiAnalysis && (
            <div className={styles.aiContent}>
              <div className={styles.aiScores}>
                <ScoreBadge label="Salute" value={aiAnalysis.overall_health} />
                <ScoreBadge label="Diversificazione" value={`${aiAnalysis.diversification_score}/100`} />
                <ScoreBadge label="Rischio" value={`${aiAnalysis.risk_score}/100`} />
              </div>
              {aiAnalysis.summary && <p className={styles.aiText}>{aiAnalysis.summary}</p>}
              {aiAnalysis.rebalancing && (
                <div className={styles.rebalancing}>
                  <strong>Ribilanciamento consigliato:</strong> {aiAnalysis.rebalancing}
                </div>
              )}
              {aiAnalysis.suggestions?.length > 0 && (
                <ul className={styles.suggestions}>
                  {aiAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HoldingRow({ holding, onRemove }) {
  const pnl = holding.pnl ?? 0
  const pnlPct = holding.pnlPct ?? 0
  return (
    <div className={styles.holdingRow}>
      <div className={styles.holdingLeft}>
        <div className={styles.holdingName}>{holding.name}</div>
        <div className={styles.holdingMeta}>{holding.symbol.split(':')[0]} · {holding.quantity} unità · avg €{holding.avgPrice.toFixed(2)}</div>
      </div>
      <div className={styles.holdingRight}>
        <div className={styles.holdingValue}>€ {((holding.currentPrice || holding.avgPrice) * holding.quantity).toLocaleString('it-IT', { maximumFractionDigits: 0 })}</div>
        <div className={`${styles.holdingPnl} ${pnl >= 0 ? styles.up : styles.down}`}>
          {pnl >= 0 ? '+' : ''}€{pnl.toFixed(0)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
        </div>
      </div>
      <button className={styles.removeBtn} onClick={onRemove} title="Rimuovi">✕</button>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={color ? { color } : {}}>{value}</div>
      {sub && <div className={styles.statSub} style={color ? { color } : {}}>{sub}</div>}
    </div>
  )
}

function ScoreBadge({ label, value }) {
  return (
    <div className={styles.scoreBadge}>
      <div className={styles.scoreLabel}>{label}</div>
      <div className={styles.scoreVal}>{value}</div>
    </div>
  )
}
