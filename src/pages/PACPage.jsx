import { useState } from 'react'
import { simulatePAC, multiScenario, HISTORICAL_RETURNS } from '../services/pac.js'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import styles from './PACPage.module.css'

export default function PACPage() {
  const [params, setParams] = useState({ monthlyAmount: 300, years: 20, annualReturn: 8, initialAmount: 0, inflationRate: 2 })
  const [showScenarios, setShowScenarios] = useState(false)

  const result = simulatePAC(params)
  const scenarios = showScenarios ? multiScenario(params) : null

  const chartData = showScenarios
    ? result.data.map((d, i) => ({
        year: `Anno ${d.year}`,
        pessimistico: scenarios.pessimistic.data[i]?.portfolio,
        base: scenarios.base.data[i]?.portfolio,
        ottimistico: scenarios.optimistic.data[i]?.portfolio,
        investito: d.invested,
      }))
    : result.data.map(d => ({
        year: `Anno ${d.year}`,
        portafoglio: d.portfolio,
        investito: d.invested,
        guadagno: d.gain,
      }))

  const set = (k, v) => setParams(p => ({ ...p, [k]: parseFloat(v) || 0 }))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Simulatore PAC</h1>
        <p className={styles.sub}>Piano di Accumulo del Capitale — calcola la crescita nel tempo</p>
      </div>

      <div className={styles.layout}>
        {/* Controls */}
        <div className={styles.controls}>
          <div className="label-row"><span className="label">Parametri</span></div>

          <SliderInput label="Investimento mensile" value={params.monthlyAmount} min={50} max={5000} step={50} format={v => `€ ${v}`} onChange={v => set('monthlyAmount', v)} />
          <SliderInput label="Capitale iniziale" value={params.initialAmount} min={0} max={100000} step={1000} format={v => `€ ${v.toLocaleString()}`} onChange={v => set('initialAmount', v)} />
          <SliderInput label="Durata" value={params.years} min={1} max={40} step={1} format={v => `${v} anni`} onChange={v => set('years', v)} />
          <SliderInput label="Rendimento annuo atteso" value={params.annualReturn} min={1} max={20} step={0.5} format={v => `${v}%`} onChange={v => set('annualReturn', v)} />
          <SliderInput label="Inflazione stimata" value={params.inflationRate} min={0} max={8} step={0.5} format={v => `${v}%`} onChange={v => set('inflationRate', v)} />

          <div className={styles.refSection}>
            <div className="label-row" style={{ margin: '0 0 10px' }}><span className="label">Rendimenti storici di riferimento</span></div>
            {Object.entries(HISTORICAL_RETURNS).map(([name, d]) => (
              <div key={name} className={styles.refRow} onClick={() => set('annualReturn', d.avg)}>
                <span className={styles.refName}>{name}</span>
                <span className={styles.refAvg}>{d.avg}% avg</span>
                <span className={styles.refDesc}>{d.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className={styles.results}>
          <div className={styles.resultCards}>
            <ResultCard label="Valore finale" value={`€ ${result.finalValue.toLocaleString('it-IT')}`} accent />
            <ResultCard label="Totale investito" value={`€ ${result.finalInvested.toLocaleString('it-IT')}`} />
            <ResultCard label="Guadagno totale" value={`+€ ${result.totalGain.toLocaleString('it-IT')}`} sub={`+${result.gainPct}%`} color="var(--buy)" />
            <ResultCard label="Valore reale (inf.)" value={`€ ${result.realValue.toLocaleString('it-IT')}`} sub={`a potere d'acquisto odierno`} />
          </div>

          <div className={styles.chartBox}>
            <div className={styles.chartHeader}>
              <span className="label">Proiezione</span>
              <button className={`${styles.toggleBtn} ${showScenarios ? styles.toggleActive : ''}`} onClick={() => setShowScenarios(s => !s)}>
                3 Scenari
              </button>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--buy)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--buy)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOptimistic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--buy)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="var(--buy)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPessimistic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--sell)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="var(--sell)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }}
                  formatter={v => [`€ ${v?.toLocaleString('it-IT')}`, '']}
                />
                {showScenarios ? (
                  <>
                    <Area type="monotone" dataKey="ottimistico" stroke="var(--buy)" fill="url(#gOptimistic)" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="base" stroke="var(--accent)" fill="url(#gPortfolio)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="pessimistico" stroke="var(--sell)" fill="url(#gPessimistic)" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="investito" stroke="var(--muted)" fill="none" strokeWidth={1} strokeDasharray="4 2" dot={false} />
                  </>
                ) : (
                  <>
                    <Area type="monotone" dataKey="portafoglio" stroke="var(--buy)" fill="url(#gPortfolio)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="investito" stroke="var(--muted)" fill="none" strokeWidth={1} strokeDasharray="4 2" dot={false} />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {showScenarios && scenarios && (
            <div className={styles.scenarioCards}>
              <ScenarioCard label="Pessimistico" data={scenarios.pessimistic} color="var(--sell)" />
              <ScenarioCard label="Base" data={scenarios.base} color="var(--accent)" />
              <ScenarioCard label="Ottimistico" data={scenarios.optimistic} color="var(--buy)" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SliderInput({ label, value, min, max, step, format, onChange }) {
  return (
    <div className={styles.sliderGroup}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderValue}>{format(value)}</span>
      </div>
      <input type="range" className={styles.slider} min={min} max={max} step={step} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function ResultCard({ label, value, sub, color, accent }) {
  return (
    <div className={`${styles.resultCard} ${accent ? styles.resultAccent : ''}`}>
      <div className={styles.resultLabel}>{label}</div>
      <div className={styles.resultValue} style={color ? { color } : {}}>{value}</div>
      {sub && <div className={styles.resultSub} style={color ? { color } : {}}>{sub}</div>}
    </div>
  )
}

function ScenarioCard({ label, data, color }) {
  return (
    <div className={styles.scenarioCard} style={{ borderColor: color + '40' }}>
      <div className={styles.scenarioLabel} style={{ color }}>{label}</div>
      <div className={styles.scenarioReturn}>{data.annualReturn}% / anno</div>
      <div className={styles.scenarioFinal} style={{ color }}>€ {data.finalValue.toLocaleString('it-IT')}</div>
      <div className={styles.scenarioGain}>+{data.gainPct}%</div>
    </div>
  )
}
