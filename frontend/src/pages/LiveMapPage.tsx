import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  Anchor,
  Compass,
  Search,
  Navigation,
  Ship as ShipIcon,
  X,
  Package,
  Users,
  ExternalLink,
} from 'lucide-react';
import {
  shipService,
  portService,
  shipVisitService,
  cargoService,
  crewMemberService,
  assignmentService,
} from '../services/api';
import type { Ship, Port, ShipVisit, Cargo, CrewMember, ShipCrewAssignment } from '../types';
import { getPortCoordinates } from '../data/portCoords';
import { MARITIME_ROUTES } from '../data/maritimeRoutes';
import { getShipTypeStyle, getPositionOnRoute } from '../data/shipTypeStyles';
import type { VoyageInfo } from '../data/shipTypeStyles';

/**
 * İki liman arasındaki gerçek su yolu rotasını bulur veya tersine çevirir.
 * Kesinlikle karadan geçmeyen onaylı deniz koridorlarını kullanır.
 */
function resolveMaritimeRoute(originCode?: string, targetCode?: string, fallbackId: number = 1): {
  waypoints: [number, number][];
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
} {
  // 1. İki liman da belirtilmişse tam eşleşme ara
  if (originCode && targetCode && originCode !== targetCode) {
    for (const r of Object.values(MARITIME_ROUTES)) {
      if (r.fromCode === originCode && r.toCode === targetCode) {
        return { waypoints: r.waypoints, from: r.from, to: r.to, fromCode: r.fromCode, toCode: r.toCode };
      }
    }
    for (const r of Object.values(MARITIME_ROUTES)) {
      if (r.fromCode === targetCode && r.toCode === originCode) {
        return {
          waypoints: [...r.waypoints].reverse(),
          from: r.to,
          to: r.from,
          fromCode: r.toCode,
          toCode: r.fromCode,
        };
      }
    }
  }

  // 2. Yalnızca hedef liman biliniyorsa bu limana varan onaylı deniz koridorunu eşleştir
  if (targetCode) {
    for (const r of Object.values(MARITIME_ROUTES)) {
      if (r.toCode === targetCode) {
        return { waypoints: r.waypoints, from: r.from, to: r.to, fromCode: r.fromCode, toCode: r.toCode };
      }
    }
    for (const r of Object.values(MARITIME_ROUTES)) {
      if (r.fromCode === targetCode) {
        return {
          waypoints: [...r.waypoints].reverse(),
          from: r.to,
          to: r.from,
          fromCode: r.toCode,
          toCode: r.fromCode,
        };
      }
    }
  }

  // 3. Yalnızca kalkış limanı biliniyorsa bu limandan kalkan rotayı eşleştir
  if (originCode) {
    for (const r of Object.values(MARITIME_ROUTES)) {
      if (r.fromCode === originCode) {
        return { waypoints: r.waypoints, from: r.from, to: r.to, fromCode: r.fromCode, toCode: r.toCode };
      }
    }
    for (const r of Object.values(MARITIME_ROUTES)) {
      if (r.toCode === originCode) {
        return {
          waypoints: [...r.waypoints].reverse(),
          from: r.to,
          to: r.from,
          fromCode: r.toCode,
          toCode: r.fromCode,
        };
      }
    }
  }

  // 4. Varsayılan deniz rotası: Sistemdeki kayıtlı limanları bağlayan bölgesel koridorları kullan
  const activeRouteKeys = Array.from({ length: 55 }, (_, i) => i + 1);
  const selectedKey = activeRouteKeys[Math.abs(fallbackId - 1) % activeRouteKeys.length];
  const route = MARITIME_ROUTES[selectedKey] || MARITIME_ROUTES[1];
  return { waypoints: route.waypoints, from: route.from, to: route.to, fromCode: route.fromCode, toCode: route.toCode };
}

export const LiveMapPage = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [visits, setVisits] = useState<ShipVisit[]>([]);
  const [cargoes, setCargoes] = useState<Cargo[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [assignments, setAssignments] = useState<ShipCrewAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtreleme State'i
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Docked' | 'EnRoute' | 'Scheduled'>('ALL');
  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite'>('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipId, setSelectedShipId] = useState<number | null>(null);

  // Detay Modalı State'i
  const [detailShipId, setDetailShipId] = useState<number | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const portsLayerRef = useRef<L.LayerGroup | null>(null);
  const shipsLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTilesRef = useRef<{ standard: L.TileLayer; satellite: L.TileLayer; labels: L.TileLayer } | null>(null);

  // Verileri Hızlıca Çek
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [s, p, v] = await Promise.all([
          shipService.getAll(),
          portService.getAll(),
          shipVisitService.getAll(),
        ]);
        if (isMounted) {
          setShips(s);
          setPorts(p);
          setVisits(v);
        }
      } catch (err) {
        console.error('Harita verileri yüklenirken hata oluştu:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Detay modalı açıldığında ilgili geminin yük ve mürettebat verilerini yükle
  useEffect(() => {
    if (!detailShipId) return;
    const fetchDetailData = async () => {
      try {
        const [c, cr, a] = await Promise.all([
          cargoService.getAll(),
          crewMemberService.getAll(),
          assignmentService.getAll(),
        ]);
        setCargoes(c);
        setCrew(cr);
        setAssignments(a);
      } catch (err) {
        console.error('Detay verileri yüklenirken hata:', err);
      }
    };
    fetchDetailData();
  }, [detailShipId]);

  // Window köprüsü: Leaflet popup HTML içi butonların React fonksiyonlarına güvenli erişimi
  useEffect(() => {
    (window as any).__openShipModal = (shipId: number) => {
      setDetailShipId(shipId);
    };
    (window as any).__filterMapShip = (shipName: string) => {
      setSearchTerm(shipName);
    };

    return () => {
      delete (window as any).__openShipModal;
      delete (window as any).__filterMapShip;
    };
  }, []);

  // Leaflet Haritasını Başlat (Tek Seferlik)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [39.2, 28.5],
      zoom: 6,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      preferCanvas: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const standard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: '&copy; Esri',
      }
    );

    const labels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
      }
    );

    baseTilesRef.current = { standard, satellite, labels };

    const routesLayer = L.layerGroup().addTo(map);
    const portsLayer = L.layerGroup().addTo(map);
    const shipsLayer = L.layerGroup().addTo(map);

    routesLayerRef.current = routesLayer;
    portsLayerRef.current = portsLayer;
    shipsLayerRef.current = shipsLayer;
    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Katman Değişimi
  useEffect(() => {
    if (!mapRef.current || !baseTilesRef.current) return;
    const { standard, satellite, labels } = baseTilesRef.current;
    const map = mapRef.current;

    if (mapLayer === 'standard') {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (map.hasLayer(labels)) map.removeLayer(labels);
      if (!map.hasLayer(standard)) standard.addTo(map);
    } else {
      if (map.hasLayer(standard)) map.removeLayer(standard);
      if (!map.hasLayer(satellite)) satellite.addTo(map);
      if (!map.hasLayer(labels)) labels.addTo(map);
    }
  }, [mapLayer]);

  // Liman İşaretçilerini Çiz (Sadece Liman Listesi Değiştiğinde Tek Sefer Çalışır - 10x Hızlandırma)
  useEffect(() => {
    if (!mapRef.current || !portsLayerRef.current || ports.length === 0) return;
    portsLayerRef.current.clearLayers();

    ports.forEach((port) => {
      const coords = getPortCoordinates(port.code, port.id);
      if (!coords) return;

      const dockedCount = visits.filter((v) => v.portId === port.id && v.status === 'Docked').length;

      const portIcon = L.divIcon({
        className: 'custom-port-icon !bg-transparent !border-0',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: 22px; height: 22px;">
            <div class="w-5.5 h-5.5 rounded-full bg-slate-800 border-2 border-white shadow-md flex items-center justify-center text-white hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="5" r="3"></circle>
                <line x1="12" y1="22" x2="12" y2="8"></line>
                <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
              </svg>
            </div>
            ${dockedCount > 0 ? `
              <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center border border-white shadow-xs">
                ${dockedCount}
              </span>
            ` : ''}
            <div class="absolute -bottom-3.5 bg-slate-900/80 text-white text-[8px] font-bold px-1 py-0 rounded tracking-tight shadow-xs whitespace-nowrap">
              ${port.code}
            </div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const portMarker = L.marker([coords.lat, coords.lng], { icon: portIcon });
      
      portMarker.bindTooltip(`
        <div class="font-sans text-xs py-0.5 px-1 leading-tight">
          <div class="font-bold text-slate-900">${port.name}</div>
          <div class="text-[10px] text-slate-500 mt-0.5">${port.city ? `${port.city}, ` : ''}${port.country} • <strong class="font-mono text-slate-700">${port.code}</strong></div>
          <div class="text-[10px] font-medium text-emerald-600 mt-0.5">Rıhtımda: ${dockedCount} / ${port.capacity} Gemi</div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -12],
        opacity: 0.95,
      });

      portMarker.bindPopup(`
        <div class="p-2 min-w-[180px] font-sans">
          <div class="font-bold text-sm text-slate-900">${port.name}</div>
          <div class="text-xs text-slate-500 mb-2">${port.city ? `${port.city}, ` : ''}${port.country} • <strong class="font-mono text-slate-700">${port.code}</strong></div>
          <div class="p-2 bg-slate-50 rounded border border-slate-100 text-xs space-y-1 mb-2">
            <div class="flex justify-between">
              <span class="text-slate-500">Kapasite:</span>
              <strong class="text-slate-800">${port.capacity} Gemi</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Rıhtımda:</span>
              <strong class="text-emerald-600">${dockedCount} Gemi</strong>
            </div>
          </div>
          <a href="/ports" class="text-xs text-blue-600 font-medium hover:underline block text-center">Liman Bilgileri &rarr;</a>
        </div>
      `);
      portsLayerRef.current?.addLayer(portMarker);
    });
  }, [ports, visits]);

  // Gemilerin ve Konumların Hesaplanması
  const mapItems = useMemo(() => ships.map((ship, idx) => {
    const shipVisits = visits.filter((v) => v.shipId === ship.id && v.status !== 'Cancelled');
    const dockedVisit = shipVisits.find((v) => v.status === 'Docked');
    const scheduledVisit = shipVisits.find((v) => v.status === 'Scheduled');
    const activeVisit = dockedVisit || scheduledVisit || (shipVisits.length > 0 ? shipVisits[shipVisits.length - 1] : null);
    const port = activeVisit ? ports.find((p) => p.id === activeVisit.portId) : null;

    const nowTime = Date.now();
    let isImminentArrival = false;
    if (scheduledVisit) {
      const arrMs = new Date(scheduledVisit.arrivalDate).getTime();
      if (!isNaN(arrMs) && arrMs - nowTime <= 12 * 60 * 60 * 1000 && arrMs - nowTime >= -2 * 60 * 60 * 1000) {
        isImminentArrival = true;
      }
    }

    const shipCargo = cargoes.find((c) => c.shipId === ship.id);

    let lat: number;
    let lng: number;
    let statusLabel: 'Docked' | 'EnRoute' | 'Scheduled';
    let statusText: string;
    let locationDesc: string;
    let heading = 0;
    let routeWaypoints: [number, number][] | undefined = undefined;
    let voyage: VoyageInfo;

    if (dockedVisit) {
      const p = ports.find((item) => item.id === dockedVisit.portId);
      const base = getPortCoordinates(p?.code, p?.id);
      const angle = ((idx * 60) * Math.PI) / 180;
      const radius = 0.0006 + ((idx % 3) * 0.0003);
      lat = Number((base.lat + Math.cos(angle) * radius).toFixed(4));
      lng = Number((base.lng + Math.sin(angle) * radius * 1.1).toFixed(4));
      statusLabel = 'Docked';
      statusText = 'Rıhtımda';
      locationDesc = `${p?.name || 'Liman'} (${dockedVisit.dockNumber || 'Rıhtım'})`;
      heading = (idx * 53) % 360;

      const depDate = new Date(dockedVisit.departureDate);
      const arrDate = new Date(dockedVisit.arrivalDate);
      const depTime = !isNaN(depDate.getTime())
        ? depDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : '18:00';
      const depDateStr = !isNaN(depDate.getTime())
        ? depDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
        : 'Yarın';

      voyage = {
        from: 'Açık Deniz',
        fromCode: 'SEA',
        departureTimeText: !isNaN(arrDate.getTime())
          ? `${arrDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' })} ${arrDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Varış yapıldı',
        to: `${p?.name || 'Liman'}`,
        toCode: p?.code || 'PORT',
        etaText: `${depDateStr} ${depTime}`,
        etaSentence: `Planlanan ayrılış: ${depDateStr} ${depTime}`,
        progressPercent: 100,
        headingDegrees: heading,
        draftMeters: 10.8,
        isAtSea: false,
      };
    } else if (scheduledVisit && isImminentArrival) {
      const p = ports.find((item) => item.id === scheduledVisit.portId);
      const base = getPortCoordinates(p?.code, p?.id);
      const angle = ((idx * 72) * Math.PI) / 180;
      const radius = 0.008 + ((idx % 4) * 0.002);
      lat = Number((base.lat + Math.cos(angle) * radius).toFixed(4));
      lng = Number((base.lng + Math.sin(angle) * radius * 1.2).toFixed(4));
      statusLabel = 'Scheduled';
      statusText = 'Demirde';
      locationDesc = `${p?.name || 'Liman'} Açıkları`;
      heading = (idx * 37) % 360;

      const arrDate = new Date(scheduledVisit.arrivalDate);
      const arrTime = !isNaN(arrDate.getTime())
        ? arrDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : '09:00';
      const arrDateStr = !isNaN(arrDate.getTime())
        ? arrDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
        : 'Bugün';

      voyage = {
        from: 'Açık Deniz',
        fromCode: 'SEA',
        departureTimeText: 'Yaklaşıyor',
        to: `${p?.name || 'Liman'}`,
        toCode: p?.code || 'PORT',
        etaText: `${arrDateStr} ${arrTime}`,
        etaSentence: `Tahmini yanaşma: ${arrDateStr} ${arrTime}`,
        progressPercent: 95,
        headingDegrees: heading,
        draftMeters: 9.5,
        isAtSea: false,
      };
    } else {
      // Seyirdeki gemiler için gerçek su yolu koridorunu bul
      const targetPort = (scheduledVisit || activeVisit) ? ports.find((p) => p.id === (scheduledVisit || activeVisit)?.portId) : null;
      const originPort = (scheduledVisit || activeVisit)?.originPortId ? ports.find((p) => p.id === (scheduledVisit || activeVisit)?.originPortId) : null;

      const resolved = resolveMaritimeRoute(originPort?.code, targetPort?.code, ship.id);
      const waypoints = resolved.waypoints;

      const progress = ((idx * 17) % 80) + 10; // %10 - %90 arası seyir pozisyonu
      const { pos: livePos, heading: liveHeading } = getPositionOnRoute(waypoints, progress);

      lat = Number(livePos[0].toFixed(4));
      lng = Number(livePos[1].toFixed(4));
      heading = liveHeading;
      statusLabel = 'EnRoute';
      statusText = 'Seyirde';

      const originPortObj = originPort || (resolved.fromCode ? ports.find((p) => p.code === resolved.fromCode) : null);
      const targetPortObj = targetPort || (resolved.toCode ? ports.find((p) => p.code === resolved.toCode) : null);

      const fromName = originPortObj ? originPortObj.name : resolved.from;
      const toName = targetPortObj ? targetPortObj.name : resolved.to;
      const toCode = targetPortObj ? targetPortObj.code : resolved.toCode;
      const fromCode = originPortObj ? originPortObj.code : resolved.fromCode;

      let liveEtaText = 'Yarın 14:00';
      if (scheduledVisit || activeVisit) {
        const targetDate = new Date((scheduledVisit || activeVisit)!.arrivalDate);
        if (!isNaN(targetDate.getTime())) {
          liveEtaText = `${targetDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${targetDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
        }
      }

      locationDesc = `${fromName} ➔ ${toName}`;
      routeWaypoints = waypoints;

      voyage = {
        from: fromName,
        fromCode: fromCode,
        departureTimeText: 'Seyirde',
        to: toName,
        toCode: toCode,
        etaText: liveEtaText,
        etaSentence: `Hedef Liman: ${toName} (ETA: ${liveEtaText})`,
        progressPercent: progress,
        headingDegrees: heading,
        draftMeters: 10.5,
        isAtSea: true,
      };
    }

    const typeStyle = getShipTypeStyle(ship.type);

    return {
      ship,
      activeVisit,
      port,
      shipCargo,
      lat,
      lng,
      statusLabel,
      statusText,
      locationDesc,
      heading,
      routeWaypoints,
      voyage,
      typeStyle,
    };
  }), [ships, visits, ports, cargoes]);

  // Filtrelenmiş gemiler
  const filteredMapItems = useMemo(() => mapItems.filter((item) => {
    if (filterStatus !== 'ALL' && item.statusLabel !== filterStatus) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.ship.name.toLowerCase().includes(term);
      const matchImo = item.ship.imoNumber.includes(term);
      const matchType = item.ship.type.toLowerCase().includes(term);
      if (!matchName && !matchImo && !matchType) return false;
    }
    return true;
  }), [mapItems, filterStatus, searchTerm]);

  // Gemi İşaretçilerini ve Seçili Rotayı Çiz (Yüksek Performanslı)
  useEffect(() => {
    if (!mapRef.current || !shipsLayerRef.current || !routesLayerRef.current) return;

    shipsLayerRef.current.clearLayers();
    routesLayerRef.current.clearLayers();

    // Sadece seçili geminin rotasını çiz (Tüm gemilere çizgi çekilmez - 60fps akıcılık)
    if (selectedShipId) {
      const selectedItem = filteredMapItems.find((i) => i.ship.id === selectedShipId);
      if (selectedItem?.routeWaypoints) {
        const routeLine = L.polyline(selectedItem.routeWaypoints, {
          color: '#2563eb',
          weight: 3.5,
          opacity: 0.9,
          dashArray: '8, 6',
          lineCap: 'round',
        });
        routesLayerRef.current.addLayer(routeLine);
      }
    }

    // Gemi İşaretçileri
    filteredMapItems.forEach((item) => {
      const isSelected = selectedShipId === item.ship.id;

      const shipIcon = L.divIcon({
        className: 'custom-ship-marker !bg-transparent !border-0',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer" style="width: 18px; height: 22px;">
            ${isSelected ? `
              <div class="absolute -inset-2 bg-blue-500/25 rounded-full animate-ping pointer-events-none"></div>
              <div class="absolute -inset-1 bg-blue-600/30 rounded-full pointer-events-none"></div>
            ` : ''}
            <div
              class="relative transition-transform duration-200 hover:scale-125 filter drop-shadow-sm flex items-center justify-center"
              style="transform: rotate(${item.heading}deg);"
            >
              <svg width="15" height="19" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2 L22 23 C22 23 17 20.5 12 20.5 C7 20.5 2 23 2 23 L12 2 Z"
                  fill="${item.typeStyle.hex}"
                  stroke="#ffffff"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        `,
        iconSize: [18, 22],
        iconAnchor: [9, 11],
      });

      const marker = L.marker([item.lat, item.lng], { icon: shipIcon });

      marker.bindTooltip(`
        <div class="font-sans text-xs py-0.5 px-1 leading-tight">
          <div class="font-bold text-slate-900">${item.ship.name}</div>
          <div class="text-[10px] text-slate-500 mt-0.5">
            ${item.ship.type} • ${item.statusText} • ${item.locationDesc}
          </div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -16],
        opacity: 0.95,
      });

      marker.on('click', () => {
        setSelectedShipId(item.ship.id);
      });

      const badgeColor =
        item.statusLabel === 'Docked'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : item.statusLabel === 'Scheduled'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-blue-50 text-blue-700 border-blue-200';

      const popupContent = `
        <div class="p-2 min-w-[240px] max-w-[280px] font-sans">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div>
              <div class="font-bold text-sm text-slate-900">${item.ship.name}</div>
              <div class="text-[11px] text-slate-400 font-mono">IMO: ${item.ship.imoNumber}</div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-medium border ${badgeColor}">
              ${item.statusText}
            </span>
          </div>

          <div class="text-xs space-y-1.5 text-slate-600 mb-3">
            <div class="flex justify-between">
              <span class="text-slate-400">Gemi Tipi:</span>
              <strong class="text-slate-700">${item.ship.type} (${item.ship.flag})</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Kapasite:</span>
              <strong class="text-slate-700">${item.ship.deadweightTonnage?.toLocaleString()} DWT</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Güzergah:</span>
              <strong class="text-slate-800 text-right truncate max-w-[140px]">${item.locationDesc}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Varış Limanı:</span>
              <strong class="text-blue-700 font-bold text-right truncate max-w-[140px]">${item.voyage.to}</strong>
            </div>
            <div class="flex justify-between pt-0.5 border-t border-slate-100 text-[11px]">
              <span class="text-slate-400">Tahmini Varış (ETA):</span>
              <strong class="text-blue-600 font-bold">${item.voyage.etaText}</strong>
            </div>
          </div>

          <div class="space-y-1.5 pt-1 border-t border-slate-100">
            <button
              onclick="window.__openShipModal(${item.ship.id})"
              class="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <span>Gemi Detaylarını Gör</span>
            </button>
            <button
              onclick="window.__filterMapShip('${item.ship.name}')"
              class="w-full py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
            >
              Listede Filtrele
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      shipsLayerRef.current?.addLayer(marker);
    });
  }, [filteredMapItems, selectedShipId]);

  // Gemiyi Haritada Bul ve Odaklan (FlyTo)
  const handleFocusShip = useCallback((item: (typeof mapItems)[0]) => {
    setSelectedShipId(item.ship.id);
    if (mapRef.current) {
      mapRef.current.flyTo([item.lat, item.lng], 9, {
        animate: true,
        duration: 1.0,
      });
    }
  }, []);

  // İstatistik Sayaçları
  const { countDocked, countEnRoute, countScheduled } = useMemo(() => ({
    countDocked: mapItems.filter((i) => i.statusLabel === 'Docked').length,
    countEnRoute: mapItems.filter((i) => i.statusLabel === 'EnRoute').length,
    countScheduled: mapItems.filter((i) => i.statusLabel === 'Scheduled').length,
  }), [mapItems]);

  const detailShip = ships.find((s) => s.id === detailShipId);
  const detailMapItem = mapItems.find((m) => m.ship.id === detailShipId);
  const detailVisit = visits.find((v) => v.shipId === detailShipId && (v.status === 'Docked' || v.status === 'Scheduled' || v.status === 'Departed')) || visits.find((v) => v.shipId === detailShipId);
  const detailOriginPort = detailVisit?.originPortId
    ? ports.find((p) => p.id === detailVisit.originPortId)
    : (detailMapItem?.voyage.fromCode ? ports.find((p) => p.code === detailMapItem.voyage.fromCode) : null);
  const detailDestPort = detailVisit?.portId
    ? ports.find((p) => p.id === detailVisit.portId)
    : (detailMapItem?.voyage.toCode ? ports.find((p) => p.code === detailMapItem.voyage.toCode) : null);
  const detailCargoes = cargoes.filter((c) => c.shipId === detailShipId);
  const detailAssignments = assignments.filter((a) => a.shipId === detailShipId);

  const totalLoadedTons = detailCargoes.reduce((acc, c) => acc + (c.weightTons || 0), 0);
  const capacityPercent = detailShip?.deadweightTonnage
    ? Math.min(100, Math.round((totalLoadedTons / detailShip.deadweightTonnage) * 100))
    : 0;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col space-y-3">
      {/* Üst Bar: Filtreler ve Arama */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tümü ({mapItems.length})
          </button>
          <button
            onClick={() => setFilterStatus('Docked')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'Docked' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Rıhtımda ({countDocked})
          </button>
          <button
            onClick={() => setFilterStatus('EnRoute')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'EnRoute' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Seyirde ({countEnRoute})
          </button>
          <button
            onClick={() => setFilterStatus('Scheduled')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'Scheduled' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Planlandı ({countScheduled})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Gemi adı veya IMO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Ana Gövde: Harita ve Liste */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0">
        {/* Sol Panel: Gemi Listesi */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col order-2 lg:order-1 h-full min-h-0">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              Takip Edilen Gemiler
            </span>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
              {filteredMapItems.length} Gemi
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Gemiler yükleniyor...</div>
            ) : filteredMapItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Aramaya uygun gemi bulunamadı.</div>
            ) : (
              filteredMapItems.map((item) => (
                <div
                  key={item.ship.id}
                  onClick={() => handleFocusShip(item)}
                  className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer space-y-1 ${
                    selectedShipId === item.ship.id ? 'bg-blue-50/70 border-l-3 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate max-w-[150px]">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.typeStyle.hex }}
                      />
                      <span className="font-semibold text-slate-800 truncate">{item.ship.name}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        item.statusLabel === 'Docked'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.statusLabel === 'Scheduled'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {item.statusText}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span className="truncate max-w-[130px]">{item.locationDesc}</span>
                    <span className="text-[10px] font-mono text-slate-400">IMO: {item.ship.imoNumber}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-slate-500" />
              <span>{ports.length} Aktif Liman</span>
            </span>
            <span className="text-slate-400">Canlı Radar Aktif</span>
          </div>
        </div>

        {/* Sağ Panel: Canlı Harita */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative order-1 lg:order-2 flex flex-col h-full min-h-0">
          {loading && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center text-slate-600 text-xs">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
              Harita yükleniyor...
            </div>
          )}

          <div ref={mapContainerRef} className="w-full h-full min-h-[350px] lg:min-h-0 z-10" />

          {/* Sade Katman Seçimi (Sol Üst) */}
          <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-1 rounded-lg shadow-sm border border-slate-200 flex items-center gap-1 text-xs">
            <button
              onClick={() => setMapLayer('standard')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                mapLayer === 'standard' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harita
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                mapLayer === 'satellite' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Uydu
            </button>
          </div>

          {/* Minimal Renk Lejantı (Sağ Üst) */}
          <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-[11px] text-slate-600 hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Tanker</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Konteyner</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Kuru Yük</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>Yolcu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Römorkör</span>
            </div>
          </div>
        </div>
      </div>

      {/* SADE VE ŞIK GEMİ DETAY MODALI */}
      {detailShip && detailMapItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Başlığı */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: detailMapItem.typeStyle.hex }}
                >
                  <ShipIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    {detailShip.name}
                    <span className="text-xs font-normal text-slate-400 font-mono">
                      (IMO: {detailShip.imoNumber})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {detailShip.flag} Bayraklı • {detailShip.type} • İnşa: {detailShip.builtYear || '2019'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailShipId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Gövdesi */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Seyir & Sefer Durum Özeti */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    {detailVisit ? `Aktif Sefer: #SEF-${detailVisit.id}` : 'Mevcut Operasyon Durumu'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-medium ${
                      detailMapItem.statusLabel === 'Docked'
                        ? 'bg-emerald-100 text-emerald-800'
                        : detailMapItem.statusLabel === 'Scheduled'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {detailMapItem.statusText}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kalkış Limanı:</span>
                    <strong className="text-slate-800 font-semibold">
                      {detailOriginPort?.name || detailMapItem.voyage.from || 'Açık Deniz'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Varış Limanı:</span>
                    <strong className="text-blue-700 font-semibold">
                      {detailDestPort?.name || detailMapItem.voyage.to}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kalkış Zamanı (ETD):</span>
                    <strong className="text-slate-800 font-semibold">
                      {detailVisit?.departureDate ? new Date(detailVisit.departureDate).toLocaleString('tr-TR') : 'Seyirde'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tahmini Varış (ETA):</span>
                    <strong className="text-blue-700 font-semibold">
                      {detailVisit?.arrivalDate ? new Date(detailVisit.arrivalDate).toLocaleString('tr-TR') : detailMapItem.voyage.etaText}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Rıhtım / Yanaşma Noktası:</span>
                    <strong className="text-slate-800 font-semibold">
                      {detailVisit?.dockNumber || 'Belirtilmedi'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">DWT Kapasitesi:</span>
                    <strong className="text-slate-800 font-semibold">
                      {detailShip.deadweightTonnage?.toLocaleString()} Ton
                    </strong>
                  </div>
                </div>

                {detailVisit?.purpose && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600">
                    <span className="text-slate-400 block text-[11px]">Sefer Amacı:</span>
                    <strong className="text-slate-800 font-medium block mt-0.5">
                      {detailVisit.purpose}
                    </strong>
                  </div>
                )}
              </div>

              {/* Yük Kapasite Çubuğu */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-500" />
                    Kargo Yükleme Seviyesi ({totalLoadedTons.toLocaleString()} / {detailShip.deadweightTonnage?.toLocaleString()} Ton)
                  </span>
                  <span className="font-bold text-slate-800">%{capacityPercent}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      capacityPercent > 90
                        ? 'bg-rose-500'
                        : capacityPercent > 60
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Gemi Yükleri */}
              <div>
                <span className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  Gemi Manifestosundaki Yükler ({detailCargoes.length})
                </span>
                {detailCargoes.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                    Bu gemiye kayıtlı kargo yükü bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {detailCargoes.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-slate-800">{c.description}</strong>
                          <div className="text-slate-400 text-[11px] flex flex-wrap gap-2 mt-0.5">
                            <span>{c.type}</span>
                            {c.containerCount && <span>• {c.containerCount} Konteyner</span>}
                            {c.billOfLadingNumber && <span>• B/L: <strong className="font-mono text-slate-600">{c.billOfLadingNumber}</strong></span>}
                            {c.sealNumber && <span>• Mühür: <strong className="font-mono text-slate-600">{c.sealNumber}</strong></span>}
                          </div>
                        </div>
                        <span className="font-bold text-slate-700 shrink-0 ml-2">{c.weightTons.toLocaleString()} Ton</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gemi Mürettebatı */}
              <div>
                <span className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Görevli Mürettebat ({detailAssignments.length} Kişi)
                </span>
                {detailAssignments.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                    Bu gemiye atanmış personel bulunmuyor.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {detailAssignments.map((a) => {
                      const crewMember = a.crewMember || crew.find((cr) => cr.id === a.crewMemberId);
                      const name = crewMember?.fullName || (crewMember?.firstName ? `${crewMember.firstName} ${crewMember.lastName}` : `Personel #${a.crewMemberId}`);
                      const role = a.roleOnShip || crewMember?.role || 'Mürettebat';

                      return (
                        <div
                          key={a.id}
                          className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {name?.[0] || 'P'}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 block truncate">
                              {name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {role}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Altı */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <a
                  href={`/visits?search=${encodeURIComponent(detailShip.name)}`}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span>Sefer Kayıtlarını Gör</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`/ships?search=${encodeURIComponent(detailShip.name)}`}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                >
                  Gemi Kaydı <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <button
                onClick={() => setDetailShipId(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
