// Standart ve Uluslararası Gerçek Dünya Liman Koordinatları (112 Adet Küresel Liman)
export const PORT_COORDS: Record<string, { lat: number; lng: number }> = {
  // 1. Türkiye, Karadeniz & Boğazlar
  TRIST: { lat: 40.9712, lng: 28.6922 }, // Ambarlı / İstanbul
  TRASY: { lat: 40.9255, lng: 27.4647 }, // Tekirdağ Asyaport
  TRMER: { lat: 36.7915, lng: 34.6366 }, // Mersin Uluslararası Limanı
  TRIZM: { lat: 38.4382, lng: 27.1425 }, // İzmir Alsancak
  TRNMP: { lat: 38.7620, lng: 26.9240 }, // Nemrut / Nemport Körfezi
  TRISK: { lat: 36.5980, lng: 36.1750 }, // İskenderun Limanı
  TRKOC: { lat: 40.7681, lng: 29.7431 }, // Kocaeli DP World / Derince
  TRGEM: { lat: 40.4350, lng: 29.1550 }, // Gemlik Borusan
  TRSSX: { lat: 41.2980, lng: 36.3450 }, // Samsun Port
  TRTZX: { lat: 41.0080, lng: 39.7350 }, // Trabzon Limanı
  TRFLY: { lat: 41.5720, lng: 32.0250 }, // Filyos Limanı
  TRBND: { lat: 40.3550, lng: 27.9750 }, // Bandırma Limanı
  TRCKZ: { lat: 40.1550, lng: 26.4050 }, // Çanakkale Kepez
  TRANT: { lat: 36.8350, lng: 30.6050 }, // Antalya Port Akdeniz
  TRHAY: { lat: 40.9980, lng: 29.0200 }, // Haydarpaşa Limanı
  TRBDM: { lat: 37.0320, lng: 27.4320 }, // Bodrum Kruvaziyer Limanı
  TRSIN: { lat: 42.0250, lng: 35.1550 }, // Sinop Limanı
  TRRIZ: { lat: 41.0350, lng: 40.5250 }, // Rize Limanı
  TRHOP: { lat: 41.4050, lng: 41.4350 }, // Hopa Limanı
  ROKOS: { lat: 44.1560, lng: 28.6600 }, // Köstence Limanı (Constanta)
  ROCND: { lat: 44.1560, lng: 28.6600 }, // Köstence Limanı (Constanta)
  UAODS: { lat: 46.4950, lng: 30.7480 }, // Odesa Limanı
  UASVP: { lat: 44.6200, lng: 33.5300 }, // Sivastopol Limanı
  RUNVS: { lat: 44.7200, lng: 37.7850 }, // Novorossiysk Limanı
  BGVAR: { lat: 43.1950, lng: 27.9150 }, // Varna Limanı
  BGBOJ: { lat: 42.4850, lng: 27.4820 }, // Burgaz Limanı
  GEPTI: { lat: 42.1550, lng: 41.6600 }, // Poti Limanı
  GEBAT: { lat: 41.6500, lng: 41.6450 }, // Batum Limanı
  GEBUS: { lat: 41.6500, lng: 41.6450 }, // Batum Limanı

  // 2. Akdeniz & Ege & Adriyatik
  GRPIR: { lat: 37.9429, lng: 23.6469 }, // Pire Limanı (Piraeus)
  GRSKG: { lat: 40.6350, lng: 22.9280 }, // Selanik Limanı
  GRHER: { lat: 35.3450, lng: 25.1480 }, // Kandiye Limanı (Heraklion)
  ESVLC: { lat: 39.4420, lng: -0.3200 }, // Valensiya Limanı
  ESBCN: { lat: 41.3480, lng: 2.1650 },  // Barselona Limanı
  ESALG: { lat: 36.1320, lng: -5.4380 }, // Algeciras Limanı
  ITGOA: { lat: 44.4050, lng: 8.9250 },  // Cenova Limanı
  ITTAR: { lat: 40.4850, lng: 17.2150 }, // Taranto Limanı
  ITTRS: { lat: 45.6420, lng: 13.7620 }, // Trieste Limanı
  ITLIV: { lat: 43.5550, lng: 10.2980 }, // Livorno Limanı
  FRMRS: { lat: 43.3450, lng: 5.3350 },  // Marsilya Limanı
  MTMLA: { lat: 35.8250, lng: 14.5420 }, // Marsaxlokk Freeport (Malta)
  CYLMS: { lat: 34.6550, lng: 33.0250 }, // Limasol Limanı
  LBBEY: { lat: 33.9050, lng: 35.5200 }, // Beyrut Limanı
  ILHFA: { lat: 32.8250, lng: 35.0020 }, // Hayfa Limanı
  ILASH: { lat: 31.8350, lng: 34.6480 }, // Aşdod Limanı
  EGPSD: { lat: 31.2650, lng: 32.3120 }, // Port Said
  EGALY: { lat: 31.1850, lng: 29.8700 }, // İskenderiye Limanı
  EGEDK: { lat: 31.1350, lng: 29.8050 }, // Dekheila Limanı
  EGDAM: { lat: 31.4750, lng: 31.7550 }, // Dimyat Limanı

  // 3. Kuzey Afrika & Atlantik & Cebelitarık
  MAPTM: { lat: 35.8920, lng: -5.5050 }, // Tanca Med Limanı
  MACAS: { lat: 33.6050, lng: -7.6080 }, // Kazablanka Limanı
  DZALG: { lat: 36.7720, lng: 3.0650 },  // Cezayir Limanı
  DZORN: { lat: 35.7080, lng: -0.6380 }, // Oran Limanı
  TNTUN: { lat: 36.8020, lng: 10.3150 }, // Rades Limanı (Tunus)
  LYTIP: { lat: 32.9020, lng: 13.1950 }, // Trablus Limanı
  LYBEN: { lat: 32.1180, lng: 20.0520 }, // Bingazi Limanı
  PTLIS: { lat: 38.7050, lng: -9.1620 }, // Lizbon Limanı
  PTSIE: { lat: 37.9520, lng: -8.8750 }, // Sines Limanı
  ESVGO: { lat: 42.2420, lng: -8.7350 }, // Vigo Limanı

  // 4. Kuzey Avrupa, Baltık & Birleşik Krallık
  NLRTM: { lat: 51.9520, lng: 4.1350 },  // Rotterdam Limanı
  BEANR: { lat: 51.2750, lng: 4.3420 },  // Anvers Limanı
  DEHAM: { lat: 53.5350, lng: 9.9450 },  // Hamburg Limanı
  DEBRE: { lat: 53.5650, lng: 8.5600 },  // Bremerhaven Limanı
  GBFXT: { lat: 51.9520, lng: 1.3150 },  // Felixstowe Limanı
  GBSOU: { lat: 50.8950, lng: -1.4150 }, // Southampton Limanı
  GBLON: { lat: 51.5050, lng: 0.4680 },  // London Gateway
  FRLEH: { lat: 49.4750, lng: 0.1150 },  // Le Havre Limanı
  FRDKK: { lat: 51.0520, lng: 2.3750 },  // Dunkirk Limanı
  PLGDN: { lat: 54.3980, lng: 18.6850 }, // Gdansk Limanı
  PLGDY: { lat: 54.5350, lng: 18.5420 }, // Gdynia Limanı
  DKCPH: { lat: 55.7050, lng: 12.6020 }, // Kopenhag Limanı
  SEGOT: { lat: 57.7020, lng: 11.9050 }, // Göteborg Limanı
  NOOSL: { lat: 59.9050, lng: 10.7420 }, // Oslo Limanı
  FIHEL: { lat: 60.2150, lng: 25.1950 }, // Helsinki Limanı

  // 5. Kızıldeniz, Basra Körfezi & Orta Doğu
  EGSUZ: { lat: 29.9520, lng: 32.5580 }, // Süveyş Limanı
  SAJED: { lat: 21.4650, lng: 39.1620 }, // Cidde İslam Limanı
  SAKAP: { lat: 22.5350, lng: 39.0950 }, // Kral Abdullah Limanı
  JOAQJ: { lat: 29.5150, lng: 35.0050 }, // Akabe Limanı
  DJJIB: { lat: 11.5950, lng: 43.1150 }, // Cibuti Limanı
  OMSLL: { lat: 16.9450, lng: 54.0050 }, // Salalah Limanı
  OMSOH: { lat: 24.4950, lng: 56.6350 }, // Sohar Limanı
  AEJEA: { lat: 25.0120, lng: 55.0620 }, // Jebel Ali (Dubai)
  AEKHL: { lat: 24.8150, lng: 54.6750 }, // Khalifa Limanı (Abu Dhabi)
  AEFJR: { lat: 25.1750, lng: 56.3620 }, // Fujairah Limanı
  QAHMD: { lat: 25.0180, lng: 51.6150 }, // Hamad Limanı (Katar)
  BHKBS: { lat: 26.1950, lng: 50.6950 }, // Khalifa Bin Salman (Bahreyn)
  SADMM: { lat: 26.4450, lng: 50.1550 }, // Dammam Kral Abdülaziz Limanı
  KWSHU: { lat: 29.3550, lng: 47.9250 }, // Shuwaikh Limanı (Kuveyt)
  IRBND: { lat: 27.1250, lng: 56.0750 }, // Bender Abbas Limanı

  // 6. Hint Okyanusu, Güney & Güneydoğu Asya
  SGSIN: { lat: 1.2650, lng: 103.8250 },  // Singapur Limanı
  MYPKG: { lat: 2.9980, lng: 101.3850 },  // Port Klang
  MYTPP: { lat: 1.3650, lng: 103.5480 },  // Tanjung Pelepas (PTP)
  LKCMB: { lat: 6.9520, lng: 79.8450 },   // Kolombo Limanı
  INNSA: { lat: 18.9450, lng: 72.9520 },  // Nhava Sheva (Mumbai)
  INMUN: { lat: 22.7450, lng: 69.7050 },  // Mundra Limanı
  INMAA: { lat: 13.0950, lng: 80.2980 },  // Chennai Limanı
  PKKHI: { lat: 24.8250, lng: 66.9750 },  // Karaçi Limanı
  PKBQM: { lat: 24.7750, lng: 67.3450 },  // Port Qasim
  BDCGP: { lat: 22.3150, lng: 91.8050 },  // Chittagong Limanı
  THLCH: { lat: 13.0750, lng: 100.8950 }, // Laem Chabang Limanı
  VNSGN: { lat: 10.7650, lng: 106.7950 }, // Saygon Limanı (Cat Lai)
  VNVUT: { lat: 10.5150, lng: 107.0250 }, // Cai Mep Limanı
  IDTPP: { lat: -6.1050, lng: 106.8850 }, // Tanjung Priok (Cakarta)
  PHMNL: { lat: 14.5850, lng: 120.9550 }, // Manila Limanı

  // 7. Doğu Asya & Çin Denizi
  CNSHA: { lat: 30.6250, lng: 122.0650 }, // Şanghay Yangshan Limanı
  CNNGB: { lat: 29.8950, lng: 121.8450 }, // Ningbo-Zhoushan Limanı
  CNSZX: { lat: 22.5650, lng: 114.2650 }, // Shenzhen Yantian Limanı
  CNQDG: { lat: 36.0850, lng: 120.3150 }, // Qingdao Limanı
  CNHKG: { lat: 22.3350, lng: 114.1250 }, // Hong Kong Limanı
  KRPUS: { lat: 35.0750, lng: 128.8350 }, // Busan New Port
  KRICN: { lat: 37.4550, lng: 126.6150 }, // Incheon Limanı
  JPTYO: { lat: 35.6150, lng: 139.7750 }, // Tokyo Limanı
  JPYOK: { lat: 35.4550, lng: 139.6650 }, // Yokohama Limanı
  TWKHH: { lat: 22.6150, lng: 120.2850 }, // Kaohsiung Limanı

};

// Global ve Türkiye kıyı hattı boyunca gerçekçi sanal liman koordinat havuzu
const COASTAL_ANCHORAGES: { lat: number; lng: number }[] = [
  // Karadeniz Kıyıları
  { lat: 41.41, lng: 41.42 }, // Hopa Açıkları
  { lat: 41.04, lng: 40.52 }, // Rize Açıkları
  { lat: 41.01, lng: 39.73 }, // Trabzon Açıkları
  { lat: 41.30, lng: 36.35 }, // Samsun Körfezi
  { lat: 42.02, lng: 35.15 }, // Sinop Burnu
  { lat: 41.75, lng: 32.38 }, // Amasra
  { lat: 41.46, lng: 31.79 }, // Zonguldak
  { lat: 41.12, lng: 29.11 }, // Kilyos Karadeniz

  // Marmara & Boğazlar
  { lat: 40.97, lng: 28.70 }, // Ambarlı Demir Sahası
  { lat: 40.86, lng: 29.28 }, // Tuzla Demir Sahası
  { lat: 40.76, lng: 29.74 }, // İzmit Körfezi
  { lat: 40.43, lng: 29.15 }, // Gemlik Körfezi
  { lat: 40.35, lng: 27.97 }, // Bandırma Körfezi
  { lat: 40.92, lng: 27.46 }, // Tekirdağ Açıkları

  // Ege Denizi
  { lat: 40.15, lng: 26.40 }, // Çanakkale Boğazı
  { lat: 39.85, lng: 26.05 }, // Bozcaada
  { lat: 38.79, lng: 26.96 }, // Çandarlı / Aliağa
  { lat: 38.44, lng: 27.14 }, // İzmir Körfezi İçi
  { lat: 37.86, lng: 27.25 }, // Kuşadası
  { lat: 37.03, lng: 27.42 }, // Bodrum Karaada Açıkları

  // Akdeniz Kıyıları
  { lat: 36.85, lng: 28.27 }, // Marmaris Körfezi
  { lat: 36.65, lng: 29.11 }, // Fethiye Körfezi
  { lat: 36.83, lng: 30.61 }, // Antalya Körfezi
  { lat: 36.79, lng: 34.64 }, // Mersin Liman Sahası
  { lat: 36.60, lng: 36.17 }, // İskenderun Körfezi

  // Uluslararası Deniz Geçitleri & Demir Sahaları
  { lat: 35.95, lng: -5.35 },  // Cebelitarık Boğazı
  { lat: 31.35, lng: 32.35 },  // Süveyş Kanalı Akdeniz Girişi
  { lat: 27.85, lng: 34.35 },  // Tiran Boğazı
  { lat: 12.65, lng: 43.35 },  // Babülmendep Boğazı
  { lat: 26.25, lng: 56.45 },  // Hürmüz Boğazı
  { lat: 1.25, lng: 103.85 },   // Malakka Boğazı Singapur
  { lat: 51.15, lng: 1.45 },    // Manş Denizi / Dover
  { lat: 55.65, lng: 12.75 },   // Danimarka Boğazları
];

/**
 * Verilen liman kodu veya id için gerçekçi deniz koordinatı üretir.
 * Bilinen limanlarda doğrudan sabit koordinatı, test/sanal limanlarda ise
 * dünya genelindeki kıyı ve demir sahalarına dağılmış gerçekçi deniz konumlarını döner.
 */
export function getPortCoordinates(portCode?: string, portId?: number): { lat: number; lng: number } {
  if (portCode && PORT_COORDS[portCode]) {
    return PORT_COORDS[portCode];
  }

  // Tanımlı olmayan veya sanal limanlar için deterministik deniz dağıtımı
  const numId = portId || (portCode ? parseInt(portCode.replace(/\D/g, ''), 10) || 1 : 1);
  const anchorIndex = Math.abs(numId) % COASTAL_ANCHORAGES.length;
  const base = COASTAL_ANCHORAGES[anchorIndex];

  // Çok küçük kontrollü saçılma (karaya taşmayı önler)
  const jitterLat = (((numId * 13) % 7) - 3) * 0.003;
  const jitterLng = (((numId * 29) % 7) - 3) * 0.003;

  return {
    lat: Number((base.lat + jitterLat).toFixed(4)),
    lng: Number((base.lng + jitterLng).toFixed(4)),
  };
}

export interface GlobalPortCatalogItem {
  name: string;
  code: string;
  country: string;
  city: string;
  capacity: number;
  region: string;
  lat: number;
  lng: number;
}

export const GLOBAL_PORTS_CATALOG: GlobalPortCatalogItem[] = [
  // 1. Türkiye, Karadeniz & Boğazlar
  { name: 'İstanbul Ambarlı Limanı', code: 'TRIST', country: 'Türkiye', city: 'İstanbul', capacity: 65, region: 'Türkiye & Boğazlar', lat: 40.9712, lng: 28.6922 },
  { name: 'Tekirdağ Asyaport', code: 'TRASY', country: 'Türkiye', city: 'Tekirdağ', capacity: 50, region: 'Türkiye & Boğazlar', lat: 40.9255, lng: 27.4647 },
  { name: 'Mersin Uluslararası Limanı (MIP)', code: 'TRMER', country: 'Türkiye', city: 'Mersin', capacity: 60, region: 'Türkiye & Boğazlar', lat: 36.7915, lng: 34.6366 },
  { name: 'İzmir Alsancak Limanı', code: 'TRIZM', country: 'Türkiye', city: 'İzmir', capacity: 45, region: 'Türkiye & Boğazlar', lat: 38.4382, lng: 27.1425 },
  { name: 'Nemrut / Nemport Körfezi', code: 'TRNMP', country: 'Türkiye', city: 'Aliağa', capacity: 40, region: 'Türkiye & Boğazlar', lat: 38.7620, lng: 26.9240 },
  { name: 'İskenderun Limanı', code: 'TRISK', country: 'Türkiye', city: 'İskenderun', capacity: 40, region: 'Türkiye & Boğazlar', lat: 36.5980, lng: 36.1750 },
  { name: 'Kocaeli / Derince Limanı', code: 'TRKOC', country: 'Türkiye', city: 'Kocaeli', capacity: 55, region: 'Türkiye & Boğazlar', lat: 40.7681, lng: 29.7431 },
  { name: 'Gemlik Borusan Limanı', code: 'TRGEM', country: 'Türkiye', city: 'Bursa', capacity: 35, region: 'Türkiye & Boğazlar', lat: 40.4350, lng: 29.1550 },
  { name: 'Samsun Port', code: 'TRSSX', country: 'Türkiye', city: 'Samsun', capacity: 30, region: 'Karadeniz', lat: 41.2980, lng: 36.3450 },
  { name: 'Trabzon Limanı', code: 'TRTZX', country: 'Türkiye', city: 'Trabzon', capacity: 25, region: 'Karadeniz', lat: 41.0080, lng: 39.7350 },
  { name: 'Filyos Limanı', code: 'TRFLY', country: 'Türkiye', city: 'Zonguldak', capacity: 35, region: 'Karadeniz', lat: 41.5720, lng: 32.0250 },
  { name: 'Bandırma Limanı', code: 'TRBND', country: 'Türkiye', city: 'Balıkesir', capacity: 30, region: 'Marmara Denizi', lat: 40.3550, lng: 27.9750 },
  { name: 'Çanakkale Kepez Limanı', code: 'TRCKZ', country: 'Türkiye', city: 'Çanakkale', capacity: 25, region: 'Çanakkale Boğazı', lat: 40.1550, lng: 26.4050 },
  { name: 'Antalya Port Akdeniz', code: 'TRANT', country: 'Türkiye', city: 'Antalya', capacity: 30, region: 'Türkiye Akdeniz', lat: 36.8350, lng: 30.6050 },
  { name: 'Haydarpaşa Limanı', code: 'TRHAY', country: 'Türkiye', city: 'İstanbul', capacity: 35, region: 'İstanbul Boğazı', lat: 40.9980, lng: 29.0200 },
  { name: 'Bodrum Kruvaziyer Limanı', code: 'TRBDM', country: 'Türkiye', city: 'Muğla', capacity: 20, region: 'Ege Denizi', lat: 37.0320, lng: 27.4320 },
  { name: 'Köstence Limanı (Constanta)', code: 'ROCND', country: 'Romanya', city: 'Constanta', capacity: 60, region: 'Karadeniz', lat: 44.1560, lng: 28.6600 },
  { name: 'Odesa Limanı', code: 'UAODS', country: 'Ukrayna', city: 'Odesa', capacity: 45, region: 'Karadeniz', lat: 46.4950, lng: 30.7480 },
  { name: 'Varna Limanı', code: 'BGVAR', country: 'Bulgaristan', city: 'Varna', capacity: 35, region: 'Karadeniz', lat: 43.1950, lng: 27.9150 },
  { name: 'Burgaz Limanı (Burgas)', code: 'BGBOJ', country: 'Bulgaristan', city: 'Burgas', capacity: 30, region: 'Karadeniz', lat: 42.4850, lng: 27.4820 },
  { name: 'Poti Limanı', code: 'GEPTI', country: 'Gürcistan', city: 'Poti', capacity: 30, region: 'Karadeniz', lat: 42.1550, lng: 41.6600 },
  { name: 'Batum Limanı (Batumi)', code: 'GEBUS', country: 'Gürcistan', city: 'Batumi', capacity: 25, region: 'Karadeniz', lat: 41.6500, lng: 41.6450 },

  // 2. Akdeniz & Ege & Adriyatik
  { name: 'Piraeus Port (Atina)', code: 'GRPIR', country: 'Yunanistan', city: 'Atina', capacity: 75, region: 'Akdeniz & Ege', lat: 37.9429, lng: 23.6469 },
  { name: 'Selanik Limanı (Thessaloniki)', code: 'GRSKG', country: 'Yunanistan', city: 'Selanik', capacity: 40, region: 'Akdeniz & Ege', lat: 40.6350, lng: 22.9280 },
  { name: 'Kandiye Limanı (Heraklion)', code: 'GRHER', country: 'Yunanistan', city: 'Girit', capacity: 30, region: 'Akdeniz & Ege', lat: 35.3450, lng: 25.1480 },
  { name: 'Valensiya Limanı (Valencia)', code: 'ESVLC', country: 'İspanya', city: 'Valensiya', capacity: 70, region: 'Batı Akdeniz', lat: 39.4420, lng: -0.3200 },
  { name: 'Barselona Limanı (Barcelona)', code: 'ESBCN', country: 'İspanya', city: 'Barselona', capacity: 65, region: 'Batı Akdeniz', lat: 41.3480, lng: 2.1650 },
  { name: 'Algeciras Limanı', code: 'ESALG', country: 'İspanya', city: 'Algeciras', capacity: 70, region: 'Cebelitarık', lat: 36.1320, lng: -5.4380 },
  { name: 'Cenova Limanı (Genoa)', code: 'ITGOA', country: 'İtalya', city: 'Cenova', capacity: 60, region: 'Batı Akdeniz', lat: 44.4050, lng: 8.9250 },
  { name: 'Taranto Limanı', code: 'ITTAR', country: 'İtalya', city: 'Taranto', capacity: 40, region: 'Adriyatik / İyon', lat: 40.4850, lng: 17.2150 },
  { name: 'Trieste Limanı', code: 'ITTRS', country: 'İtalya', city: 'Trieste', capacity: 50, region: 'Adriyatik', lat: 45.6420, lng: 13.7620 },
  { name: 'Livorno Limanı', code: 'ITLIV', country: 'İtalya', city: 'Livorno', capacity: 35, region: 'Batı Akdeniz', lat: 43.5550, lng: 10.2980 },
  { name: 'Marsilya Limanı (Marseille Fos)', code: 'FRMRS', country: 'Fransa', city: 'Marsilya', capacity: 60, region: 'Batı Akdeniz', lat: 43.3450, lng: 5.3350 },
  { name: 'Marsaxlokk Freeport (Malta)', code: 'MTMLA', country: 'Malta', city: 'Marsaxlokk', capacity: 55, region: 'Orta Akdeniz', lat: 35.8250, lng: 14.5420 },
  { name: 'Limasol Limanı (Limassol)', code: 'CYLMS', country: 'Kıbrıs', city: 'Limasol', capacity: 35, region: 'Doğu Akdeniz', lat: 34.6550, lng: 33.0250 },
  { name: 'Beyrut Limanı (Beirut)', code: 'LBBEY', country: 'Lübnan', city: 'Beyrut', capacity: 35, region: 'Doğu Akdeniz', lat: 33.9050, lng: 35.5200 },
  { name: 'Hayfa Limanı (Haifa)', code: 'ILHFA', country: 'İsrail', city: 'Hayfa', capacity: 45, region: 'Doğu Akdeniz', lat: 32.8250, lng: 35.0020 },
  { name: 'Aşdod Limanı (Ashdod)', code: 'ILASH', country: 'İsrail', city: 'Aşdod', capacity: 40, region: 'Doğu Akdeniz', lat: 31.8350, lng: 34.6480 },
  { name: 'Port Said (Süveyş Girişi)', code: 'EGPSD', country: 'Mısır', city: 'Port Said', capacity: 70, region: 'Süveyş Kanalı', lat: 31.2650, lng: 32.3120 },
  { name: 'İskenderiye Limanı (Alexandria)', code: 'EGALY', country: 'Mısır', city: 'İskenderiye', capacity: 55, region: 'Kuzey Afrika', lat: 31.1850, lng: 29.8700 },
  { name: 'Dekheila Limanı', code: 'EGEDK', country: 'Mısır', city: 'İskenderiye', capacity: 40, region: 'Kuzey Afrika', lat: 31.1350, lng: 29.8050 },
  { name: 'Dimyat Limanı (Damietta)', code: 'EGDAM', country: 'Mısır', city: 'Dimyat', capacity: 45, region: 'Kuzey Afrika', lat: 31.4750, lng: 31.7550 },

  // 3. Kuzey Afrika & Atlantik & Cebelitarık
  { name: 'Tanca Med Limanı (Tanger Med)', code: 'MAPTM', country: 'Fas', city: 'Tanca', capacity: 75, region: 'Cebelitarık', lat: 35.8920, lng: -5.5050 },
  { name: 'Kazablanka Limanı (Casablanca)', code: 'MACAS', country: 'Fas', city: 'Kazablanka', capacity: 45, region: 'Atlantik', lat: 33.6050, lng: -7.6080 },
  { name: 'Cezayir Limanı (Algiers)', code: 'DZALG', country: 'Cezayir', city: 'Cezayir', capacity: 40, region: 'Kuzey Afrika', lat: 36.7720, lng: 3.0650 },
  { name: 'Oran Limanı', code: 'DZORN', country: 'Cezayir', city: 'Oran', capacity: 35, region: 'Kuzey Afrika', lat: 35.7080, lng: -0.6380 },
  { name: 'Rades Limanı (Tunis)', code: 'TNTUN', country: 'Tunus', city: 'Tunus', capacity: 35, region: 'Kuzey Afrika', lat: 36.8020, lng: 10.3150 },
  { name: 'Trablus Limanı (Tripoli)', code: 'LYTIP', country: 'Libya', city: 'Trablus', capacity: 30, region: 'Kuzey Afrika', lat: 32.9020, lng: 13.1950 },
  { name: 'Bingazi Limanı (Benghazi)', code: 'LYBEN', country: 'Libya', city: 'Bingazi', capacity: 25, region: 'Kuzey Afrika', lat: 32.1180, lng: 20.0520 },
  { name: 'Lizbon Limanı (Lisbon)', code: 'PTLIS', country: 'Portekiz', city: 'Lizbon', capacity: 45, region: 'Atlantik', lat: 38.7050, lng: -9.1620 },
  { name: 'Sines Limanı', code: 'PTSIE', country: 'Portekiz', city: 'Sines', capacity: 50, region: 'Atlantik', lat: 37.9520, lng: -8.8750 },
  { name: 'Vigo Limanı', code: 'ESVGO', country: 'İspanya', city: 'Vigo', capacity: 35, region: 'Atlantik', lat: 42.2420, lng: -8.7350 },

  // 4. Kuzey Avrupa, Baltık & Birleşik Krallık
  { name: 'Rotterdam Limanı (Port of Rotterdam)', code: 'NLRTM', country: 'Hollanda', city: 'Rotterdam', capacity: 90, region: 'Kuzey Avrupa', lat: 51.9520, lng: 4.1350 },
  { name: 'Anvers Limanı (Antwerp-Bruges)', code: 'BEANR', country: 'Belçika', city: 'Anvers', capacity: 85, region: 'Kuzey Avrupa', lat: 51.2750, lng: 4.3420 },
  { name: 'Hamburg Limanı', code: 'DEHAM', country: 'Almanya', city: 'Hamburg', capacity: 80, region: 'Kuzey Avrupa', lat: 53.5350, lng: 9.9450 },
  { name: 'Bremerhaven Limanı', code: 'DEBRE', country: 'Almanya', city: 'Bremerhaven', capacity: 60, region: 'Kuzey Avrupa', lat: 53.5650, lng: 8.5600 },
  { name: 'Felixstowe Limanı', code: 'GBFXT', country: 'Birleşik Krallık', city: 'Felixstowe', capacity: 65, region: 'Birleşik Krallık', lat: 51.9520, lng: 1.3150 },
  { name: 'Southampton Limanı', code: 'GBSOU', country: 'Birleşik Krallık', city: 'Southampton', capacity: 55, region: 'Birleşik Krallık', lat: 50.8950, lng: -1.4150 },
  { name: 'London Gateway', code: 'GBLON', country: 'Birleşik Krallık', city: 'Londra', capacity: 55, region: 'Birleşik Krallık', lat: 51.5050, lng: 0.4680 },
  { name: 'Le Havre Limanı (HAROPA)', code: 'FRLEH', country: 'Fransa', city: 'Le Havre', capacity: 60, region: 'Kuzey Avrupa', lat: 49.4750, lng: 0.1150 },
  { name: 'Dunkirk Limanı', code: 'FRDKK', country: 'Fransa', city: 'Dunkirk', capacity: 40, region: 'Kuzey Avrupa', lat: 51.0520, lng: 2.3750 },
  { name: 'Gdansk Limanı (Baltic Hub)', code: 'PLGDN', country: 'Polonya', city: 'Gdansk', capacity: 55, region: 'Baltık Denizi', lat: 54.3980, lng: 18.6850 },
  { name: 'Gdynia Limanı', code: 'PLGDY', country: 'Polonya', city: 'Gdynia', capacity: 40, region: 'Baltık Denizi', lat: 54.5350, lng: 18.5420 },
  { name: 'Kopenhag Limanı', code: 'DKCPH', country: 'Danimarka', city: 'Kopenhag', capacity: 40, region: 'Baltık Denizi', lat: 55.7050, lng: 12.6020 },
  { name: 'Göteborg Limanı', code: 'SEGOT', country: 'İsveç', city: 'Göteborg', capacity: 45, region: 'İskandinavya', lat: 57.7020, lng: 11.9050 },
  { name: 'Oslo Limanı', code: 'NOOSL', country: 'Norveç', city: 'Oslo', capacity: 35, region: 'İskandinavya', lat: 59.9050, lng: 10.7420 },
  { name: 'Helsinki Limanı (Vuosaari)', code: 'FIHEL', country: 'Finlandiya', city: 'Helsinki', capacity: 40, region: 'Baltık Denizi', lat: 60.2150, lng: 25.1950 },

  // 5. Kızıldeniz, Basra Körfezi & Orta Doğu
  { name: 'Süveyş Limanı (Port Tewfik)', code: 'EGSUZ', country: 'Mısır', city: 'Süveyş', capacity: 50, region: 'Kızıldeniz', lat: 29.9520, lng: 32.5580 },
  { name: 'Cidde İslam Limanı (Jeddah)', code: 'SAJED', country: 'Suudi Arabistan', city: 'Cidde', capacity: 75, region: 'Kızıldeniz', lat: 21.4650, lng: 39.1620 },
  { name: 'Kral Abdullah Limanı (Rabigh)', code: 'SAKAP', country: 'Suudi Arabistan', city: 'Rabigh', capacity: 60, region: 'Kızıldeniz', lat: 22.5350, lng: 39.0950 },
  { name: 'Akabe Limanı (Aqaba)', code: 'JOAQJ', country: 'Ürdün', city: 'Akabe', capacity: 40, region: 'Kızıldeniz', lat: 29.5150, lng: 35.0050 },
  { name: 'Cibuti Limanı (Doraleh)', code: 'DJJIB', country: 'Cibuti', city: 'Cibuti', capacity: 45, region: 'Babülmendep', lat: 11.5950, lng: 43.1150 },
  { name: 'Salalah Limanı', code: 'OMSLL', country: 'Umman', city: 'Salalah', capacity: 65, region: 'Arap Denizi', lat: 16.9450, lng: 54.0050 },
  { name: 'Sohar Limanı', code: 'OMSOH', country: 'Umman', city: 'Sohar', capacity: 45, region: 'Umman Körfezi', lat: 24.4950, lng: 56.6350 },
  { name: 'Jebel Ali Limanı (DP World Dubai)', code: 'AEJEA', country: 'BAE', city: 'Dubai', capacity: 90, region: 'Basra Körfezi', lat: 25.0120, lng: 55.0620 },
  { name: 'Khalifa Limanı (Abu Dhabi)', code: 'AEKHL', country: 'BAE', city: 'Abu Dabi', capacity: 60, region: 'Basra Körfezi', lat: 24.8150, lng: 54.6750 },
  { name: 'Fujairah Tanker Limanı', code: 'AEFJR', country: 'BAE', city: 'Fujairah', capacity: 55, region: 'Umman Körfezi', lat: 25.1750, lng: 56.3620 },
  { name: 'Hamad Limanı (Doha)', code: 'QAHMD', country: 'Katar', city: 'Doha', capacity: 55, region: 'Basra Körfezi', lat: 25.0180, lng: 51.6150 },
  { name: 'Khalifa Bin Salman Limanı', code: 'BHKBS', country: 'Bahreyn', city: 'Manama', capacity: 40, region: 'Basra Körfezi', lat: 26.1950, lng: 50.6950 },
  { name: 'Dammam Kral Abdülaziz Limanı', code: 'SADMM', country: 'Suudi Arabistan', city: 'Dammam', capacity: 65, region: 'Basra Körfezi', lat: 26.4450, lng: 50.1550 },
  { name: 'Shuwaikh Limanı', code: 'KWSHU', country: 'Kuveyt', city: 'Kuveyt', capacity: 45, region: 'Basra Körfezi', lat: 29.3550, lng: 47.9250 },
  { name: 'Shahid Rajaee Limanı (Bandar Abbas)', code: 'IRBND', country: 'İran', city: 'Bender Abbas', capacity: 50, region: 'Hürmüz Boğazı', lat: 27.1250, lng: 56.0750 },

  // 6. Hint Okyanusu, Güney & Güneydoğu Asya
  { name: 'Singapur Limanı (PSA Singapore)', code: 'SGSIN', country: 'Singapur', city: 'Singapur', capacity: 95, region: 'Malakka Boğazı', lat: 1.2650, lng: 103.8250 },
  { name: 'Port Klang (Westports)', code: 'MYPKG', country: 'Malezya', city: 'Kuala Lumpur', capacity: 75, region: 'Güneydoğu Asya', lat: 2.9980, lng: 101.3850 },
  { name: 'Tanjung Pelepas Limanı (PTP)', code: 'MYTPP', country: 'Malezya', city: 'Johor', capacity: 70, region: 'Güneydoğu Asya', lat: 1.3650, lng: 103.5480 },
  { name: 'Kolombo Limanı (Port of Colombo)', code: 'LKCMB', country: 'Sri Lanka', city: 'Kolombo', capacity: 65, region: 'Hint Okyanusu', lat: 6.9520, lng: 79.8450 },
  { name: 'Nhava Sheva Limanı (JNPT Mumbai)', code: 'INNSA', country: 'Hindistan', city: 'Navi Mumbai', capacity: 65, region: 'Güney Asya', lat: 18.9450, lng: 72.9520 },
  { name: 'Mundra Limanı (Adani)', code: 'INMUN', country: 'Hindistan', city: 'Gujarat', capacity: 60, region: 'Güney Asya', lat: 22.7450, lng: 69.7050 },
  { name: 'Chennai Limanı', code: 'INMAA', country: 'Hindistan', city: 'Chennai', capacity: 50, region: 'Bengal Körfezi', lat: 13.0950, lng: 80.2980 },
  { name: 'Karaçi Limanı (Karachi)', code: 'PKKHI', country: 'Pakistan', city: 'Karaçi', capacity: 50, region: 'Güney Asya', lat: 24.8250, lng: 66.9750 },
  { name: 'Port Qasim', code: 'PKBQM', country: 'Pakistan', city: 'Karaçi', capacity: 45, region: 'Güney Asya', lat: 24.7750, lng: 67.3450 },
  { name: 'Chittagong Limanı', code: 'BDCGP', country: 'Bangladeş', city: 'Chittagong', capacity: 50, region: 'Bengal Körfezi', lat: 22.3150, lng: 91.8050 },
  { name: 'Laem Chabang Limanı', code: 'THLCH', country: 'Tayland', city: 'Chonburi', capacity: 65, region: 'Güneydoğu Asya', lat: 13.0750, lng: 100.8950 },
  { name: 'Saygon Limanı (Cat Lai)', code: 'VNSGN', country: 'Vietnam', city: 'Ho Chi Minh', capacity: 60, region: 'Güneydoğu Asya', lat: 10.7650, lng: 106.7950 },
  { name: 'Cai Mep Uluslararası Terminali', code: 'VNVUT', country: 'Vietnam', city: 'Vung Tau', capacity: 55, region: 'Güneydoğu Asya', lat: 10.5150, lng: 107.0250 },
  { name: 'Tanjung Priok Limanı', code: 'IDTPP', country: 'Endonezya', city: 'Cakarta', capacity: 65, region: 'Güneydoğu Asya', lat: -6.1050, lng: 106.8850 },
  { name: 'Manila Limanı', code: 'PHMNL', country: 'Filipinler', city: 'Manila', capacity: 55, region: 'Güneydoğu Asya', lat: 14.5850, lng: 120.9550 },

  // 7. Doğu Asya & Çin Denizi
  { name: 'Şanghay Yangshan Limanı', code: 'CNSHA', country: 'Çin', city: 'Şanghay', capacity: 95, region: 'Doğu Asya', lat: 30.6250, lng: 122.0650 },
  { name: 'Ningbo-Zhoushan Limanı', code: 'CNNGB', country: 'Çin', city: 'Ningbo', capacity: 90, region: 'Doğu Asya', lat: 29.8950, lng: 121.8450 },
  { name: 'Shenzhen Yantian Limanı', code: 'CNSZX', country: 'Çin', city: 'Shenzhen', capacity: 85, region: 'Doğu Asya', lat: 22.5650, lng: 114.2650 },
  { name: 'Qingdao Limanı', code: 'CNQDG', country: 'Çin', city: 'Qingdao', capacity: 80, region: 'Doğu Asya', lat: 36.0850, lng: 120.3150 },
  { name: 'Hong Kong Limanı (Kwai Tsing)', code: 'CNHKG', country: 'Hong Kong', city: 'Hong Kong', capacity: 80, region: 'Doğu Asya', lat: 22.3350, lng: 114.1250 },
  { name: 'Busan New Port', code: 'KRPUS', country: 'Güney Kore', city: 'Busan', capacity: 85, region: 'Doğu Asya', lat: 35.0750, lng: 128.8350 },
  { name: 'Incheon Limanı', code: 'KRICN', country: 'Güney Kore', city: 'Incheon', capacity: 55, region: 'Doğu Asya', lat: 37.4550, lng: 126.6150 },
  { name: 'Tokyo Limanı (Ohi Terminal)', code: 'JPTYO', country: 'Japonya', city: 'Tokyo', capacity: 65, region: 'Doğu Asya', lat: 35.6150, lng: 139.7750 },
  { name: 'Yokohama Limanı', code: 'JPYOK', country: 'Japonya', city: 'Yokohama', capacity: 60, region: 'Doğu Asya', lat: 35.4550, lng: 139.6650 },
  { name: 'Kaohsiung Limanı', code: 'TWKHH', country: 'Tayvan', city: 'Kaohsiung', capacity: 70, region: 'Doğu Asya', lat: 22.6150, lng: 120.2850 },
];