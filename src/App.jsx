import { useState } from 'react'
import { useStore } from './store/index.jsx'
import Navbar from './components/Navbar.jsx'
import MarketPage from './pages/MarketPage.jsx'
import PortfolioPage from './pages/PortfolioPage.jsx'
import PACPage from './pages/PACPage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import SetupBanner from './components/SetupBanner.jsx'
import styles from './App.module.css'

export default function App() {
  const [page, setPage] = useState('market')
  const { settings } = useStore()
  const needsSetup = !settings.finnhubKey

  return (
    <div className={styles.app}>
      <Navbar active={page} onNav={setPage} />
      <div className={styles.content}>
        {needsSetup && page !== 'settings' && (
          <SetupBanner onSetup={() => setPage('settings')} />
        )}
        {page === 'market'    && <MarketPage />}
        {page === 'portfolio' && <PortfolioPage />}
        {page === 'pac'       && <PACPage />}
        {page === 'alerts'    && <AlertsPage />}
        {page === 'settings'  && <SettingsPage />}
      </div>
    </div>
  )
}
