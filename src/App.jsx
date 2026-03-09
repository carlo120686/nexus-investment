import { useState, useEffect, useCallback, useRef } from 'react'
import { SettingsProvider, useSettings } from './store/settings.jsx'
import { ETF_LIST, COMMODITY_LIST, CRYPTO_LIST, ALL_ASSETS, TABS } from './services/assets.js'
import { fetchQuote, fetchCandles, calcSignal } from './services/market.js'
import { analyzeAsset, analyzePortfolio } from './services/ai.js'
import { loadPortfolio, savePortfolio, addHolding, removeHolding, updatePrices, portfolioStats } from './services/portfolio.js'
import { simulatePAC, multiScenario, BENCHMARKS } from './services/pac.js'
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AppRoot() {
  return <SettingsProvider><App /></SettingsProvider>
}

function App() {
  const [page, setPage] = useState('market')
  const { s } = useSettings()
  return (
    <div style={{display:'flex',minHeight:'100vh',background:'var(--bg)'}}>
      <Sidebar active={page} onNav={setPage} />
      <main style={{flex:1,marginLeft:220,minHeight:'100vh'}}>
        {!s.finnhubKey && page!=='settings' && (
          <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:6,padding:'12px 24px',margin:'20px 32px 0',fontSize:12,color:'#c8d8f0',display:'flex',alignItems:'center',gap:12}}>
            <span style={{color:'#f59e0b',fontSize:16}}>⚙</span>
            <span>Configura la <strong style={{color:'#f59e0b'}}>Finnhub API key</strong> per accedere ai dati di mercato.</span>
            <button onClick={()=>setPage('settings')} style={{marginLeft:'auto',background:'transparent',border:'1px solid #f59e0b',color:'#f59e0b',fontFamily:'var(--font-head)',fontSize:11,padding:'5px 14px',borderRadius:4,cursor:'pointer',whiteSpace:'nowrap'}}>Configura →</button>
          </div>
        )}
        {page==='market'    && <MarketPage />}
        {page==='portfolio' && <PortfolioPage />}
        {page==='pac'       && <PACPage />}
        {page==='alerts'    && <AlertsPage />}
        {page==='settings'  && <SettingsPage />}
      </main>
    </div>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({active, onNav}) {
  const { s, aiActive } = useSettings()
  const [time, setTime] = useState(new Date())
  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t)},[])
  const open = ()=>{const h=time.getUTCHours(),d=time.getUTCDay();return d>=1&&d<=5&&h>=8&&h<17}
  const nav = [
    {id:'market',icon:'◈',label:'Market'},
    {id:'portfolio',icon:'◉',label:'Portfolio'},
    {id:'pac',icon:'◷',label:'PAC Simulator'},
    {id:'alerts',icon:'◬',label:'Alerts'},
    {id:'settings',icon:'◎',label:'Settings'},
  ]
  return (
    <nav style={{width:220,minHeight:'100vh',background:'var(--bg2)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'24px 0',position:'fixed',top:0,left:0,bottom:0,zIndex:100}}>
      <div style={{padding:'0 20px 24px',borderBottom:'1px solid var(--border)',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:36,height:36,background:'var(--accent)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-head)',fontSize:20,fontWeight:800,color:'white',boxShadow:'0 0 20px rgba(59,130,246,0.3)',flexShrink:0}}>N</div>
        <div>
          <div style={{fontFamily:'var(--font-head)',fontSize:18,fontWeight:700,letterSpacing:3,color:'var(--text)'}}>NEXUS</div>
          <div style={{fontSize:8,letterSpacing:2,color:'var(--muted)'}}>Investment Intelligence</div>
        </div>
      </div>
      <div style={{padding:'0 20px 20px',borderBottom:'1px solid var(--border)',marginBottom:12}}>
        <div style={{fontFamily:'var(--font-head)',fontSize:28,fontWeight:600,letterSpacing:2,color:'var(--text)',lineHeight:1}}>{time.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</div>
        <div style={{fontSize:10,color:'var(--muted)',marginTop:3,textTransform:'capitalize'}}>{time.toLocaleDateString('it-IT',{weekday:'short',day:'2-digit',month:'short'})}</div>
        <div style={{display:'flex',alignItems:'center',gap:5,marginTop:6,fontSize:9,letterSpacing:2,color:open()?'var(--buy)':'var(--muted)'}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:open()?'var(--buy)':'var(--muted)',display:'inline-block'}} />
          Mercato {open()?'aperto':'chiuso'}
        </div>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:2,padding:'0 10px'}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>onNav(n.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 12px',borderRadius:6,background:active===n.id?'var(--surface)':'transparent',border:'none',color:active===n.id?'var(--text)':'var(--muted)',fontFamily:'var(--font-head)',fontSize:13,fontWeight:600,letterSpacing:1,cursor:'pointer',position:'relative',textAlign:'left',transition:'all .15s'}}>
            <span style={{fontSize:16,width:20,textAlign:'center'}}>{n.icon}</span>
            <span style={{flex:1}}>{n.label}</span>
            {active===n.id&&<span style={{position:'absolute',right:0,top:'50%',transform:'translateY(-50%)',width:3,height:'60%',background:'var(--accent)',borderRadius:'2px 0 0 2px'}} />}
          </button>
        ))}
      </div>
      <div style={{padding:'16px 20px 0',borderTop:'1px solid var(--border)',marginTop:12}}>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:9,letterSpacing:2,color:aiActive?'var(--buy)':'var(--muted)'}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:aiActive?'var(--buy)':'var(--muted)',display:'inline-block'}} />
          AI {aiActive?'attiva':'disattivata'}
        </div>
        {!s.finnhubKey&&<div style={{fontSize:9,color:'var(--hold)',marginTop:6}}>⚠ Configura API key</div>}
      </div>
    </nav>
  )
}

// ─── MARKET PAGE ─────────────────────────────────────────────────────────────

function MarketPage() {
  const { s, aiActive } = useSettings()
  const [tab, setTab] = useState('etf')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Tutti')
  const [data, setData] = useState({})
  const [expanded, setExpanded] = useState(null)

  const currentTab = TABS.find(t=>t.id===tab)
  const categories = ['Tutti', ...new Set(currentTab.list.map(a=>a.cat))]
  const filtered = currentTab.list.filter(a=>{
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.symbol.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter==='Tutti' || a.cat===catFilter
    return matchSearch && matchCat
  })

  const loadAsset = useCallback(async (asset) => {
    if (!s.finnhubKey || data[asset.id]?.quote) return
    setData(p=>({...p,[asset.id]:{...p[asset.id],loading:true}}))
    const [quote, candles] = await Promise.all([fetchQuote(asset.symbol, s.finnhubKey), fetchCandles(asset.symbol, s.finnhubKey)])
    const signal = calcSignal(quote, candles)
    setData(p=>({...p,[asset.id]:{quote,candles,signal,loading:false}}))
  }, [s.finnhubKey, data])

  const loadAI = useCallback(async (asset) => {
    if (!aiActive) return
    const d = data[asset.id]
    if (!d?.quote || d.aiAnalysis || d.aiLoading) return
    setData(p=>({...p,[asset.id]:{...p[asset.id],aiLoading:true}}))
    const aiAnalysis = await analyzeAsset(asset, d.quote, d.candles, d.signal, s.anthropicKey)
    setData(p=>({...p,[asset.id]:{...p[asset.id],aiAnalysis,aiLoading:false}}))
  }, [aiActive, data, s.anthropicKey])

  useEffect(()=>{
    if (!s.finnhubKey) return
    TABS.find(t=>t.id===tab).list.slice(0,8).forEach(loadAsset)
  }, [tab, s.finnhubKey])

  const handleExpand = (asset) => {
    const next = expanded===asset.id ? null : asset.id
    setExpanded(next)
    if (next) { loadAsset(asset); setTimeout(()=>loadAI(asset),200) }
  }

  return (
    <div style={{padding:'32px 40px 60px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <h1 style={{fontFamily:'var(--font-head)',fontSize:32,fontWeight:800,letterSpacing:2,color:'var(--text)'}}>Market</h1>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>{setSearch(e.target.value);setCatFilter('Tutti')}} placeholder="Cerca asset..." style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:12,padding:'9px 14px',outline:'none',width:220}} />
          {!aiActive&&<span style={{fontSize:10,color:'var(--muted)',border:'1px solid var(--border)',padding:'6px 12px',borderRadius:6}}>◎ AI off — segnali tecnici attivi</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,borderBottom:'1px solid var(--border)',marginBottom:16}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setSearch('');setCatFilter('Tutti');setExpanded(null)}} style={{background:'transparent',border:'none',borderBottom:tab===t.id?'2px solid var(--accent)':'2px solid transparent',color:tab===t.id?'var(--text)':'var(--muted)',fontFamily:'var(--font-head)',fontSize:14,fontWeight:600,letterSpacing:1,padding:'10px 18px',cursor:'pointer',marginBottom:-1,display:'flex',alignItems:'center',gap:7}}>
            {t.label}
            <span style={{fontSize:9,background:tab===t.id?'rgba(59,130,246,0.15)':'var(--surface2)',color:tab===t.id?'var(--accent2)':'var(--muted)',padding:'2px 6px',borderRadius:10}}>{t.list.length}</span>
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
        {categories.map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)} style={{background:catFilter===c?'var(--accent)':'var(--surface)',border:'1px solid',borderColor:catFilter===c?'var(--accent)':'var(--border)',color:catFilter===c?'white':'var(--text2)',fontFamily:'var(--font-mono)',fontSize:10,padding:'4px 12px',borderRadius:20,cursor:'pointer',letterSpacing:1}}>
            {c}
          </button>
        ))}
      </div>

      {/* Asset list */}
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {filtered.map(asset=>(
          <AssetRow key={asset.id} asset={asset} data={data[asset.id]} expanded={expanded===asset.id} onExpand={()=>handleExpand(asset)} onVisible={()=>loadAsset(asset)} aiActive={aiActive} />
        ))}
      </div>
    </div>
  )
}

// ─── ASSET ROW ───────────────────────────────────────────────────────────────

function AssetRow({asset, data, expanded, onExpand, onVisible, aiActive}) {
  const ref = useRef(null)
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)onVisible()},{threshold:0.1})
    if(ref.current)obs.observe(ref.current)
    return()=>obs.disconnect()
  },[])

  const {quote,candles,signal,aiAnalysis,loading,aiLoading} = data||{}
  const hasData = quote?.ok

  const sigColor = (sig) => sig==='BUY'?'var(--buy)':sig==='SELL'?'var(--sell)':'var(--hold)'
  const sigBg    = (sig) => sig==='BUY'?'var(--buy-bg)':sig==='SELL'?'var(--sell-bg)':'var(--hold-bg)'

  return (
    <div ref={ref} style={{background:'var(--surface)',border:`1px solid ${expanded?'var(--accent)':'var(--border)'}`,borderRadius:6,overflow:'hidden',transition:'border-color .2s'}}>
      {/* Header */}
      <div onClick={onExpand} style={{display:'grid',gridTemplateColumns:'1fr 160px 130px 24px',alignItems:'center',gap:16,padding:'12px 18px',cursor:'pointer',userSelect:'none'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            {asset.icon&&<span style={{fontSize:15}}>{asset.icon}</span>}
            <span style={{fontFamily:'var(--font-head)',fontSize:14,fontWeight:600,color:'var(--text)'}}>{asset.name}</span>
            <span style={{fontSize:9,letterSpacing:1,color:'var(--muted)',background:'var(--surface2)',padding:'2px 7px',borderRadius:3,textTransform:'uppercase',whiteSpace:'nowrap'}}>{asset.cat}</span>
            {asset.ter!=null&&<span style={{fontSize:9,color:'var(--muted)'}}>TER {asset.ter}%</span>}
          </div>
          <div style={{fontSize:10,color:'var(--accent2)',marginTop:2,fontWeight:500}}>{asset.symbol.split(':')[0]}</div>
        </div>

        <div style={{height:40}}>
          {hasData&&candles?.sparkline&&(
            <ResponsiveContainer width="100%" height={40}>
              <LineChart data={candles.sparkline}>
                <Line type="monotone" dataKey="v" stroke={quote.change>=0?'var(--buy)':'var(--sell)'} dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {loading&&<div className="skeleton" style={{height:40,width:'100%'}} />}
        </div>

        <div style={{textAlign:'right'}}>
          {loading&&<><div className="skeleton" style={{height:18,width:80,marginLeft:'auto',marginBottom:4}} /><div className="skeleton" style={{height:12,width:50,marginLeft:'auto'}} /></>}
          {hasData&&(
            <>
              <div style={{fontFamily:'var(--font-head)',fontSize:17,fontWeight:600,color:'var(--text)'}}>{quote.current?.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:asset.type==='Crypto'?2:2})}</div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:quote.change>=0?'var(--buy)':'var(--sell)'}}>{quote.change>=0?'+':''}{quote.change?.toFixed(2)}%</div>
              {signal&&(
                <span style={{fontFamily:'var(--font-head)',fontSize:9,letterSpacing:1.5,fontWeight:700,color:sigColor(aiAnalysis?.short_signal||signal.shortTerm||signal.signal),background:sigBg(aiAnalysis?.short_signal||signal.shortTerm||signal.signal),border:`1px solid ${sigColor(aiAnalysis?.short_signal||signal.shortTerm||signal.signal)}`,borderRadius:3,padding:'2px 7px',display:'inline-block',marginTop:3}}>
                  {aiAnalysis?.short_signal||signal.shortTerm||signal.signal}
                </span>
              )}
            </>
          )}
        </div>

        <div style={{fontSize:10,color:'var(--muted)',textAlign:'center'}}>{expanded?'▲':'▼'}</div>
      </div>

      {/* Detail panel */}
      {expanded&&hasData&&(
        <DetailPanel candles={candles} quote={quote} signal={signal} aiAnalysis={aiAnalysis} aiLoading={aiLoading} aiActive={aiActive} />
      )}
    </div>
  )
}

function DetailPanel({candles, quote, signal, aiAnalysis, aiLoading, aiActive}) {
  const [chartType, setChartType] = useState('area') // 'area' | 'candle'
  const sigColor = s => s==='BUY'?'var(--buy)':s==='SELL'?'var(--sell)':'var(--hold)'
  const sigBg    = s => s==='BUY'?'var(--buy-bg)':s==='SELL'?'var(--sell-bg)':'var(--hold-bg)'
  const indColor = (v, low, hi) => v==null?'var(--text2)':v<=low?'var(--buy)':v>=hi?'var(--sell)':'var(--text2)'

  const indicators = [
    { l:'RSI 14',     v: candles.rsi!=null?`${candles.rsi}`:null,                                         c: indColor(candles.rsi,35,65) },
    { l:'SMA 20',     v: candles.sma20!=null?candles.sma20.toFixed(2):null,                                c: candles.trendUp?'var(--buy)':'var(--sell)' },
    { l:'SMA 50',     v: candles.sma50!=null?candles.sma50.toFixed(2):null },
    { l:'EMA 9',      v: candles.ema9!=null?candles.ema9.toFixed(2):null },
    { l:'EMA 21',     v: candles.ema21!=null?candles.ema21.toFixed(2):null },
    { l:'Cross SMA',  v: candles.goldenCross!=null?(candles.goldenCross?'☀ Golden':'☽ Death'):null,       c: candles.goldenCross?'var(--buy)':'var(--sell)' },
    { l:'Cross EMA',  v: candles.emaGolden!=null?(candles.emaGolden?'↑ EMA9>21':'↓ EMA9<21'):null,       c: candles.emaGolden?'var(--buy)':'var(--sell)' },
    { l:'MACD',       v: candles.macd?.signal,                                                             c: candles.macd?.signal==='bullish'?'var(--buy)':'var(--sell)' },
    { l:'MACD hist',  v: candles.macd?.histogram!=null?candles.macd.histogram.toFixed(4):null,            c: candles.macd?.histogram>0?'var(--buy)':'var(--sell)' },
    { l:'BB %',       v: candles.bb!=null?`${candles.bb.pct}%`:null,                                      c: indColor(candles.bb?.pct,20,80) },
    { l:'BB Squeeze', v: candles.bb?.squeeze!=null?(candles.bb.squeeze?'⚡ Sì':'— No'):null,              c: candles.bb?.squeeze?'var(--hold)':'var(--muted)' },
    { l:'Stoch %K',   v: candles.stoch!=null?`${candles.stoch.k}`:null,                                   c: indColor(candles.stoch?.k,20,80) },
    { l:'Stoch %D',   v: candles.stoch!=null?`${candles.stoch.d}`:null,                                   c: indColor(candles.stoch?.d,20,80) },
    { l:'ATR',        v: candles.atr?.value!=null?`${candles.atr.value.toFixed(2)} (${candles.atr.pct}%)`:null },
    { l:'OBV',        v: candles.obv?.trend,                                                               c: candles.obv?.signal==='bullish'?'var(--buy)':'var(--sell)' },
    { l:'VWAP',       v: candles.vwap?.value!=null?candles.vwap.value.toFixed(2):null,                    c: candles.vwap?.aboveVwap?'var(--buy)':'var(--sell)' },
    { l:'VWAP diff',  v: candles.vwap?.diff!=null?`${candles.vwap.diff}%`:null,                           c: candles.vwap?.aboveVwap?'var(--buy)':'var(--sell)' },
    { l:'Ichimoku',   v: candles.ichimoku?.signal,                                                         c: candles.ichimoku?.signal==='bullish'?'var(--buy)':candles.ichimoku?.signal==='bearish'?'var(--sell)':'var(--hold)' },
    { l:'Williams %R',v: candles.williamsR!=null?`${candles.williamsR.value}`:null,                       c: indColor(candles.williamsR?.value,-80,-20) },
    { l:'CCI 20',     v: candles.cci!=null?`${candles.cci.value}`:null,                                   c: indColor(candles.cci?.value,-100,100) },
    { l:'52W High',   v: candles.high52!=null?candles.high52.toFixed(2):null },
    { l:'52W Low',    v: candles.low52!=null?candles.low52.toFixed(2):null },
    { l:'Resistenza', v: candles.sr?.resistances?.[0]!=null?candles.sr.resistances[0].toFixed(2):null,   c:'var(--sell)' },
    { l:'Supporto',   v: candles.sr?.supports?.[0]!=null?candles.sr.supports[0].toFixed(2):null,         c:'var(--buy)' },
  ].filter(i=>i.v!=null)

  return (
    <div style={{borderTop:'1px solid var(--border)',padding:'20px 18px',display:'flex',flexDirection:'column',gap:20}}>

      {/* Chart with toggle */}
      <div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <span style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase'}}>Grafico 60 giorni</span>
          <div style={{display:'flex',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:6,overflow:'hidden'}}>
            {[{id:'area',l:'Area'},{ id:'candle',l:'Candele'}].map(t=>(
              <button key={t.id} onClick={()=>setChartType(t.id)} style={{background:chartType===t.id?'var(--surface2)':'transparent',border:'none',color:chartType===t.id?'var(--text)':'var(--muted)',fontFamily:'var(--font-mono)',fontSize:10,padding:'5px 14px',cursor:'pointer',letterSpacing:1}}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
        {chartType==='area' ? (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={candles.sparkline} margin={{top:4,right:4,bottom:0,left:0}}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={quote.change>=0?'var(--buy)':'var(--sell)'} stopOpacity={0.25}/>
                  <stop offset="100%" stopColor={quote.change>=0?'var(--buy)':'var(--sell)'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="i" hide />
              <YAxis domain={['auto','auto']} tick={{fontSize:9,fill:'var(--muted)'}} tickLine={false} axisLine={false} width={55} tickFormatter={v=>v.toFixed(2)} />
              <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:4,fontSize:11}} formatter={v=>[v.toFixed(4),'Prezzo']} labelFormatter={()=>''} />
              <Area type="monotone" dataKey="v" stroke={quote.change>=0?'var(--buy)':'var(--sell)'} fill="url(#areaGrad)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <CandlestickChart data={candles.candleData||[]} />
        )}
      </div>

      {/* Indicators grid */}
      <div>
        <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:10}}>Indicatori tecnici</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:6}}>
          {indicators.map((ind,i)=>(
            <div key={i} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:5,padding:'7px 12px'}}>
              <div style={{fontSize:8,letterSpacing:1.5,color:'var(--muted)',marginBottom:2,textTransform:'uppercase',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ind.l}</div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:12,color:ind.c||'var(--text)',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ind.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Signal rows */}
      {signal?.signals?.length>0&&(
        <div>
          <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:8}}>Segnali attivi</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
            {signal.signals.map((s,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:4,background:s.t==='buy'?'var(--buy-bg)':s.t==='sell'?'var(--sell-bg)':'var(--surface2)',fontSize:11}}>
                <span style={{fontFamily:'var(--font-mono)',fontWeight:600,color:s.t==='buy'?'var(--buy)':s.t==='sell'?'var(--sell)':'var(--muted)',minWidth:70,flexShrink:0}}>{s.l}</span>
                <span style={{color:'var(--muted)',minWidth:55,flexShrink:0,fontFamily:'var(--font-mono)',fontSize:10}}>{s.v}</span>
                <span style={{color:s.t==='buy'?'var(--buy)':s.t==='sell'?'var(--sell)':'var(--text2)',opacity:.85,fontSize:10}}>{s.n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* S/R levels */}
      {candles.sr&&(candles.sr.supports?.length>0||candles.sr.resistances?.length>0)&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <div style={{fontSize:9,letterSpacing:2,color:'var(--buy)',textTransform:'uppercase',marginBottom:6}}>Supporti</div>
            {candles.sr.supports.map((v,i)=><div key={i} style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--buy)',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>{v.toFixed(2)}</div>)}
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:2,color:'var(--sell)',textTransform:'uppercase',marginBottom:6}}>Resistenze</div>
            {candles.sr.resistances.map((v,i)=><div key={i} style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--sell)',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>{v.toFixed(2)}</div>)}
          </div>
        </div>
      )}

      {/* Short vs Long */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1px 1fr',gap:20}}>
        {[
          {label:'Breve termine',sig:aiAnalysis?.short_signal||signal?.shortTerm||signal?.signal,conf:aiAnalysis?.short_confidence,rationale:aiAnalysis?.short_rationale},
          {label:'Lungo termine', sig:aiAnalysis?.long_signal||signal?.longTerm||signal?.signal, conf:aiAnalysis?.long_confidence, rationale:aiAnalysis?.long_rationale},
        ].map((b,i)=>[
          i===1&&<div key="div" style={{background:'var(--border)'}} />,
          <div key={b.label}>
            <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:8}}>{b.label}</div>
            {b.sig&&<span style={{fontFamily:'var(--font-head)',fontSize:16,fontWeight:700,letterSpacing:2,color:sigColor(b.sig),background:sigBg(b.sig),border:`1px solid ${sigColor(b.sig)}`,borderRadius:3,padding:'5px 14px',display:'inline-block'}}>{b.sig==='BUY'?'ACQUISTA':b.sig==='SELL'?'VENDI':'ATTENDI'}</span>}
            {b.conf&&<div style={{fontSize:11,color:'var(--muted)',marginTop:6}}>{b.conf}% confidenza</div>}
            {b.rationale&&<p style={{fontSize:12,color:'var(--text2)',lineHeight:1.6,marginTop:6}}>{b.rationale}</p>}
          </div>
        ])}
      </div>

      {/* AI */}
      {aiActive&&(
        <div style={{background:'rgba(59,130,246,0.04)',border:'1px solid rgba(59,130,246,0.15)',borderRadius:6,padding:16}}>
          <div style={{fontSize:9,letterSpacing:3,color:'var(--accent2)',textTransform:'uppercase',marginBottom:12}}>◈ Analisi AI</div>
          {aiLoading&&<div style={{display:'flex',alignItems:'center',gap:10,fontSize:12,color:'var(--muted)'}}><div style={{width:16,height:16,border:'2px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin .8s linear infinite'}} />Claude sta analizzando...</div>}
          {aiAnalysis&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {aiAnalysis.macro&&<AiBlock label="Contesto Macro" text={aiAnalysis.macro} />}
              {aiAnalysis.geopolitical&&<AiBlock label="Geopolitica" text={aiAnalysis.geopolitical} />}
              {aiAnalysis.risks?.length>0&&(
                <div>
                  <div style={{fontSize:9,letterSpacing:2,color:'var(--muted)',textTransform:'uppercase',marginBottom:6}}>Rischi</div>
                  {aiAnalysis.risks.map((r,i)=><div key={i} style={{fontSize:12,color:'rgba(244,63,94,0.8)',paddingLeft:12,lineHeight:1.5}}>• {r}</div>)}
                </div>
              )}
              {aiAnalysis.opportunities?.length>0&&(
                <div>
                  <div style={{fontSize:9,letterSpacing:2,color:'var(--muted)',textTransform:'uppercase',marginBottom:6}}>Opportunità</div>
                  {aiAnalysis.opportunities.map((o,i)=><div key={i} style={{fontSize:12,color:'rgba(16,217,138,0.8)',paddingLeft:12,lineHeight:1.5}}>• {o}</div>)}
                </div>
              )}
              {aiAnalysis.pac_suggestion&&(
                <div style={{background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:4,padding:'10px 12px',fontSize:12,color:'var(--hold)',display:'flex',gap:8}}>
                  <span>◷</span><span>{aiAnalysis.pac_suggestion}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Candlestick chart (custom SVG via recharts ComposedChart trick) ────────────
function CandlestickChart({data}) {
  if (!data?.length) return <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:12}}>Dati candele non disponibili</div>
  const w=900, h=160, pad={t:8,b:20,l:50,r:4}
  const iw=w-pad.l-pad.r, ih=h-pad.t-pad.b
  const vals=[...data.map(d=>d.h),...data.map(d=>d.l)]
  const mn=Math.min(...vals), mx=Math.max(...vals)
  const rng=mx-mn||1
  const toY=v=>pad.t+ih-(v-mn)/rng*ih
  const cw=Math.max(2,Math.floor(iw/data.length)-2)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:160,display:'block'}}>
      {/* Y axis labels */}
      {[0,.25,.5,.75,1].map(p=>{
        const val=mn+rng*p
        const y=toY(val)
        return <g key={p}>
          <line x1={pad.l-4} y1={y} x2={w-pad.r} y2={y} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3,3"/>
          <text x={pad.l-6} y={y+4} fontSize={9} fill="var(--muted)" textAnchor="end">{val.toFixed(2)}</text>
        </g>
      })}
      {/* Candles */}
      {data.map((d,i)=>{
        const x=pad.l+i*(iw/data.length)+iw/data.length/2
        const bull=d.c>=d.o
        const col=bull?'var(--buy)':'var(--sell)'
        const bodyT=toY(Math.max(d.o,d.c)), bodyB=toY(Math.min(d.o,d.c))
        const bodyH=Math.max(1,bodyB-bodyT)
        return <g key={i}>
          <line x1={x} y1={toY(d.h)} x2={x} y2={toY(d.l)} stroke={col} strokeWidth={1}/>
          <rect x={x-cw/2} y={bodyT} width={cw} height={bodyH} fill={bull?col:'none'} stroke={col} strokeWidth={1}/>
        </g>
      })}
      {/* X labels every 10 candles */}
      {data.filter((_,i)=>i%10===0).map((d,i,arr)=>{
        const idx=data.indexOf(d)
        const x=pad.l+idx*(iw/data.length)+iw/data.length/2
        return <text key={i} x={x} y={h-4} fontSize={8} fill="var(--muted)" textAnchor="middle">{d.t}</text>
      })}
    </svg>
  )
}

function AiBlock({label, text}) {
  return (
    <div>
      <div style={{fontSize:9,letterSpacing:2,color:'var(--accent2)',textTransform:'uppercase',marginBottom:5}}>{label}</div>
      <p style={{fontSize:12,color:'var(--text2)',lineHeight:1.7}}>{text}</p>
    </div>
  )
}

// ─── PORTFOLIO PAGE ──────────────────────────────────────────────────────────

function PortfolioPage() {
  const { s, aiActive } = useSettings()
  const [holdings, setHoldings] = useState(()=>loadPortfolio())
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({assetId:'',qty:'',price:'',date:''})
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(()=>savePortfolio(holdings),[holdings])
  const stats = portfolioStats(holdings)
  const PIE_COLORS=['#3b82f6','#10d98a','#f59e0b','#f43f5e','#8b5cf6','#06b6d4']

  const refresh = async () => {
    if (!s.finnhubKey||!holdings.length) return
    setRefreshing(true)
    const quotes={}
    await Promise.allSettled(holdings.map(async h=>{
      const asset=ALL_ASSETS.find(a=>a.id===h.id)
      if (asset){const q=await fetchQuote(asset.symbol,s.finnhubKey);if(q.ok)quotes[h.id]=q}
    }))
    setHoldings(p=>updatePrices(p,quotes))
    setRefreshing(false)
  }

  const doAI = async () => {
    setAiLoading(true)
    const r=await analyzePortfolio(holdings,s.anthropicKey)
    setAiAnalysis(r); setAiLoading(false)
  }

  const handleAdd = () => {
    const asset=ALL_ASSETS.find(a=>a.id===form.assetId)
    if (!asset||!form.qty||!form.price) return
    setHoldings(p=>addHolding(p,asset,parseFloat(form.qty),parseFloat(form.price),form.date))
    setForm({assetId:'',qty:'',price:'',date:''}); setShowAdd(false)
  }

  const pieData=Object.entries(stats.byType||{}).map(([name,value])=>({name,value:Math.round(value)}))

  return (
    <div style={{padding:'32px 40px 60px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <h1 style={{fontFamily:'var(--font-head)',fontSize:32,fontWeight:800,letterSpacing:2,color:'var(--text)'}}>Portfolio</h1>
        <div style={{display:'flex',gap:10}}>
          <Btn onClick={refresh} disabled={refreshing}>{refreshing?'⟳ ..':'⟳ Aggiorna'}</Btn>
          <BtnPrimary onClick={()=>setShowAdd(p=>!p)}>{showAdd?'✕ Chiudi':'+ Aggiungi'}</BtnPrimary>
        </div>
      </div>

      {/* Stats */}
      {holdings.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
          <StatCard label="Valore totale" value={`€ ${stats.totalValue.toLocaleString('it-IT',{maximumFractionDigits:0})}`} />
          <StatCard label="Investito" value={`€ ${stats.totalCost.toLocaleString('it-IT',{maximumFractionDigits:0})}`} />
          <StatCard label="P&L" value={`${stats.totalPnl>=0?'+':''}€ ${Math.abs(stats.totalPnl).toLocaleString('it-IT',{maximumFractionDigits:0})}`} sub={`${stats.totalPnl>=0?'+':''}${stats.totalPnlPct.toFixed(2)}%`} color={stats.totalPnl>=0?'var(--buy)':'var(--sell)'} />
          <StatCard label="Posizioni" value={holdings.length} />
        </div>
      )}

      {/* Add form */}
      {showAdd&&(
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:20,marginBottom:24}}>
          <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:14}}>Aggiungi posizione</div>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:10,alignItems:'end'}}>
            <select value={form.assetId} onChange={e=>setForm(p=>({...p,assetId:e.target.value}))} style={inputSt}>
              <option value="">Seleziona asset...</option>
              <optgroup label="ETF">{ETF_LIST.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>
              <optgroup label="Materie Prime">{COMMODITY_LIST.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>
              <optgroup label="Crypto">{CRYPTO_LIST.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>
            </select>
            <input style={inputSt} type="number" placeholder="Quantità" value={form.qty} onChange={e=>setForm(p=>({...p,qty:e.target.value}))} />
            <input style={inputSt} type="number" placeholder="Prezzo €" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} />
            <input style={inputSt} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} />
            <BtnPrimary onClick={handleAdd}>Aggiungi</BtnPrimary>
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20,alignItems:'start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {holdings.length===0&&<div style={{textAlign:'center',padding:60,color:'var(--text2)',fontSize:13}}>
            <div style={{fontSize:36,color:'var(--muted)',marginBottom:12}}>◉</div>
            Nessuna posizione — aggiungi i tuoi investimenti
          </div>}
          {holdings.map(h=>(
            <div key={h.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:'14px 18px',display:'flex',alignItems:'center',gap:16}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:'var(--font-head)',fontSize:14,color:'var(--text)'}}>{h.name}</div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{h.symbol?.split(':')[0]} · {h.quantity} unità · avg €{h.avgPrice?.toFixed(2)}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--font-head)',fontSize:16,color:'var(--text)'}}>€ {((h.currentPrice||h.avgPrice)*h.quantity).toLocaleString('it-IT',{maximumFractionDigits:0})}</div>
                <div style={{fontSize:11,fontFamily:'var(--font-mono)',color:(h.pnl||0)>=0?'var(--buy)':'var(--sell)'}}>{(h.pnl||0)>=0?'+':''}€{(h.pnl||0).toFixed(0)} ({(h.pnlPct||0).toFixed(2)}%)</div>
              </div>
              <button onClick={()=>setHoldings(p=>removeHolding(p,h.id))} style={{background:'transparent',border:'none',color:'var(--muted)',fontSize:12,cursor:'pointer',padding:'4px 6px',borderRadius:3}}>✕</button>
            </div>
          ))}
        </div>

        {pieData.length>1&&(
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:18}}>
            <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:14}}>Allocazione</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie><Tooltip formatter={v=>`€ ${v.toLocaleString('it-IT')}`} contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:4,fontSize:11}} /></PieChart>
            </ResponsiveContainer>
            {pieData.map((d,i)=>(
              <div key={d.name} style={{display:'flex',alignItems:'center',gap:8,fontSize:11,color:'var(--text2)',marginTop:6}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:PIE_COLORS[i%PIE_COLORS.length],display:'inline-block'}} />
                <span style={{flex:1}}>{d.name}</span>
                <span style={{color:'var(--muted)'}}>{((d.value/stats.totalValue)*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {aiActive&&holdings.length>0&&(
        <div style={{marginTop:24,background:'rgba(59,130,246,0.04)',border:'1px solid rgba(59,130,246,0.15)',borderRadius:6,padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <span style={{fontSize:9,letterSpacing:3,color:'var(--accent2)',textTransform:'uppercase'}}>◈ Analisi AI portafoglio</span>
            <Btn onClick={doAI} disabled={aiLoading}>{aiLoading?'⟳ Analisi...':'▶ Analizza'}</Btn>
          </div>
          {aiAnalysis&&(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                {[{l:'Salute',v:aiAnalysis.overall_health},{l:'Diversif.',v:`${aiAnalysis.diversification_score}/100`},{l:'Rischio',v:`${aiAnalysis.risk_score}/100`}].map(x=>(
                  <div key={x.l} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 14px'}}>
                    <div style={{fontSize:9,letterSpacing:2,color:'var(--muted)',textTransform:'uppercase'}}>{x.l}</div>
                    <div style={{fontFamily:'var(--font-head)',fontSize:14,color:'var(--text)',marginTop:2,textTransform:'capitalize'}}>{x.v}</div>
                  </div>
                ))}
              </div>
              {aiAnalysis.summary&&<p style={{fontSize:12,color:'var(--text2)',lineHeight:1.7}}>{aiAnalysis.summary}</p>}
              {aiAnalysis.rebalancing&&<div style={{fontSize:12,color:'var(--hold)',background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:4,padding:'10px 14px'}}><strong>Ribilanciamento:</strong> {aiAnalysis.rebalancing}</div>}
              {aiAnalysis.suggestions?.map((s,i)=><div key={i} style={{fontSize:12,color:'var(--text2)',paddingLeft:12}}>• {s}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PAC PAGE ─────────────────────────────────────────────────────────────────

function PACPage() {
  const [p, setP] = useState({monthlyAmount:300,years:20,annualReturn:8,initialAmount:0,inflationRate:2})
  const [showScenarios, setShowScenarios] = useState(false)
  const set = (k,v) => setP(prev=>({...prev,[k]:parseFloat(v)||0}))
  const result = simulatePAC(p)
  const scenarios = showScenarios ? multiScenario(p) : null

  const chartData = showScenarios
    ? result.data.map((d,i)=>({year:`A${d.year}`,pessimistico:scenarios.pessimistic.data[i]?.portfolio,base:scenarios.base.data[i]?.portfolio,ottimistico:scenarios.optimistic.data[i]?.portfolio,investito:d.invested}))
    : result.data.map(d=>({year:`A${d.year}`,portafoglio:d.portfolio,investito:d.invested}))

  return (
    <div style={{padding:'32px 40px 60px'}}>
      <h1 style={{fontFamily:'var(--font-head)',fontSize:32,fontWeight:800,letterSpacing:2,color:'var(--text)',marginBottom:6}}>Simulatore PAC</h1>
      <p style={{fontSize:12,color:'var(--muted)',marginBottom:28}}>Piano di Accumulo del Capitale</p>

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:24,alignItems:'start'}}>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:22,display:'flex',flexDirection:'column',gap:20}}>
          {[
            {l:'Investimento mensile',k:'monthlyAmount',min:50,max:5000,step:50,fmt:v=>`€ ${v}`},
            {l:'Capitale iniziale',k:'initialAmount',min:0,max:100000,step:1000,fmt:v=>`€ ${Number(v).toLocaleString()}`},
            {l:'Durata',k:'years',min:1,max:40,step:1,fmt:v=>`${v} anni`},
            {l:'Rendimento annuo',k:'annualReturn',min:1,max:25,step:0.5,fmt:v=>`${v}%`},
            {l:'Inflazione stimata',k:'inflationRate',min:0,max:8,step:0.5,fmt:v=>`${v}%`},
          ].map(({l,k,min,max,step,fmt})=>(
            <div key={k}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:11,color:'var(--text2)'}}>{l}</span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--text)',fontWeight:500}}>{fmt(p[k])}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={p[k]} onChange={e=>set(k,e.target.value)} style={{width:'100%',accentColor:'var(--accent)'}} />
            </div>
          ))}
          <div style={{borderTop:'1px solid var(--border)',paddingTop:16}}>
            <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:10}}>Rendimenti storici</div>
            {Object.entries(BENCHMARKS).map(([name,d])=>(
              <div key={name} onClick={()=>set('annualReturn',d.avg)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',borderRadius:4,cursor:'pointer',marginBottom:2}} onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{fontSize:11,color:'var(--text2)'}}>{name}</span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--buy)'}}>{d.avg}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            <StatCard label="Valore finale" value={`€ ${result.finalValue.toLocaleString('it-IT')}`} accent />
            <StatCard label="Totale investito" value={`€ ${result.finalInvested.toLocaleString('it-IT')}`} />
            <StatCard label="Guadagno" value={`+€ ${result.totalGain.toLocaleString('it-IT')}`} sub={`+${result.gainPct}%`} color="var(--buy)" />
            <StatCard label="Valore reale" value={`€ ${result.realValue.toLocaleString('it-IT')}`} sub="adj. inflazione" />
          </div>

          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:20}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <span style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase'}}>Proiezione</span>
              <button onClick={()=>setShowScenarios(p=>!p)} style={{background:showScenarios?'rgba(59,130,246,0.15)':'var(--surface2)',border:`1px solid ${showScenarios?'var(--accent)':'var(--border2)'}`,borderRadius:6,color:showScenarios?'var(--accent2)':'var(--text2)',fontFamily:'var(--font-mono)',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>3 Scenari</button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
                <defs>
                  <linearGradient id="gBuy" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--buy)" stopOpacity={0.3}/><stop offset="100%" stopColor="var(--buy)" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gSell" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--sell)" stopOpacity={0.1}/><stop offset="100%" stopColor="var(--sell)" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{fontSize:10,fill:'var(--muted)'}} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{fontSize:10,fill:'var(--muted)'}} tickLine={false} axisLine={false} tickFormatter={v=>`€${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:4,fontSize:11}} formatter={v=>[`€ ${v?.toLocaleString('it-IT')}`]} />
                {showScenarios?<>
                  <Area type="monotone" dataKey="ottimistico" stroke="var(--buy)" fill="url(#gBuy)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="base" stroke="var(--accent)" fill="none" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="pessimistico" stroke="var(--sell)" fill="url(#gSell)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="investito" stroke="var(--muted)" fill="none" strokeWidth={1} strokeDasharray="4 2" dot={false} />
                </>:<>
                  <Area type="monotone" dataKey="portafoglio" stroke="var(--buy)" fill="url(#gBuy)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="investito" stroke="var(--muted)" fill="none" strokeWidth={1} strokeDasharray="4 2" dot={false} />
                </>}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ALERTS PAGE ─────────────────────────────────────────────────────────────

function AlertsPage() {
  const { s } = useSettings()
  const [alerts, setAlerts] = useState(()=>{try{return JSON.parse(localStorage.getItem('nexus_v2_alerts')||'[]')}catch{return[]}})
  const [form, setForm] = useState({assetId:'',condition:'above',price:''})
  const [checking, setChecking] = useState(false)
  useEffect(()=>{try{localStorage.setItem('nexus_v2_alerts',JSON.stringify(alerts))}catch{}},[alerts])

  const add = () => {
    const asset=ALL_ASSETS.find(a=>a.id===form.assetId)
    if (!asset||!form.price) return
    setAlerts(p=>[{id:Date.now(),assetId:asset.id,symbol:asset.symbol,name:asset.name,condition:form.condition,price:parseFloat(form.price),createdAt:new Date().toLocaleDateString('it-IT'),triggered:false,currentPrice:null},...p])
    setForm({assetId:'',condition:'above',price:''})
  }

  const check = async () => {
    if (!s.finnhubKey||!alerts.length) return
    setChecking(true)
    const updated=[...alerts]
    await Promise.allSettled(updated.map(async(a,i)=>{
      const asset=ALL_ASSETS.find(x=>x.id===a.assetId); if(!asset)return
      const q=await fetchQuote(asset.symbol,s.finnhubKey); if(!q.ok)return
      updated[i]={...a,currentPrice:q.current,triggered:a.condition==='above'?q.current>=a.price:q.current<=a.price,lastCheck:new Date().toLocaleTimeString('it-IT')}
    }))
    setAlerts(updated); setChecking(false)
  }

  const triggered=alerts.filter(a=>a.triggered)
  const pending=alerts.filter(a=>!a.triggered)

  return (
    <div style={{padding:'32px 40px 60px',maxWidth:860}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontFamily:'var(--font-head)',fontSize:32,fontWeight:800,letterSpacing:2,color:'var(--text)'}}>Alerts</h1>
          <p style={{fontSize:12,color:'var(--muted)',marginTop:4}}>Soglie di prezzo personalizzate</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          {triggered.length>0&&<button onClick={()=>setAlerts(p=>p.filter(a=>!a.triggered))} style={{background:'rgba(244,63,94,0.08)',border:'1px solid rgba(244,63,94,0.3)',borderRadius:6,color:'var(--sell)',fontFamily:'var(--font-mono)',fontSize:11,padding:'8px 14px',cursor:'pointer'}}>Cancella scattati ({triggered.length})</button>}
          <Btn onClick={check} disabled={checking||!s.finnhubKey}>{checking?'⟳ Controllo...':'⟳ Controlla ora'}</Btn>
        </div>
      </div>

      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:20,marginBottom:24}}>
        <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:14}}>Nuovo alert</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <select value={form.assetId} onChange={e=>setForm(p=>({...p,assetId:e.target.value}))} style={{...inputSt,flex:2,minWidth:200}}>
            <option value="">Seleziona asset...</option>
            <optgroup label="ETF">{ETF_LIST.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>
            <optgroup label="Materie Prime">{COMMODITY_LIST.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>
            <optgroup label="Crypto">{CRYPTO_LIST.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>
          </select>
          <select value={form.condition} onChange={e=>setForm(p=>({...p,condition:e.target.value}))} style={{...inputSt,width:140}}>
            <option value="above">Sopra ↑</option>
            <option value="below">Sotto ↓</option>
          </select>
          <input type="number" placeholder="Prezzo soglia" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} style={{...inputSt,width:150}} />
          <BtnPrimary onClick={add}>+ Aggiungi</BtnPrimary>
        </div>
      </div>

      {triggered.length>0&&(
        <div style={{marginBottom:24}}>
          <div style={{fontSize:9,letterSpacing:3,color:'var(--buy)',textTransform:'uppercase',marginBottom:10}}>⚡ Scattati ({triggered.length})</div>
          {triggered.map(a=><AlertRow key={a.id} alert={a} onRemove={()=>setAlerts(p=>p.filter(x=>x.id!==a.id))} />)}
        </div>
      )}

      <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:10}}>In attesa ({pending.length})</div>
      {pending.length===0&&<div style={{textAlign:'center',padding:50,color:'var(--text2)',fontSize:13}}><div style={{fontSize:32,color:'var(--muted)',marginBottom:10}}>◬</div>Nessun alert attivo</div>}
      {pending.map(a=><AlertRow key={a.id} alert={a} onRemove={()=>setAlerts(p=>p.filter(x=>x.id!==a.id))} />)}
    </div>
  )
}

function AlertRow({alert, onRemove}) {
  return (
    <div style={{background:alert.triggered?'var(--buy-bg)':'var(--surface)',border:`1px solid ${alert.triggered?'var(--buy)':'var(--border)'}`,borderRadius:6,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,marginBottom:8}}>
      <span style={{fontSize:18,width:24,textAlign:'center',color:alert.triggered?'var(--buy)':'var(--muted)'}}>{alert.triggered?'⚡':alert.condition==='above'?'↑':'↓'}</span>
      <div style={{flex:1}}>
        <div style={{fontFamily:'var(--font-head)',fontSize:14,color:'var(--text)'}}>{alert.name}</div>
        <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>
          {alert.condition==='above'?'Sopra':'Sotto'} <strong style={{color:'var(--text)'}}>€ {alert.price.toLocaleString('it-IT')}</strong>
          {alert.currentPrice&&<> · Attuale: <strong style={{color:'var(--text)'}}>€ {alert.currentPrice.toFixed(2)}</strong></>}
          <span style={{marginLeft:8,color:'var(--muted)'}}>· {alert.createdAt}</span>
          {alert.lastCheck&&<span style={{marginLeft:8,color:'var(--muted)'}}>· check {alert.lastCheck}</span>}
        </div>
      </div>
      {alert.triggered&&<span style={{fontFamily:'var(--font-head)',fontSize:10,letterSpacing:2,color:'var(--buy)',border:'1px solid var(--buy)',padding:'3px 8px',borderRadius:3}}>SCATTATO</span>}
      <button onClick={onRemove} style={{background:'transparent',border:'none',color:'var(--muted)',fontSize:12,cursor:'pointer',padding:'4px 6px',borderRadius:3}}>✕</button>
    </div>
  )
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────

function SettingsPage() {
  const { s, update, aiActive } = useSettings()
  const [fk, setFk] = useState(s.finnhubKey||'')
  const [ak, setAk] = useState(s.anthropicKey||'')
  const [showF, setShowF] = useState(false)
  const [showA, setShowA] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = () => {
    update({finnhubKey:fk.trim(),anthropicKey:ak.trim()})
    setSaved(true); setTimeout(()=>setSaved(false),2000)
  }

  return (
    <div style={{padding:'32px 40px',maxWidth:720}}>
      <h1 style={{fontFamily:'var(--font-head)',fontSize:32,fontWeight:800,letterSpacing:2,color:'var(--text)',marginBottom:6}}>Impostazioni</h1>
      <p style={{fontSize:12,color:'var(--muted)',marginBottom:32}}>Configura le chiavi API e le preferenze</p>

      <div style={{display:'flex',flexDirection:'column',gap:24}}>

        {/* Finnhub */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:22}}>
          <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:14}}>Finnhub API — Dati di mercato</div>
          <p style={{fontSize:12,color:'var(--text2)',marginBottom:14,lineHeight:1.6}}>Gratuita — 60 chiamate/min. Registrati su <a href="https://finnhub.io/register" target="_blank" rel="noreferrer" style={{color:'var(--accent2)'}}>finnhub.io/register</a></p>
          <div style={{display:'flex',gap:8}}>
            <input type={showF?'text':'password'} value={fk} onChange={e=>setFk(e.target.value)} placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" style={{...inputSt,flex:1}} />
            <button onClick={()=>setShowF(p=>!p)} style={{background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:6,padding:'0 12px',color:'var(--text2)',cursor:'pointer'}}>{showF?'🙈':'👁'}</button>
          </div>
          {fk.startsWith('pk_')&&<div style={{fontSize:11,color:'var(--buy)',marginTop:6}}>✓ Formato corretto</div>}
        </div>

        {/* AI Toggle */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:22}}>
          <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:14}}>Analisi AI — Opzionale</div>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}}>
            <div>
              <div style={{fontSize:13,color:'var(--text)',marginBottom:6}}>Abilita analisi AI con Claude</div>
              <p style={{fontSize:12,color:'var(--text2)',lineHeight:1.6,maxWidth:480}}>Aggiunge analisi geopolitica, segnali BUY/HOLD/SELL motivati e consigli PAC. ~€0.01 per analisi. <strong style={{color:'var(--text)'}}>Disattivando, tutte le altre funzionalità continuano normalmente.</strong></p>
            </div>
            <button onClick={()=>update({aiEnabled:!s.aiEnabled})} style={{width:44,height:24,background:s.aiEnabled?'var(--buy)':'var(--border2)',border:'none',borderRadius:12,position:'relative',cursor:'pointer',flexShrink:0,marginTop:2,transition:'background .2s'}}>
              <span style={{position:'absolute',top:3,left:s.aiEnabled?21:3,width:18,height:18,background:'white',borderRadius:'50%',transition:'left .2s',display:'block'}} />
            </button>
          </div>
          {s.aiEnabled&&(
            <div style={{marginTop:16}}>
              <p style={{fontSize:12,color:'var(--text2)',marginBottom:12,lineHeight:1.6}}>Chiave Anthropic da <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{color:'var(--accent2)'}}>console.anthropic.com</a>. Salvata solo nel browser.</p>
              <div style={{display:'flex',gap:8}}>
                <input type={showA?'text':'password'} value={ak} onChange={e=>setAk(e.target.value)} placeholder="sk-ant-api03-..." style={{...inputSt,flex:1}} />
                <button onClick={()=>setShowA(p=>!p)} style={{background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:6,padding:'0 12px',color:'var(--text2)',cursor:'pointer'}}>{showA?'🙈':'👁'}</button>
              </div>
              {ak.startsWith('sk-ant-')&&<div style={{fontSize:11,color:'var(--buy)',marginTop:6}}>✓ Formato corretto</div>}
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:22}}>
          <div style={{fontSize:9,letterSpacing:3,color:'var(--muted)',textTransform:'uppercase',marginBottom:14}}>Stato attuale</div>
          {[
            {l:'Dati di mercato',on:!!s.finnhubKey,desc:s.finnhubKey?'Finnhub connesso':'Chiave non configurata'},
            {l:'Analisi AI',on:aiActive,desc:aiActive?'Claude attivo':s.aiEnabled&&!s.anthropicKey?'Chiave Anthropic mancante':'Disattivata — funzioni base attive'},
          ].map(x=>(
            <div key={x.l} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:x.on?'var(--buy)':'var(--muted)',display:'inline-block',boxShadow:x.on?'0 0 6px var(--buy)':'none'}} />
              <div>
                <div style={{fontSize:12,color:'var(--text)'}}>{x.l}</div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:1}}>{x.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={save} style={{background:saved?'var(--buy)':'var(--accent)',border:'none',borderRadius:6,color:'white',fontFamily:'var(--font-head)',fontSize:14,fontWeight:700,letterSpacing:2,padding:'13px 32px',cursor:'pointer',alignSelf:'flex-start',transition:'background .2s'}}>
          {saved?'✓ Salvato':'Salva impostazioni'}
        </button>

        <div style={{padding:16,background:'rgba(244,63,94,0.05)',border:'1px solid rgba(244,63,94,0.15)',borderRadius:6,fontSize:11,color:'var(--text2)',lineHeight:1.7}}>
          <strong style={{color:'var(--sell)'}}>⚠ DISCLAIMER</strong> — NEXUS è uno strumento informativo per uso personale. Non costituisce consulenza finanziaria. Ogni decisione è responsabilità esclusiva dell'utente.
        </div>
      </div>
    </div>
  )
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function StatCard({label,value,sub,color,accent}) {
  return (
    <div style={{background:accent?'rgba(59,130,246,0.06)':'var(--surface)',border:`1px solid ${accent?'var(--accent)':'var(--border)'}`,borderRadius:6,padding:'16px 18px'}}>
      <div style={{fontSize:9,letterSpacing:2,color:'var(--muted)',textTransform:'uppercase',marginBottom:6}}>{label}</div>
      <div style={{fontFamily:'var(--font-head)',fontSize:20,fontWeight:700,color:color||'var(--text)'}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:color||'var(--muted)',marginTop:3}}>{sub}</div>}
    </div>
  )
}

function Btn({children, onClick, disabled}) {
  return <button onClick={onClick} disabled={disabled} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text2)',fontFamily:'var(--font-mono)',fontSize:11,padding:'8px 14px',cursor:disabled?'default':'pointer',opacity:disabled?.5:1}}>{children}</button>
}

function BtnPrimary({children, onClick}) {
  return <button onClick={onClick} style={{background:'var(--accent)',border:'none',borderRadius:6,color:'white',fontFamily:'var(--font-head)',fontSize:12,fontWeight:700,letterSpacing:1,padding:'9px 18px',cursor:'pointer',whiteSpace:'nowrap'}}>{children}</button>
}

const inputSt = {background:'var(--bg)',border:'1px solid var(--border2)',borderRadius:6,color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:12,padding:'9px 12px',outline:'none',width:'100%'}
