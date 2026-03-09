// Simulatore PAC — Piano di Accumulo del Capitale

export function simulatePAC({
  monthlyAmount,    // importo mensile €
  years,            // anni di investimento
  annualReturn,     // rendimento annuo atteso %
  initialAmount = 0, // capitale iniziale
  inflationRate = 2, // inflazione %
}) {
  const months = years * 12
  const monthlyRate = annualReturn / 100 / 12
  const data = []
  let portfolio = initialAmount
  let totalInvested = initialAmount

  for (let m = 0; m <= months; m++) {
    if (m > 0) {
      portfolio = portfolio * (1 + monthlyRate) + monthlyAmount
      totalInvested += monthlyAmount
    }
    if (m % 12 === 0) {
      data.push({
        year: m / 12,
        portfolio: Math.round(portfolio),
        invested: Math.round(totalInvested),
        gain: Math.round(portfolio - totalInvested),
      })
    }
  }

  const finalValue = portfolio
  const finalInvested = totalInvested
  const totalGain = finalValue - finalInvested
  const gainPct = (totalGain / finalInvested) * 100

  // Valore reale (aggiustato inflazione)
  const inflationFactor = Math.pow(1 + inflationRate / 100, years)
  const realValue = finalValue / inflationFactor

  return {
    data,
    finalValue: Math.round(finalValue),
    finalInvested: Math.round(finalInvested),
    totalGain: Math.round(totalGain),
    gainPct: Math.round(gainPct),
    realValue: Math.round(realValue),
    monthlyAmount,
    years,
    annualReturn,
  }
}

// Scenari multipli
export function multiScenario(params) {
  return {
    pessimistic: simulatePAC({ ...params, annualReturn: params.annualReturn - 3 }),
    base:        simulatePAC({ ...params }),
    optimistic:  simulatePAC({ ...params, annualReturn: params.annualReturn + 3 }),
  }
}

// Rendimenti storici di riferimento per suggerimenti
export const HISTORICAL_RETURNS = {
  'MSCI World':      { avg: 9.5,  std: 15, desc: '~50 anni di dati' },
  'S&P 500':         { avg: 10.5, std: 17, desc: '~100 anni di dati' },
  'EuroStoxx 600':   { avg: 7.5,  std: 16, desc: '~30 anni di dati' },
  'Oro':             { avg: 5.5,  std: 14, desc: '~50 anni di dati' },
  'BTC':             { avg: 60,   std: 80, desc: '~10 anni di dati, altamente volatile' },
  'Portafoglio 60/40': { avg: 7.0, std: 10, desc: '60% azioni, 40% bond' },
}
