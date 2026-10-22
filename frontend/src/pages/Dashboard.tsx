import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Ship as ShipIcon,
  Anchor,
  Users,
  CalendarDays,
  Plus,
  Search,
  Eye,
  Package,
  ArrowRight
} from 'lucide-react';
import { 
  shipService, portService, shipVisitService, crewMemberService, 
  cargoService, assignmentService 
} from '../services/api';
import type { Ship, Port, ShipVisit, CrewMember, Cargo, ShipCrewAssignment } from '../types';
import { Modal } from '../components/Modal';

export const Dashboard: React.FC = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [visits, setVisits] = useState<ShipVisit[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Sefer Detay Modalı State'i
  const [detailVisit, setDetailVisit] = useState<ShipVisit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailCargoes, setDetailCargoes] = useState<Cargo[]>([]);
  const [detailCrew, setDetailCrew] = useState<ShipCrewAssignment[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleOpenDetailModal = async (visit: ShipVisit) => {
    setDetailVisit(visit);
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const [allC, allA] = await Promise.all([
        cargoService.getAll(),
        assignmentService.getAll(),
      ]);
      setDetailCargoes(allC.filter((c) => c.shipId === visit.shipId));
      setDetailCrew(allA.filter((a) => a.shipId === visit.shipId));
    } catch (err) {
      console.error('Sefer detay verisi alınırken hata:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [s, p, v, cr] = await Promise.all([
          shipService.getAll(),
          portService.getAll(),
          shipVisitService.getAll(),
          crewMemberService.getAll(),
        ]);
        setShips(s);
        setPorts(p);
        setVisits(v);
        setCrew(cr);
      } catch (err) {
        console.error('Veri yüklenirken hata:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [portFilter, setPortFilter] = useState<'ALL' | 'ACTIVE'>('ALL');
  const [portSearch, setPortSearch] = useState('');

  const dockedVisits = visits.filter((v) => v.status === 'Docked');

  const portStats = useMemo(() => {
    return ports.map((port) => {
      const dockedCount = visits.filter(
        (v) => v.portId === port.id && v.status === 'Docked'
      ).length;
      const cap = port.capacity || 1;
      const percent = dockedCount > 0 ? Math.max(1, Math.min(100, Math.round((dockedCount / cap) * 100))) : 0;
      const isFull = dockedCount >= cap;
      return { port, dockedCount, cap, percent, isFull };
    });
  }, [ports, visits]);

  const filteredPortStats = useMemo(() => {
    let list = portStats;
    if (portFilter === 'ACTIVE') {
      list = list.filter((p) => p.dockedCount > 0);
    }
    if (portSearch.trim()) {
      const q = portSearch.toLowerCase();
      list = list.filter((p) => 
        p.port.name.toLowerCase().includes(q) || 
        p.port.code.toLowerCase().includes(q) ||
        (p.port.country && p.port.country.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => b.dockedCount - a.dockedCount || a.port.name.localeCompare(b.port.name, 'tr'));
  }, [portStats, portFilter, portSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Veriler yükleniyor, lütfen bekleyin...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basit Başlık */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h1 className="text-xl font-bold text-slate-800">Liman Kontrol Paneli</h1>
        <p className="text-sm text-slate-500 mt-1">
          Limanlardaki gemileri, rıhtım durumlarını ve sefer kayıtlarını buradan takip edebilirsiniz.
        </p>
      </div>

      {/* 4 Sade Özet Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gemiler */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Toplam Gemi</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded">
              <ShipIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{ships.length}</div>
          <Link to="/ships" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
            Gemileri gör &rarr;
          </Link>
        </div>

        {/* Limanlar */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Liman Sayısı</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded">
              <Anchor className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{ports.length}</div>
          <Link to="/ports" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
            Limanları gör &rarr;
          </Link>
        </div>

        {/* Gemi Ziyaretleri */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Gemi Ziyaretleri</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{visits.length}</div>
          <div className="flex items-center justify-between mt-2">
            <Link to="/visits" className="text-xs text-blue-600 hover:underline inline-block">
              Ziyaretleri gör &rarr;
            </Link>
            <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
              {dockedVisits.length} rıhtımda
            </span>
          </div>
        </div>

        {/* Mürettebat */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Kayıtlı Personel</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{crew.length}</div>
          <Link to="/crew" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
            Personeli gör &rarr;
          </Link>
        </div>
      </div>

      {/* Liman Doluluk Durumu */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Limanların Rıhtım ve Doluluk Durumu</h3>
            <p className="text-xs text-slate-500">Limanlardaki anlık rıhtım doluluk oranları ve yanaşık gemi sayıları.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtre Butonları */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setPortFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  portFilter === 'ALL'
                    ? 'bg-white text-slate-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tümü ({portStats.length})
              </button>
              <button
                onClick={() => setPortFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  portFilter === 'ACTIVE'
                    ? 'bg-white text-slate-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yanaşık Gemi Olanlar ({portStats.filter((p) => p.dockedCount > 0).length})
              </button>
            </div>

            {/* Arama Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Liman ara..."
                value={portSearch}
                onChange={(e) => setPortSearch(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
              />
            </div>
          </div>
        </div>

        {filteredPortStats.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Arama kriterine uygun liman bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPortStats.map(({ port, dockedCount, cap, percent, isFull }) => (
              <div key={port.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-sm text-slate-800 block truncate">{port.name}</span>
                    <span className="text-[10px] text-slate-500">{port.city ? `${port.city}, ` : ''}{port.country} • <strong className="font-mono text-slate-600">{port.code}</strong></span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold shrink-0 ${
                      isFull
                        ? 'bg-red-100 text-red-700'
                        : percent > 50
                        ? 'bg-amber-100 text-amber-700'
                        : percent > 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isFull ? 'Dolu' : `%${percent} Dolu`}
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isFull ? 'bg-red-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${dockedCount > 0 ? Math.max(percent, 4) : 0}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-500 pt-0.5">
                  <span>Yanaşan: <strong className={dockedCount > 0 ? "text-emerald-700 font-bold" : "text-slate-700"}>{dockedCount} Gemi</strong></span>
                  <span>Rıhtım Kapasitesi: <strong>{cap}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Son Gemi Ziyaretleri Tablosu */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Son Ziyaret Kayıtları</h3>
          <Link
            to="/visits"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded"
          >
            <Plus className="w-3.5 h-3.5" />
            Yeni Ziyaret Ekle
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Gemi</th>
                <th className="px-4 py-3">Liman</th>
                <th className="px-4 py-3">Geliş Tarihi</th>
                <th className="px-4 py-3">Ayrılış Tarihi</th>
                <th className="px-4 py-3">Rıhtım No</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    Henüz kayıtlı ziyaret bulunmuyor.
                  </td>
                </tr>
              ) : (
                visits.slice(0, 5).map((visit) => {
                  const ship = ships.find((s) => s.id === visit.shipId);
                  const port = ports.find((p) => p.id === visit.portId);
                  return (
                    <tr key={visit.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {ship?.name || `Gemi #${visit.shipId}`}
                      </td>
                      <td className="px-4 py-3">{port?.name || `Liman #${visit.portId}`}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(visit.arrivalDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(visit.departureDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{visit.dockNumber || '-'}</td>
                      <td className="px-4 py-3">
                        {visit.status === 'Docked' && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            Rıhtımda
                          </span>
                        )}
                        {visit.status === 'Scheduled' && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Planlandı
                          </span>
                        )}
                        {visit.status === 'Departed' && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            Ayrıldı
                          </span>
                        )}
                        {visit.status === 'Cancelled' && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            İptal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenDetailModal(visit)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                          title="Sefer Detaylarını İncele"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detay</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEFER DETAYLARI MODALI */}
      {detailVisit && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Sefer Detayı (Sefer #${detailVisit.id})`}
        >
          {(() => {
            const ship = ships.find((s) => s.id === detailVisit.shipId);
            const port = ports.find((p) => p.id === detailVisit.portId);
            const originPort = detailVisit.originPortId ? ports.find((p) => p.id === detailVisit.originPortId) : null;
            const totalCargoWeight = detailCargoes.reduce((acc, c) => acc + (c.weightTons || 0), 0);

            return (
              <div className="space-y-4 text-xs">
                {/* Sefer Başlığı */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShipIcon className="w-5 h-5 text-blue-400" />
                      <div>
                        <span className="font-bold text-sm text-white block">
                          {ship?.name || `Gemi #${detailVisit.shipId}`}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          IMO: {ship?.imoNumber || '-'} • {ship?.flag || 'Uluslararası'} • {ship?.type || 'Ticari'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        detailVisit.status === 'Docked'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : detailVisit.status === 'Scheduled'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : detailVisit.status === 'Departed'
                          ? 'bg-slate-700 text-slate-300 border-slate-600'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                    >
                      {detailVisit.status === 'Docked' && 'Rıhtımda'}
                      {detailVisit.status === 'Scheduled' && 'Planlandı (Seyirde)'}
                      {detailVisit.status === 'Departed' && 'Ayrıldı (Tamamlandı)'}
                      {detailVisit.status === 'Cancelled' && 'İptal'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Sefer Rotası:</span>
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <span>{originPort?.name || 'Açık Deniz'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="text-blue-300">{port?.name || `Liman #${detailVisit.portId}`}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Yanaşma Rıhtımı / Noktası:</span>
                      <strong className="text-white font-semibold">{detailVisit.dockNumber || 'Belirtilmedi'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Kalkış Zamanı (ETD):</span>
                      <strong className="text-white font-semibold">
                        {new Date(detailVisit.departureDate).toLocaleString('tr-TR')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Varış Zamanı (ETA):</span>
                      <strong className="text-blue-300 font-semibold">
                        {new Date(detailVisit.arrivalDate).toLocaleString('tr-TR')}
                      </strong>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2.5 text-slate-300">
                    <span className="text-slate-400 block text-[11px]">Sefer Amacı:</span>
                    <strong className="text-white font-medium block mt-0.5">
                      {detailVisit.purpose || 'Standart Ticari Yük ve Konteyner Operasyonu'}
                    </strong>
                  </div>
                </div>

                {/* Kargo Bilgileri */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-amber-500" />
                      Sefer Manifestosu ({detailCargoes.length} Kalem)
                    </span>
                    {totalCargoWeight > 0 && (
                      <span className="text-[11px] text-slate-500 font-normal">
                        Toplam: <strong>{totalCargoWeight.toLocaleString()} Ton</strong>
                      </span>
                    )}
                  </div>

                  {loadingDetail ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-center text-slate-400">Veriler yükleniyor...</div>
                  ) : detailCargoes.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                      Bu sefere ait kayıtlı kargo yükü bulunmuyor.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {detailCargoes.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 block">{c.description}</span>
                            <div className="text-[11px] text-slate-500 flex gap-2 mt-0.5">
                              <span>Tip: <strong>{c.type}</strong></span>
                              {c.containerCount && <span>Konteyner: <strong>{c.containerCount} TEU</strong></span>}
                            </div>
                          </div>
                          <span className="font-bold text-blue-700 shrink-0 ml-2">
                            {c.weightTons.toLocaleString()} Ton
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Görevli Mürettebat */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      Görevli Mürettebat ({detailCrew.length} Kişi)
                    </span>
                  </div>

                  {loadingDetail ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-center text-slate-400">Personel yükleniyor...</div>
                  ) : detailCrew.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                      Bu gemiye atanmış personel bulunmuyor.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                      {detailCrew.map((a) => {
                        const cm = a.crewMember;
                        const name = cm?.fullName || (cm?.firstName ? `${cm.firstName} ${cm.lastName}` : `Personel #${a.crewMemberId}`);
                        const role = a.roleOnShip || cm?.role || 'Mürettebat';

                        return (
                          <div
                            key={a.id}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {name[0] || 'P'}
                            </div>
                            <div className="truncate flex-1 min-w-0">
                              <span className="font-semibold text-slate-900 block truncate">{name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{role}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Modal Altı */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/visits?search=${encodeURIComponent(ship?.name || '')}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    Seferler Sayfasına Git <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
