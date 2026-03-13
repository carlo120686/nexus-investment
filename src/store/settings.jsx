cat > src/store/settings.jsx << 'EOF'
import { useState, useEffect, createContext, useContext } from 'react'
const Ctx = createContext(null)
const KEY = 'nexus_v2_settings'
const defaults = { finnhubKey: '', anthropicKey: '', aiEnabled: false }
export function SettingsProvider({ children }) {
  const [s, setS] = useState(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') } }
    catch { return defaults }
  })
  const update = (patch) => setS(prev => {
    const next = { ...prev, ...patch }
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
    return next
  })
  const aiActive = s.aiEnabled && !!s.anthropicKey
  return <Ctx.Provider value={{ s, update, aiActive }}>{children}</Ctx.Provider>
}
export const useSettings = () => useContext(Ctx)
EOF
