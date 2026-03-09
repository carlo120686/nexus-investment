import { useState, useEffect } from 'react'
import { useStore } from '../store/index.jsx'
import styles from './Navbar.module.css'

const NAV_ITEMS = [
  { id: 'market',    icon: '◈', label: 'Market' },
  { id: 'portfolio', icon: '◉', label: 'Portfolio' },
  { id: 'pac',       icon: '◷', label: 'PAC' },
  { id: 'alerts',    icon: '◬', label: 'Alerts' },
  { id: 'settings',  icon: '◎', label: 'Settings' },
]

export default function Navbar({ active, onNav }) {
  const { settings, aiActive } = useStore()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const isMarketOpen = () => {
    const h = time.getUTCHours(), d = time.getUTCDay()
    return d >= 1 && d <= 5 && h >= 8 && h < 17
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>N</div>
        <div>
          <div className={styles.logoText}>NEXUS</div>
          <div className={styles.logoSub}>Investment Intelligence</div>
        </div>
      </div>

      <div className={styles.clock}>
        <div className={styles.clockTime}>{time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
        <div className={styles.clockDate}>{time.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
        <div className={`${styles.marketStatus} ${isMarketOpen() ? styles.open : ''}`}>
          <span className={styles.statusDot} />
          {isMarketOpen() ? 'Aperto' : 'Chiuso'}
        </div>
      </div>

      <div className={styles.items}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`${styles.item} ${active === item.id ? styles.active : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className={styles.itemIcon}>{item.icon}</span>
            <span className={styles.itemLabel}>{item.label}</span>
            {active === item.id && <span className={styles.activeBar} />}
          </button>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={`${styles.aiStatus} ${aiActive ? styles.aiOn : ''}`}>
          <span className={styles.statusDot} />
          AI {aiActive ? 'attiva' : 'disattivata'}
        </div>
        {!settings.finnhubKey && (
          <div className={styles.warning}>⚠ Configura API key</div>
        )}
      </div>
    </nav>
  )
}
