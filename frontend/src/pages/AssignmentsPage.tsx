import { useState, useEffect } from 'react';
import { Plus, Trash2, Ship as ShipIcon, Users, AlertCircle, Calendar, CheckCircle, ShieldAlert, Search, X, Download } from 'lucide-react';
import { assignmentService, shipService, crewMemberService } from '../services/api';
import type { ShipCrewAssignment, Ship, CrewMember } from '../types';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { exportToCsv } from '../utils/exportUtils';

export const AssignmentsPage = () => {
  const { canManageOperations, canDelete, role } = useAuth();
  const [assignments, setAssignments] = useState<ShipCrewAssignment[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipFilter, setSelectedShipFilter] = useState<number | 'ALL'>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    shipId: 0,
    crewMemberId: 0,
    startDate: '',
    endDate: '',
    roleOnShip: 'Kaptan',
  });

  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [a, s, c] = await Promise.all([
        assignmentService.getAll(),
        shipService.getAll(),
        crewMemberService.getAll(),
      ]);
      setAssignments(a);
      setShips(s);
      setCrew(c);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Atamalar yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    const today = new Date().toISOString().slice(0, 10);
    const initialCrew = crew.length > 0 ? crew[0] : null;
    setFormData({
      shipId: ships.length > 0 ? ships[0].id : 0,
      crewMemberId: initialCrew ? initialCrew.id : 0,
      startDate: today,
      endDate: '',
      roleOnShip: initialCrew ? initialCrew.role : 'Kaptan',
    });
    setAlert(null);
    setIsModalOpen(true);
  };

  // Seçilen personelin şu anki aktif görevini bul
  const selectedCrewActiveDuty = assignments.find(
    (a) =>
      a.crewMemberId === Number(formData.crewMemberId) &&
      (!a.endDate || new Date(a.endDate) >= new Date())
  );
  const activeShipName = selectedCrewActiveDuty
    ? ships.find((s) => s.id === selectedCrewActiveDuty.shipId)?.name || `Gemi #${selectedCrewActiveDuty.shipId}`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    const newStart = new Date(formData.startDate).getTime();
    const newEnd = formData.endDate ? new Date(formData.endDate).getTime() : Infinity;

    if (newEnd < newStart) {
      setAlert({ type: 'error', message: 'Görev bitiş tarihi, başlangıç tarihinden önce olamaz.' });
      setSubmitting(false);
      return;
    }

    // Kural 1 & 2: Bir çalışan aynı anda sadece 1 gemiye atanabilir! Tarih çakışması olamaz!
    const conflict = assignments.find((a) => {
      if (a.crewMemberId !== Number(formData.crewMemberId)) return false;
      const exStart = new Date(a.startDate).getTime();
      const exEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      return newEnd >= exStart && exEnd >= newStart;
    });

    if (conflict) {
      const conflictShip = ships.find((s) => s.id === conflict.shipId)?.name || `Gemi #${conflict.shipId}`;
      const conflictStartStr = new Date(conflict.startDate).toLocaleDateString('tr-TR');
      const conflictEndStr = conflict.endDate ? new Date(conflict.endDate).toLocaleDateString('tr-TR') : 'Devam Ediyor';
      const crewName = crew.find((c) => c.id === Number(formData.crewMemberId))?.fullName || 'Personel';

      if (conflict.shipId !== Number(formData.shipId)) {
        setAlert({
          type: 'error',
          message: `Çift Gemi Ataması Engeli: '${crewName}' adlı personel ${conflictStartStr} - ${conflictEndStr} tarihleri arasında zaten '${conflictShip}' gemisinde görev yapmaktadır! Bir personel aynı anda birden fazla gemide görev alamaz.`,
        });
      } else {
        setAlert({
          type: 'error',
          message: `Mükerrer Görev Engeli: '${crewName}' adlı personelin '${conflictShip}' gemisinde ${conflictStartStr} - ${conflictEndStr} tarihleri arasında zaten aktif bir görevi bulunmaktadır! Çakışan tarihlerde mükerrer görev atanamaz.`,
        });
      }
      setSubmitting(false);
      return;
    }

    try {
      await assignmentService.create({
        shipId: Number(formData.shipId),
        crewMemberId: Number(formData.crewMemberId),
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        roleOnShip: formData.roleOnShip,
      });
      setAlert({ type: 'success', message: 'Personel gemiye başarıyla atandı.' });
      setTimeout(() => {
        setIsModalOpen(false);
        fetchData();
      }, 500);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Atama işlemi başarısız!' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndDuty = async (item: ShipCrewAssignment) => {
    const today = new Date().toISOString().slice(0, 10);
    const memberName = crew.find((c) => c.id === item.crewMemberId)?.fullName || 'Personel';
    const shipName = ships.find((s) => s.id === item.shipId)?.name || 'Gemi';

    if (confirm(`'${memberName}' adlı personelin '${shipName}' gemisindeki görevini bugünün tarihiyle (${new Date().toLocaleDateString('tr-TR')}) sonlandırmak istiyor musunuz?`)) {
      try {
        await assignmentService.update(item.id, {
          ...item,
          endDate: today,
        });
        setAlert({ type: 'success', message: `'${memberName}' personelinin görevi tamamlandı ve sonlandırıldı.` });
        fetchData();
      } catch (err: any) {
        setAlert({ type: 'error', message: err.message || 'Görev sonlandırılamadı.' });
      }
    }
  };

  const handleExportCsv = () => {
    if (!assignments.length) return;
    const headers = ['ID', 'Personel', 'Atandığı Gemi', 'Gemideki Görevi', 'Başlangıç Tarihi', 'Bitiş Tarihi'];
    const rows = assignments.map((item) => {
      const member = crew.find((c) => c.id === item.crewMemberId);
      const ship = ships.find((s) => s.id === item.shipId);
      return [
        item.id,
        member?.fullName || `${member?.firstName || ''} ${member?.lastName || ''}`.trim() || `ID #${item.crewMemberId}`,
        ship?.name || `Gemi #${item.shipId}`,
        item.roleOnShip || member?.role || '-',
        item.startDate ? new Date(item.startDate).toLocaleDateString('tr-TR') : '-',
        item.endDate ? new Date(item.endDate).toLocaleDateString('tr-TR') : 'Devam Ediyor',
      ];
    });

    exportToCsv('gemi_murettebat_atamalari', headers, rows);
  };

  const handleDelete = async (item: ShipCrewAssignment) => {
    if (confirm('Bu atama kaydını sistemden kalıcı olarak silmek istediğinize emin misiniz?')) {
      try {
        await assignmentService.delete(item.id);
        setAlert({ type: 'success', message: 'Atama kaydı silindi.' });
        fetchData();
      } catch (err: any) {
        setAlert({ type: 'error', message: err.message || 'Silinemedi.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gemi-Mürettebat Atamaları</h2>
          <p className="text-xs text-slate-500">
            Hangi personelin hangi gemide ne zaman görev yapacağının operasyonel yönetimi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={loading || assignments.length === 0}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="CSV İndir"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">CSV İndir</span>
          </button>
          {canManageOperations ? (
            <button
              onClick={handleOpenAddModal}
              disabled={ships.length === 0 || crew.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yeni Görev / Atama Yap
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
              Salt Okunur Mod ({role})
            </div>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-bold">Önemli İş Kuralı:</span> Bir mürettebat üyesi aynı anda sadece 1 gemide görev yapabilir. Çakışan tarihlerde veya devam eden aktif bir görevi varken ikinci bir gemiye atama yapılması sistem tarafından engellenir.
        </div>
      </div>

      {/* Arama ve Filtreleme Çubuğu */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Personel adı, e-posta veya görev ara..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <label className="text-slate-500 font-medium whitespace-nowrap">Gemi Filtresi:</label>
          <select
            value={selectedShipFilter}
            onChange={(e) => setSelectedShipFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tüm Gemiler ({assignments.length})</option>
            {ships.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({assignments.filter((a) => a.shipId === s.id).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Görevli Personel</th>
                <th className="px-6 py-3.5">Atandığı Gemi</th>
                <th className="px-6 py-3.5">Gemideki Görevi</th>
                <th className="px-6 py-3.5">Başlangıç Tarihi</th>
                <th className="px-6 py-3.5">Bitiş Tarihi</th>
                <th className="px-6 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Atamalar yükleniyor...
                  </td>
                </tr>
              ) : (() => {
                const filtered = assignments.filter((item) => {
                  if (selectedShipFilter !== 'ALL' && item.shipId !== selectedShipFilter) return false;
                  if (searchTerm.trim()) {
                    const term = searchTerm.toLowerCase();
                    const member = crew.find((c) => c.id === item.crewMemberId);
                    const ship = ships.find((s) => s.id === item.shipId);
                    const memberName = member ? `${member.firstName} ${member.lastName}`.toLowerCase() : '';
                    const shipName = ship ? ship.name.toLowerCase() : '';
                    const roleName = (item.roleOnShip || '').toLowerCase();
                    const email = (member?.email || '').toLowerCase();
                    return memberName.includes(term) || shipName.includes(term) || roleName.includes(term) || email.includes(term);
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        {assignments.length === 0
                          ? 'Henüz aktif personel ataması bulunmuyor.'
                          : 'Arama kriterlerine uygun atama bulunamadı.'}
                      </td>
                    </tr>
                  );
                }

                return filtered.map((item) => {
                  const ship = ships.find((s) => s.id === item.shipId);
                  const member = crew.find((c) => c.id === item.crewMemberId);
                  const isOngoing = !item.endDate || new Date(item.endDate) >= new Date();

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <Users className="w-4 h-4 text-ocean-600" />
                          </div>
                          <div>
                            <div>
                              {member
                                ? member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || `Personel #${item.crewMemberId}`
                                : `Personel #${item.crewMemberId}`}
                            </div>
                            <div className="text-xs font-normal text-slate-400">{member?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <ShipIcon className="w-4 h-4 text-ocean-600" />
                          <span>{ship?.name || `Gemi #${item.shipId}`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          {item.roleOnShip}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(item.startDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {item.endDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(item.endDate).toLocaleDateString('tr-TR')}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Devam Ediyor
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Operatör ve Admin aktif görevi sonlandırabilir */}
                          {canManageOperations && isOngoing && (
                            <button
                              onClick={() => handleEndDuty(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              title="Görevi Bugünden İtibaren Sonlandır"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Görevi Bitir</span>
                            </button>
                          )}

                          {/* Sadece Admin kalıcı silme yapabilir */}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Kaydı Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {!canManageOperations && !canDelete && (
                            <span className="text-[11px] text-slate-400 font-medium">Salt Okunur</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Personel Görev Ataması">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Atanacak Personel *
            </label>
            <select
              value={formData.crewMemberId}
              onChange={(e) => {
                const cId = parseInt(e.target.value);
                const sel = crew.find((c) => c.id === cId);
                setFormData({
                  ...formData,
                  crewMemberId: cId,
                  roleOnShip: sel ? sel.role : formData.roleOnShip,
                });
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
            >
              {crew.map((c) => {
                const isAssigned = assignments.find(
                  (a) => a.crewMemberId === c.id && (!a.endDate || new Date(a.endDate) >= new Date())
                );
                const assignedShip = isAssigned ? ships.find((s) => s.id === isAssigned.shipId)?.name : null;

                return (
                  <option key={c.id} value={c.id}>
                    {c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim()} - {c.role}
                    {assignedShip ? ` (⚠️ Şu an ${assignedShip} gemisinde aktif görevde)` : ' (Müsait)'}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedCrewActiveDuty && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Aktif Görev Uyarısı:</span> Bu personel şu anda{' '}
                <span className="font-semibold underline">{activeShipName}</span> gemisinde aktif görevdedir. Bir çalışan aynı anda birden fazla gemiye atanamaz! Yeni gemiye atama yapabilmek için personelin mevcut görevini bitirmelisiniz.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Görev Alacağı Gemi *
            </label>
            <select
              value={formData.shipId}
              onChange={(e) => setFormData({ ...formData, shipId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
            >
              {ships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.type} - {s.flag})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Gemideki Görev / Rol *
            </label>
            <input
              type="text"
              required
              value={formData.roleOnShip}
              onChange={(e) => setFormData({ ...formData, roleOnShip: e.target.value })}
              placeholder="Örn: Kaptan"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Görev Başlangıç Tarihi *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Görev Bitiş Tarihi (Opsiyonel)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Kaydediliyor...' : 'Atamayı Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
