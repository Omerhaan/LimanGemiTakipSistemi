import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Ship as ShipIcon,
  AlertCircle,
  ShieldAlert,
  Search,
  Download,
} from 'lucide-react';
import { cargoService, shipService } from '../services/api';
import type { Cargo, Ship, CargoType } from '../types';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCsv } from '../utils/exportUtils';

const CARGO_TYPES: { label: string; value: CargoType }[] = [
  { label: 'Konteyner (Container)', value: 'Container' },
  { label: 'Kuru Yük / Dökme (Bulk)', value: 'Bulk' },
  { label: 'Sıvı / Akaryakıt (Liquid)', value: 'Liquid' },
  { label: 'Genel Kargo (General)', value: 'General' },
  { label: 'Araç / Ro-Ro (Vehicles)', value: 'Vehicles' },
];

export const CargoesPage: React.FC = () => {
  const { canEdit, canDelete, role } = useAuth();
  const [cargoes, setCargoes] = useState<Cargo[]>([]);
  const [allCargoes, setAllCargoes] = useState<Cargo[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [selectedType, setSelectedType] = useState('ALL');

  // Pagination State
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);

  const [formData, setFormData] = useState({
    shipId: 0,
    description: '',
    weightTons: 1000,
    type: 'Container' as CargoType,
    containerCount: 50,
  });

  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadLookupData = async () => {
    try {
      const [allC, s] = await Promise.all([
        cargoService.getAll(),
        shipService.getAll(),
      ]);
      setAllCargoes(allC);
      setShips(s);
    } catch (err: any) {
      console.error('Lookup verileri yüklenirken hata:', err);
    }
  };

  const fetchPagedCargoes = async () => {
    try {
      setLoading(true);
      const pagedC = await cargoService.getPaged({
        pageNumber,
        pageSize,
        searchTerm: debouncedSearch,
        type: selectedType === 'ALL' ? undefined : selectedType,
      });
      setCargoes(pagedC.items);
      setTotalCount(pagedC.totalCount);
      setTotalPages(pagedC.totalPages);
      setHasPreviousPage(pagedC.hasPreviousPage);
      setHasNextPage(pagedC.hasNextPage);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Yük kayıtları yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookupData();
  }, []);

  useEffect(() => {
    fetchPagedCargoes();
  }, [pageNumber, pageSize, debouncedSearch, selectedType]);

  // Seçilen geminin mevcut yükü ve kalan DWT kapasitesi
  const selectedShip = ships.find((s) => s.id === Number(formData.shipId));
  const currentShipLoadedWeight = allCargoes
    .filter((c) => c.shipId === Number(formData.shipId) && (!editingCargo || c.id !== editingCargo.id))
    .reduce((sum, c) => sum + (c.weightTons || 0), 0);

  const remainingDwt = selectedShip ? Math.max(0, selectedShip.deadweightTonnage - currentShipLoadedWeight) : 0;
  const isOverCapacity = selectedShip ? (currentShipLoadedWeight + (formData.weightTons || 0) > selectedShip.deadweightTonnage) : false;

  const handleOpenAddModal = () => {
    setEditingCargo(null);
    const initialShipId = ships.length > 0 ? ships[0].id : 0;

    setFormData({
      shipId: initialShipId,
      description: '',
      weightTons: 1000,
      type: 'Container',
      containerCount: 50,
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setFormData({
      shipId: cargo.shipId,
      description: cargo.description,
      weightTons: cargo.weightTons,
      type: cargo.type,
      containerCount: cargo.containerCount || 0,
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    if (formData.weightTons <= 0) {
      setAlert({
        type: 'error',
        message: "İş Kuralı İhlali: Yük ağırlığı 0'dan büyük olmalıdır!",
      });
      setSubmitting(false);
      return;
    }

    if (!formData.description.trim()) {
      setAlert({ type: 'error', message: 'Yük açıklaması giriniz!' });
      setSubmitting(false);
      return;
    }

    if (selectedShip && isOverCapacity) {
      setAlert({
        type: 'error',
        message: `Güvenlik Kuralı İhlali: '${selectedShip.name}' gemisinin azami DWT kapasitesi (${selectedShip.deadweightTonnage.toLocaleString()} Ton) aşılamaz! Kalan boş kapasite: ${remainingDwt.toLocaleString()} Ton.`,
      });
      setSubmitting(false);
      return;
    }

    try {
      if (editingCargo) {
        await cargoService.update(editingCargo.id, formData);
        setAlert({ type: 'success', message: 'Yük kaydı güncellendi.' });
      } else {
        await cargoService.create(formData);
        setAlert({ type: 'success', message: 'Yeni yük kaydı başarıyla eklendi.' });
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchPagedCargoes();
        loadLookupData();
      }, 500);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'İşlem başarısız!' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cargo: Cargo) => {
    if (confirm('Bu yük kaydını silmek istediğinize emin misiniz?')) {
      try {
        await cargoService.delete(cargo.id);
        setAlert({ type: 'success', message: 'Yük silindi.' });
        fetchPagedCargoes();
        loadLookupData();
      } catch (err: any) {
        setAlert({ type: 'error', message: err.message || 'Silinemedi.' });
      }
    }
  };

  const handleExportCsv = async () => {
    try {
      const all = await cargoService.getAll();
      const headers = [
        'ID',
        'Gemi',
        'Yük Açıklaması',
        'Kargo Türü',
        'Ağırlık (Ton)',
        'Konteyner (TEU)',
      ];
      const rows = all.map((c) => {
        const s = ships.find((ship) => ship.id === c.shipId);
        return [
          c.id,
          s?.name || `Gemi #${c.shipId}`,
          c.description,
          c.type,
          c.weightTons,
          c.containerCount || '-',
        ];
      });
      exportToCsv('kargo_listesi', headers, rows);
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Dışa aktarma başarısız: ' + err.message });
    }
  };

  const totalWeight = allCargoes.reduce((acc, c) => acc + (c.weightTons || 0), 0);

  return (
    <div className="space-y-6">
      {/* Başlık ve Eylemler */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Kargo & Yük Takibi</h2>
          <p className="text-xs text-slate-500">
            Gemilere tahsisli yük kayıtları ve DWT kapasite kontrolü.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-xs transition-all cursor-pointer"
            title="Tüm Yük Listesini Excel / CSV Olarak İndir"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Dışa Aktar</span>
          </button>
          {canEdit ? (
            <button
              onClick={handleOpenAddModal}
              disabled={ships.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yeni Kargo Ekle
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
              Salt Okunur Mod ({role})
            </div>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Güvenlik Bilgi Kutusu */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Denizcilik Emniyet Standartı:</span> Yük ağırlığı geminin tescilli azami DWT (Deadweight Tonnage) sınırını aşamaz.
          </div>
        </div>
        <div className="text-right whitespace-nowrap">
          <span className="text-[10px] uppercase font-bold text-emerald-700">Toplam Yüklü Tonaj:</span>
          <div className="font-extrabold text-sm text-emerald-900">{totalWeight.toLocaleString('tr-TR')} Ton</div>
        </div>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Yük açıklaması veya gemi ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNumber(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Yük Tipi:</span>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPageNumber(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          >
            <option value="ALL">Tüm Kargo Türleri</option>
            {CARGO_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Taşıyan Gemi</th>
                <th className="px-5 py-3.5">Yük Açıklaması</th>
                <th className="px-5 py-3.5">Kargo Türü</th>
                <th className="px-5 py-3.5">Ağırlık</th>
                <th className="px-5 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Yükler yükleniyor...
                  </td>
                </tr>
              ) : cargoes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Kriterlere uygun yük kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                cargoes.map((cargo) => {
                  const ship = cargo.ship || ships.find((s) => s.id === cargo.shipId);

                  return (
                    <tr key={cargo.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <ShipIcon className="w-4 h-4 text-ocean-600 shrink-0" />
                          <span className="truncate max-w-[150px]">{ship?.name || `Gemi #${cargo.shipId}`}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block ml-6">
                          DWT: {ship?.deadweightTonnage?.toLocaleString('tr-TR')} Ton
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800 text-xs">
                        {cargo.description}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {cargo.type}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {cargo.weightTons.toLocaleString('tr-TR')} Ton
                        </div>
                        {cargo.containerCount ? (
                          <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                            {cargo.containerCount} TEU
                          </span>
                        ) : null}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEditModal(cargo)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(cargo)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
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

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              pageNumber={pageNumber}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              hasPreviousPage={hasPreviousPage}
              hasNextPage={hasNextPage}
              onPageChange={(page) => setPageNumber(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPageNumber(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCargo ? 'Kargo Kaydını Düzenle' : 'Yeni Kargo Kaydı'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Taşıyan Gemi *
            </label>
            <select
              value={formData.shipId}
              onChange={(e) => setFormData({ ...formData, shipId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
            >
              {ships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.type} - {s.deadweightTonnage?.toLocaleString()} DWT)
                </option>
              ))}
            </select>
          </div>

          {/* DWT Kapasite Göstergesi */}
          {selectedShip && (
            <div
              className={`p-3 rounded-lg border text-xs ${
                isOverCapacity ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-700">{selectedShip.name} DWT Doluluk Durumu:</span>
                <span className={`font-bold ${isOverCapacity ? 'text-red-700' : 'text-slate-800'}`}>
                  {(currentShipLoadedWeight + (formData.weightTons || 0)).toLocaleString()} /{' '}
                  {selectedShip.deadweightTonnage?.toLocaleString()} Ton
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${isOverCapacity ? 'bg-red-600' : 'bg-ocean-600'}`}
                  style={{
                    width: `${Math.min(
                      100,
                      ((currentShipLoadedWeight + (formData.weightTons || 0)) / (selectedShip.deadweightTonnage || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
              {isOverCapacity ? (
                <div className="text-red-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Kapasite Aşımı! Toplam yükleme geminin azami DWT kapasitesini{' '}
                  {(currentShipLoadedWeight + formData.weightTons - selectedShip.deadweightTonnage).toLocaleString()} Ton
                  aşıyor!
                </div>
              ) : (
                <div className="text-slate-500 text-[11px] flex justify-between">
                  <span>Mevcut Yük: {currentShipLoadedWeight.toLocaleString()} Ton</span>
                  <span>
                    Yeni Toplam: {(currentShipLoadedWeight + (formData.weightTons || 0)).toLocaleString()} Ton (
                    {Math.round(
                      ((currentShipLoadedWeight + (formData.weightTons || 0)) / (selectedShip.deadweightTonnage || 1)) *
                        100
                    )}
                    %)
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Yük Tanımı / Açıklaması *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Örn: Sanayi Makineleri ve Yedek Parçalar"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Kargo Tipi *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CargoType })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              >
                {CARGO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Ağırlık (Metrik Ton) *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                value={formData.weightTons}
                onChange={(e) => setFormData({ ...formData, weightTons: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>
          </div>

          {formData.type === 'Container' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Konteyner Sayısı (TEU)
              </label>
              <input
                type="number"
                min="1"
                value={formData.containerCount}
                onChange={(e) => setFormData({ ...formData, containerCount: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting || isOverCapacity}
              className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Kaydediliyor...' : editingCargo ? 'Kargoyu Güncelle' : 'Kargoyu Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
