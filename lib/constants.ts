export const PDVS = ['APRILIA','ARENZANO','BELPASSO','BOLZANO','BRENNERO','BRUGNATO','CHIETI','CORCIANO','EBOLI','FORMIA','GENOVA','GROSSETO','LA SPEZIA','LANCIANO','LATINA','LAURENTINA','LIVORNO','MANFREDONIA','MANTOVA','MANZONI','MERATE','MONDOVICINO','MORELLI',"NA CARITÀ","NA MANZONI","NA STAZIONE","PALERMO","PALMANOVA","PESCARA","POMPEI","POTENZA","QUARTO","ROMA MARCONI","SALERNO","SASSARI","SPOLTORE","TARANTO","TORRE ANNUNZIATA","TORINO LINGOTTO","VENEZIA MESTRE","VIGEVANO","ZUGLIANO"]

export const BRANDS = ['ARMANI','BURBERRY','CAVALLI','CHANEL','CLARINS','CLE DE PEAU','COLLISTAR','D&G','DIOR','DOLCE&GABBANA','ESTEE LAUDER','GIVENCHY','GUERLAIN','KENZO','LA MER','LA PRAIRIE','MAC','NARCISO','NARS','NEURAE','SISLEY']

export const TRADE_TIPI = [
  { value: 'ANT',  label: 'Antitaccheggio',              price: 120,  unit: 'pdv2w', incl: true  },
  { value: 'PAN',  label: 'Pancarte',                    price: 100,  unit: 'pdv2w', incl: true  },
  { value: 'VET',  label: 'Vetrina Total Look',           price: 1500, unit: 'pdv2w', incl: true  },
  { value: 'REG',  label: 'Reglette Personalizzate',      price: 3000, unit: 'flat',  incl: true  },
  { value: 'LED1', label: 'Ledwall Singolo PDV',          price: 800,  unit: '2w',    incl: true  },
  { value: 'LED2', label: 'Ledwall Cluster',              price: 3500, unit: '2w',    incl: true  },
  { value: 'LED3', label: 'Ledwall Totale Rete',          price: 6000, unit: '2w',    incl: true  },
  { value: 'WEB1', label: 'Web — Banner Homepage',        price: 800,  unit: 'flat',  incl: true  },
  { value: 'WEB2', label: 'Web — Brand Page',             price: 200,  unit: 'flat',  incl: true  },
  { value: 'WEB3', label: 'Web — Pop-up',                 price: 1000, unit: 'flat',  incl: true  },
  { value: 'WEB4', label: 'Web — Notifiche Push',         price: 200,  unit: 'flat',  incl: true  },
  { value: 'COR',  label: 'Corner Esterno',               price: 3000, unit: 'flat',  incl: false },
  { value: 'TMP',  label: 'Temporary Completo',           price: 7500, unit: 'flat',  incl: false },
  { value: 'VOL1', label: 'Volantino — Box Prodotto',     price: 500,  unit: 'flat',  incl: true  },
  { value: 'VOL2', label: 'Volantino — Mezza Pagina',     price: 1000, unit: 'flat',  incl: true  },
  { value: 'VOL3', label: 'Volantino — Pagina Intera',    price: 2000, unit: 'flat',  incl: true  },
  { value: 'VOL4', label: 'Volantino — Sponsor Esclusivo',price: 3500, unit: 'flat',  incl: true  },
  { value: 'FOR',  label: 'Formazione Prodotto',          price: 1000, unit: 'flat',  incl: false },
  { value: 'RIU',  label: "Sponsor Riunione d'Area",      price: 2000, unit: 'flat',  incl: false },
  { value: 'SOC1', label: 'Social — Brand Awareness',     price: 800,  unit: 'flat',  incl: false },
  { value: 'SOC2', label: 'Social — Drive-to-Store',      price: 1500, unit: 'flat',  incl: false },
  { value: 'PRE',  label: 'Pre-Sampling',                 price: 2500, unit: 'flat',  incl: true  },
  { value: 'APE1', label: 'Nuova Apertura — Condiviso',   price: 5000, unit: 'flat',  incl: false },
  { value: 'APE2', label: 'Nuova Apertura — Unico',       price: 8000, unit: 'flat',  incl: false },
]

export const GIORNATE_TIPI = [
  { value: 'BEA', label: 'Beauty Consultant', color: '#2dd4bf' },
  { value: 'HOS', label: 'Hostess',           color: '#4a8fff' },
  { value: 'MUA', label: 'MU Artist',         color: '#f472b6' },
  { value: 'SPC', label: 'Specialist',        color: '#4ade80' },
  { value: 'OUT', label: 'Outpost',           color: '#fb923c' },
  { value: 'PRE', label: 'Presidio MUP',      color: '#f87171' },
  { value: 'REC', label: 'Presidio REC',      color: '#f87171' },
  { value: 'BTC', label: 'BTOC',              color: '#94a3b8' },
  { value: 'SER', label: 'Serigrafa',         color: '#94a3b8' },
]

export const INTERNAL_TIPI = [
  { value: 'GWP', label: 'Promozione GWP',           icon: '🎁' },
  { value: 'VIS', label: 'Visibilità Interna',        icon: '💎' },
  { value: 'APE', label: 'Apertura PDV',              icon: '🏪' },
  { value: 'EVE', label: 'Evento in Store',           icon: '🎉' },
  { value: 'LAN', label: 'Lancio Prodotto',           icon: '📦' },
  { value: 'VOL', label: 'Volantino',                 icon: '📰' },
  { value: 'SOC', label: 'Campagna Social',           icon: '📱' },
  { value: 'PRS', label: 'Press Trip / Evento Brand', icon: '✈️' },
  { value: 'FOR', label: 'Formazione Team',           icon: '🎓' },
  { value: 'MTG', label: 'Meeting Brand',             icon: '📊' },
]

export const SOCIAL_CANALI = [
  { value: 'IGF', label: 'Instagram Feed',    color: '#e1306c' },
  { value: 'IGR', label: 'Instagram Reels',   color: '#833ab4' },
  { value: 'IGS', label: 'Instagram Stories', color: '#fd1d1d' },
  { value: 'TTK', label: 'TikTok',            color: '#69c9d0' },
  { value: 'FB',  label: 'Facebook',          color: '#4267B2' },
  { value: 'NWL', label: 'Newsletter',        color: '#4ade80' },
]

export const SOCIAL_STATI = [
  { value: 'IDA', label: '💡 Idea' },
  { value: 'PRD', label: '✍️ In produzione' },
  { value: 'REV', label: '👀 In revisione' },
  { value: 'APP', label: '✅ Approvato' },
  { value: 'PUB', label: '🚀 Pubblicato' },
]

export const MODULES = [
  { id: 'trade',    label: 'Visibilità Trade',   icon: '💄', color: '#7c3aed' },
  { id: 'giornate', label: 'Giornate PDV',        icon: '👤', color: '#0891b2' },
  { id: 'internal', label: 'Attività Interne',    icon: '🎯', color: '#ea580c' },
  { id: 'social',   label: 'Social',              icon: '📱', color: '#db2777' },
  { id: 'budget',   label: 'Budget Brand',        icon: '💶', color: '#c9a96e' },
  { id: 'pdv',      label: 'Vista PDV',           icon: '🏪', color: '#16a34a' },
  { id: 'todo',     label: 'To-do Team',          icon: '✅', color: '#4a8fff' },
  { id: 'admin',    label: 'Amministrazione',     icon: '⚙️', color: '#f87171' },
]

export const ROLES = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin',      label: 'Admin' },
  { value: 'editor',     label: 'Editor' },
  { value: 'viewer',     label: 'Viewer' },
]

export const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
export const BRAND_COLORS = ['#c9a96e','#a78bfa','#4a8fff','#4ade80','#f472b6','#fb923c','#2dd4bf','#f87171','#94a3b8','#e879f9','#facc15','#38bdf8']
