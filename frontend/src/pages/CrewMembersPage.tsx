import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Mail, Phone, ShieldCheck, AlertCircle, Search, Download } from 'lucide-react';
import { crewMemberService } from '../services/api';
import type { CrewMember } from '../types';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCsv } from '../utils/exportUtils';

const CREW_ROLES = [
  'Kaptan (Master)',
  'Çarkçıbaşı (Chief Engineer)',
  '1. Zabit (Chief Officer)',
  '2. Zabit (Second Officer)',
  '2. Çarkçı (Second Engineer)',
  'Lostromo (Boatswain)',
  'Usta Gemici (Able Seaman)',
  'Yağcı (Oiler)',
  'Aşçı (Cook)',
];

export const CrewMembersPage: React.FC = () => {
  const { canManageSystem, canDelete, role } = useAuth();
  const [crew, setCrew] = useState<CrewMember[]>([]);
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
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'Kaptan (Master)',
    email: '',
    phone: '',
    nationality: 'T.C.',
  });

  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCrew = async () => {
    try {
      setLoading(true);
      const res = await crewMemberService.getPaged({
        pageNumber,
        pageSize,
        searchTerm: debouncedSearch,
      });
      setCrew(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setHasPreviousPage(res.hasPreviousPage);
      setHasNextPage(res.hasNextPage);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Mürettebat yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrew();
  }, [pageNumber, pageSize, debouncedSearch]);

  const handleOpenAddModal = () => {
    setEditingCrew(null);
    setFormData({
      firstName: '',
      lastName: '',
      role: 'Kaptan (Master)',
      email: '',
      phone: '',
      nationality: 'T.C.',
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: CrewMember) => {
    setEditingCrew(member);
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      role: member.role,
      email: member.email,
      phone: member.phone,
      nationality: member.nationality,
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    // Ad ve Soyad Validasyonu
    if (!formData.firstName.trim()) {
      setAlert({ type: 'error', message: 'Personel adı (First Name) alanı zorunludur!' });
      setSubmitting(false);
      return;
    }
    if (!formData.lastName.trim()) {
      setAlert({ type: 'error', message: 'Personel soyadı (Last Name) alanı zorunludur!' });
      setSubmitting(false);
      return;
    }

    // E-posta Validasyonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setAlert({
        type: 'error',
        message: 'İş Kuralı İhlali: Lütfen geçerli bir e-posta formatı giriniz (örn: ornek@deniz.com)!',
      });
      setSubmitting(false);
      return;
    }

    // Telefon Numarası Validasyonu
    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      setAlert({
        type: 'error',
        message: 'İş Kuralı İhlali: Lütfen geçerli bir telefon numarası giriniz!',
      });
      setSubmitting(false);
      return;
    }

    try {
      if (editingCrew) {
        await crewMemberService.update(editingCrew.id, formData);
        setAlert({ type: 'success', message: 'Personel bilgisi güncellendi.' });
      } else {
        await crewMemberService.create(formData);
        setAlert({ type: 'success', message: 'Yeni personel başarıyla kaydedildi.' });
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchCrew();
      }, 500);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Kayıt başarısız!' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const all = await crewMemberService.getAll();
      const headers = ['ID', 'Adı', 'Soyadı', 'Görevi / Unvanı', 'E-Posta', 'Telefon', 'Uyruk'];
      const rows = all.map((c) => [c.id, c.firstName, c.lastName, c.role, c.email, c.phone, c.nationality]);
      exportToCsv('murettebat_listesi', headers, rows);
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Dışa aktarma başarısız: ' + (err.message || 'Hata') });
    }
  };

  const handleDelete = async (member: CrewMember) => {
    const memberName = member.fullName || `${member.firstName} ${member.lastName}`.trim();
    if (confirm(`"${memberName}" personelini silmek istediğinize emin misiniz?`)) {
      try {
        await crewMemberService.delete(member.id);
        setAlert({ type: 'success', message: 'Personel silindi.' });
        fetchCrew();
      } catch (err: any) {
        setAlert({ type: 'error', message: err.message || 'Silinemedi.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mürettebat Yönetimi</h2>
          <p className="text-xs text-slate-500">
            Kayıtlı denizciler, kaptanlar, çarkçılar ve iletişim bilgileri.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={loading || crew.length === 0}
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
              <Plus className="w-4 h-4" /> Yeni Personel Kaydet
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
              Salt Okunur Mod ({role})
            </div>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />
        <div>
          <span className="font-bold">İş Kuralları:</span> Personel kayıtlarında e-posta ve telefon format kontrolleri zorunludur. Geçersiz formatlı kayıtlar reddedilir.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Personel adı, unvan, e-posta veya uyruk ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNumber(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Adı Soyadı</th>
                <th className="px-6 py-3.5">Görevi / Rütbesi</th>
                <th className="px-6 py-3.5">E-Posta Adresi</th>
                <th className="px-6 py-3.5">Telefon Numarası</th>
                <th className="px-6 py-3.5">Uyruk</th>
                <th className="px-6 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Mürettebat listesi yükleniyor...
                  </td>
                </tr>
              ) : crew.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Kriterlere uygun mürettebat üyesi bulunamadı.
                  </td>
                </tr>
              ) : (
                crew.map((member) => {
                  const displayName = member.fullName || `${member.firstName} ${member.lastName}`.trim();
                  const initials = member.firstName && member.lastName
                    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
                    : displayName.slice(0, 2).toUpperCase();
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div>{displayName}</div>
                            <div className="text-xs font-normal text-slate-400">Sicil: #{member.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-xs">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {member.nationality}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManageSystem && (
                            <button
                              onClick={() => handleOpenEditModal(member)}
                              className="p-1.5 text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition-colors cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(member)}
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
        title={editingCrew ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Ad (First Name) *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Örn: Ahmet"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Soyad (Last Name) *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Örn: Yılmaz"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Görevi / Rütbesi *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              >
                {CREW_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Uyruk *
              </label>
              <input
                type="text"
                required
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="Örn: T.C."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                E-Posta Adresi * <span className="text-slate-400 font-normal">(Format Kontrollü)</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Örn: ahmet@liman.gov.tr"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Telefon Numarası * <span className="text-slate-400 font-normal">(Format Kontrollü)</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Örn: +90 532 111 2233"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-ocean-500 focus:outline-none"
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
              {submitting ? 'Kaydediliyor...' : editingCrew ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
