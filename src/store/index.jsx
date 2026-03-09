// Store globale — chiavi API e impostazioni
// L'AI è completamente opzionale: disattivandola tutte le altre funzioni continuano a funzionare

import { useState, useEffect, createContext, useContext } from 'react'

const StoreContext = createContext(null)

const STORAGE_KEY = 'nexus_settings'

const defaults = {
  finnhubKey: '',
  anthropicKey: '',
  aiEnabled: false,       // ← toggle principale AI
  currency: 'EUR',
  riskProfile: 'moderate',
}

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
    } catch { return defaults }
  })

  const update = (patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  // AI è attiva solo se abilitata E c'è la chiave
  const aiActive = settings.aiEnabled && !!settings.anthropicKey

  return (
    <StoreContext.Provider value={{ settings, update, aiActive }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
