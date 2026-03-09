// Database asset — simboli Finnhub

export const ETF_LIST = [
  { id: 'vwce',  symbol: 'VWCE:XETRA', name: 'Vanguard FTSE All-World',        ter: 0.22, category: 'globale',    type: 'ETF' },
  { id: 'swda',  symbol: 'SWDA:XETRA', name: 'iShares Core MSCI World',         ter: 0.20, category: 'globale',    type: 'ETF' },
  { id: 'webg',  symbol: 'WEBG:XETRA', name: 'Amundi Prime All Country World',  ter: 0.07, category: 'globale',    type: 'ETF' },
  { id: 'cspx',  symbol: 'CSPX:XETRA', name: 'iShares Core S&P 500',           ter: 0.07, category: 'usa',        type: 'ETF' },
  { id: 'vuaa',  symbol: 'VUAA:XETRA', name: 'Vanguard S&P 500',               ter: 0.07, category: 'usa',        type: 'ETF' },
  { id: 'eqqq',  symbol: 'EQQQ:XETRA', name: 'Invesco Nasdaq 100',             ter: 0.30, category: 'usa',        type: 'ETF' },
  { id: 'sxr8',  symbol: 'SXR8:XETRA', name: 'iShares Core S&P 500 EUR Hdg',  ter: 0.10, category: 'usa',        type: 'ETF' },
  { id: 'exsa',  symbol: 'EXSA:XETRA', name: 'iShares Core EURO STOXX 50',     ter: 0.10, category: 'europa',     type: 'ETF' },
  { id: 'meud',  symbol: 'MEUD:XETRA', name: 'Lyxor EuroStoxx 600',            ter: 0.07, category: 'europa',     type: 'ETF' },
  { id: 'exs1',  symbol: 'EXS1:XETRA', name: 'iShares Core DAX',               ter: 0.16, category: 'europa',     type: 'ETF' },
  { id: 'spyw',  symbol: 'SPYW:XETRA', name: 'SPDR Europe Dividend Aristocr',  ter: 0.30, category: 'europa',     type: 'ETF' },
  { id: 'iema',  symbol: 'IEMA:XETRA', name: 'iShares Core MSCI EM IMI',       ter: 0.18, category: 'emergenti',  type: 'ETF' },
  { id: 'vfem',  symbol: 'VFEM:XETRA', name: 'Vanguard FTSE Emerging Markets', ter: 0.22, category: 'emergenti',  type: 'ETF' },
  { id: 'cjpa',  symbol: 'CJPA:XETRA', name: 'iShares Core MSCI Japan IMI',    ter: 0.15, category: 'emergenti',  type: 'ETF' },
  { id: 'xcha',  symbol: 'XCHA:XETRA', name: 'Xtrackers MSCI China',           ter: 0.20, category: 'emergenti',  type: 'ETF' },
  { id: 'qdve',  symbol: 'QDVE:XETRA', name: 'iShares S&P 500 Info Tech',      ter: 0.15, category: 'settoriale', type: 'ETF' },
  { id: 'iuhs',  symbol: 'IUHS:XETRA', name: 'iShares S&P 500 Health Care',    ter: 0.15, category: 'settoriale', type: 'ETF' },
  { id: 'exv1',  symbol: 'EXV1:XETRA', name: 'iShares STOXX Europe 600 Banks', ter: 0.46, category: 'settoriale', type: 'ETF' },
  { id: 'wtai',  symbol: 'WTAI:XETRA', name: 'WisdomTree AI & Innovation',     ter: 0.40, category: 'tematico',   type: 'ETF' },
  { id: 'lock',  symbol: 'LOCK:XETRA', name: 'iShares Digital Security',       ter: 0.40, category: 'tematico',   type: 'ETF' },
  { id: 'robo',  symbol: 'ROBO:XETRA', name: 'iShares Automation & Robotics',  ter: 0.40, category: 'tematico',   type: 'ETF' },
  { id: 'iqqh',  symbol: 'IQQH:XETRA', name: 'iShares Global Clean Energy',    ter: 0.65, category: 'tematico',   type: 'ETF' },
  { id: 'cemg',  symbol: 'CEMG:XETRA', name: 'VanEck Semiconductor',           ter: 0.35, category: 'tematico',   type: 'ETF' },
  { id: 'bate',  symbol: 'BATE:XETRA', name: 'WisdomTree Battery Solutions',   ter: 0.40, category: 'tematico',   type: 'ETF' },
]

export const COMMODITY_LIST = [
  { id: 'gold',   symbol: 'OANDA:XAUUSD',    name: 'Oro',            icon: '🥇', type: 'Commodity', desc: 'Safe haven & inflazione' },
  { id: 'silver', symbol: 'OANDA:XAGUSD',    name: 'Argento',        icon: '🥈', type: 'Commodity', desc: 'Metallo prezioso industriale' },
  { id: 'oil',    symbol: 'OANDA:BCOUSD',    name: 'Petrolio Brent', icon: '🛢️', type: 'Commodity', desc: 'Greggio europeo benchmark' },
  { id: 'natgas', symbol: 'OANDA:NATGASUSD', name: 'Gas Naturale',   icon: '🔥', type: 'Commodity', desc: 'Energia & geopolitica EU' },
  { id: 'copper', symbol: 'OANDA:XCUUSD',    name: 'Rame',           icon: '⚙️', type: 'Commodity', desc: 'Barometro economia globale' },
  { id: 'wheat',  symbol: 'OANDA:WHEATUSD',  name: 'Grano',          icon: '🌾', type: 'Commodity', desc: 'Commodity agricola' },
]

export const CRYPTO_LIST = [
  { id: 'btc', symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin',  icon: '₿',  type: 'Crypto', desc: 'Prima criptovaluta per cap.' },
  { id: 'eth', symbol: 'BINANCE:ETHUSDT', name: 'Ethereum', icon: '⟠',  type: 'Crypto', desc: 'Smart contract e DeFi' },
  { id: 'sol', symbol: 'BINANCE:SOLUSDT', name: 'Solana',   icon: '◎',  type: 'Crypto', desc: 'Layer 1 ad alta velocità' },
  { id: 'bnb', symbol: 'BINANCE:BNBUSDT', name: 'BNB',      icon: '🔶', type: 'Crypto', desc: 'Token Binance exchange' },
]

export const ALL_ASSETS = [...ETF_LIST, ...COMMODITY_LIST, ...CRYPTO_LIST]
