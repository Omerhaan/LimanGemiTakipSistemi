/**
 * Denizcilik Mesafe ve Seyir Hesaplama Yardımcıları
 */

// İki koordinat arası Haversine formülü ile Deniz Mili (NM) hesaplama
export function calculateNauticalDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // Dünya yarıçapı (Deniz Mili / Nautical Miles)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Deniz koridoru düzeltme katsayısı: Gemiler doğrudan karadan kuş uçuşu gidemediği için ortalama %18 manevra payı
  return Math.round(distance * 1.18);
}

export interface VoyageEstimate {
  distanceNM: number;
  distanceKm: number;
  hoursAtSpeed: number;
  daysAtSpeed: number;
  bunkerConsumptionTons: number;
}

export function estimateVoyage(distanceNM: number, speedKnots: number = 14): VoyageEstimate {
  const speed = Math.max(1, speedKnots);
  const hours = distanceNM / speed;
  const days = hours / 24;
  // Tipik orta ölçekli kargo/konteyner gemisi: knot başına günlük ~1.8 - 2.5 ton VLSFO yakıt sarfiyatı
  const dailyFuelTons = 22 + (speed - 12) * 2.2;
  const totalBunker = Math.round(days * dailyFuelTons * 10) / 10;

  return {
    distanceNM,
    distanceKm: Math.round(distanceNM * 1.852),
    hoursAtSpeed: Math.round(hours * 10) / 10,
    daysAtSpeed: Math.round(days * 10) / 10,
    bunkerConsumptionTons: Math.max(1, totalBunker),
  };
}

export interface MaritimeSectorWeather {
  sector: string;
  windSpeedKts: number;
  windDirection: string;
  beaufortScale: number;
  seaState: string;
  waveHeightM: number;
}

export const MARITIME_WEATHER_DATA: MaritimeSectorWeather[] = [
  {
    sector: 'Marmara Denizi',
    windSpeedKts: 14,
    windDirection: 'KD (Poyraz)',
    beaufortScale: 4,
    seaState: 'Orta Çalkantılı',
    waveHeightM: 1.1,
  },
  {
    sector: 'Kuzey Ege & Çanakkale',
    windSpeedKts: 18,
    windDirection: 'K (Yıldız)',
    beaufortScale: 5,
    seaState: 'Kaba Dalgalı',
    waveHeightM: 1.8,
  },
  {
    sector: 'Güney Ege & Oniki Adalar',
    windSpeedKts: 16,
    windDirection: 'KB (Karayel)',
    beaufortScale: 4,
    seaState: 'Orta Dalgalı',
    waveHeightM: 1.4,
  },
  {
    sector: 'Doğu Akdeniz (Mersin/İskenderun)',
    windSpeedKts: 9,
    windDirection: 'G (Kıble)',
    beaufortScale: 3,
    seaState: 'Sakin / Çırpıntılı',
    waveHeightM: 0.6,
  },
  {
    sector: 'Batı Karadeniz (İstanbul Boğazı Çıkışı)',
    windSpeedKts: 21,
    windDirection: 'KD (Poyraz)',
    beaufortScale: 6,
    seaState: 'Kuvvetli Dalgalı',
    waveHeightM: 2.3,
  },
];
