export function simulatePAC({monthlyAmount,years,annualReturn,initialAmount=0,inflationRate=2}) {
  const months=years*12, mr=annualReturn/100/12
  const data=[]; let portfolio=initialAmount, invested=initialAmount
  for(let m=0;m<=months;m++){
    if(m>0){portfolio=portfolio*(1+mr)+monthlyAmount;invested+=monthlyAmount}
    if(m%12===0) data.push({year:m/12,portfolio:Math.round(portfolio),invested:Math.round(invested),gain:Math.round(portfolio-invested)})
  }
  const realValue=Math.round(portfolio/Math.pow(1+inflationRate/100,years))
  return{data,finalValue:Math.round(portfolio),finalInvested:Math.round(invested),totalGain:Math.round(portfolio-invested),gainPct:Math.round((portfolio-invested)/invested*100),realValue,monthlyAmount,years,annualReturn}
}

export function multiScenario(p) {
  return{
    pessimistic:simulatePAC({...p,annualReturn:Math.max(1,p.annualReturn-3)}),
    base:simulatePAC({...p}),
    optimistic:simulatePAC({...p,annualReturn:p.annualReturn+3}),
  }
}

export const BENCHMARKS = {
  'MSCI World':      {avg:9.5,  desc:'~50 anni'},
  'S&P 500':         {avg:10.5, desc:'~100 anni'},
  'EuroStoxx 600':   {avg:7.5,  desc:'~30 anni'},
  'Oro':             {avg:5.5,  desc:'~50 anni'},
  'Bitcoin':         {avg:60,   desc:'~10 anni, alta volatilità'},
  'Portafoglio 60/40':{avg:7.0, desc:'60% azioni, 40% bond'},
}
