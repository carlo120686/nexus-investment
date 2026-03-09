import { useEffect, useRef } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import SignalBadge from './SignalBadge.jsx'
import styles from './AssetCard.module.css'

export default function AssetCard({ asset, data, expanded, onExpand, onVisible, aiActive }) {
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) onVisible() }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const { quote, candles, signal, aiAnalysis, loading, aiLoading } = data || {}
  const hasData = quote?.ok && candles?.ok

  return (
    <div ref={ref} className={`${styles.card} ${expanded ? styles.expanded : ''}`}>
      {/* ── Header row ─────────────────────────────────────── */}
      <div className={styles.header} onClick={onExpand}>
        <div className={styles.left}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{asset.name}</span>
            {asset.category && (
              <span className={styles.category}>{asset.category}</span>
            )}
            {asset.icon && <span className={styles.icon}>{asset.icon}</span>}
          </div>
          <div className={styles.meta}>
            <span className={styles.symbol}>{asset.symbol.split(':')[0]}</span>
            {asset.ter != null && <span className={styles.ter}>TER {asset.ter}%</span>}
            <span className={styles.type}>{asset.type}</span>
          </div>
        </div>

        <div className={styles.center}>
          {loading && <div className={`${styles.skRow} skeleton`} />}
          {hasData && (
            <div className={styles.sparkWrap}>
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={candles.sparkline}>
                  <Line type="monotone" dataKey="v" stroke={quote.changePct >= 0 ? 'var(--buy)' : 'var(--sell)'} dot={false} strokeWidth={1.5} />
                  <Tooltip contentStyle={{ display: 'none' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={styles.right}>
          {loading && (
            <div className={styles.loadingBlock}>
              <div className={`skeleton ${styles.skPrice}`} />
              <div className={`skeleton ${styles.skChg}`} />
            </div>
          )}
          {hasData && (
            <>
              <div className={styles.price}>
                {quote.current?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: asset.type === 'Crypto' ? 0 : 2 })}
              </div>
              <div className={`${styles.change} ${quote.changePct >= 0 ? styles.up : styles.down}`}>
                {quote.changePct >= 0 ? '+' : ''}{quote.changePct?.toFixed(2)}%
              </div>
              {signal && (
                <div className={styles.signals}>
                  <SignalBadge signal={aiAnalysis?.short_signal || signal.shortTerm || signal.signal} size="sm" />
                </div>
              )}
            </>
          )}
          {!loading && !hasData && !data && (
            <div className={styles.noData}>—</div>
          )}
        </div>

        <div className={styles.chevron}>{expanded ? '▲' : '▼'}</div>
      </div>

      {/* ── Expanded detail ─────────────────────────────────── */}
      {expanded && hasData && (
        <div className={styles.detail}>
          {/* Indicators row */}
          <div className={styles.indicators}>
            <Indicator label="RSI" value={candles.rsi?.toFixed(0)} color={rsiColor(candles.rsi)} />
            <Indicator label="SMA 20" value={candles.sma20?.toFixed(2)} />
            <Indicator label="SMA 50" value={candles.sma50?.toFixed(2)} />
            <Indicator label="MACD" value={candles.macd?.signal} color={candles.macd?.signal === 'bullish' ? 'var(--buy)' : 'var(--sell)'} />
            <Indicator label="BB %" value={candles.bb ? `${candles.bb.pct}%` : '—'} color={bbColor(candles.bb?.pct)} />
            <Indicator label="Golden X" value={candles.goldenCross ? 'SÌ ☀' : 'NO ☽'} color={candles.goldenCross ? 'var(--buy)' : 'var(--sell)'} />
            <Indicator label="52W H" value={candles.high52?.toFixed(2)} />
            <Indicator label="52W L" value={candles.low52?.toFixed(2)} />
          </div>

          {/* Signals breakdown */}
          {signal?.signals && (
            <div className={styles.signalBreakdown}>
              <div className="label-row" style={{ margin: '0 0 10px' }}><span className="label">Segnali tecnici</span></div>
              <div className={styles.signalGrid}>
                {signal.signals.map((s, i) => (
                  <div key={i} className={`${styles.sigRow} ${styles['sig_' + s.type]}`}>
                    <span className={styles.sigLabel}>{s.label}</span>
                    <span className={styles.sigValue}>{s.value}</span>
                    <span className={styles.sigNote}>{s.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Short vs Long term */}
          <div className={styles.timeSignals}>
            <div className={styles.timeBlock}>
              <div className="label">Breve termine</div>
              <SignalBadge signal={aiAnalysis?.short_signal || signal?.shortTerm || signal?.signal} size="lg" />
              {aiAnalysis?.short_confidence && <div className={styles.conf}>{aiAnalysis.short_confidence}% confidenza</div>}
              {aiAnalysis?.short_rationale && <p className={styles.rationale}>{aiAnalysis.short_rationale}</p>}
              {!aiAnalysis && signal?.shortTerm && <p className={styles.rationale} style={{ color: 'var(--muted)' }}>Basato su RSI e momentum</p>}
            </div>
            <div className={styles.timeDivider} />
            <div className={styles.timeBlock}>
              <div className="label">Lungo termine</div>
              <SignalBadge signal={aiAnalysis?.long_signal || signal?.longTerm || signal?.signal} size="lg" />
              {aiAnalysis?.long_confidence && <div className={styles.conf}>{aiAnalysis.long_confidence}% confidenza</div>}
              {aiAnalysis?.long_rationale && <p className={styles.rationale}>{aiAnalysis.long_rationale}</p>}
              {!aiAnalysis && signal?.longTerm && <p className={styles.rationale} style={{ color: 'var(--muted)' }}>Basato su trend e golden cross</p>}
            </div>
          </div>

          {/* AI Section — shown only if AI active */}
          {aiActive && (
            <div className={styles.aiSection}>
              <div className="label-row" style={{ margin: '0 0 12px' }}>
                <span className="label">◈ Analisi AI</span>
              </div>
              {aiLoading && (
                <div className={styles.aiLoading}>
                  <div className={styles.aiSpinner} />
                  <span>Claude sta analizzando...</span>
                </div>
              )}
              {aiAnalysis && (
                <div className={styles.aiContent}>
                  {aiAnalysis.macro && (
                    <AiBlock label="Macro" content={aiAnalysis.macro} />
                  )}
                  {aiAnalysis.geopolitical && (
                    <AiBlock label="Geopolitica" content={aiAnalysis.geopolitical} />
                  )}
                  {aiAnalysis.risks?.length > 0 && (
                    <div className={styles.aiBlock}>
                      <div className={styles.aiBlockLabel}>Rischi</div>
                      <ul className={styles.list}>
                        {aiAnalysis.risks.map((r, i) => <li key={i} className={styles.risk}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {aiAnalysis.opportunities?.length > 0 && (
                    <div className={styles.aiBlock}>
                      <div className={styles.aiBlockLabel}>Opportunità</div>
                      <ul className={styles.list}>
                        {aiAnalysis.opportunities.map((o, i) => <li key={i} className={styles.opp}>{o}</li>)}
                      </ul>
                    </div>
                  )}
                  {aiAnalysis.pac_suggestion && (
                    <div className={styles.pacTip}>
                      <span className={styles.pacIcon}>◷</span>
                      <span>{aiAnalysis.pac_suggestion}</span>
                    </div>
                  )}
                </div>
              )}
              {!aiLoading && !aiAnalysis && (
                <div className={styles.aiPlaceholder}>AI non disponibile per questo asset</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Indicator({ label, value, color }) {
  return (
    <div className={styles.indicator}>
      <div className={styles.indLabel}>{label}</div>
      <div className={styles.indValue} style={color ? { color } : {}}>{value ?? '—'}</div>
    </div>
  )
}

function AiBlock({ label, content }) {
  return (
    <div className={styles.aiBlock}>
      <div className={styles.aiBlockLabel}>{label}</div>
      <p className={styles.aiText}>{content}</p>
    </div>
  )
}

function rsiColor(rsi) {
  if (!rsi) return null
  if (rsi < 30) return 'var(--buy)'
  if (rsi > 70) return 'var(--sell)'
  return 'var(--text2)'
}

function bbColor(pct) {
  if (pct == null) return null
  if (pct < 20) return 'var(--buy)'
  if (pct > 80) return 'var(--sell)'
  return 'var(--text2)'
}
