export interface VoyageInfo {
  from: string;
  fromCode: string;
  departureTimeText: string;
  to: string;
  toCode: string;
  etaText: string;
  etaSentence: string;
  progressPercent: number;
  headingDegrees: number;
  draftMeters: number;
  isAtSea: boolean;
}

// MarineTraffic Gemi Tipi Renk Kodlaması ve Sınıflandırması
export interface ShipTypeStyle {
  category: 'Tanker' | 'Cargo' | 'Passenger' | 'Tug' | 'Bulk';
  categoryLabel: string;
  emoji: string;
  hex: string;
  bgClass: string;
  badgeClass: string;
  textClass: string;
  pingClass: string;
}

export const getShipTypeStyle = (type: string): ShipTypeStyle => {
  const t = (type || '').toLowerCase();

  // 🔴 Kırmızı: Tankerler (Petrol & Kimyasal, LNG/LPG)
  if (t.includes('tanker') || t.includes('lng') || t.includes('lpg') || t.includes('kimyasal') || t.includes('petrol')) {
    return {
      category: 'Tanker',
      categoryLabel: 'Tanker (Petrol & Kimyasal)',
      emoji: '🔴',
      hex: '#ef4444',
      bgClass: 'bg-red-500',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      textClass: 'text-red-600',
      pingClass: 'bg-red-400',
    };
  }

  // 🟡 Sarı: Kuru Yük & Dökme Yük Gemileri
  if (t.includes('kuru yük') || t.includes('dökme') || t.includes('bulk')) {
    return {
      category: 'Bulk',
      categoryLabel: 'Kuru Yük & Dökme',
      emoji: '🟡',
      hex: '#eab308',
      bgClass: 'bg-amber-500',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      textClass: 'text-amber-600',
      pingClass: 'bg-amber-400',
    };
  }

  // 🟣 Mor: Yolcu & Kruvaziyer Gemileri (Yolcu & Ro-Ro)
  if (t.includes('yolcu') || t.includes('kruvaziyer') || t.includes('cruise') || t.includes('ro-ro') || t.includes('roro')) {
    return {
      category: 'Passenger',
      categoryLabel: 'Yolcu & Ro-Ro',
      emoji: '🟣',
      hex: '#a855f7',
      bgClass: 'bg-purple-600',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      textClass: 'text-purple-600',
      pingClass: 'bg-purple-400',
    };
  }

  // 🔵 Mavi: Römorkörler ve Liman Hizmet Araçları (Buzkıran, Destek vb.)
  if (t.includes('römorkör') || t.includes('tug') || t.includes('destek') || t.includes('buzkıran') || t.includes('kılavuz') || t.includes('pilot') || t.includes('hizmet')) {
    return {
      category: 'Tug',
      categoryLabel: 'Römorkör & Destek',
      emoji: '🔵',
      hex: '#3b82f6',
      bgClass: 'bg-blue-600',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      textClass: 'text-blue-600',
      pingClass: 'bg-blue-400',
    };
  }

  // 🟢 Yeşil: Yük & Konteyner Gemileri
  return {
    category: 'Cargo',
    categoryLabel: 'Konteyner & Yük',
    emoji: '🟢',
    hex: '#22c55e',
    bgClass: 'bg-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    textClass: 'text-emerald-600',
    pingClass: 'bg-emerald-400',
  };
};

export function getPositionOnRoute(
  waypoints: [number, number][],
  progressPercent: number
): { pos: [number, number]; heading: number } {
  if (!waypoints || waypoints.length === 0) return { pos: [0, 0], heading: 0 };
  if (waypoints.length === 1) return { pos: waypoints[0], heading: 0 };

  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dLat = waypoints[i + 1][0] - waypoints[i][0];
    const dLng = waypoints[i + 1][1] - waypoints[i][1];
    const d = Math.hypot(dLat, dLng);
    segmentLengths.push(d);
    totalLength += d;
  }

  if (totalLength === 0) return { pos: waypoints[0], heading: 0 };

  const clampedProgress = Math.max(0, Math.min(100, progressPercent));
  const targetDist = (clampedProgress / 100) * totalLength;

  let accumulated = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (accumulated + segLen >= targetDist || i === segmentLengths.length - 1) {
      const segT = segLen > 0 ? (targetDist - accumulated) / segLen : 0;
      const lat = waypoints[i][0] + segT * (waypoints[i + 1][0] - waypoints[i][0]);
      const lng = waypoints[i][1] + segT * (waypoints[i + 1][1] - waypoints[i][1]);

      const lat1 = (waypoints[i][0] * Math.PI) / 180;
      const lat2 = (waypoints[i + 1][0] * Math.PI) / 180;
      const dLon = ((waypoints[i + 1][1] - waypoints[i][1]) * Math.PI) / 180;
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      let brng = (Math.atan2(y, x) * 180) / Math.PI;
      brng = (brng + 360) % 360;

      return {
        pos: [Number(lat.toFixed(4)), Number(lng.toFixed(4))],
        heading: Math.round(brng),
      };
    }
    accumulated += segLen;
  }

  return { pos: waypoints[waypoints.length - 1], heading: 0 };
}