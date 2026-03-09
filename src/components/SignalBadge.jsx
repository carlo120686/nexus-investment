import styles from './SignalBadge.module.css'

const LABELS = { BUY: 'ACQUISTA', SELL: 'VENDI', HOLD: 'ATTENDI' }

export default function SignalBadge({ signal, size = 'md', showLabel = true }) {
  if (!signal) return null
  return (
    <span className={`${styles.badge} ${styles[signal.toLowerCase()]} ${styles[size]}`}>
      {showLabel ? LABELS[signal] : signal}
    </span>
  )
}
