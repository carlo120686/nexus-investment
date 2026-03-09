import { useState, useEffect } from 'react'
import { useStore } from '../store/index.jsx'
import { ALL_ASSETS } from '../services/assets.js'
import { fetchQuote } from '../services/finnhub.js'
import styles from './AlertsPage.module.css'

const ALERTS_KEY = 'nexus_alerts'

function loadAlerts() { try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]') } catch { return [] } }
function saveAlerts(a) { try { localStorage.setItem(ALERTS_KEY, JSON.stringify(a)) } catch {} }

export default function AlertsPage() {
  const { settings } = useStore()
  const [alerts, setAlerts] = useState(() => loadAlerts())
  const [form, setForm] = useState({ assetId: '', condition: 'above', price: '' })
  const [checking, setChecking] = useState(false)

  useEffect(() => { saveAlerts(alerts) }, [alerts])

  const addAlert = () => {
    const asset = ALL_ASSETS.find(a => a.id === form.assetId)
    if (!asset || !form.price) return
    const newAlert = {
      id: Date.now(),
      assetId: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      condition: form.condition,
      price: parseFloat(form.price),
      createdAt: new Date().toLocaleDateString('it-IT'),
      triggered: false,
      currentPrice: null,
    }
    setAlerts(prev => [newAlert, ...prev])
    setForm({ assetId: '', condition: 'above', price: '' })
  }

  const checkAlerts = async () => {
    if (!settings.finnhubKey || !alerts.length) return
    setChecking(true)
    const updated = [...alerts]
    await Promise.allSettled(updated.map(async (alert, i) => {
      const asset = ALL_ASSETS.find(a => a.id === alert.assetId)
      if (!asset) return
      const q = await fetchQuote(asset.symbol, settings.finnhubKey)
      if (!q.ok) return
      updated[i] = {
        ...alert,
        currentPrice: q.current,
        triggered: alert.condition === 'above' ? q.current >= alert.price : q.current <= alert.price,
        lastCheck: new Date().toLocaleTimeString('it-IT'),
      }
    }))
    setAlerts(updated)
    setChecking(false)
  }

  const removeAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id))
  const clearTriggered = () => setAlerts(prev => prev.filter(a => !a.triggered))

  const triggered = alerts.filter(a => a.triggered)
  const pending   = alerts.filter(a => !a.triggered)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Alerts</h1>
          <p className={styles.sub}>Soglie di prezzo personalizzate</p>
        </div>
        <div className={styles.actions}>
          {triggered.length > 0 && (
            <button className={styles.btnDanger} onClick={clearTriggered}>Cancella scattati ({triggered.length})</button>
          )}
          <button className={styles.btn} onClick={checkAlerts} disabled={checking || !settings.finnhubKey}>
            {checking ? '⟳ Controllo...' : '⟳ Controlla ora'}
          </button>
        </div>
      </div>

      {/* Add form */}
      <div className={styles.addForm}>
        <div className="label-row"><span className="label">Nuovo alert</span></div>
        <div className={styles.formRow}>
          <select
            className={styles.select}
            value={form.assetId}
            onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
          >
            <option value="">Seleziona asset...</option>
            {ALL_ASSETS.map(a => <option key={a.id} value={a.id}>{a.name} ({a.symbol.split(':')[0]})</option>)}
          </select>
          <select className={styles.select} style={{ width: 160 }} value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
            <option value="above">Sopra ↑</option>
            <option value="below">Sotto ↓</option>
          </select>
          <input
            className={styles.input}
            type="number"
            placeholder="Prezzo soglia"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            style={{ width: 160 }}
          />
          <button className={styles.btnPrimary} onClick={addAlert}>+ Aggiungi alert</button>
        </div>
      </div>

      {/* Triggered */}
      {triggered.length > 0 && (
        <div className={styles.section}>
          <div className="label-row"><span className="label" style={{ color: 'var(--buy)' }}>⚡ Alert scattati ({triggered.length})</span></div>
          {triggered.map(a => <AlertRow key={a.id} alert={a} onRemove={() => removeAlert(a.id)} />)}
        </div>
      )}

      {/* Pending */}
      <div className={styles.section}>
        <div className="label-row"><span className="label">In attesa ({pending.length})</span></div>
        {pending.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>◬</div>
            <div>Nessun alert attivo</div>
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>Aggiungi soglie di prezzo per monitorare i tuoi asset</div>
          </div>
        )}
        {pending.map(a => <AlertRow key={a.id} alert={a} onRemove={() => removeAlert(a.id)} />)}
      </div>
    </div>
  )
}

function AlertRow({ alert, onRemove }) {
  const dist = alert.currentPrice && alert.price
    ? ((alert.price - alert.currentPrice) / alert.currentPrice * 100).toFixed(1)
    : null

  return (
    <div className={`${styles.alertRow} ${alert.triggered ? styles.alertTriggered : ''}`}>
      <div className={styles.alertIcon}>{alert.triggered ? '⚡' : alert.condition === 'above' ? '↑' : '↓'}</div>
      <div className={styles.alertInfo}>
        <div className={styles.alertName}>{alert.name}</div>
        <div className={styles.alertMeta}>
          {alert.condition === 'above' ? 'Prezzo sopra' : 'Prezzo sotto'} <strong>€ {alert.price.toLocaleString('it-IT')}</strong>
          {alert.currentPrice && <> · Attuale: <strong>€ {alert.currentPrice.toFixed(2)}</strong></>}
          {dist && !alert.triggered && <> · Distanza: {dist}%</>}
          <span style={{ marginLeft: 8, color: 'var(--muted)' }}>Creato {alert.createdAt}</span>
          {alert.lastCheck && <span style={{ marginLeft: 8, color: 'var(--muted)' }}>· Ultimo check {alert.lastCheck}</span>}
        </div>
      </div>
      {alert.triggered && <span className={styles.triggeredBadge}>SCATTATO</span>}
      <button className={styles.removeBtn} onClick={onRemove}>✕</button>
    </div>
  )
}
