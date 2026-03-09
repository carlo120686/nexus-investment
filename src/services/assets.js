export const ASSETS = {
  etf: [
    { symbol: 'VWCE.MI', name: 'Vanguard FTSE All-World', category: 'Globale', ter: 0.22, acc: true },
    { symbol: 'SWDA.MI', name: 'iShares Core MSCI World', category: 'Globale', ter: 0.20, acc: true },
    { symbol: 'WEBG.MI', name: 'Amundi MSCI World', category: 'Globale', ter: 0.07, acc: true },
    { symbol: 'ISAC.MI', name: 'iShares MSCI ACWI', category: 'Globale', ter: 0.20, acc: true },
    { symbol: 'CSPX.MI', name: 'iShares Core S&P 500', category: 'USA', ter: 0.07, acc: true },
    { symbol: 'VUAA.MI', name: 'Vanguard S&P 500', category: 'USA', ter: 0.07, acc: true },
    { symbol: 'EQQQ.MI', name: 'Invesco NASDAQ 100', category: 'USA Tech', ter: 0.30, acc: false },
    { symbol: 'CSNDX.MI', name: 'iShares NASDAQ 100', category: 'USA Tech', ter: 0.33, acc: true },
    { symbol: 'EXSA.MI', name: 'iShares Core EURO STOXX 50', category: 'Europa', ter: 0.10, acc: false },
    { symbol: 'MEUD.MI', name: 'Lyxor Core MSCI EMU', category: 'Europa', ter: 0.12, acc: true },
    { symbol: 'SPYW.MI', name: 'SPDR S&P Euro Dividend', category: 'Europa Div.', ter: 0.30, acc: false },
    { symbol: 'IEMA.MI', name: 'iShares Core MSCI EM IMI', category: 'Emergenti', ter: 0.18, acc: true },
    { symbol: 'VFEM.MI', name: 'Vanguard FTSE Emerging', category: 'Emergenti', ter: 0.22, acc: false },
    { symbol: 'CJPA.MI', name: 'Amundi Japan', category: 'Giappone', ter: 0.12, acc: true },
    { symbol: 'QDVE.MI', name: 'iShares S&P500 IT Sector', category: 'Tech', ter: 0.15, acc: true },
    { symbol: 'IUFS.MI', name: 'iShares S&P500 Financials', category: 'Finanza', ter: 0.15, acc: true },
    { symbol: 'IUHS.MI', name: 'iShares S&P500 Healthcare', category: 'Healthcare', ter: 0.15, acc: true },
    { symbol: 'WTAI.MI', name: 'WisdomTree AI & Innovation', category: 'AI', ter: 0.40, acc: true },
    { symbol: 'IQQH.MI', name: 'iShares Global Clean Energy', category: 'Green', ter: 0.65, acc: true },
    { symbol: 'ROBO.MI', name: 'iShares Automation & Rob.', category: 'Robotica', ter: 0.40, acc: true },
  ],
  commodities: [
    { symbol: 'GC=F', name: 'Oro', category: 'Metalli Preziosi', unit: 'oz' },
    { symbol: 'SI=F', name: 'Argento', category: 'Metalli Preziosi', unit: 'oz' },
    { symbol: 'PL=F', name: 'Platino', category: 'Metalli Preziosi', unit: 'oz' },
    { symbol: 'HG=F', name: 'Rame', category: 'Metalli Industriali', unit: 'lb' },
    { symbol: 'CL=F', name: 'Petrolio WTI', category: 'Energia', unit: 'barrel' },
    { symbol: 'BZ=F', name: 'Petrolio Brent', category: 'Energia', unit: 'barrel' },
    { symbol: 'NG=F', name: 'Gas Naturale', category: 'Energia', unit: 'MMBtu' },
    { symbol: 'ZW=F', name: 'Grano', category: 'Agricoltura', unit: 'bushel' },
    { symbol: 'ZC=F', name: 'Mais', category: 'Agricoltura', unit: 'bushel' },
    { symbol: 'ZS=F', name: 'Soia', category: 'Agricoltura', unit: 'bushel' },
  ],
  crypto: [
    { symbol: 'BTC-USD', name: 'Bitcoin', category: 'Layer 1', binance: 'BTCUSDT' },
    { symbol: 'ETH-USD', name: 'Ethereum', category: 'Layer 1', binance: 'ETHUSDT' },
    { symbol: 'SOL-USD', name: 'Solana', category: 'Layer 1', binance: 'SOLUSDT' },
    { symbol: 'BNB-USD', name: 'BNB', category: 'Exchange', binance: 'BNBUSDT' },
  ]
}

export const ALL_ASSETS = [
  ...ASSETS.etf.map(a => ({ ...a, type: 'etf' })),
  ...ASSETS.commodities.map(a => ({ ...a, type: 'commodity' })),
  ...ASSETS.crypto.map(a => ({ ...a, type: 'crypto' })),
]
