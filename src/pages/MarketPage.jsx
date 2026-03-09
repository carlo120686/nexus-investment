import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/index.jsx'
import { ETF_LIST, COMMODITY_LIST, CRYPTO_LIST } from '../services/assets.js'
import { fetchQuote, fetchCandles, calcTechnicalSignal } from '../services/finnhub.js'
import { analyzeAsset } from '../services/ai.js'
import AssetCard from '../components/AssetCard.jsx'
import styles from './MarketPage.module.css'

const TABS = [
  { id: 'etf',       label: 'ETF',          list: ETF_LIST },
  { id: 'commodity', label: 'Materie Prime', list: COMMODITY_LIST },
  { id: 'crypto',    label: 'Crypto',        list: CRYPTO_LIST },
]

export default function MarketPage() {
  const { settings, aiActive } = useStore()
  const [tab, setTab] = useState('etf')
  const [search, setSearch] = useState('')
  const [data, setData] = useState({})       // { [id]: { quote, candles, signal, aiAnalysis, loading } }
  const [expanded, setExpanded] = useState(null)

  const currentList = TABS.find(t => t.id === tab).list
  const filtered = currentList.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.symbol.toLowerCase().includes(search.toLowerCase())
  )

  // Load a single asset
  const loadAsset = useCallback(async (asset) => {
    if (!settings.finnhubKey) return
    if (data[asset.id]?.quote) return  // already loaded

    setData(prev => ({ ...prev, [asset.id]: { ...prev[asset.id], loading: true } }))

    const [quote, candles] = await Promise.all([
      fetchQuote(asset.symbol, settings.finnhubKey),
      fetchCandles(asset.symbol, settings.finnhubKey, 90),
    ])

    const signal = calcTechnicalSignal(quote, candles)

    setData(prev => ({ ...prev, [asset.id]: { quote, candles, signal, loading: false, aiAnalysis: null, aiLoading: false } }))
  }, [settings.finnhubKey, data])

  // Load AI for an asset (only when expanded and AI is active)
  const loadAI = useCallback(async (asset) => {
    if (!aiActive) return
    const d = data[asset.id]
    if (!d?.quote || d.aiAnalysis || d.aiLoading) return

    setData(prev => ({ ...prev, [asset.id]: { ...prev[asset.id], aiLoading: true } }))
    const aiAnalysis = await analyzeAsset(asset, d.quote, d.candles, d.signal, settings.anthropicKey)
    setData(prev => ({ ...prev, [asset.id]: { ...prev[asset.id], aiAnalysis, aiLoading: false } }))
  }, [aiActive, data, settings.anthropicKey])

  // Load first 6 assets on tab change
  useEffect(() => {
    if (!settings.finnhubKey) return
    const list = TABS.find(t => t.id === tab).list.slice(0, 6)
    list.forEach(asset => loadAsset(asset))
  }, [tab, settings.finnhubKey])

  const handleExpand = (asset) => {
    const newExpanded = expanded === asset.id ? null : asset.id
    setExpanded(newExpanded)
    if (newExpanded) {
      loadAsset(asset)
      setTimeout(() => loadAI(asset), 100)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Market</h1>
        <div className={styles.controls}>
          <input
            className={styles.search}
            placeholder="Cerca asset..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {!aiActive && (
            <div className={styles.aiOff}>
              ◎ AI disattivata — segnali tecnici attivi
            </div>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => { setTab(t.id); setSearch(''); setExpanded(null) }}
          >
            {t.label}
            <span className={styles.tabCount}>{t.list.length}</span>
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filtered.map(asset => (
          <AssetCard
            key={asset.id}
            asset={asset}
            data={data[asset.id]}
            expanded={expanded === asset.id}
            onExpand={() => handleExpand(asset)}
            onVisible={() => loadAsset(asset)}
            aiActive={aiActive}
          />
        ))}
      </div>
    </div>
  )
}
