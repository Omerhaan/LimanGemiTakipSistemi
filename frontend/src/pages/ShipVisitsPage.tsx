import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Ship as ShipIcon, Anchor, AlertCircle, ShieldAlert, 
  Search, Download, Compass, ArrowRight, CheckCircle2, AlertTriangle, 
  Users, ChevronRight, ChevronLeft, Lock, Eye, Package
} from 'lucide-react';
import { 
  shipVisitService, shipService, portService, computeVisitStatus,
  cargoService, assignmentService 
} from '../services/api';
import type { 
  ShipVisit, Ship, Port, VisitStatus, Cargo, ShipCrewAssignment,
  AvailableShipDto, AvailableCrewDto, SafeManningValidationResult 
} from '../types';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCsv } from '../utils/exportUtils';

const STATUS_LIST: VisitStatus[] = ['Scheduled', 'Docked', 'Departed', 'Cancelled'];

export const ShipVisitsPage: React.FC = () => {
  const { canEdit, canDelete, role } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [visits, setVisits] = useState<ShipVisit[]>([]);
  const [allVisits, setAllVisits] = useState<ShipVisit[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 350);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Akıllı Sefer Planlayıcı (Smart Dispatcher Wizard) State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardData, setWizardData] = useState({
    originPortId: 0,
    destinationPortId: 0,
    departureDate: '',
    arrivalDate: '',
    purpose: 'Konteyner ve Ticari Yük Seferi',
    dockNumber: 'Rıhtım 1',
    shipId: 0,
    crewMemberIds: [] as number[],
  });
  const [availableShips, setAvailableShips] = useState<AvailableShipDto[]>([]);
  const [loadingShips, setLoadingShips] = useState(false);
  const [availableCrew, setAvailableCrew] = useState<AvailableCrewDto[]>([]);
  const [loadingCrew, setLoadingCrew] = useState(false);
  const [manningResult, setManningResult] = useState<SafeManningValidationResult | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [wizardAlert, setWizardAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== search) {
      setSearch(q);
      setPageNumber(1);
    }
  }, [searchParams]);

  // Pagination State
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<ShipVisit | null>(null);

  const [formData, setFormData] = useState({
    shipId: 0,
    originPortId: 0,
    portId: 0,
    arrivalDate: '',
    departureDate: '',
    status: 'Scheduled' as VisitStatus,
    dockNumber: '',
  });

  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      console.error('Sefer detay verileri yüklenirken hata:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Yardımcı (lookup) verileri tek seferde yükle
  const loadLookupData = async () => {
    try {
      const [allV, s, p] = await Promise.all([
        shipVisitService.getAll(),
        shipService.getAll(),
        portService.getAll(),
      ]);
      setAllVisits(allV);
      setShips(s);
      setPorts(p);
    } catch (err: any) {
      console.error('Lookup verileri yüklenirken hata:', err);
    }
  };

  const fetchPagedVisits = async () => {
    try {
      setLoading(true);
      const pagedV = await shipVisitService.getPaged({
        pageNumber,
        pageSize,
        searchTerm: debouncedSearch,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      });
      setVisits(pagedV.items);
      setTotalCount(pagedV.totalCount);
      setTotalPages(pagedV.totalPages);
      setHasPreviousPage(pagedV.hasPreviousPage);
      setHasNextPage(pagedV.hasNextPage);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Ziyaretler yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookupData();
  }, []);

  useEffect(() => {
    fetchPagedVisits();
  }, [pageNumber, pageSize, debouncedSearch, selectedStatus]);

  // Seçilen Liman ve Gemi
  const selectedShip = ships.find((s) => s.id === Number(formData.shipId));
  const selectedPort = ports.find((p) => p.id === Number(formData.portId));

  // Tarih geçerlilik kontrolü
  const arrTime = new Date(formData.arrivalDate).getTime();
  const depTime = new Date(formData.departureDate).getTime();
  const datesValid = !isNaN(arrTime) && !isNaN(depTime) && arrTime < depTime;

  // 1. Gemi Çift Rezervasyon (Işınlanma) Kontrolü
  const conflictingShipVisit = (datesValid && formData.status !== 'Cancelled')
    ? allVisits.find((v) =>
        (!editingVisit || v.id !== editingVisit.id) &&
        v.shipId === Number(formData.shipId) &&
        v.status !== 'Cancelled' &&
        new Date(formData.arrivalDate) < new Date(v.departureDate) &&
        new Date(formData.departureDate) > new Date(v.arrivalDate)
      )
    : null;

  const conflictingPort = conflictingShipVisit ? ports.find((p) => p.id === conflictingShipVisit.portId) : null;
  const isShipDoubleBooked = Boolean(conflictingShipVisit);

  // 2. Liman Eşzamanlı Kapasite Aşımı Kontrolü
  const overlappingPortVisits = (datesValid && formData.status !== 'Cancelled')
    ? allVisits.filter((v) =>
        (!editingVisit || v.id !== editingVisit.id) &&
        v.portId === Number(formData.portId) &&
        v.status !== 'Cancelled' &&
        new Date(formData.arrivalDate) < new Date(v.departureDate) &&
        new Date(formData.departureDate) > new Date(v.arrivalDate)
      )
    : [];

  const portCapacity = selectedPort?.capacity || 0;
  const currentPortOccupancy = overlappingPortVisits.length;
  const isPortFull = portCapacity > 0 && currentPortOccupancy >= portCapacity;
  const hasConflict = isShipDoubleBooked || isPortFull;

  const handleOpenAddModal = () => {
    setEditingVisit(null);
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 2);

    setFormData({
      shipId: ships.length > 0 ? ships[0].id : 0,
      originPortId: ports.length > 0 ? ports[0].id : 0,
      portId: ports.length > 1 ? ports[1].id : (ports[0]?.id || 0),
      arrivalDate: now.toISOString().slice(0, 16),
      departureDate: tomorrow.toISOString().slice(0, 16),
      status: 'Scheduled',
      dockNumber: 'Rıhtım 1',
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (visit: ShipVisit) => {
    setEditingVisit(visit);
    setFormData({
      shipId: visit.shipId,
      originPortId: visit.originPortId || 0,
      portId: visit.portId,
      arrivalDate: visit.arrivalDate.slice(0, 16),
      departureDate: visit.departureDate.slice(0, 16),
      status: visit.status,
      dockNumber: visit.dockNumber || '',
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  // Sefer Emri ve Donatım (Voyage Dispatch) Handlers
  const handleOpenDispatcherWizard = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 3);

    const defaultOrigin = ports.length > 0 ? ports[0].id : 0;
    const defaultDest = ports.length > 1 ? ports[1].id : (ports[0]?.id || 0);

    setWizardData({
      originPortId: defaultOrigin,
      destinationPortId: defaultDest,
      departureDate: now.toISOString().slice(0, 16),
      arrivalDate: tomorrow.toISOString().slice(0, 16),
      purpose: 'Konteyner ve Ticari Yük Seferi',
      dockNumber: 'Rıhtım 1',
      shipId: 0,
      crewMemberIds: [],
    });
    setWizardStep(1);
    setWizardAlert(null);
    setManningResult(null);
    setIsWizardOpen(true);
  };

  const handleWizardStep1Next = async () => {
    setWizardAlert(null);
    if (!wizardData.originPortId || !wizardData.destinationPortId) {
      setWizardAlert({ type: 'error', message: 'Lütfen kalkış ve varış limanlarını seçiniz.' });
      return;
    }
    if (wizardData.originPortId === wizardData.destinationPortId) {
      setWizardAlert({ type: 'error', message: 'Kalkış limanı ile varış limanı aynı olamaz!' });
      return;
    }
    const dep = new Date(wizardData.departureDate).getTime();
    const arr = new Date(wizardData.arrivalDate).getTime();
    if (isNaN(dep) || isNaN(arr) || dep >= arr) {
      setWizardAlert({ type: 'error', message: 'Varış tarihi, kalkış tarihinden sonra olmalıdır!' });
      return;
    }

    try {
      setLoadingShips(true);
      const s = await shipVisitService.getAvailableShips(wizardData.departureDate, wizardData.arrivalDate);
      setAvailableShips(s);
      setWizardStep(2);
    } catch (err: any) {
      setWizardAlert({ type: 'error', message: err.message || 'Müsait gemiler sorgulanamadı.' });
    } finally {
      setLoadingShips(false);
    }
  };

  const handleWizardStep2Next = async () => {
    setWizardAlert(null);
    if (!wizardData.shipId) {
      setWizardAlert({ type: 'error', message: 'Lütfen sefer için müsait bir gemi seçiniz.' });
      return;
    }

    try {
      setLoadingCrew(true);
      const c = await shipVisitService.getAvailableCrew(wizardData.departureDate, wizardData.arrivalDate);
      setAvailableCrew(c);
      setWizardStep(3);
    } catch (err: any) {
      setWizardAlert({ type: 'error', message: err.message || 'Müsait mürettebat listesi alınamadı.' });
    } finally {
      setLoadingCrew(false);
    }
  };

  const handleToggleCrew = async (crewId: number) => {
    const nextIds = wizardData.crewMemberIds.includes(crewId)
      ? wizardData.crewMemberIds.filter((id) => id !== crewId)
      : [...wizardData.crewMemberIds, crewId];

    setWizardData({ ...wizardData, crewMemberIds: nextIds });

    if (nextIds.length > 0) {
      try {
        const val = await shipVisitService.validateSafeManning(wizardData.shipId, nextIds);
        setManningResult(val);
      } catch {
        // quiet
      }
    } else {
      setManningResult(null);
    }
  };

  const handleAutoAssignCrew = async () => {
    const available = availableCrew.filter((c) => c.isAvailable);
    const captain = available.find((c) => /kaptan|master|captain/i.test(c.role));
    const chief = available.find((c) => /mühendis|çarkçı|engineer/i.test(c.role));
    const sailors = available.filter((c) => c.crewId !== captain?.crewId && c.crewId !== chief?.crewId).slice(0, 3);

    const autoIds: number[] = [];
    if (captain) autoIds.push(captain.crewId);
    if (chief) autoIds.push(chief.crewId);
    sailors.forEach((s) => autoIds.push(s.crewId));

    setWizardData({ ...wizardData, crewMemberIds: autoIds });
    if (autoIds.length > 0) {
      const val = await shipVisitService.validateSafeManning(wizardData.shipId, autoIds);
      setManningResult(val);
    }
  };

  const handleWizardStep3Next = async () => {
    setWizardAlert(null);
    if (wizardData.crewMemberIds.length === 0) {
      setWizardAlert({ type: 'error', message: 'Lütfen seyre çıkacak asgari mürettebatı seçiniz.' });
      return;
    }

    try {
      const val = await shipVisitService.validateSafeManning(wizardData.shipId, wizardData.crewMemberIds);
      setManningResult(val);
      if (!val.isCompliant) {
        setWizardAlert({ type: 'error', message: val.errors.join(' ') });
        return;
      }
      setWizardStep(4);
    } catch (err: any) {
      setWizardAlert({ type: 'error', message: err.message || 'Mürettebat kontrolü başarısız.' });
    }
  };

  const handleDispatchSubmit = async () => {
    setWizardAlert(null);
    setDispatching(true);
    try {
      const res = await shipVisitService.dispatchVoyage({
        shipId: wizardData.shipId,
        originPortId: wizardData.originPortId,
        destinationPortId: wizardData.destinationPortId,
        departureDate: wizardData.departureDate,
        arrivalDate: wizardData.arrivalDate,
        purpose: wizardData.purpose,
        dockNumber: wizardData.dockNumber,
        crewMemberIds: wizardData.crewMemberIds,
      });

      if (res.success) {
        setAlert({
          type: 'success',
          message: `Sefer başarıyla başlatıldı! Gemi varış hedefine doğru planlandı ve ${wizardData.crewMemberIds.length} personel göreve atandı.`,
        });
        setIsWizardOpen(false);
        fetchPagedVisits();
        loadLookupData();
      } else {
        setWizardAlert({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setWizardAlert({ type: 'error', message: err.message || 'Sefer planlanırken hata oluştu.' });
    } finally {
      setDispatching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    // İş Kuralı: Geliş tarihi ayrılış tarihinden önce olmalı
    if (isNaN(arrTime) || isNaN(depTime)) {
      setAlert({ type: 'error', message: 'Geçerli bir tarih ve saat seçiniz!' });
      setSubmitting(false);
      return;
    }

    if (arrTime >= depTime) {
      setAlert({
        type: 'error',
        message: 'İş Kuralı İhlali: Geliş tarihi, ayrılış tarihinden önce olmalıdır!',
      });
      setSubmitting(false);
      return;
    }

    if (formData.originPortId && Number(formData.originPortId) === Number(formData.portId)) {
      setAlert({
        type: 'error',
        message: 'Kalkış limanı ile varış limanı aynı olamaz!',
      });
      setSubmitting(false);
      return;
    }

    // Güvenlik Kuralı: Gemi Çift Rezervasyon (Işınlanma) Engeli
    if (isShipDoubleBooked && conflictingShipVisit) {
      const portName = conflictingPort ? conflictingPort.name : `Liman #${conflictingShipVisit.portId}`;
      const shipName = selectedShip ? selectedShip.name : `Gemi #${formData.shipId}`;
      setAlert({
        type: 'error',
        message: `Gemi Çift Rezervasyon (Işınlanma) Hatası: '${shipName}' gemisi belirtilen tarihlerde zaten '${portName}' limanında aktif bir sefere sahiptir. Bir gemi aynı anda iki farklı yerde bulunamaz!`,
      });
      setSubmitting(false);
      return;
    }

    // Güvenlik Kuralı: Liman Eşzamanlı Kapasite Aşımı Kontrolü
    if (isPortFull && selectedPort) {
      setAlert({
        type: 'error',
        message: `Liman Rıhtım Kapasitesi Dolu! '${selectedPort.name}' limanının azami eşzamanlı yanaşma kapasitesi ${selectedPort.capacity} adettir. Belirtilen tarihlerde liman kapasitesi tamamen doludur. Yeni gemi kabul edilemez!`,
      });
      setSubmitting(false);
      return;
    }

    try {
      if (editingVisit) {
        await shipVisitService.update(editingVisit.id, {
          ...formData,
          rowVersion: editingVisit.rowVersion,
        });
        setAlert({ type: 'success', message: 'Ziyaret kaydı güncellendi.' });
      } else {
        await shipVisitService.create(formData);
        setAlert({ type: 'success', message: 'Yeni ziyaret planlandı.' });
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchPagedVisits();
        loadLookupData();
      }, 500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Kayıt başarısız!';
      if (err.response?.status === 409 || err.response?.data?.code === 'CONCURRENCY_CONFLICT') {
        setAlert({
          type: 'error',
          message: '⚠️ Eş Zamanlı Güncelleme Çakışması (Concurrency Conflict): Bu kayıt sizden önce başka bir kullanıcı tarafından değiştirilmiştir. Değişikliğin üzerine yazılmaması için işlem durduruldu. Sayfadaki veriler yenileniyor...',
        });
        fetchPagedVisits();
      } else {
        setAlert({ type: 'error', message: errorMsg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (visit: ShipVisit) => {
    if (confirm('Bu ziyaret kaydını silmek istediğinize emin misiniz?')) {
      try {
        await shipVisitService.delete(visit.id);
        setAlert({ type: 'success', message: 'Kayıt silindi.' });
        fetchPagedVisits();
        loadLookupData();
      } catch (err: any) {
        setAlert({ type: 'error', message: err.message || 'Silinemedi.' });
      }
    }
  };

  const handleExportCsv = async () => {
    try {
      const all = await shipVisitService.getAll();
      const headers = ['ID', 'Gemi', 'Liman', 'Geliş Tarihi', 'Ayrılış Tarihi', 'Rıhtım No', 'Durum'];
      const rows = all.map((v) => {
        const s = ships.find((ship) => ship.id === v.shipId);
        const p = ports.find((port) => port.id === v.portId);
        return [
          v.id,
          s?.name || `Gemi #${v.shipId}`,
          p?.name || `Liman #${v.portId}`,
          new Date(v.arrivalDate).toLocaleString('tr-TR'),
          new Date(v.departureDate).toLocaleString('tr-TR'),
          v.dockNumber || '-',
          v.status,
        ];
      });
      exportToCsv('liman_ziyaretleri_takvimi', headers, rows);
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Dışa aktarma başarısız: ' + err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ziyaret Kayıtları</h2>
          <p className="text-xs text-slate-500">
            Limanlara yanaşma, ayrılış takvimi ve rıhtım operasyonları.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-xs transition-all cursor-pointer"
            title="Tüm Sefer Listesini Excel / CSV Olarak İndir"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Dışa Aktar</span>
          </button>
          {canEdit && (
            <button
              onClick={handleOpenDispatcherWizard}
              disabled={ships.length === 0 || ports.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-slate-500" />
              <span>Detaylı Sefer Planlayıcı</span>
            </button>
          )}
          {canEdit ? (
            <button
              onClick={handleOpenAddModal}
              disabled={ships.length === 0 || ports.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yeni Sefer Kaydı
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
              Salt Okunur Mod ({role})
            </div>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Güvenlik & İş Kuralları Bilgilendirme Kartı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Gemi Çift Rezervasyon (Işınlanma) Engeli:</span> Bir gemi aynı anda iki farklı limanda veya seferde bulunamaz. Tarihleri çakışan mükerrer seferler sistem tarafından engellenir.
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-indigo-900 flex items-start gap-2.5">
          <Anchor className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Liman Eşzamanlı Kapasite Kontrolü:</span> Aynı zaman diliminde bir limana yanaşan gemi sayısı, o limanın rıhtım kapasitesine ulaştığında rıhtım kilitlenir.
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Gemi, liman veya rıhtım ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNumber(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Durum:</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPageNumber(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          >
            <option value="ALL">Tümü</option>
            {STATUS_LIST.map((st) => (
              <option key={st} value={st}>
                {st === 'Docked' ? 'Rıhtımda' : st === 'Scheduled' ? 'Planlandı' : st === 'Departed' ? 'Ayrıldı' : 'İptal'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Gemi</th>
                <th className="px-6 py-3.5">Güzergah (Kalkış ➔ Varış)</th>
                <th className="px-6 py-3.5">Varış (ETA)</th>
                <th className="px-6 py-3.5">Ayrılış Zamanı</th>
                <th className="px-6 py-3.5">Rıhtım No</th>
                <th className="px-6 py-3.5">Durum</th>
                <th className="px-6 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Kayıtlar yükleniyor...
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Kriterlere uygun ziyaret bulunamadı.
                  </td>
                </tr>
              ) : (
                visits.map((visit) => {
                  const ship = visit.ship || ships.find((s) => s.id === visit.shipId);
                  const port = visit.port || ports.find((p) => p.id === visit.portId);
                  const originPort = visit.originPort || (visit.originPortId ? ports.find((p) => p.id === visit.originPortId) : null);
                  return (
                    <tr key={visit.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <ShipIcon className="w-4 h-4 text-ocean-600" />
                          <div>
                            <div>{ship?.name || `Gemi #${visit.shipId}`}</div>
                            <div className="text-[11px] font-mono text-slate-400 font-normal">IMO: {ship?.imoNumber || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="font-medium text-slate-400">Kalkış:</span>
                            <span className="truncate max-w-[130px]">{originPort?.name || 'Açık Deniz'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-ocean-700">
                            <Anchor className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[150px]">{port?.name || `Liman #${visit.portId}`}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {new Date(visit.arrivalDate).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {new Date(visit.departureDate).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {visit.dockNumber || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            visit.status === 'Docked'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : visit.status === 'Scheduled'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : visit.status === 'Departed'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {visit.status === 'Docked' && 'Rıhtımda'}
                          {visit.status === 'Scheduled' && 'Planlandı'}
                          {visit.status === 'Departed' && 'Ayrıldı'}
                          {visit.status === 'Cancelled' && 'İptal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetailModal(visit)}
                            className="p-1.5 text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition-colors cursor-pointer"
                            title="Sefer Detaylarını İncele"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEditModal(visit)}
                              className="p-1.5 text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition-colors cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(visit)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          onPageChange={(page) => setPageNumber(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageNumber(1);
          }}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVisit ? 'Sefer Kaydını Düzenle' : 'Yeni Sefer Kaydı'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Gemi Seçimi *
              </label>
              <select
                value={formData.shipId}
                onChange={(e) => setFormData({ ...formData, shipId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              >
                {ships.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.imoNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Kalkış Limanı (Nereden)
              </label>
              <select
                value={formData.originPortId || ''}
                onChange={(e) => setFormData({ ...formData, originPortId: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              >
                <option value="">-- Açık Deniz / Seçilmedi --</option>
                {ports.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Varış Limanı (Nereye) *
              </label>
              <select
                value={formData.portId}
                onChange={(e) => setFormData({ ...formData, portId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              >
                {ports.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Geliş Tarihi & Saati *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.arrivalDate}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoStatus = computeVisitStatus(val, formData.departureDate, formData.status);
                  setFormData({ ...formData, arrivalDate: val, status: autoStatus });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Ayrılış Tarihi & Saati *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.departureDate}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoStatus = computeVisitStatus(formData.arrivalDate, val, formData.status);
                  setFormData({ ...formData, departureDate: val, status: autoStatus });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Eşzamanlı Liman Kapasitesi ve Gemi Çakışma Durum Paneli */}
          {datesValid && formData.status !== 'Cancelled' && (
            <div className="space-y-2.5">
              {/* Liman Kapasite Göstergesi */}
              {selectedPort && portCapacity > 0 && (
                <div className={`p-3.5 rounded-xl border text-xs transition-all ${isPortFull ? 'bg-red-50 border-red-200 text-red-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Anchor className={`w-4 h-4 ${isPortFull ? 'text-red-600' : 'text-ocean-600'}`} />
                      {selectedPort.name} Rıhtım Doluluğu:
                    </span>
                    <span className={`font-bold ${isPortFull ? 'text-red-600' : 'text-slate-800'}`}>
                      {currentPortOccupancy} / {portCapacity} Gemi ({Math.min(100, Math.round((currentPortOccupancy / portCapacity) * 100))}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className={`h-2 rounded-full transition-all ${isPortFull ? 'bg-red-600' : 'bg-ocean-600'}`}
                      style={{ width: `${Math.min(100, (currentPortOccupancy / portCapacity) * 100)}%` }}
                    />
                  </div>
                  {isPortFull ? (
                    <div className="text-red-700 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Liman Rıhtım Kapasitesi Dolu! Seçilen tarih aralığında limandaki gemi sayısı azami kapasiteye ({portCapacity}) ulaşmıştır. Yeni gemi kabul edilemez.
                    </div>
                  ) : (
                    <div className="text-emerald-700 text-[11px] font-medium flex justify-between">
                      <span>✓ Seçilen tarihlerde rıhtımda yer var.</span>
                      <span>Kalan Boş Rıhtım: {portCapacity - currentPortOccupancy}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Gemi Çift Rezervasyon (Işınlanma) Uyarısı */}
              {isShipDoubleBooked && conflictingShipVisit && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-700">Gemi Çift Rezervasyon (Işınlanma) Engeli!</div>
                    <div className="mt-0.5 text-red-800">
                      <strong>{selectedShip?.name}</strong> gemisi bu tarihlerde zaten <strong>{conflictingPort?.name || `Liman #${conflictingShipVisit.portId}`}</strong> limanında aktif bir sefere sahip:
                    </div>
                    <div className="font-mono text-[11px] text-red-600 mt-1 font-semibold">
                      {new Date(conflictingShipVisit.arrivalDate).toLocaleString('tr-TR')} - {new Date(conflictingShipVisit.departureDate).toLocaleString('tr-TR')}
                    </div>
                    <div className="mt-1 font-medium text-red-700 text-[11px]">
                      Bir gemi aynı anda iki farklı limanda veya seferde bulunamaz!
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Rıhtım / Lokasyon
              </label>
              <input
                type="text"
                value={formData.dockNumber}
                onChange={(e) => setFormData({ ...formData, dockNumber: e.target.value })}
                placeholder="Örn: Rıhtım 3"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Operasyon Durumu</span>
                <span className="text-[10px] text-ocean-600 lowercase font-normal">(tarihe göre otomatik belirlenir)</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as VisitStatus })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none bg-slate-50"
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s === 'Scheduled' && 'Planlandı (Gelecekte)'}
                    {s === 'Docked' && 'Rıhtımda (Şu Anda)'}
                    {s === 'Departed' && 'Ayrıldı (Geçmişte)'}
                    {s === 'Cancelled' && 'İptal Edildi'}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                {formData.status === 'Departed' && '🚢 Ayrılış tarihi geçmişte kaldığı için durum "Ayrıldı" olarak ayarlandı.'}
                {formData.status === 'Docked' && '⚓ Gemi şu an liman ziyaret süresinde olduğu için "Rıhtımda" olarak ayarlandı.'}
                {formData.status === 'Scheduled' && '🕒 Geliş tarihi gelecekte olduğu için "Planlandı" olarak ayarlandı.'}
                {formData.status === 'Cancelled' && '❌ Ziyaret iptal edildi.'}
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting || hasConflict}
              className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Kaydediliyor...' : editingVisit ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Sefer ve Donatım Planlayıcı */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Sefer ve Donatım Planlayıcı"
      >
        <div className="space-y-5">
          {/* Adım Göstergesi */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold border-b border-slate-100 pb-3">
            <div
              className={`py-1.5 px-2 rounded-lg transition-all ${
                wizardStep === 1
                  ? 'bg-ocean-600 text-white shadow-xs'
                  : wizardStep > 1
                  ? 'bg-ocean-50 text-ocean-700 font-bold'
                  : 'text-slate-400 bg-slate-50'
              }`}
            >
              1. Güzergah
            </div>
            <div
              className={`py-1.5 px-2 rounded-lg transition-all ${
                wizardStep === 2
                  ? 'bg-ocean-600 text-white shadow-xs'
                  : wizardStep > 2
                  ? 'bg-ocean-50 text-ocean-700 font-bold'
                  : 'text-slate-400 bg-slate-50'
              }`}
            >
              2. Gemi Tahsisi
            </div>
            <div
              className={`py-1.5 px-2 rounded-lg transition-all ${
                wizardStep === 3
                  ? 'bg-ocean-600 text-white shadow-xs'
                  : wizardStep > 3
                  ? 'bg-ocean-50 text-ocean-700 font-bold'
                  : 'text-slate-400 bg-slate-50'
              }`}
            >
              3. Donatım (Personel)
            </div>
            <div
              className={`py-1.5 px-2 rounded-lg transition-all ${
                wizardStep === 4
                  ? 'bg-ocean-600 text-white shadow-xs'
                  : 'text-slate-400 bg-slate-50'
              }`}
            >
              4. Sefer Özeti
            </div>
          </div>

          {wizardAlert && (
            <Alert type={wizardAlert.type} message={wizardAlert.message} onClose={() => setWizardAlert(null)} />
          )}

          {/* ADIM 1: GÜZERGAH VE TARİH PENCERESİ */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-ocean-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Sefer Planlama:</span> Belirlenen kalkış ve varış tarih aralığında müsait gemiler ve personel filtrelenecektir.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Kalkış Limanı *
                  </label>
                  <select
                    value={wizardData.originPortId}
                    onChange={(e) => setWizardData({ ...wizardData, originPortId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  >
                    <option value="0">-- Kalkış Limanı Seçin --</option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Varış Limanı *
                  </label>
                  <select
                    value={wizardData.destinationPortId}
                    onChange={(e) => setWizardData({ ...wizardData, destinationPortId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  >
                    <option value="0">-- Varış Limanı Seçin --</option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Kalkış Tarihi & Saati (ETD) *
                  </label>
                  <input
                    type="datetime-local"
                    value={wizardData.departureDate}
                    onChange={(e) => setWizardData({ ...wizardData, departureDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Tahmini Varış Tarihi (ETA) *
                  </label>
                  <input
                    type="datetime-local"
                    value={wizardData.arrivalDate}
                    onChange={(e) => setWizardData({ ...wizardData, arrivalDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleWizardStep1Next}
                  disabled={loadingShips}
                  className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loadingShips ? 'Müsaitlik Taranıyor...' : 'Müsait Filoyu Sorgula'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ADIM 2: MÜSAİT GEMİ SEÇİMİ */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  Sefer Aralığı: {new Date(wizardData.departureDate).toLocaleDateString('tr-TR')} - {new Date(wizardData.arrivalDate).toLocaleDateString('tr-TR')}
                </span>
                <span className="font-semibold text-emerald-700">
                  {availableShips.filter((s) => s.isAvailable).length} Gemi Operasyona Hazır
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {availableShips.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Sistemde gemi bulunamadı.
                  </div>
                ) : (
                  availableShips.map((ship) => (
                    <div
                      key={ship.shipId}
                      onClick={() => {
                        if (ship.isAvailable) {
                          let autoPurpose = 'Ticari Sefer';
                          const t = (ship.type || '').toLowerCase();
                          if (t.includes('container') || t.includes('konteyner')) autoPurpose = 'Konteyner ve Ticari Yük Seferi';
                          else if (t.includes('passenger') || t.includes('yolcu')) autoPurpose = 'Yolcu ve Kruvaziyer Seferi';
                          else if (t.includes('tanker')) autoPurpose = 'Sıvı Yakıt / Ham Petrol Taşımacılığı';
                          else if (t.includes('bulk') || t.includes('dökme')) autoPurpose = 'Kuru Dökme Yük Seferi';
                          else if (t.includes('general') || t.includes('genel')) autoPurpose = 'Genel Kargo Seferi';
                          else if (t.includes('roro')) autoPurpose = 'Ro-Ro Araç ve Yük Seferi';

                          setWizardData({
                            ...wizardData,
                            shipId: ship.shipId,
                            purpose: autoPurpose,
                            dockNumber: wizardData.dockNumber || 'Rıhtım 1',
                          });
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                        !ship.isAvailable
                          ? 'bg-slate-50/80 border-slate-200 opacity-60 cursor-not-allowed'
                          : wizardData.shipId === ship.shipId
                          ? 'bg-ocean-50/80 border-ocean-500 ring-2 ring-ocean-500/30 cursor-pointer shadow-xs'
                          : 'bg-white border-slate-200 hover:border-ocean-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            ship.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <ShipIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{ship.name}</div>
                          <div className="text-slate-500 font-mono text-[11px]">
                            IMO: {ship.imoNumber} • {ship.type} • {ship.deadweightTonnage?.toLocaleString()} DWT
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {ship.isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Müsait (Boşta)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-400" /> {ship.currentStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Geri
                </button>
                <button
                  type="button"
                  onClick={handleWizardStep2Next}
                  disabled={!wizardData.shipId || loadingCrew}
                  className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loadingCrew ? 'Mürettebat Taranıyor...' : 'Personel Donatımına İlerle'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ADIM 3: MÜRETTEBAT SEÇİMİ VE ASGARİ GÜVENLİ DONATIM (STCW) */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-ocean-600" />
                    Asgari Güvenli Donatım Standartları (IMO / STCW Safe Manning)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Uluslararası denizcilik emniyet kuralları gereğince sefer emri için en az 1 Kaptan atanmış olmalıdır.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoAssignCrew}
                  className="px-3 py-1.5 bg-ocean-50 hover:bg-ocean-100 text-ocean-700 border border-ocean-200 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                >
                  Kadroya Otomatik Personel Ata
                </button>
              </div>

              {manningResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    manningResult.isCompliant
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {manningResult.isCompliant ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>
                      {manningResult.isCompliant
                        ? `STCW Asgari Güvenli Donatım Şartı Sağlandı (${wizardData.crewMemberIds.length} Personel Görevlendirildi)`
                        : 'Eksik Donatım: IMO/STCW Kuralı Gereği Kaptan Atanmadan Sefer Başlatılamaz'}
                    </span>
                  </div>
                  {manningResult.errors.map((err, i) => (
                    <div key={i} className="text-red-700 pl-6 text-[11px] font-medium">• {err}</div>
                  ))}
                  {manningResult.warnings.map((warn, i) => (
                    <div key={i} className="text-amber-700 pl-6 text-[11px]">• {warn}</div>
                  ))}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {availableCrew.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Sistemde personel kaydı bulunamadı.
                  </div>
                ) : (
                  availableCrew.map((c) => {
                    const isSelected = wizardData.crewMemberIds.includes(c.crewId);
                    return (
                      <div
                        key={c.crewId}
                        onClick={() => {
                          if (c.isAvailable) handleToggleCrew(c.crewId);
                        }}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                          !c.isAvailable
                            ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-ocean-50/90 border-ocean-500 ring-1 ring-ocean-500/40 cursor-pointer shadow-xs'
                            : 'bg-white border-slate-200 hover:border-ocean-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!c.isAvailable}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-ocean-600 focus:ring-ocean-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-slate-900">{c.fullName}</span>
                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {c.role}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          {c.isAvailable ? (
                            <span className="text-[11px] text-emerald-600 font-medium">Müsait</span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">{c.conflictDescription}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Geri
                </button>
                <button
                  type="button"
                  onClick={handleWizardStep3Next}
                  disabled={wizardData.crewMemberIds.length === 0}
                  className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  Sefer Emri Özetine İlerle
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ADIM 4: ROTA & GÖREV ÖZETİ VE SEFERİ BAŞLATMA */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-semibold text-ocean-300 uppercase tracking-wider">
                    Sefer Özeti
                  </span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    Onaya Hazır
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Güzergah:</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <span>{ports.find((p) => p.id === wizardData.originPortId)?.name || 'Kalkış'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
                      <span>{ports.find((p) => p.id === wizardData.destinationPortId)?.name || 'Varış'}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Planlanan Sefer Süresi:</span>
                    <span className="text-xs font-semibold text-white mt-0.5 block">
                      {new Date(wizardData.departureDate).toLocaleString('tr-TR')} ➔ {new Date(wizardData.arrivalDate).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-slate-800 pt-2.5">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Görevli Gemi:</span>
                    <span className="font-bold text-white mt-0.5 block">
                      {ships.find((s) => s.id === wizardData.shipId)?.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Görevlendirilen Mürettebat:</span>
                    <span className="font-semibold text-ocean-200 mt-0.5 block">
                      {wizardData.crewMemberIds.length} Personel (Kaptan & Donatım Onaylı)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-slate-800 pt-2.5">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sefer Operasyon Tipi:</span>
                    <span className="font-semibold text-ocean-200 mt-0.5 block">
                      {wizardData.purpose}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Hedef Yanaşma Rıhtımı:</span>
                    <span className="font-semibold text-white mt-0.5 block">
                      {wizardData.dockNumber || 'Rıhtım 1'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Çakışma ve personel donatım kontrolleri başarıyla tamamlandı. Onaylandığında sefer kaydı oluşturulacaktır.</span>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Geri
                </button>
                <button
                  type="button"
                  onClick={handleDispatchSubmit}
                  disabled={dispatching}
                  className="px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-bold shadow-md shadow-ocean-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {dispatching ? 'Sefer Başlatılıyor...' : 'Seferi Onayla ve Başlat'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* SEFER DETAYLARI MODALI */}
      {detailVisit && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Sefer Detayı (Sefer #${detailVisit.id})`}
        >
          {(() => {
            const ship = detailVisit.ship || ships.find((s) => s.id === detailVisit.shipId);
            const port = detailVisit.port || ports.find((p) => p.id === detailVisit.portId);
            const originPort = detailVisit.originPort || (detailVisit.originPortId ? ports.find((p) => p.id === detailVisit.originPortId) : null);
            const totalCargoWeight = detailCargoes.reduce((acc, c) => acc + (c.weightTons || 0), 0);

            return (
              <div className="space-y-4 text-xs">
                {/* Sefer & Durum Başlık Kartı */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShipIcon className="w-5 h-5 text-ocean-400" />
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

                  {/* Rota ve Tarihler */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Sefer Rotası:</span>
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <span>{originPort?.name || 'Açık Deniz'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
                        <span className="text-ocean-300">{port?.name || `Liman #${detailVisit.portId}`}</span>
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
                      <strong className="text-ocean-300 font-semibold">
                        {new Date(detailVisit.arrivalDate).toLocaleString('tr-TR')}
                      </strong>
                    </div>
                  </div>

                  {/* Operasyon Amacı */}
                  <div className="border-t border-slate-800 pt-2.5 text-slate-300">
                    <span className="text-slate-400 block text-[11px]">Sefer Amacı & Operasyon Tipi:</span>
                    <strong className="text-white font-medium block mt-0.5">
                      {detailVisit.purpose || 'Standart Ticari ve Konteyner Operasyonu'}
                    </strong>
                  </div>
                </div>

                {/* Gemi Künyesi & Teknik Detay */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Taşıma Kapasitesi</span>
                    <strong className="font-semibold text-slate-900">
                      {ship?.deadweightTonnage ? `${ship.deadweightTonnage.toLocaleString()} DWT` : '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">İnşa Yılı</span>
                    <strong className="font-semibold text-slate-900">{ship?.builtYear || '2020'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Toplam Yük Tonajı</span>
                    <strong className="font-semibold text-ocean-700">
                      {totalCargoWeight > 0 ? `${totalCargoWeight.toLocaleString()} Ton` : 'Yüksüz'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Görevli Personel</span>
                    <strong className="font-semibold text-slate-900">{detailCrew.length} Kişi</strong>
                  </div>
                </div>

                {/* Kargo & Manifesto Bölümü */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-amber-500" />
                      Sefer Kargo Manifestosu ({detailCargoes.length} Kalem)
                    </span>
                    {totalCargoWeight > 0 && (
                      <span className="text-[11px] text-slate-500 font-normal">
                        Toplam: <strong>{totalCargoWeight.toLocaleString()} Ton</strong>
                      </span>
                    )}
                  </div>

                  {loadingDetail ? (
                    <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400">Veriler yükleniyor...</div>
                  ) : detailCargoes.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                      Bu sefere ait kayıtlı kargo yükü bulunmuyor.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {detailCargoes.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 block">{c.description}</span>
                            <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 mt-0.5">
                              <span>Tip: <strong>{c.type}</strong></span>
                              {c.containerCount && <span>Konteyner: <strong>{c.containerCount} TEU</strong></span>}
                              {c.billOfLadingNumber && <span>B/L No: <strong className="font-mono">{c.billOfLadingNumber}</strong></span>}
                              {c.sealNumber && <span>Mühür: <strong className="font-mono">{c.sealNumber}</strong></span>}
                            </div>
                          </div>
                          <span className="font-bold text-ocean-700 shrink-0 ml-2">
                            {c.weightTons.toLocaleString()} Ton
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Görevli Mürettebat Bölümü */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-ocean-600" />
                      Seferde Görevli Personel ({detailCrew.length} Kişi)
                    </span>
                  </div>

                  {loadingDetail ? (
                    <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400">Personel listesi yükleniyor...</div>
                  ) : detailCrew.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                      Bu gemiye atanmış personel bulunmuyor.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {detailCrew.map((a) => {
                        const cm = a.crewMember;
                        const name = cm?.fullName || (cm?.firstName ? `${cm.firstName} ${cm.lastName}` : `Personel #${a.crewMemberId}`);
                        const role = a.roleOnShip || cm?.role || 'Mürettebat';

                        return (
                          <div
                            key={a.id}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2.5"
                          >
                            <div className="w-7 h-7 rounded-full bg-ocean-100 text-ocean-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {name[0] || 'P'}
                            </div>
                            <div className="truncate flex-1 min-w-0">
                              <span className="font-bold text-slate-900 block truncate">{name}</span>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate">
                                <span className="font-medium text-ocean-700">{role}</span>
                                {cm?.nationality && <span>• {cm.nationality}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Modal Alt Aksiyonları */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenEditModal(detailVisit);
                      }}
                      className="px-3.5 py-1.5 bg-ocean-50 text-ocean-700 hover:bg-ocean-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Sefer Bilgilerini Düzenle
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="ml-auto px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
