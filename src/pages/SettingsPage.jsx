import { useState } from 'react'
import { useStore } from '../store/index.jsx'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { settings, update, aiActive } = useStore()
  const [finnhub, setFinnhub] = useState(settings.finnhubKey || '')
  const [anthropic, setAnthropic] = useState(settings.anthropicKey || '')
  const [showFinnhub, setShowFinnhub] = useState(false)
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = () => {
    update({ finnhubKey: finnhub.trim(), anthropicKey: anthropic.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Impostazioni</h1>
        <p className={styles.sub}>Configura le chiavi API e le preferenze</p>
      </div>

      <div className={styles.sections}>

        {/* Finnhub */}
        <div className={styles.section}>
          <div className="label-row"><span className="label">Finnhub API — Dati di mercato</span></div>
          <p className={styles.desc}>
            Gratuita — 60 chiamate/minuto. Registrati su{' '}
            <a href="https://finnhub.io/register" target="_blank" rel="noreferrer">finnhub.io/register</a>
            {' '}e copia la chiave dalla dashboard.
          </p>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              type={showFinnhub ? 'text' : 'password'}
              placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={finnhub}
              onChange={e => setFinnhub(e.target.value)}
            />
            <button className={styles.toggle} onClick={() => setShowFinnhub(s => !s)}>{showFinnhub ? '🙈' : '👁'}</button>
          </div>
          {finnhub.startsWith('pk_') && <div className={styles.ok}>✓ Formato corretto</div>}
        </div>

        {/* AI Toggle */}
        <div className={styles.section}>
          <div className="label-row"><span className="label">Analisi AI — Opzionale</span></div>
          <div className={styles.aiToggleRow}>
            <div>
              <div className={styles.aiToggleTitle}>Abilita analisi AI con Claude</div>
              <div className={styles.aiToggleDesc}>
                Aggiunge analisi geopolitica, segnali BUY/HOLD/SELL motivati e consigli PAC.
                Costo stimato: ~€0.01 per analisi. <strong>Disattivando questa opzione, tutte le altre funzionalità continuano a funzionare normalmente.</strong>
              </div>
            </div>
            <button
              className={`${styles.toggle2} ${settings.aiEnabled ? styles.toggleOn : ''}`}
              onClick={() => update({ aiEnabled: !settings.aiEnabled })}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>

          {settings.aiEnabled && (
            <>
              <p className={styles.desc} style={{ marginTop: 16 }}>
                Chiave Anthropic da{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a>.
                Richiede credito minimo $5. Salvata solo nel browser, mai trasmessa altrove.
              </p>
              <div className={styles.inputRow}>
                <input
                  className={styles.input}
                  type={showAnthropic ? 'text' : 'password'}
                  placeholder="sk-ant-api03-..."
                  value={anthropic}
                  onChange={e => setAnthropic(e.target.value)}
                />
                <button className={styles.toggle} onClick={() => setShowAnthropic(s => !s)}>{showAnthropic ? '🙈' : '👁'}</button>
              </div>
              {anthropic.startsWith('sk-ant-') && <div className={styles.ok}>✓ Formato corretto</div>}
            </>
          )}
        </div>

        {/* Status */}
        <div className={styles.section}>
          <div className="label-row"><span className="label">Stato attuale</span></div>
          <div className={styles.statusGrid}>
            <StatusRow label="Dati di mercato" active={!!settings.finnhubKey} desc={settings.finnhubKey ? 'Finnhub connesso' : 'Chiave non configurata'} />
            <StatusRow label="Analisi AI" active={aiActive} desc={aiActive ? 'Claude attivo' : settings.aiEnabled && !settings.anthropicKey ? 'Chiave Anthropic mancante' : 'Disattivata — funzioni base attive'} />
          </div>
        </div>

        <button className={styles.saveBtn} onClick={save}>
          {saved ? '✓ Salvato' : 'Salva impostazioni'}
        </button>
      </div>

      <div className={styles.disclaimer}>
        <strong>⚠ DISCLAIMER</strong> — NEXUS è uno strumento informativo per uso personale.
        Non costituisce consulenza finanziaria. I segnali BUY/HOLD/SELL sono indicatori orientativi basati
        su analisi tecnica automatizzata. Ogni decisione di investimento è responsabilità esclusiva dell'utente.
        Investire comporta rischi inclusa la perdita del capitale.
      </div>
    </div>
  )
}

function StatusRow({ label, active, desc }) {
  return (
    <div className={styles.statusRow}>
      <span className={`${styles.statusDot} ${active ? styles.dotOn : styles.dotOff}`} />
      <div>
        <div className={styles.statusLabel}>{label}</div>
        <div className={styles.statusDesc}>{desc}</div>
      </div>
    </div>
  )
}
