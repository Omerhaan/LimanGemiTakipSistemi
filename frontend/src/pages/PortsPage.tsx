import React, { useState, useEffect, useMemo } from 'react';
import { Anchor, Plus, Search, Edit2, Trash2, Download, Globe, MapPin, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { portService } from '../services/api';
import type { Port } from '../types';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCsv } from '../utils/exportUtils';
import { GLOBAL_PORTS_CATALOG, PORT_COORDS } from '../data/portCoords';

export const PortsPage: React.FC = () => {
  const { canManageSystem, canDelete, role } = useAuth();
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  // Pagination State
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);

  const [selectedCatalogCode, setSelectedCatalogCode] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isCatalogDropdownOpen, setIsCatalogDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country: 'Türkiye',
    city: '',
    capacity: 50,
  });

  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return GLOBAL_PORTS_CATALOG;
    const term = catalogSearch.toLowerCase().trim();
    return GLOBAL_PORTS_CATALOG.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.country.toLowerCase().includes(term) ||
        (p.city && p.city.toLowerCase().includes(term))
    );
  }, [catalogSearch]);

  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPorts = async () => {
    try {
      setLoading(true);
      const res = await portService.getPaged({
        pageNumber,
        pageSize,
        searchTerm: debouncedSearch,
      });
      setPorts(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setHasPreviousPage(res.hasPreviousPage);
      setHasNextPage(res.hasNextPage);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Limanlar yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPorts();
  }, [pageNumber, pageSize, debouncedSearch]);

  const handleOpenAddModal = () => {
    setEditingPort(null);
    setSelectedCatalogCode('');
    setSelectedCoords(null);
    setCatalogSearch('');
    setIsCatalogDropdownOpen(false);
    setFormData({
      name: '',
      code: '',
      country: 'Türkiye',
      city: '',
      capacity: 50,
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (port: Port) => {
    setEditingPort(port);
    setSelectedCatalogCode(port.code);
    setSelectedCoords(PORT_COORDS[port.code] || null);
    setCatalogSearch('');
    setIsCatalogDropdownOpen(false);
    setFormData({
      name: port.name,
      code: port.code,
      country: port.country,
      city: port.city || '',
      capacity: port.capacity,
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  const handleCatalogSelect = (code: string) => {
    setSelectedCatalogCode(code);
    if (!code) {
      setSelectedCoords(null);
      return;
    }
    const found = GLOBAL_PORTS_CATALOG.find((p) => p.code === code);
    if (found) {
      setFormData({
        name: found.name,
        code: found.code,
        country: found.country,
        city: found.city,
        capacity: found.capacity,
      });
      setSelectedCoords({ lat: found.lat, lng: found.lng });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    if (!formData.name.trim() || !formData.code.trim()) {
      setAlert({ type: 'error', message: 'Liman Adı ve Liman Kodu zorunludur!' });
      setSubmitting(false);
      return;
    }

    try {
      if (editingPort) {
        await portService.update(editingPort.id, formData);
        setAlert({ type: 'success', message: 'Liman güncellendi.' });
      } else {
        await portService.create(formData);
        setAlert({ type: 'success', message: 'Yeni liman eklendi.' });
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchPorts();
      }, 500);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'İşlem başarısız.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const all = await portService.getAll();
      const headers = ['ID', 'Liman Adı', 'Liman Kodu (UN/LOCODE)', 'Ülke', 'Eşzamanlı Kapasite'];
      const rows = all.map((p) => [p.id, p.name, p.code, p.country, p.capacity]);
      exportToCsv('limanlar_listesi', headers, rows);
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Dışa aktarma başarısız: ' + (err.message || 'Hata') });
    }
  };

  const handleDelete = async (port: Port) => {
    if (confirm(`"${port.name}" limanını silmek istediğinize emin misiniz?`)) {
      try {
        await portService.delete(port.id);
        setAlert({ type: 'success', message: 'Liman silindi.' });
        fetchPorts();
      } catch (err: any) {
        setAlert({ type: 'error', message: err.message || 'Silme işlemi başarısız.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Liman Yönetimi</h2>
          <p className="text-xs text-slate-500">Kayıtlı limanlar, ülke ve rıhtım kapasiteleri.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={loading || ports.length === 0}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="CSV İndir"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">CSV İndir</span>
          </button>
          {canManageSystem ? (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yeni Liman Ekle
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
              Salt Okunur Mod ({role})
            </div>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Liman adı, kodu veya ülke ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNumber(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Liman Adı</th>
                <th className="px-6 py-3.5">Liman Kodu (UN/LOCODE)</th>
                <th className="px-6 py-3.5">Ülke</th>
                <th className="px-6 py-3.5">Eşzamanlı Gemi Kapasitesi</th>
                <th className="px-6 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Limanlar yükleniyor...
                  </td>
                </tr>
              ) : ports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Liman bulunamadı.
                  </td>
                </tr>
              ) : (
                ports.map((port) => (
                  <tr key={port.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Anchor className="w-5 h-5" />
                        </div>
                        <div>
                          <div>{port.name}</div>
                          <div className="text-xs font-normal text-slate-400">ID: #{port.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-700">
                      {port.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {port.country}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {port.capacity} Gemi
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/map"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Haritada Gör"
                        >
                          <MapPin className="w-4 h-4" />
                        </Link>
                        {canManageSystem && (
                          <button
                            onClick={() => handleOpenEditModal(port)}
                            className="p-1.5 text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition-colors cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(port)}
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
        title={editingPort ? 'Liman Düzenle' : 'Yeni Liman Ekle'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingPort && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
                  <Globe className="w-4 h-4 text-ocean-600" />
                  Katalogdan Liman Seçimi (UN/LOCODE Veritabanı)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">112 Uluslararası Liman</span>
              </div>

              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Liman adı, UN/LOCODE veya ülke ara... (Örn: Rotterdam, TRMER, Hamburg)"
                    value={catalogSearch}
                    onFocus={() => setIsCatalogDropdownOpen(true)}
                    onChange={(e) => {
                      setCatalogSearch(e.target.value);
                      setIsCatalogDropdownOpen(true);
                    }}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  />
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogSearch('');
                        setSelectedCatalogCode('');
                        setSelectedCoords(null);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isCatalogDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsCatalogDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto z-20 divide-y divide-slate-100">
                      {filteredCatalog.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center">
                          "{catalogSearch}" ile eşleşen liman bulunamadı. Aşağıdaki formdan manuel giriş yapabilirsiniz.
                        </div>
                      ) : (
                        filteredCatalog.slice(0, 30).map((port) => (
                          <button
                            key={port.code}
                            type="button"
                            onClick={() => {
                              handleCatalogSelect(port.code);
                              setCatalogSearch(`${port.name} (${port.code}) - ${port.country}`);
                              setIsCatalogDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 hover:bg-ocean-50/70 transition-colors flex items-center justify-between group ${
                              selectedCatalogCode === port.code ? 'bg-ocean-50' : ''
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-semibold text-slate-800 group-hover:text-ocean-700 truncate">
                                {port.name} <span className="font-mono text-ocean-600 font-bold">[{port.code}]</span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {port.country}{port.city ? ` • ${port.city}` : ''} • Kapasite: {port.capacity}
                              </div>
                            </div>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-ocean-100 group-hover:text-ocean-700 shrink-0">
                              {port.region}
                            </span>
                          </button>
                        ))
                      )}
                      {filteredCatalog.length > 30 && (
                        <div className="p-2 text-[11px] text-center text-slate-400 bg-slate-50">
                          +{filteredCatalog.length - 30} liman daha var. Aramanızı daraltın.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {selectedCoords && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 font-medium">
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>Katalog verileri aktarıldı. Koordinatlar: [{selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}]</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Liman Adı *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: Mersin Uluslararası Limanı"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Liman Kodu (UN/LOCODE) *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Örn: TRMER"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-ocean-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Ülke *
              </label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Örn: Türkiye"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Şehir
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Örn: Mersin"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Kapasite (Eşzamanlı Yanaşabilen Gemi Sayısı)
              </label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
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
              disabled={submitting}
              className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Kaydediliyor...' : editingPort ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
