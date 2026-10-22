import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Ship as ShipIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
} from 'lucide-react';
import { shipService, validateImoNumber, generateRandomValidImo } from '../services/api';
import type { Ship } from '../types';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCsv } from '../utils/exportUtils';

export interface ShipTypeConfig {
  name: string;
  category: string;
  typicalDwt: string;
  minDwt: number;
  maxDwt: number;
}

export const SHIP_TYPES: ShipTypeConfig[] = [
  { name: 'Konteyner', category: 'Konteyner Taşımacılığı', typicalDwt: '5.000 - 220.000', minDwt: 500, maxDwt: 250000 },
  { name: 'Kuru Yük', category: 'Dökme & Kuru Yük', typicalDwt: '3.000 - 400.000', minDwt: 500, maxDwt: 450000 },
  { name: 'Tanker', category: 'Ham Petrol & Ürün Tankeri', typicalDwt: '3.000 - 320.000', minDwt: 500, maxDwt: 350000 },
  { name: 'LNG / LPG Gaz Tankeri', category: 'Sıvılaştırılmış Gaz Tankeri', typicalDwt: '5.000 - 150.000', minDwt: 500, maxDwt: 160000 },
  { name: 'Ro-Ro', category: 'Araç & Vagon Taşıyıcı', typicalDwt: '2.000 - 50.000', minDwt: 500, maxDwt: 60000 },
  { name: 'Genel Kargo', category: 'Çok Amaçlı Kargo', typicalDwt: '1.000 - 35.000', minDwt: 200, maxDwt: 50000 },
  { name: 'Yolcu Gemisi', category: 'Kruvaziyer & Yolcu', typicalDwt: '500 - 25.000', minDwt: 50, maxDwt: 35000 },
  { name: 'Römorkör', category: 'Liman Hizmet & Çekici', typicalDwt: '50 - 2.500', minDwt: 10, maxDwt: 4000 },
  { name: 'Buzkıran & Destek', category: 'Özel Hizmet & Açık Deniz', typicalDwt: '100 - 15.000', minDwt: 50, maxDwt: 20000 },
  { name: 'Balıkçı Gemisi', category: 'Ticari Balıkçılık', typicalDwt: '50 - 4.000', minDwt: 10, maxDwt: 6000 },
];

export const ShipsPage: React.FC = () => {
  const { canManageSystem, canDelete, role } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 350);
  const [selectedType, setSelectedType] = useState('ALL');

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShip, setEditingShip] = useState<Ship | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    imoNumber: '',
    flag: 'Türkiye',
    type: 'Konteyner',
    builtYear: new Date().getFullYear(),
    deadweightTonnage: 25000,
  });

  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchShips = async () => {
    try {
      setLoading(true);
      const res = await shipService.getPaged({
        pageNumber,
        pageSize,
        searchTerm: debouncedSearch,
        type: selectedType === 'ALL' ? undefined : selectedType,
      });
      setShips(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setHasPreviousPage(res.hasPreviousPage);
      setHasNextPage(res.hasNextPage);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Gemiler yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShips();
  }, [pageNumber, pageSize, debouncedSearch, selectedType]);

  const handleOpenAddModal = () => {
    setEditingShip(null);
    setFormData({
      name: '',
      imoNumber: '',
      flag: 'Türkiye',
      type: 'Konteyner',
      builtYear: new Date().getFullYear(),
      deadweightTonnage: 25000,
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ship: Ship) => {
    setEditingShip(ship);
    setFormData({
      name: ship.name,
      imoNumber: ship.imoNumber,
      flag: ship.flag,
      type: ship.type,
      builtYear: ship.builtYear,
      deadweightTonnage: ship.deadweightTonnage,
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  const currentTypeConfig = SHIP_TYPES.find((t) => t.name === formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    // Zorunlu alan kontrolü
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setAlert({ type: 'error', message: 'Gemi Adı en az 2 karakter olmalıdır!' });
      setSubmitting(false);
      return;
    }

    if (!formData.flag.trim()) {
      setAlert({ type: 'error', message: 'Gemi Bayrağı / Tescil Ülkesi zorunludur!' });
      setSubmitting(false);
      return;
    }

    if (formData.deadweightTonnage <= 0) {
      setAlert({ type: 'error', message: 'Gemi taşıma kapasitesi (DWT) 0\'dan büyük olmalıdır!' });
      setSubmitting(false);
      return;
    }

    if (formData.deadweightTonnage > 600000) {
      setAlert({ type: 'error', message: 'Gemi taşıma kapasitesi (DWT) gerçekçi sınırlar içinde olmalıdır (Maksimum 600.000 DWT)!' });
      setSubmitting(false);
      return;
    }

    const maxYear = new Date().getFullYear() + 3;
    if (formData.builtYear < 1900 || formData.builtYear > maxYear) {
      setAlert({ type: 'error', message: `Gemi yapım yılı 1900 ile ${maxYear} arasında geçerli bir yıl olmalıdır!` });
      setSubmitting(false);
      return;
    }

    // Uluslararası IMO Kontrol Basamağı Doğrulaması
    const imoValidation = validateImoNumber(formData.imoNumber);
    if (!imoValidation.isValid) {
      setAlert({ type: 'error', message: `İş Kuralı İhlali: ${imoValidation.message}` });
      setSubmitting(false);
      return;
    }

    try {
      if (editingShip) {
        await shipService.update(editingShip.id, formData);
        setAlert({ type: 'success', message: 'Gemi başarıyla güncellendi.' });
      } else {
        await shipService.create(formData);
        setAlert({ type: 'success', message: 'Yeni gemi başarıyla eklendi.' });
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchShips();
      }, 500);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'İşlem sırasında hata oluştu!' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ship: Ship) => {
    if (confirm(`"${ship.name}" isimli gemiyi silmek istediğinize emin misiniz?`)) {
      try {
        await shipService.delete(ship.id);
        setAlert({ type: 'success', message: 'Gemi silindi.' });
        fetchShips();
      } catch (err: any) {
        setAlert({ type: 'error', message: err.message || 'Silme işlemi başarısız.' });
      }
    }
  };

  const handleExportCsv = async () => {
    try {
      const all = await shipService.getAll();
      const headers = ['ID', 'Gemi Adı', 'IMO Numarası', 'Bayrak', 'Gemi Tipi', 'İnşa Yılı', 'DWT Kapasitesi (Ton)'];
      const rows = all.map((s) => [s.id, s.name, s.imoNumber, s.flag, s.type, s.builtYear, s.deadweightTonnage]);
      exportToCsv('gemi_filosu_listesi', headers, rows);
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Dışa aktarma başarısız: ' + err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gemi Sicil Yönetimi</h2>
          <p className="text-xs text-slate-500">
            Kayıtlı ticari ve hizmet filosunu görüntüleyin, yeni gemi kaydı oluşturun ve detayları yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-xs transition-all cursor-pointer"
            title="Tüm Gemi Listesini Excel / CSV Olarak İndir"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Dışa Aktar</span>
          </button>
          {canManageSystem ? (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yeni Gemi Ekle
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
              Salt Okunur Mod ({role})
            </div>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Gemi adı, IMO no veya bayrak ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNumber(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Gemi Tipi:</span>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPageNumber(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          >
            <option value="ALL">Tüm Gemi Çeşitleri</option>
            {SHIP_TYPES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ships Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Gemi Bilgisi</th>
                <th className="px-6 py-3.5">IMO Numarası</th>
                <th className="px-6 py-3.5">Gemi Çeşidi / Tipi</th>
                <th className="px-6 py-3.5">Bayrak (Ülke)</th>
                <th className="px-6 py-3.5">Yapım Yılı</th>
                <th className="px-6 py-3.5">Taşıma Kapasitesi (DWT)</th>
                <th className="px-6 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Gemiler yükleniyor...
                  </td>
                </tr>
              ) : ships.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Arama kriterine uygun gemi bulunamadı.
                  </td>
                </tr>
              ) : (
                ships.map((ship) => (
                  <tr key={ship.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-ocean-50 text-ocean-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <ShipIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div>{ship.name}</div>
                          <div className="text-xs font-normal text-slate-400">Kayıt: #{ship.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded">
                        IMO {ship.imoNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ocean-50 text-ocean-700">
                        {ship.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {ship.flag}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                      {ship.builtYear}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {ship.deadweightTonnage?.toLocaleString('tr-TR')} DWT
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManageSystem && (
                          <button
                            onClick={() => handleOpenEditModal(ship)}
                            className="p-1.5 text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition-colors cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(ship)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {!canManageSystem && !canDelete && (
                          <span className="text-[11px] text-slate-400 font-medium">Salt Okunur</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShip ? 'Gemi Bilgilerini Düzenle' : 'Yeni Gemi Sicil Kaydı'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Gemi Adı *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: Arkas Ege, Turkuaz-1, Bosphorus Star"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  IMO Numarası *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateRandomValidImo();
                    setFormData({ ...formData, imoNumber: generated });
                  }}
                  className="text-[11px] text-ocean-600 hover:text-ocean-800 hover:underline font-medium cursor-pointer"
                  title="Form doldurmayı hızlandırmak için geçerli 7 haneli test IMO numarası üretir"
                >
                  Örnek IMO
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.imoNumber}
                onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
                placeholder="Örn: 9176187"
                className={`w-full px-3.5 py-2 border rounded-lg text-sm font-mono focus:outline-none transition-colors ${
                  formData.imoNumber.trim().length === 0
                    ? 'border-slate-200 focus:ring-2 focus:ring-ocean-500'
                    : validateImoNumber(formData.imoNumber).isValid
                    ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500 text-emerald-900 font-bold'
                    : 'border-amber-400 bg-amber-50/20 focus:ring-2 focus:ring-amber-500 text-amber-900'
                }`}
              />
              {formData.imoNumber.trim().length > 0 && (
                <div className="mt-1.5 flex items-start gap-1 text-[11px] leading-tight">
                  {validateImoNumber(formData.imoNumber).isValid ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Geçerli IMO formatı
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {validateImoNumber(formData.imoNumber).message}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Bayrak (Tescil Ülkesi) *
              </label>
              <input
                type="text"
                required
                value={formData.flag}
                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                placeholder="Örn: Türkiye, Panama, Liberya..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Gemi Çeşidi / Tipi *
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const cfg = SHIP_TYPES.find((t) => t.name === newType);
                  // Seçilen tipe göre mantıklı bir başlangıç DWT değeri öner
                  setFormData({
                    ...formData,
                    type: newType,
                    deadweightTonnage: cfg ? Math.round((cfg.minDwt + cfg.maxDwt) / 4) : formData.deadweightTonnage,
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none font-medium"
              >
                {SHIP_TYPES.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Yapım Yılı *
              </label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 3}
                required
                value={formData.builtYear}
                onChange={(e) => setFormData({ ...formData, builtYear: parseInt(e.target.value) || 2020 })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Taşıma Kapasitesi (DWT) *
              </label>
              <input
                type="number"
                min="1"
                max="600000"
                step="any"
                required
                value={formData.deadweightTonnage}
                onChange={(e) => setFormData({ ...formData, deadweightTonnage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tipik Aralık Rehberi */}
          {currentTypeConfig && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Info className="w-3.5 h-3.5 text-ocean-600" />
                <span>{currentTypeConfig.name} Referans Parametreleri:</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Kategori: <span className="font-medium text-slate-700">{currentTypeConfig.category}</span> | 
                Tipik DWT: <span className="font-semibold text-ocean-700">{currentTypeConfig.typicalDwt} Ton</span>
              </p>
              {formData.deadweightTonnage > 0 &&
                (formData.deadweightTonnage < currentTypeConfig.minDwt ||
                  formData.deadweightTonnage > currentTypeConfig.maxDwt) && (
                  <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 pt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Belirtilen DWT ({formData.deadweightTonnage.toLocaleString('tr-TR')} Ton), seçilen gemi tipi için olağan aralığın dışındadır.
                  </p>
                )}
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
              disabled={submitting}
              className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Kaydediliyor...' : editingShip ? 'Güncelle' : 'Gemi Sicilini Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
