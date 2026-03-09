import styles from './SetupBanner.module.css'

export default function SetupBanner({ onSetup }) {
  return (
    <div className={styles.banner}>
      <span className={styles.icon}>⚙</span>
      <span>Configura la tua <strong>Finnhub API key</strong> per accedere ai dati di mercato in tempo reale.</span>
      <button className={styles.btn} onClick={onSetup}>Configura ora →</button>
    </div>
  )
}
