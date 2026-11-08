/* ═══════════════════════════════════════════════════════════════
   CATÁLOGO DE VALORES

   Lista para sugerirte empresas al escribir, nada más. Trae ticker,
   nombre, tipo y bolsa; NO trae ISIN ni datos (PER, precio, deuda),
   porque esos cambian cada día y tienen que venir de tus
   importaciones del cribado o de los paquetes que te preparo.

   No hace falta que esté completo: el programa también sugiere todo
   lo que hayas importado alguna vez al universo del cribado, así que
   la lista crece sola con lo que tú uses.

   Para ampliarlo, pídeme un paquete de catálogo y se añade sin tocar
   este archivo.

   Formato de cada fila: [ticker, nombre, tipo, bolsa]
     tipo: accion | etf | fondo
   ═══════════════════════════════════════════════════════════════ */
const VALORES = (() => {

  const V = [

/* ───────── ESPAÑA · IBEX 35 y mercado continuo ───────── */
['ACS','ACS Actividades de Construcción y Servicios','accion','Madrid'],
['ACX','Acerinox','accion','Madrid'],
['AENA','Aena','accion','Madrid'],
['AMS','Amadeus IT Group','accion','Madrid'],
['ANA','Acciona','accion','Madrid'],
['ANE','Acciona Energías Renovables','accion','Madrid'],
['BBVA','Banco Bilbao Vizcaya Argentaria','accion','Madrid'],
['BKT','Bankinter','accion','Madrid'],
['CABK','CaixaBank','accion','Madrid'],
['CLNX','Cellnex Telecom','accion','Madrid'],
['COL','Inmobiliaria Colonial','accion','Madrid'],
['ELE','Endesa','accion','Madrid'],
['ENG','Enagás','accion','Madrid'],
['FER','Ferrovial','accion','Madrid'],
['FDR','Fluidra','accion','Madrid'],
['GRF','Grifols','accion','Madrid'],
['IAG','International Consolidated Airlines Group','accion','Madrid'],
['IBE','Iberdrola','accion','Madrid'],
['IDR','Indra Sistemas','accion','Madrid'],
['ITX','Industria de Diseño Textil (Inditex)','accion','Madrid'],
['LOG','Logista','accion','Madrid'],
['MAP','Mapfre','accion','Madrid'],
['MEL','Meliá Hotels International','accion','Madrid'],
['MRL','Merlin Properties','accion','Madrid'],
['MTS','ArcelorMittal','accion','Madrid'],
['NTGY','Naturgy Energy Group','accion','Madrid'],
['PUIG','Puig Brands','accion','Madrid'],
['RED','Redeia (Red Eléctrica)','accion','Madrid'],
['REP','Repsol','accion','Madrid'],
['ROVI','Laboratorios Rovi','accion','Madrid'],
['SAB','Banco de Sabadell','accion','Madrid'],
['SAN','Banco Santander','accion','Madrid'],
['SCYR','Sacyr','accion','Madrid'],
['SLR','Solaria Energía y Medio Ambiente','accion','Madrid'],
['TEF','Telefónica','accion','Madrid'],
['UNI','Unicaja Banco','accion','Madrid'],

['A3M','Atresmedia','accion','Madrid'],
['ADX','Audax Renovables','accion','Madrid'],
['AEDAS','AEDAS Homes','accion','Madrid'],
['AI','Airtificial Intelligence Structures','accion','Madrid'],
['ALB','Corporación Financiera Alba','accion','Madrid'],
['ALM','Almirall','accion','Madrid'],
['AMP','Amper','accion','Madrid'],
['APPS','Applus Services','accion','Madrid'],
['ATRY','Atrys Health','accion','Madrid'],
['AZK','Azkoyen','accion','Madrid'],
['BDL','Barón de Ley','accion','Madrid'],
['BIO','Biosearch','accion','Madrid'],
['CAF','Construcciones y Auxiliar de Ferrocarriles','accion','Madrid'],
['CASH','Prosegur Cash','accion','Madrid'],
['CBAV','Cie Automotive','accion','Madrid'],
['CDR','Coca-Cola Europacific Partners','accion','Madrid'],
['CEV','Cevasa','accion','Madrid'],
['CIE','Cie Automotive','accion','Madrid'],
['CLEO','Cleop','accion','Madrid'],
['DIA','Distribuidora Internacional de Alimentación','accion','Madrid'],
['DOM','Global Dominion Access','accion','Madrid'],
['EBRO','Ebro Foods','accion','Madrid'],
['ECR','Ercros','accion','Madrid'],
['EDR','eDreams ODIGEO','accion','Madrid'],
['ELZ','Elecnor','accion','Madrid'],
['ENC','Ence Energía y Celulosa','accion','Madrid'],
['EZE','Ezentis','accion','Madrid'],
['FAE','Faes Farma','accion','Madrid'],
['FCC','Fomento de Construcciones y Contratas','accion','Madrid'],
['GCO','Grupo Catalana Occidente','accion','Madrid'],
['GEST','Gestamp Automoción','accion','Madrid'],
['GIGA','Gigas Hosting','accion','Madrid'],
['GSJ','Grupo Empresarial San José','accion','Madrid'],
['HOME','Neinor Homes','accion','Madrid'],
['IBG','Iberpapel Gestión','accion','Madrid'],
['LDA','Linea Directa Aseguradora','accion','Madrid'],
['LGT','Lingotes Especiales','accion','Madrid'],
['LRE','Laboratorio Reig Jofre','accion','Madrid'],
['MCM','Miquel y Costas & Miquel','accion','Madrid'],
['NEA','Nueva Expresión Textil','accion','Madrid'],
['NTH','Naturhouse Health','accion','Madrid'],
['NXT','Nextil','accion','Madrid'],
['OHLA','OHLA (Obrascón Huarte Lain)','accion','Madrid'],
['OLE','Deoleo','accion','Madrid'],
['PHM','Pharma Mar','accion','Madrid'],
['PRIM','Prim','accion','Madrid'],
['PSG','Prosegur','accion','Madrid'],
['R4','Renta 4 Banco','accion','Madrid'],
['RJF','Reig Jofre','accion','Madrid'],
['SPH','Sphera Global Healthcare','accion','Madrid'],
['SQRL','Squirrel Media','accion','Madrid'],
['TLGO','Talgo','accion','Madrid'],
['TRE','Técnicas Reunidas','accion','Madrid'],
['TUB','Tubacex','accion','Madrid'],
['TUB2','Tubos Reunidos','accion','Madrid'],
['UBS','Urbas Grupo Financiero','accion','Madrid'],
['VID','Vidrala','accion','Madrid'],
['VIS','Viscofan','accion','Madrid'],
['VOC','Vocento','accion','Madrid'],
['ZOT','Zardoya Otis','accion','Madrid'],

/* ───────── PORTUGAL · PSI ───────── */
['ALTR','Altri','accion','Lisboa'],
['BCP','Banco Comercial Português','accion','Lisboa'],
['COR','Corticeira Amorim','accion','Lisboa'],
['CTT','CTT Correios de Portugal','accion','Lisboa'],
['EDP','EDP Energias de Portugal','accion','Lisboa'],
['EDPR','EDP Renováveis','accion','Lisboa'],
['EGL','Mota-Engil','accion','Lisboa'],
['GALP','Galp Energia','accion','Lisboa'],
['IBS','Ibersol','accion','Lisboa'],
['JMT','Jerónimo Martins','accion','Lisboa'],
['NOS','NOS SGPS','accion','Lisboa'],
['NVG','Navigator Company','accion','Lisboa'],
['RAM','Ramada Investimentos','accion','Lisboa'],
['REN','REN Redes Energéticas Nacionais','accion','Lisboa'],
['SEM','Semapa','accion','Lisboa'],
['SON','Sonae','accion','Lisboa'],

/* ───────── FRANCIA · CAC 40 ───────── */
['AI','Air Liquide','accion','París'],
['AIR','Airbus','accion','París'],
['ALO','Alstom','accion','París'],
['MT','ArcelorMittal','accion','París'],
['CS','AXA','accion','París'],
['BNP','BNP Paribas','accion','París'],
['EN','Bouygues','accion','París'],
['CAP','Capgemini','accion','París'],
['CA','Carrefour','accion','París'],
['ACA','Crédit Agricole','accion','París'],
['BN','Danone','accion','París'],
['DSY','Dassault Systèmes','accion','París'],
['EDEN','Edenred','accion','París'],
['ENGI','Engie','accion','París'],
['EL','EssilorLuxottica','accion','París'],
['ERF','Eurofins Scientific','accion','París'],
['RMS','Hermès International','accion','París'],
['KER','Kering','accion','París'],
['LR','Legrand','accion','París'],
['OR','L\'Oréal','accion','París'],
['MC','LVMH Moët Hennessy Louis Vuitton','accion','París'],
['ML','Michelin','accion','París'],
['ORA','Orange','accion','París'],
['RI','Pernod Ricard','accion','París'],
['PUB','Publicis Groupe','accion','París'],
['RNO','Renault','accion','París'],
['SAF','Safran','accion','París'],
['SGO','Saint-Gobain','accion','París'],
['SAN','Sanofi','accion','París'],
['SU','Schneider Electric','accion','París'],
['GLE','Société Générale','accion','París'],
['STLAP','Stellantis','accion','París'],
['STMPA','STMicroelectronics','accion','París'],
['TEP','Teleperformance','accion','París'],
['HO','Thales','accion','París'],
['TTE','TotalEnergies','accion','París'],
['URW','Unibail-Rodamco-Westfield','accion','París'],
['VIE','Veolia Environnement','accion','París'],
['DG','Vinci','accion','París'],
['VIV','Vivendi','accion','París'],

/* ───────── ALEMANIA · DAX y MDAX destacadas ───────── */
['ADS','Adidas','accion','Fráncfort'],
['AIR','Airbus','accion','Fráncfort'],
['ALV','Allianz','accion','Fráncfort'],
['BAS','BASF','accion','Fráncfort'],
['BAYN','Bayer','accion','Fráncfort'],
['BEI','Beiersdorf','accion','Fráncfort'],
['BMW','Bayerische Motoren Werke','accion','Fráncfort'],
['BNR','Brenntag','accion','Fráncfort'],
['CBK','Commerzbank','accion','Fráncfort'],
['CON','Continental','accion','Fráncfort'],
['1COV','Covestro','accion','Fráncfort'],
['DTG','Daimler Truck Holding','accion','Fráncfort'],
['DBK','Deutsche Bank','accion','Fráncfort'],
['DB1','Deutsche Börse','accion','Fráncfort'],
['DPW','DHL Group','accion','Fráncfort'],
['DTE','Deutsche Telekom','accion','Fráncfort'],
['EOAN','E.ON','accion','Fráncfort'],
['FME','Fresenius Medical Care','accion','Fráncfort'],
['FRE','Fresenius','accion','Fráncfort'],
['HNR1','Hannover Rück','accion','Fráncfort'],
['HEI','Heidelberg Materials','accion','Fráncfort'],
['HEN3','Henkel','accion','Fráncfort'],
['IFX','Infineon Technologies','accion','Fráncfort'],
['MBG','Mercedes-Benz Group','accion','Fráncfort'],
['MRK','Merck KGaA','accion','Fráncfort'],
['MTX','MTU Aero Engines','accion','Fráncfort'],
['MUV2','Münchener Rück','accion','Fráncfort'],
['PAH3','Porsche Automobil Holding','accion','Fráncfort'],
['P911','Porsche AG','accion','Fráncfort'],
['QIA','Qiagen','accion','Fráncfort'],
['RHM','Rheinmetall','accion','Fráncfort'],
['RWE','RWE','accion','Fráncfort'],
['SAP','SAP','accion','Fráncfort'],
['SRT3','Sartorius','accion','Fráncfort'],
['SIE','Siemens','accion','Fráncfort'],
['ENR','Siemens Energy','accion','Fráncfort'],
['SHL','Siemens Healthineers','accion','Fráncfort'],
['SY1','Symrise','accion','Fráncfort'],
['VOW3','Volkswagen','accion','Fráncfort'],
['VNA','Vonovia','accion','Fráncfort'],
['ZAL','Zalando','accion','Fráncfort'],
['LHA','Deutsche Lufthansa','accion','Fráncfort'],
['EVK','Evonik Industries','accion','Fráncfort'],
['LXS','Lanxess','accion','Fráncfort'],
['NEM','Nemetschek','accion','Fráncfort'],
['PUM','Puma','accion','Fráncfort'],
['TKA','Thyssenkrupp','accion','Fráncfort'],
['UN01','Uniper','accion','Fráncfort'],

/* ───────── PAÍSES BAJOS Y BÉLGICA · AEX y BEL 20 ───────── */
['ADYEN','Adyen','accion','Ámsterdam'],
['AD','Koninklijke Ahold Delhaize','accion','Ámsterdam'],
['AKZA','Akzo Nobel','accion','Ámsterdam'],
['MT','ArcelorMittal','accion','Ámsterdam'],
['ASM','ASM International','accion','Ámsterdam'],
['ASML','ASML Holding','accion','Ámsterdam'],
['ASRNL','ASR Nederland','accion','Ámsterdam'],
['BESI','BE Semiconductor Industries','accion','Ámsterdam'],
['DSFIR','DSM-Firmenich','accion','Ámsterdam'],
['HEIA','Heineken','accion','Ámsterdam'],
['IMCD','IMCD','accion','Ámsterdam'],
['INGA','ING Groep','accion','Ámsterdam'],
['KPN','Koninklijke KPN','accion','Ámsterdam'],
['NN','NN Group','accion','Ámsterdam'],
['PHIA','Koninklijke Philips','accion','Ámsterdam'],
['PRX','Prosus','accion','Ámsterdam'],
['RAND','Randstad','accion','Ámsterdam'],
['REN','Relx','accion','Ámsterdam'],
['SHELL','Shell','accion','Ámsterdam'],
['UNA','Unilever','accion','Ámsterdam'],
['WKL','Wolters Kluwer','accion','Ámsterdam'],
['ABI','Anheuser-Busch InBev','accion','Bruselas'],
['ACKB','Ackermans & van Haaren','accion','Bruselas'],
['COLR','Colruyt','accion','Bruselas'],
['GBLB','Groupe Bruxelles Lambert','accion','Bruselas'],
['KBC','KBC Groep','accion','Bruselas'],
['SOLB','Solvay','accion','Bruselas'],
['UCB','UCB','accion','Bruselas'],
['UMI','Umicore','accion','Bruselas'],

/* ───────── ITALIA · FTSE MIB ───────── */
['A2A','A2A','accion','Milán'],
['AMP','Amplifon','accion','Milán'],
['AZM','Azimut Holding','accion','Milán'],
['BAMI','Banco BPM','accion','Milán'],
['BMED','Banca Mediolanum','accion','Milán'],
['BPE','BPER Banca','accion','Milán'],
['BZU','Buzzi','accion','Milán'],
['CPR','Davide Campari-Milano','accion','Milán'],
['DIA','DiaSorin','accion','Milán'],
['ENEL','Enel','accion','Milán'],
['ENI','Eni','accion','Milán'],
['ERG','ERG','accion','Milán'],
['RACE','Ferrari','accion','Milán'],
['FBK','FinecoBank','accion','Milán'],
['G','Assicurazioni Generali','accion','Milán'],
['HER','Hera','accion','Milán'],
['IG','Italgas','accion','Milán'],
['ISP','Intesa Sanpaolo','accion','Milán'],
['IVG','Immobiliare Grande Distribuzione','accion','Milán'],
['INW','Infrastrutture Wireless Italiane','accion','Milán'],
['LDO','Leonardo','accion','Milán'],
['MB','Mediobanca','accion','Milán'],
['MONC','Moncler','accion','Milán'],
['NEXI','Nexi','accion','Milán'],
['PIRC','Pirelli & C','accion','Milán'],
['PST','Poste Italiane','accion','Milán'],
['PRY','Prysmian','accion','Milán'],
['REC','Recordati','accion','Milán'],
['SPM','Saipem','accion','Milán'],
['SRG','Snam','accion','Milán'],
['STLAM','Stellantis','accion','Milán'],
['STM','STMicroelectronics','accion','Milán'],
['TIT','Telecom Italia','accion','Milán'],
['TEN','Tenaris','accion','Milán'],
['TRN','Terna','accion','Milán'],
['UCG','UniCredit','accion','Milán'],
['UNI','Unipol','accion','Milán'],

/* ───────── SUIZA, NÓRDICOS Y REINO UNIDO · grandes ───────── */
['ABBN','ABB','accion','Zúrich'],
['ALC','Alcon','accion','Zúrich'],
['CFR','Compagnie Financière Richemont','accion','Zúrich'],
['GIVN','Givaudan','accion','Zúrich'],
['HOLN','Holcim','accion','Zúrich'],
['LONN','Lonza Group','accion','Zúrich'],
['NESN','Nestlé','accion','Zúrich'],
['NOVN','Novartis','accion','Zúrich'],
['ROG','Roche Holding','accion','Zúrich'],
['SIKA','Sika','accion','Zúrich'],
['SREN','Swiss Re','accion','Zúrich'],
['UBSG','UBS Group','accion','Zúrich'],
['ZURN','Zurich Insurance Group','accion','Zúrich'],
['ATCO-A','Atlas Copco','accion','Estocolmo'],
['ERIC-B','Telefonaktiebolaget LM Ericsson','accion','Estocolmo'],
['EVO','Evolution','accion','Estocolmo'],
['HM-B','Hennes & Mauritz','accion','Estocolmo'],
['INVE-B','Investor AB','accion','Estocolmo'],
['SAND','Sandvik','accion','Estocolmo'],
['VOLV-B','Volvo','accion','Estocolmo'],
['NOVO-B','Novo Nordisk','accion','Copenhague'],
['MAERSK-B','A.P. Møller-Mærsk','accion','Copenhague'],
['ORSTED','Ørsted','accion','Copenhague'],
['DSV','DSV','accion','Copenhague'],
['EQNR','Equinor','accion','Oslo'],
['NHY','Norsk Hydro','accion','Oslo'],
['NESTE','Neste','accion','Helsinki'],
['NOKIA','Nokia','accion','Helsinki'],
['SAMPO','Sampo','accion','Helsinki'],
['AZN','AstraZeneca','accion','Londres'],
['BARC','Barclays','accion','Londres'],
['BP','BP','accion','Londres'],
['BATS','British American Tobacco','accion','Londres'],
['DGE','Diageo','accion','Londres'],
['GSK','GSK','accion','Londres'],
['HSBA','HSBC Holdings','accion','Londres'],
['LLOY','Lloyds Banking Group','accion','Londres'],
['NG','National Grid','accion','Londres'],
['PRU','Prudential','accion','Londres'],
['REL','Relx','accion','Londres'],
['RIO','Rio Tinto','accion','Londres'],
['RR','Rolls-Royce Holdings','accion','Londres'],
['SHEL','Shell','accion','Londres'],
['ULVR','Unilever','accion','Londres'],
['VOD','Vodafone Group','accion','Londres'],

/* ───────── ESTADOS UNIDOS · S&P 500 y Nasdaq 100 ───────── */
['AAPL','Apple','accion','Nasdaq'],['MSFT','Microsoft','accion','Nasdaq'],
['NVDA','NVIDIA','accion','Nasdaq'],['AMZN','Amazon.com','accion','Nasdaq'],
['GOOGL','Alphabet clase A','accion','Nasdaq'],['GOOG','Alphabet clase C','accion','Nasdaq'],
['META','Meta Platforms','accion','Nasdaq'],['TSLA','Tesla','accion','Nasdaq'],
['BRK.B','Berkshire Hathaway clase B','accion','NYSE'],['AVGO','Broadcom','accion','Nasdaq'],
['LLY','Eli Lilly','accion','NYSE'],['JPM','JPMorgan Chase','accion','NYSE'],
['V','Visa','accion','NYSE'],['MA','Mastercard','accion','NYSE'],
['UNH','UnitedHealth Group','accion','NYSE'],['XOM','Exxon Mobil','accion','NYSE'],
['JNJ','Johnson & Johnson','accion','NYSE'],['PG','Procter & Gamble','accion','NYSE'],
['COST','Costco Wholesale','accion','Nasdaq'],['HD','Home Depot','accion','NYSE'],
['WMT','Walmart','accion','NYSE'],['ABBV','AbbVie','accion','NYSE'],
['MRK','Merck & Co','accion','NYSE'],['CVX','Chevron','accion','NYSE'],
['KO','Coca-Cola','accion','NYSE'],['PEP','PepsiCo','accion','Nasdaq'],
['ADBE','Adobe','accion','Nasdaq'],['CRM','Salesforce','accion','NYSE'],
['BAC','Bank of America','accion','NYSE'],['NFLX','Netflix','accion','Nasdaq'],
['AMD','Advanced Micro Devices','accion','Nasdaq'],['TMO','Thermo Fisher Scientific','accion','NYSE'],
['LIN','Linde','accion','Nasdaq'],['ACN','Accenture','accion','NYSE'],
['MCD','McDonald\'s','accion','NYSE'],['CSCO','Cisco Systems','accion','Nasdaq'],
['ABT','Abbott Laboratories','accion','NYSE'],['DHR','Danaher','accion','NYSE'],
['INTU','Intuit','accion','Nasdaq'],['WFC','Wells Fargo','accion','NYSE'],
['TXN','Texas Instruments','accion','Nasdaq'],['QCOM','Qualcomm','accion','Nasdaq'],
['DIS','Walt Disney','accion','NYSE'],['VZ','Verizon Communications','accion','NYSE'],
['AMGN','Amgen','accion','Nasdaq'],['CAT','Caterpillar','accion','NYSE'],
['PFE','Pfizer','accion','NYSE'],['IBM','International Business Machines','accion','NYSE'],
['GE','GE Aerospace','accion','NYSE'],['NOW','ServiceNow','accion','NYSE'],
['CMCSA','Comcast','accion','Nasdaq'],['PM','Philip Morris International','accion','NYSE'],
['SPGI','S&P Global','accion','NYSE'],['UNP','Union Pacific','accion','NYSE'],
['AXP','American Express','accion','NYSE'],['RTX','RTX','accion','NYSE'],
['HON','Honeywell International','accion','Nasdaq'],['GS','Goldman Sachs Group','accion','NYSE'],
['LOW','Lowe\'s Companies','accion','NYSE'],['ISRG','Intuitive Surgical','accion','Nasdaq'],
['NEE','NextEra Energy','accion','NYSE'],['BKNG','Booking Holdings','accion','Nasdaq'],
['T','AT&T','accion','NYSE'],['MS','Morgan Stanley','accion','NYSE'],
['BLK','BlackRock','accion','NYSE'],['SYK','Stryker','accion','NYSE'],
['ETN','Eaton','accion','NYSE'],['TJX','TJX Companies','accion','NYSE'],
['PGR','Progressive','accion','NYSE'],['VRTX','Vertex Pharmaceuticals','accion','Nasdaq'],
['BSX','Boston Scientific','accion','NYSE'],['MDT','Medtronic','accion','NYSE'],
['LMT','Lockheed Martin','accion','NYSE'],['ADP','Automatic Data Processing','accion','Nasdaq'],
['C','Citigroup','accion','NYSE'],['BMY','Bristol-Myers Squibb','accion','NYSE'],
['SCHW','Charles Schwab','accion','NYSE'],['CB','Chubb','accion','NYSE'],
['MU','Micron Technology','accion','Nasdaq'],['DE','Deere & Company','accion','NYSE'],
['PLD','Prologis','accion','NYSE'],['FI','Fiserv','accion','NYSE'],
['UPS','United Parcel Service','accion','NYSE'],['AMAT','Applied Materials','accion','Nasdaq'],
['SBUX','Starbucks','accion','Nasdaq'],['MMC','Marsh & McLennan','accion','NYSE'],
['GILD','Gilead Sciences','accion','Nasdaq'],['ADI','Analog Devices','accion','Nasdaq'],
['INTC','Intel','accion','Nasdaq'],['LRCX','Lam Research','accion','Nasdaq'],
['REGN','Regeneron Pharmaceuticals','accion','Nasdaq'],['KLAC','KLA Corporation','accion','Nasdaq'],
['PANW','Palo Alto Networks','accion','Nasdaq'],['SO','Southern Company','accion','NYSE'],
['ELV','Elevance Health','accion','NYSE'],['CI','Cigna Group','accion','NYSE'],
['DUK','Duke Energy','accion','NYSE'],['ZTS','Zoetis','accion','NYSE'],
['MDLZ','Mondelez International','accion','Nasdaq'],['ANET','Arista Networks','accion','NYSE'],
['ICE','Intercontinental Exchange','accion','NYSE'],['CME','CME Group','accion','Nasdaq'],
['SHW','Sherwin-Williams','accion','NYSE'],['CDNS','Cadence Design Systems','accion','Nasdaq'],
['SNPS','Synopsys','accion','Nasdaq'],['WM','Waste Management','accion','NYSE'],
['MO','Altria Group','accion','NYSE'],['EQIX','Equinix','accion','Nasdaq'],
['CVS','CVS Health','accion','NYSE'],['MCK','McKesson','accion','NYSE'],
['APH','Amphenol','accion','NYSE'],['CL','Colgate-Palmolive','accion','NYSE'],
['ITW','Illinois Tool Works','accion','NYSE'],['TGT','Target','accion','NYSE'],
['MAR','Marriott International','accion','Nasdaq'],['FDX','FedEx','accion','NYSE'],
['NOC','Northrop Grumman','accion','NYSE'],['GD','General Dynamics','accion','NYSE'],
['ORLY','O\'Reilly Automotive','accion','Nasdaq'],['MSI','Motorola Solutions','accion','NYSE'],
['PH','Parker-Hannifin','accion','NYSE'],['CSX','CSX','accion','Nasdaq'],
['PYPL','PayPal Holdings','accion','Nasdaq'],['USB','U.S. Bancorp','accion','NYSE'],
['PNC','PNC Financial Services','accion','NYSE'],['AON','Aon','accion','NYSE'],
['CMG','Chipotle Mexican Grill','accion','NYSE'],['NKE','Nike','accion','NYSE'],
['HCA','HCA Healthcare','accion','NYSE'],['EMR','Emerson Electric','accion','NYSE'],
['ECL','Ecolab','accion','NYSE'],['ROP','Roper Technologies','accion','Nasdaq'],
['APD','Air Products and Chemicals','accion','NYSE'],['COP','ConocoPhillips','accion','NYSE'],
['SLB','SLB','accion','NYSE'],['EOG','EOG Resources','accion','NYSE'],
['PSX','Phillips 66','accion','NYSE'],['MPC','Marathon Petroleum','accion','NYSE'],
['VLO','Valero Energy','accion','NYSE'],['OXY','Occidental Petroleum','accion','NYSE'],
['KMI','Kinder Morgan','accion','NYSE'],['WMB','Williams Companies','accion','NYSE'],
['AEP','American Electric Power','accion','Nasdaq'],['D','Dominion Energy','accion','NYSE'],
['EXC','Exelon','accion','Nasdaq'],['SRE','Sempra','accion','NYSE'],
['XEL','Xcel Energy','accion','Nasdaq'],['ED','Consolidated Edison','accion','NYSE'],
['PEG','Public Service Enterprise Group','accion','NYSE'],['WEC','WEC Energy Group','accion','NYSE'],
['AWK','American Water Works','accion','NYSE'],['O','Realty Income','accion','NYSE'],
['AMT','American Tower','accion','NYSE'],['CCI','Crown Castle','accion','NYSE'],
['SPG','Simon Property Group','accion','NYSE'],['PSA','Public Storage','accion','NYSE'],
['DLR','Digital Realty Trust','accion','NYSE'],['WELL','Welltower','accion','NYSE'],
['AVB','AvalonBay Communities','accion','NYSE'],['VICI','VICI Properties','accion','NYSE'],
['GM','General Motors','accion','NYSE'],['F','Ford Motor','accion','NYSE'],
['BA','Boeing','accion','NYSE'],['LUV','Southwest Airlines','accion','NYSE'],
['DAL','Delta Air Lines','accion','NYSE'],['UAL','United Airlines Holdings','accion','Nasdaq'],
['UBER','Uber Technologies','accion','NYSE'],['ABNB','Airbnb','accion','Nasdaq'],
['DASH','DoorDash','accion','Nasdaq'],['SHOP','Shopify','accion','NYSE'],
['SQ','Block','accion','NYSE'],['COIN','Coinbase Global','accion','Nasdaq'],
['SNOW','Snowflake','accion','NYSE'],['CRWD','CrowdStrike Holdings','accion','Nasdaq'],
['DDOG','Datadog','accion','Nasdaq'],['ZS','Zscaler','accion','Nasdaq'],
['MDB','MongoDB','accion','Nasdaq'],['TEAM','Atlassian','accion','Nasdaq'],
['WDAY','Workday','accion','Nasdaq'],['ADSK','Autodesk','accion','Nasdaq'],
['FTNT','Fortinet','accion','Nasdaq'],['CTSH','Cognizant Technology Solutions','accion','Nasdaq'],
['INFY','Infosys','accion','NYSE'],['ACGL','Arch Capital Group','accion','Nasdaq'],
['TRV','Travelers Companies','accion','NYSE'],['ALL','Allstate','accion','NYSE'],
['AFL','Aflac','accion','NYSE'],['MET','MetLife','accion','NYSE'],
['PRU','Prudential Financial','accion','NYSE'],['AIG','American International Group','accion','NYSE'],
['BK','Bank of New York Mellon','accion','NYSE'],['STT','State Street','accion','NYSE'],
['TFC','Truist Financial','accion','NYSE'],['COF','Capital One Financial','accion','NYSE'],
['DFS','Discover Financial Services','accion','NYSE'],['AMP','Ameriprise Financial','accion','NYSE'],
['KKR','KKR & Co','accion','NYSE'],['BX','Blackstone','accion','NYSE'],
['APO','Apollo Global Management','accion','NYSE'],['MCO','Moody\'s','accion','NYSE'],
['MSCI','MSCI','accion','NYSE'],['NDAQ','Nasdaq','accion','Nasdaq'],
['KHC','Kraft Heinz','accion','Nasdaq'],['GIS','General Mills','accion','NYSE'],
['K','Kellanova','accion','NYSE'],['HSY','Hershey','accion','NYSE'],
['STZ','Constellation Brands','accion','NYSE'],['KDP','Keurig Dr Pepper','accion','Nasdaq'],
['MNST','Monster Beverage','accion','Nasdaq'],['SYY','Sysco','accion','NYSE'],
['KR','Kroger','accion','NYSE'],['DG','Dollar General','accion','NYSE'],
['DLTR','Dollar Tree','accion','Nasdaq'],['ROST','Ross Stores','accion','Nasdaq'],
['YUM','Yum! Brands','accion','NYSE'],['DRI','Darden Restaurants','accion','NYSE'],
['EL','Estée Lauder Companies','accion','NYSE'],['KMB','Kimberly-Clark','accion','NYSE'],
['CHD','Church & Dwight','accion','NYSE'],['CLX','Clorox','accion','NYSE'],
['HUM','Humana','accion','NYSE'],['CNC','Centene','accion','NYSE'],
['BDX','Becton Dickinson','accion','NYSE'],['EW','Edwards Lifesciences','accion','NYSE'],
['IDXX','IDEXX Laboratories','accion','Nasdaq'],['A','Agilent Technologies','accion','NYSE'],
['IQV','IQVIA Holdings','accion','NYSE'],['BIIB','Biogen','accion','Nasdaq'],
['MRNA','Moderna','accion','Nasdaq'],['ILMN','Illumina','accion','Nasdaq'],
['DXCM','DexCom','accion','Nasdaq'],['ALGN','Align Technology','accion','Nasdaq'],
['WST','West Pharmaceutical Services','accion','NYSE'],['RMD','ResMed','accion','NYSE'],
['MMM','3M','accion','NYSE'],['CARR','Carrier Global','accion','NYSE'],
['JCI','Johnson Controls International','accion','NYSE'],['TT','Trane Technologies','accion','NYSE'],
['CMI','Cummins','accion','NYSE'],['PCAR','PACCAR','accion','Nasdaq'],
['ROK','Rockwell Automation','accion','NYSE'],['DOV','Dover','accion','NYSE'],
['FAST','Fastenal','accion','Nasdaq'],['GWW','W.W. Grainger','accion','NYSE'],
['URI','United Rentals','accion','NYSE'],['NSC','Norfolk Southern','accion','NYSE'],
['ODFL','Old Dominion Freight Line','accion','Nasdaq'],['LHX','L3Harris Technologies','accion','NYSE'],
['TDG','TransDigm Group','accion','NYSE'],['HWM','Howmet Aerospace','accion','NYSE'],
['AXON','Axon Enterprise','accion','Nasdaq'],['FCX','Freeport-McMoRan','accion','NYSE'],
['NEM','Newmont','accion','NYSE'],['NUE','Nucor','accion','NYSE'],
['DOW','Dow','accion','NYSE'],['DD','DuPont de Nemours','accion','NYSE'],
['PPG','PPG Industries','accion','NYSE'],['VMC','Vulcan Materials','accion','NYSE'],
['MLM','Martin Marietta Materials','accion','NYSE'],['IP','International Paper','accion','NYSE'],
['BLDR','Builders FirstSource','accion','NYSE'],['DHI','D.R. Horton','accion','NYSE'],
['LEN','Lennar','accion','NYSE'],['NVR','NVR','accion','NYSE'],
['PHM','PulteGroup','accion','NYSE'],['WY','Weyerhaeuser','accion','NYSE'],
['TSCO','Tractor Supply','accion','Nasdaq'],['AZO','AutoZone','accion','NYSE'],
['EBAY','eBay','accion','Nasdaq'],['EXPE','Expedia Group','accion','Nasdaq'],
['TTWO','Take-Two Interactive Software','accion','Nasdaq'],['EA','Electronic Arts','accion','Nasdaq'],
['RBLX','Roblox','accion','NYSE'],['SPOT','Spotify Technology','accion','NYSE'],
['WBD','Warner Bros. Discovery','accion','Nasdaq'],['PARA','Paramount Global','accion','Nasdaq'],
['CHTR','Charter Communications','accion','Nasdaq'],['TMUS','T-Mobile US','accion','Nasdaq'],
['ON','ON Semiconductor','accion','Nasdaq'],['MCHP','Microchip Technology','accion','Nasdaq'],
['NXPI','NXP Semiconductors','accion','Nasdaq'],['MRVL','Marvell Technology','accion','Nasdaq'],
['TER','Teradyne','accion','Nasdaq'],['SMCI','Super Micro Computer','accion','Nasdaq'],
['DELL','Dell Technologies','accion','NYSE'],['HPQ','HP','accion','NYSE'],
['HPE','Hewlett Packard Enterprise','accion','NYSE'],['NTAP','NetApp','accion','Nasdaq'],
['STX','Seagate Technology','accion','Nasdaq'],['WDC','Western Digital','accion','Nasdaq'],
['KEYS','Keysight Technologies','accion','NYSE'],['GLW','Corning','accion','NYSE'],
['TSM','Taiwan Semiconductor Manufacturing','accion','NYSE'],['ASML','ASML Holding (ADR)','accion','Nasdaq'],
['BABA','Alibaba Group','accion','NYSE'],['PDD','PDD Holdings','accion','Nasdaq'],
['JD','JD.com','accion','Nasdaq'],['NIO','NIO','accion','NYSE'],
['SONY','Sony Group','accion','NYSE'],['TM','Toyota Motor','accion','NYSE'],
['NVO','Novo Nordisk (ADR)','accion','NYSE'],['AZN','AstraZeneca (ADR)','accion','Nasdaq'],
['SAP','SAP (ADR)','accion','NYSE'],['SHEL','Shell (ADR)','accion','NYSE'],
['BP','BP (ADR)','accion','NYSE'],['TTE','TotalEnergies (ADR)','accion','NYSE'],
['UL','Unilever (ADR)','accion','NYSE'],['HSBC','HSBC Holdings (ADR)','accion','NYSE'],
['SAN','Banco Santander (ADR)','accion','NYSE'],['BBVA','BBVA (ADR)','accion','NYSE'],
['TEF','Telefónica (ADR)','accion','NYSE'],

/* ───────── ETFs Y FONDOS INDEXADOS MÁS USADOS DESDE ESPAÑA ───────── */
['VWCE','Vanguard FTSE All-World UCITS ETF Acc','etf','Xetra'],
['VWRL','Vanguard FTSE All-World UCITS ETF Dist','etf','Ámsterdam'],
['IWDA','iShares Core MSCI World UCITS ETF Acc','etf','Ámsterdam'],
['SWDA','iShares Core MSCI World UCITS ETF Acc','etf','Milán'],
['EUNL','iShares Core MSCI World UCITS ETF Acc','etf','Xetra'],
['IMAE','iShares Core MSCI Europe UCITS ETF','etf','Ámsterdam'],
['EIMI','iShares Core MSCI EM IMI UCITS ETF','etf','Londres'],
['CSPX','iShares Core S&P 500 UCITS ETF Acc','etf','Londres'],
['SXR8','iShares Core S&P 500 UCITS ETF Acc','etf','Xetra'],
['VUSA','Vanguard S&P 500 UCITS ETF Dist','etf','Ámsterdam'],
['ISF','iShares Core FTSE 100 UCITS ETF','etf','Londres'],
['VUKE','Vanguard FTSE 100 UCITS ETF','etf','Londres'],
['VUAA','Vanguard S&P 500 UCITS ETF Acc','etf','Xetra'],
['EQQQ','Invesco EQQQ Nasdaq-100 UCITS ETF','etf','Ámsterdam'],
['CNDX','iShares Nasdaq 100 UCITS ETF Acc','etf','Londres'],
['VEUR','Vanguard FTSE Developed Europe UCITS ETF','etf','Ámsterdam'],
['VERX','Vanguard FTSE Developed Europe ex UK UCITS ETF','etf','Londres'],
['VFEM','Vanguard FTSE Emerging Markets UCITS ETF','etf','Ámsterdam'],
['VJPN','Vanguard FTSE Japan UCITS ETF','etf','Ámsterdam'],
['IUSQ','iShares MSCI ACWI UCITS ETF Acc','etf','Xetra'],
['SPYI','SPDR MSCI ACWI IMI UCITS ETF','etf','Xetra'],
['ZPRV','SPDR MSCI USA Small Cap Value Weighted UCITS ETF','etf','Xetra'],
['ZPRX','SPDR MSCI Europe Small Cap Value Weighted UCITS ETF','etf','Xetra'],
['IUSN','iShares MSCI World Small Cap UCITS ETF','etf','Xetra'],
['WSML','iShares MSCI World Small Cap UCITS ETF','etf','Londres'],
['IS3N','iShares Core MSCI EM IMI UCITS ETF','etf','Xetra'],
['XDWD','Xtrackers MSCI World UCITS ETF','etf','Xetra'],
['XDEM','Xtrackers MSCI World Momentum UCITS ETF','etf','Xetra'],
['XDEV','Xtrackers MSCI World Value UCITS ETF','etf','Xetra'],
['XDEQ','Xtrackers MSCI World Quality UCITS ETF','etf','Xetra'],
['IQQQ','iShares Global Infrastructure UCITS ETF','etf','Xetra'],
['IQQH','iShares Global Clean Energy UCITS ETF','etf','Xetra'],
['IH2O','iShares Global Water UCITS ETF','etf','Londres'],
['IWDP','iShares Developed Markets Property Yield UCITS ETF','etf','Londres'],
['IEAC','iShares Core Euro Corporate Bond UCITS ETF','etf','Londres'],
['IEAG','iShares Core Euro Aggregate Bond UCITS ETF','etf','Londres'],
['IBGL','iShares Euro Government Bond 15-30yr UCITS ETF','etf','Londres'],
['IB01','iShares USD Treasury Bond 0-1yr UCITS ETF','etf','Londres'],
['ERNE','iShares Euro Ultrashort Bond UCITS ETF','etf','Londres'],
['XEON','Xtrackers II EUR Overnight Rate Swap UCITS ETF','etf','Xetra'],
['SGLN','iShares Physical Gold ETC','etf','Londres'],
['4GLD','Xetra-Gold','etf','Xetra'],
['LYXIB','Amundi IBEX 35 UCITS ETF','etf','Madrid'],
['BBVAI','BBVA Bolsa Índice FI','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['VANGEUR','Vanguard European Stock Index Fund','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['VANGGLB','Vanguard Global Stock Index Fund','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['VANGSP5','Vanguard U.S. 500 Stock Index Fund','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['VANGEM','Vanguard Emerging Markets Stock Index Fund','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['VANGJAP','Vanguard Japan Stock Index Fund','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['VANGGB','Vanguard Global Bond Index Fund','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['AMUNDIW','Amundi Index MSCI World','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['AMUNDIEM','Amundi Index MSCI Emerging Markets','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['FIDEUR','Fidelity MSCI Europe Index Fund','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['ISHWLD','iShares Developed World Index Fund','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['BESTINFON','Bestinfond','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['BESTINVER','Bestinver Internacional','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['COBAS','Cobas Internacional','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['AZVALOR','azValor Internacional','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['MAGALLANES','Magallanes European Equity','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['HORIZON','Horos Value Internacional','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['TRUEVALUE','True Value','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['NUMANTIA','Numantia Patrimonio Global','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['SEILERN','Seilern World Growth','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],
['FUNDSMITH','Fundsmith Equity Fund','fondo','sin ticker oficial: pon su ISIN en «Más datos»'],

  ];

  /* Quita tildes y pasa a minúsculas, para que «telefonica» encuentre
     «Telefónica» y «amperes» no haga falta escribirlo clavado */
  const llano = s => String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* Lo que tú hayas importado al cribado vale tanto como la lista de fábrica,
     y además viene con sector y país. Por eso el catálogo crece con tu uso. */
  function delUniverso() {
    try {
      if (typeof Store === 'undefined' || !Store.universo) return [];
      return Store.universo().map(e => ({
        ticker: e.ticker || '', nombre: e.nombre || e.ticker || '',
        tipo: 'accion', mercado: e.mercado || e.pais || '',
        sector: e.sector || '', pais: e.pais || '', origen: 'cribado'
      })).filter(x => x.ticker);
    } catch (e) { return []; }
  }

  function todos() {
    const base = V.map(v => ({ ticker: v[0], nombre: v[1], tipo: v[2], mercado: v[3], sector: '', pais: '', origen: 'catalogo' }));
    const vistos = new Set(base.map(x => llano(x.ticker + '|' + x.nombre)));
    const extra = delUniverso().filter(x => {
      const k = llano(x.ticker + '|' + x.nombre);
      if (vistos.has(k)) return false;
      vistos.add(k); return true;
    });
    return base.concat(extra);
  }

  /* Devuelve lo que mejor encaja. El orden importa más que la cantidad:
       0  ticker exacto              («ITX»)
       1  ticker que empieza así     («FT» → FTNT)
       2  nombre que empieza así     («tele» → Telefónica)
       3  alguna palabra del nombre empieza así  («FT» → Vanguard FTSE…)
       4  el ticker lo contiene
       5  el nombre lo contiene, solo desde tres letras: con dos, «ft»
          sacaría Microsoft y Lufthansa, que no es lo que buscas
     Varias palabras se buscan todas a la vez: «vanguard europe».
     `filtro.tipo` deja solo acciones, ETFs o fondos. */
  function buscar(q, tope, filtro) {
    const t = llano(q).trim().replace(/\s+/g, ' ');
    if (!t) return [];
    const trozos = t.split(' ');
    const yaTengo = new Set();
    try { Store.activos().forEach(a => yaTengo.add(llano(a.ticker))); } catch (e) {}
    const tipo = filtro && filtro.tipo;
    const out = [];
    todos().forEach(x => {
      if (tipo && x.tipo !== tipo) return;
      const tk = llano(x.ticker), nb = llano(x.nombre);
      const palabras = nb.split(/[^a-z0-9&]+/).filter(Boolean);
      const empiezaPalabra = w => palabras.some(p => p.startsWith(w));
      let p = -1;
      if (tk === t) p = 0;
      else if (tk.startsWith(t)) p = 1;
      else if (nb.startsWith(t)) p = 2;
      else if (trozos.every(w => empiezaPalabra(w) || tk.startsWith(w))) p = 3;
      else if (t.length >= 2 && tk.includes(t)) p = 4;
      else if (t.length >= 3 && trozos.every(w => nb.includes(w) || tk.includes(w))) p = 5;
      if (p < 0) return;
      out.push(Object.assign({ p, tengo: yaTengo.has(tk) }, x));
    });
    out.sort((a, b) => a.p - b.p || a.ticker.length - b.ticker.length || a.nombre.localeCompare(b.nombre));
    const lista = out.slice(0, tope || 12);
    lista.total = out.length;
    return lista;
  }

  /* Engancha el buscador a un campo cualquiera. La lista sale justo debajo
     del campo, empujando lo de abajo (nada flotando que se corte en el
     móvil), y se elige tocando. `opts.elegir(x)` recibe lo elegido;
     `opts.filtro()` puede devolver { tipo } para afinar. */
  function enganchar(input, opts) {
    if (!input) return;
    opts = opts || {};
    const caja = document.createElement('div');
    caja.className = 'sugerencias';
    const campo = input.closest('.field') || input.parentNode;
    campo.appendChild(caja);
    let sug = [], marcado = -1;
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const nombreTipo = k => (typeof TIPOS !== 'undefined' && TIPOS[k]) || k;
    const cerrar = () => { sug = []; marcado = -1; caja.innerHTML = ''; caja.classList.remove('on'); };
    const pintar = () => {
      if (!sug.length) {
        const q = input.value.trim();
        if (q.length >= 2 && opts.avisarVacio !== false) {
          caja.innerHTML = `<div class="sug-nada">Nada en la lista con «${esc(q)}». Puedes añadirlo igual: escribe el resto a mano.</div>`;
          caja.classList.add('on');
        } else cerrar();
        return;
      }
      caja.innerHTML = sug.map((x, i) => `
        <button type="button" class="sug ${i === marcado ? 'on' : ''}" data-i="${i}">
          <b>${esc(x.ticker)}</b>
          <span>${esc(x.nombre)}<em>${esc(nombreTipo(x.tipo))}${x.mercado ? ' · ' + esc(x.mercado) : ''}${x.origen === 'cribado' ? ' · de tu cribado' : ''}</em></span>
          ${x.tengo ? '<i class="ya">ya la tienes</i>' : ''}
        </button>`).join('') +
        (sug.total > sug.length ? `<div class="sug-nada">Y ${sug.total - sug.length} más: sigue escribiendo para afinar.</div>` : '');
      caja.classList.add('on');
      caja.querySelectorAll('.sug').forEach(b => b.onclick = e => { e.preventDefault(); elegir(sug[+b.dataset.i]); });
    };
    const elegir = x => {
      if (!x) return;
      cerrar();
      if (opts.elegir) opts.elegir(x);
    };
    const buscarYa = () => {
      sug = buscar(input.value, opts.tope || 12, opts.filtro ? opts.filtro() : null);
      marcado = -1; pintar();
    };
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');
    input.addEventListener('input', buscarYa);
    input.addEventListener('focus', () => { if (input.value.trim() && !opts.noAlEnfocar) buscarYa(); });
    input.addEventListener('keydown', e => {
      if (!sug.length) return;
      if (e.key === 'ArrowDown') { marcado = Math.min(sug.length - 1, marcado + 1); pintar(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { marcado = Math.max(0, marcado - 1); pintar(); e.preventDefault(); }
      else if (e.key === 'Enter') { elegir(sug[marcado < 0 ? 0 : marcado]); e.preventDefault(); }
      else if (e.key === 'Escape') { cerrar(); e.stopPropagation(); }
    });
    /* Tocar fuera la cierra */
    document.addEventListener('click', e => { if (!campo.contains(e.target)) cerrar(); });
    return { cerrar, buscar: buscarYa };
  }

  /* El que encaja exacto con un ticker escrito a mano, para completar el
     nombre si el usuario no llegó a elegir de la lista */
  function exacto(tk) {
    const t = llano(tk).trim();
    return t ? todos().find(x => llano(x.ticker) === t) || null : null;
  }

  return { V, buscar, enganchar, exacto, todos, cuantos: () => todos().length };
})();
