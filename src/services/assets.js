export const ETF_LIST = [
  // GLOBALI
  { id:'vwce',  symbol:'VWCE:XETRA',  isin:'IE00B3RBWM25', name:'Vanguard FTSE All-World',           ter:0.22, cat:'Globali',    type:'ETF', acc:true  },
  { id:'swda',  symbol:'SWDA:XETRA',  isin:'IE00B4L5Y983', name:'iShares Core MSCI World',           ter:0.20, cat:'Globali',    type:'ETF', acc:true  },
  { id:'webg',  symbol:'WEBG:XETRA',  isin:'IE0007J30ET5', name:'Amundi Prime All Country World',    ter:0.07, cat:'Globali',    type:'ETF', acc:true  },
  { id:'isac',  symbol:'ISAC:XETRA',  isin:'IE00B6R52259', name:'iShares MSCI ACWI',                 ter:0.20, cat:'Globali',    type:'ETF', acc:true  },
  { id:'imwd',  symbol:'IMWD:XETRA',  isin:'LU1781541179', name:'Lyxor Core MSCI World',             ter:0.12, cat:'Globali',    type:'ETF', acc:true  },
  { id:'iusq',  symbol:'IUSQ:XETRA',  isin:'IE00BD45KH83', name:'iShares MSCI ACWI IMI',             ter:0.17, cat:'Globali',    type:'ETF', acc:true  },

  // USA
  { id:'cspx',  symbol:'CSPX:XETRA',  isin:'IE00B5BMR087', name:'iShares Core S&P 500',             ter:0.07, cat:'USA',        type:'ETF', acc:true  },
  { id:'vuaa',  symbol:'VUAA:XETRA',  isin:'IE00B3XXRP09', name:'Vanguard S&P 500',                 ter:0.07, cat:'USA',        type:'ETF', acc:true  },
  { id:'sxr8',  symbol:'SXR8:XETRA',  isin:'IE00B4L5YC18', name:'iShares Core S&P 500 (Acc)',       ter:0.07, cat:'USA',        type:'ETF', acc:true  },
  { id:'iusp',  symbol:'IUSP:XETRA',  isin:'IE00B3WJKG14', name:'iShares S&P 500 Value',            ter:0.18, cat:'USA',        type:'ETF', acc:true  },
  { id:'zprv',  symbol:'ZPRV:XETRA',  isin:'IE00BSPLC413', name:'SPDR S&P 400 US Mid Cap Value',    ter:0.35, cat:'USA',        type:'ETF', acc:true  },
  { id:'eqqq',  symbol:'EQQQ:XETRA',  isin:'IE0032077012', name:'Invesco Nasdaq 100',               ter:0.30, cat:'USA Nasdaq', type:'ETF', acc:false },
  { id:'csndx', symbol:'CSNDX:XETRA', isin:'IE00B53SZB19', name:'iShares Nasdaq 100',               ter:0.33, cat:'USA Nasdaq', type:'ETF', acc:true  },
  { id:'susa',  symbol:'SUSA:XETRA',  isin:'IE00B52VJ196', name:'iShares MSCI USA ESG Screened',    ter:0.07, cat:'USA ESG',    type:'ETF', acc:true  },

  // EUROPA
  { id:'exsa',  symbol:'EXSA:XETRA',  isin:'DE0005933956', name:'iShares Core Euro Stoxx 50',       ter:0.10, cat:'Europa',     type:'ETF', acc:false },
  { id:'exs1',  symbol:'EXS1:XETRA',  isin:'DE0005933931', name:'iShares Core DAX',                 ter:0.16, cat:'Europa',     type:'ETF', acc:true  },
  { id:'spyw',  symbol:'SPYW:XETRA',  isin:'IE00B5M1WJ87', name:'SPDR Europe Dividend Aristocrats', ter:0.30, cat:'Europa Div', type:'ETF', acc:false },
  { id:'xeon',  symbol:'XEON:XETRA',  isin:'LU0290358497', name:'Xtrackers EUR Overnight Rate Swap',ter:0.10, cat:'Europa',     type:'ETF', acc:true  },
  { id:'isf',   symbol:'ISF:XETRA',   isin:'IE0005042456', name:'iShares Core FTSE 100',            ter:0.07, cat:'UK',         type:'ETF', acc:false },
  { id:'imea',  symbol:'IMEA:XETRA',  isin:'IE00B4K48X80', name:'iShares MSCI Europe ex-UK',        ter:0.12, cat:'Europa',     type:'ETF', acc:true  },
  { id:'meud',  symbol:'MEUD:XETRA',  isin:'IE00B4K48X80', name:'Amundi Core Stoxx Europe 600 UCIITS ETF Acc',        ter:0.07, cat:'Europa',     type:'ETF', acc:true  },

  // EMERGENTI
  { id:'iema',  symbol:'IEMA:XETRA',  isin:'IE00BKM4GZ66', name:'iShares Core MSCI EM IMI',         ter:0.18, cat:'Emergenti',  type:'ETF', acc:true  },
  { id:'vfem',  symbol:'VFEM:XETRA',  isin:'IE00B3Z3FS74', name:'Vanguard FTSE Emerging Markets',   ter:0.22, cat:'Emergenti',  type:'ETF', acc:false },
  { id:'aeem',  symbol:'AEEM:XETRA',  isin:'LU1681045370', name:'Amundi MSCI Emerging Markets',     ter:0.10, cat:'Emergenti',  type:'ETF', acc:true  },
  { id:'xcha',  symbol:'XCHA:XETRA',  isin:'IE00BJ0KDR00', name:'Xtrackers MSCI China',             ter:0.20, cat:'Cina',       type:'ETF', acc:true  },
  { id:'cjpa',  symbol:'CJPA:XETRA',  isin:'IE00B04GQQ17', name:'iShares Core MSCI Japan IMI',      ter:0.15, cat:'Giappone',   type:'ETF', acc:true  },
  { id:'paasi', symbol:'PAASI:XETRA', isin:'FR0013412285', name:'Amundi PEA Asie Emergente',        ter:0.19, cat:'Asia Pac',   type:'ETF', acc:true  },
  { id:'vnam',  symbol:'VNAM:XETRA',  isin:'IE00BTEM1Y91', name:'VanEck Vietnam ETF',               ter:0.72, cat:'Vietnam',    type:'ETF', acc:false },

  // SETTORIALI
  { id:'qdve',  symbol:'QDVE:XETRA',  isin:'IE00B3WJKG14', name:'iShares S&P 500 Information Tech', ter:0.15, cat:'Tecnologia', type:'ETF', acc:true  },
  { id:'iufs',  symbol:'IUFS:XETRA',  isin:'IE00B4JNQZ49', name:'iShares S&P 500 Financials',       ter:0.15, cat:'Finanza',    type:'ETF', acc:true  },
  { id:'iuhs',  symbol:'IUHS:XETRA',  isin:'IE00B43HR379', name:'iShares S&P 500 Health Care',      ter:0.15, cat:'Healthcare', type:'ETF', acc:true  },
  { id:'iues',  symbol:'IUES:XETRA',  isin:'IE00B42SXC22', name:'iShares S&P 500 Energy',           ter:0.15, cat:'Energia',    type:'ETF', acc:true  },
  { id:'iucm',  symbol:'IUCM:XETRA',  isin:'IE00B40B8R38', name:'iShares S&P 500 Cons. Staples',    ter:0.15, cat:'Consumer',   type:'ETF', acc:true  },
  { id:'iuis',  symbol:'IUIS:XETRA',  isin:'IE00B4JNQZ49', name:'iShares S&P 500 Industrials',      ter:0.15, cat:'Industria',  type:'ETF', acc:true  },
  { id:'exv1',  symbol:'EXV1:XETRA',  isin:'DE000A0H08E0', name:'iShares STOXX Europe 600 Banks',   ter:0.46, cat:'Banche EU',  type:'ETF', acc:false },
  { id:'iprp',  symbol:'IPRP:XETRA',  isin:'IE00B1FZS350', name:'iShares European Property',        ter:0.40, cat:'Real Estate',type:'ETF', acc:false },

  // TEMATICI
  { id:'wtai',  symbol:'WTAI:XETRA',  isin:'IE00BDVPNG13', name:'WisdomTree AI & Innovation',       ter:0.40, cat:'AI',         type:'ETF', acc:true  },
  { id:'lock',  symbol:'LOCK:XETRA',  isin:'IE00BFNM3P36', name:'iShares Digital Security',         ter:0.40, cat:'Cybersec',   type:'ETF', acc:true  },
  { id:'robo',  symbol:'ROBO:XETRA',  isin:'IE00BMW3QX54', name:'iShares Automation & Robotics',    ter:0.40, cat:'Robotica',   type:'ETF', acc:true  },
  { id:'iqqh',  symbol:'IQQH:XETRA',  isin:'IE00B1XNHC34', name:'iShares Global Clean Energy',      ter:0.65, cat:'Clean Enrg', type:'ETF', acc:true  },
  { id:'cemg',  symbol:'CEMG:XETRA',  isin:'IE00BMC38736', name:'VanEck Semiconductor',             ter:0.35, cat:'Semicon',    type:'ETF', acc:false },
  { id:'bate',  symbol:'BATE:XETRA',  isin:'IE00BJGZ2G24', name:'WisdomTree Battery Solutions',     ter:0.40, cat:'Battery',    type:'ETF', acc:true  },
  { id:'espo',  symbol:'ESPO:XETRA',  isin:'IE00BQQP9H09', name:'VanEck Video Gaming & eSports',    ter:0.55, cat:'Gaming',     type:'ETF', acc:false },
  { id:'renw',  symbol:'RENW:XETRA',  isin:'IE00BMDKNX95', name:'HANetf Clean Energy',              ter:0.60, cat:'Rinnovabili',type:'ETF', acc:true  },
  { id:'btce',  symbol:'BTCE:XETRA',  isin:'DE000A27Z304', name:'ETC Group Bitcoin ETP',            ter:2.00, cat:'Crypto ETP', type:'ETF', acc:true  },
  { id:'zeth',  symbol:'ZETH:XETRA',  isin:'CH0445689208', name:'21Shares Ethereum ETP',            ter:1.49, cat:'Crypto ETP', type:'ETF', acc:true  },
]

export const COMMODITY_LIST = [
  { id:'gold',     symbol:'OANDA:XAUUSD',    name:'Oro',             icon:'🥇', cat:'Metalli Preziosi', type:'Commodity' },
  { id:'silver',   symbol:'OANDA:XAGUSD',    name:'Argento',         icon:'🥈', cat:'Metalli Preziosi', type:'Commodity' },
  { id:'platinum', symbol:'OANDA:XPTUSD',    name:'Platino',         icon:'⬜', cat:'Metalli Preziosi', type:'Commodity' },
  { id:'palladium',symbol:'OANDA:XPDUSD',    name:'Palladio',        icon:'🔘', cat:'Metalli Preziosi', type:'Commodity' },
  { id:'brent',    symbol:'OANDA:BCOUSD',    name:'Petrolio Brent',  icon:'🛢️', cat:'Energia',          type:'Commodity' },
  { id:'wti',      symbol:'OANDA:WTICOUSD',  name:'Petrolio WTI',    icon:'🛢️', cat:'Energia',          type:'Commodity' },
  { id:'natgas',   symbol:'OANDA:NATGASUSD', name:'Gas Naturale',    icon:'🔥', cat:'Energia',          type:'Commodity' },
  { id:'coal',     symbol:'COAL:NYMEX',      name:'Carbone',         icon:'⚫', cat:'Energia',          type:'Commodity' },
  { id:'copper',   symbol:'OANDA:XCUUSD',    name:'Rame',            icon:'🟤', cat:'Metalli Ind.',     type:'Commodity' },
  { id:'aluminum', symbol:'OANDA:ALUUSD',    name:'Alluminio',       icon:'⚙️', cat:'Metalli Ind.',     type:'Commodity' },
  { id:'nickel',   symbol:'OANDA:XNIUSD',    name:'Nichel',          icon:'🔩', cat:'Metalli Ind.',     type:'Commodity' },
  { id:'zinc',     symbol:'OANDA:XZNUSD',    name:'Zinco',           icon:'🔧', cat:'Metalli Ind.',     type:'Commodity' },
  { id:'wheat',    symbol:'OANDA:WHEATUSD',  name:'Grano',           icon:'🌾', cat:'Agricoltura',      type:'Commodity' },
  { id:'corn',     symbol:'OANDA:CORNUSD',   name:'Mais',            icon:'🌽', cat:'Agricoltura',      type:'Commodity' },
  { id:'soy',      symbol:'OANDA:SOYBNUSD',  name:'Soia',            icon:'🫘', cat:'Agricoltura',      type:'Commodity' },
  { id:'coffee',   symbol:'OANDA:COFFEEUSD', name:'Caffè',           icon:'☕', cat:'Agricoltura',      type:'Commodity' },
  { id:'cocoa',    symbol:'OANDA:COCOAUSD',  name:'Cacao',           icon:'🍫', cat:'Agricoltura',      type:'Commodity' },
  { id:'sugar',    symbol:'OANDA:SUGARUSD',  name:'Zucchero',        icon:'🍬', cat:'Agricoltura',      type:'Commodity' },
]

export const CRYPTO_LIST = [
  { id:'btc',      symbol:'BINANCE:BTCUSDT',  name:'Bitcoin',               icon:'₿',  cat:'Large Cap',  type:'Crypto', mc:1  },
  { id:'eth',      symbol:'BINANCE:ETHUSDT',  name:'Ethereum',              icon:'⟠',  cat:'Large Cap',  type:'Crypto', mc:2  },
  { id:'bnb',      symbol:'BINANCE:BNBUSDT',  name:'BNB',                   icon:'🔶', cat:'Large Cap',  type:'Crypto', mc:3  },
  { id:'sol',      symbol:'BINANCE:SOLUSDT',  name:'Solana',                icon:'◎',  cat:'Large Cap',  type:'Crypto', mc:4  },
  { id:'xrp',      symbol:'BINANCE:XRPUSDT',  name:'XRP',                   icon:'✕',  cat:'Mid Cap',    type:'Crypto', mc:5  },
  { id:'ada',      symbol:'BINANCE:ADAUSDT',  name:'Cardano',               icon:'🔵', cat:'Mid Cap',    type:'Crypto', mc:8  },
  { id:'avax',     symbol:'BINANCE:AVAXUSDT', name:'Avalanche',             icon:'🔺', cat:'Mid Cap',    type:'Crypto', mc:9  },
  { id:'dot',      symbol:'BINANCE:DOTUSDT',  name:'Polkadot',              icon:'⬤',  cat:'Mid Cap',    type:'Crypto', mc:12 },
  { id:'link',     symbol:'BINANCE:LINKUSDT', name:'Chainlink',             icon:'⬡',  cat:'Mid Cap',    type:'Crypto', mc:13 },
  { id:'matic',    symbol:'BINANCE:MATICUSDT',name:'Polygon',               icon:'🟣', cat:'Mid Cap',    type:'Crypto', mc:14 },
  { id:'atom',     symbol:'BINANCE:ATOMUSDT', name:'Cosmos',                icon:'⚛',  cat:'Mid Cap',    type:'Crypto', mc:15 },
  { id:'uni',      symbol:'BINANCE:UNIUSDT',  name:'Uniswap',               icon:'🦄', cat:'DeFi',       type:'Crypto', mc:20 },
  { id:'aave',     symbol:'BINANCE:AAVEUSDT', name:'Aave',                  icon:'👻', cat:'DeFi',       type:'Crypto', mc:22 },
  { id:'mkr',      symbol:'BINANCE:MKRUSDT',  name:'Maker',                 icon:'⬡',  cat:'DeFi',       type:'Crypto', mc:25 },
  { id:'crv',      symbol:'BINANCE:CRVUSDT',  name:'Curve',                 icon:'🔄', cat:'DeFi',       type:'Crypto', mc:30 },
  { id:'usdt',     symbol:'BINANCE:USDTUSDC', name:'USDT/USDC',             icon:'💵', cat:'Stablecoin', type:'Crypto', mc:99 },
  { id:'btce_etf', symbol:'BTCE:XETRA',       name:'ETC Bitcoin ETP (Borsa)',icon:'₿',  cat:'Crypto ETP', type:'Crypto' },
  { id:'zeth_etf', symbol:'ZETH:XETRA',       name:'21Shares Ethereum ETP', icon:'⟠',  cat:'Crypto ETP', type:'Crypto' },
]

export const ALL_ASSETS = [...ETF_LIST, ...COMMODITY_LIST, ...CRYPTO_LIST]

export const TABS = [
  { id:'etf',       label:'ETF',           list: ETF_LIST       },
  { id:'commodity', label:'Materie Prime',  list: COMMODITY_LIST },
  { id:'crypto',    label:'Crypto',         list: CRYPTO_LIST    },
]
