import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Play,
  Check,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { securityLabService } from '../services/api';
import type { AuditLogItem } from '../services/api';

interface SecurityControl {
  id: number;
  title: string;
  category: string;
  description: string;
  defaultPayload: string;
  shortMitigation: string;
}

const SECURITY_CONTROLS: SecurityControl[] = [
  {
    id: 1,
    title: '1. Yetki ve Rol Kontrolü (Broken Access Control)',
    category: 'Erişim Güvenliği',
    description: 'Yetkisiz kişilerin gizli liman operasyon ve bütçe verilerine erişmesi engellenir.',
    defaultPayload: 'Kimliksiz GET İsteği',
    shortMitigation: 'Role-Based Authorization (Admin/PortManager) devrede.',
  },
  {
    id: 2,
    title: '2. Liman Veri İzolasyonu (IDOR Koruması)',
    category: 'Erişim Güvenliği',
    description: 'Bir kullanıcının URL üzerinden başka bir limana ait özel seferleri görmesi engellenir.',
    defaultPayload: 'portId: 2',
    shortMitigation: 'Claims-based liman sahiplik denetimi ve 403 Forbidden kuralı.',
  },
  {
    id: 3,
    title: '3. SQL Injection Koruması',
    category: 'Veri Güvenliği',
    description: "Arama kutusuna girilen zararlı SQL kodlarının (' OR '1'='1) çalışması engellenir.",
    defaultPayload: "' OR '1'='1",
    shortMitigation: 'Parametreli Entity Framework Core LINQ sorguları.',
  },
  {
    id: 4,
    title: '4. Kişisel Veri Maskeleme (KVKK / GDPR)',
    category: 'Veri Güvenliği',
    description: 'Gemi personelinin telefon ve e-posta gibi kişisel verileri maskelenerek korunur.',
    defaultPayload: 'Personel Veri Talebi',
    shortMitigation: 'Rol bazlı DTO projeksiyonu (+90 532 *** ** 33).',
  },
  {
    id: 5,
    title: '5. Yetki Yükseltme Koruması (Mass Assignment)',
    category: 'Erişim Güvenliği',
    description: 'Kayıt sırasında gönderilen sahte Admin rolü sunucu tarafından yok sayılır.',
    defaultPayload: '{"role": "Admin", "isAdmin": true}',
    shortMitigation: 'Katı Request DTO sözleşmesi ve sunucu taraflı rol ataması.',
  },
  {
    id: 6,
    title: '6. Güçlü Oturum ve Jeton Rotasyonu',
    category: 'Kimlik Doğrulama',
    description: '15 dakikalık kısa ömürlü token ve tek kullanımlık Refresh Token kullanılır.',
    defaultPayload: 'Token Yenileme',
    shortMitigation: '15 Dk Access Token + Kriptografik Refresh Token Rotasyonu.',
  },
  {
    id: 7,
    title: '7. Güvenli Hata Yönetimi',
    category: 'Sistem Güvenliği',
    description: 'Hata anında SQL bağlantı şifreleri ve dosya yolları kullanıcıya gösterilmez.',
    defaultPayload: 'İstisna Simülasyonu',
    shortMitigation: 'Global Exception Handler ve istemciye jenerik TraceId.',
  },
  {
    id: 8,
    title: '8. Güvenli Dosya Yükleme',
    category: 'Uygulama Güvenliği',
    description: 'Zararlı uzantılı (.php, .exe) web shell dosyalarının yüklenmesi engellenir.',
    defaultPayload: 'exploit_shell.php',
    shortMitigation: 'Uzantı beyaz listesi (.pdf, .png, .jpg) ve boyut sınırı.',
  },
  {
    id: 9,
    title: '9. XSS Betik Koruması',
    category: 'Uygulama Güvenliği',
    description: 'Gemi notlarına girilen zararlı JavaScript etiketleri arındırılır.',
    defaultPayload: "<script>alert('XSS')</script>",
    shortMitigation: 'HTML Encoding ve Content Security Policy (CSP).',
  },
  {
    id: 10,
    title: '10. Trafik Sınırlandırma (DoS / Rate Limiting)',
    category: 'Ağ Güvenliği',
    description: 'Aşırı büyük veri talepleri sınırlandırılır ve seri istekler kısıtlanır.',
    defaultPayload: 'pageSize=1000000',
    shortMitigation: 'Maksimum 100 kayıt sınırı ve IP başına Rate Limiter.',
  },
];

interface TestResult {
  mode: 'secure' | 'vulnerable';
  isSafe: boolean;
  message: string;
  latencyMs: number;
  statusCode: number;
  dataSummary: string;
  rawJson: any;
}

export const SecurityLabPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'controls' | 'logs'>('controls');

  // Test Sonuçları
  const [results, setResults] = useState<Record<number, TestResult>>({});
  const [loadingTestId, setLoadingTestId] = useState<number | null>(null);
  const [runningAll, setRunningAll] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Denetim Günlüğü
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchLogs();
  }, [severityFilter]);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await securityLabService.getAuditLogs(1, 100, undefined, severityFilter);
      setAuditLogs(res.items);
    } catch (err) {
      console.error('Audit log alınamadı:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const runTest = async (controlId: number, mode: 'secure' | 'vulnerable') => {
    setLoadingTestId(controlId);
    try {
      const res = await securityLabService.testScenario(controlId, mode);
      const isSafe = mode === 'secure' ? !res.isVulnerabilityExploited : false;

      let dataSummary = '';
      if (res.data) {
        if (Array.isArray(res.data)) {
          dataSummary = `${res.data.length} kayıt döndü`;
        } else if (typeof res.data === 'object') {
          dataSummary = Object.keys(res.data).slice(0, 3).join(', ');
        }
      }

      setResults((prev) => ({
        ...prev,
        [controlId]: {
          mode,
          isSafe,
          message: res.resultMessage,
          latencyMs: res.latencyMs,
          statusCode: res.statusCode,
          dataSummary,
          rawJson: res.data ?? res.rawResponse,
        },
      }));

      // Arka planda logları tazele
      fetchLogs();
    } catch (err: any) {
      console.error('Test hatası:', err);
    } finally {
      setLoadingTestId(null);
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    for (const ctrl of SECURITY_CONTROLS) {
      await runTest(ctrl.id, 'secure');
    }
    setRunningAll(false);
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return auditLogs;
    const q = searchQuery.toLowerCase();
    return auditLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        (l.username && l.username.toLowerCase().includes(q)) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q))
    );
  }, [auditLogs, searchQuery]);

  const exportCsv = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Zaman', 'Olay', 'Varlık', 'Kullanıcı', 'Rol', 'IP', 'Önem', 'Detay'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString('tr-TR')}"`,
      `"${l.action}"`,
      `"${l.entityName || ''}"`,
      `"${l.username || 'Anonymous'}"`,
      `"${l.userRole || ''}"`,
      `"${l.ipAddress || ''}"`,
      `"${l.severity || 'INFO'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `guvenlik_kayitlari_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const testedCount = Object.keys(results).length;
  const safeCount = Object.values(results).filter((r) => r.isSafe).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-sans text-slate-800">
      {/* Sade & Şık Üst Başlık */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Sistem Güvenlik Kontrolleri</h1>
              <p className="text-xs text-slate-500">
                Liman takip sisteminin aktif güvenlik kuralları ve denetim kayıtları.
              </p>
            </div>
          </div>
        </div>

        {/* Sekme Geçişi */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'controls' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Güvenlik Kontrolleri (10)</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Denetim Logları ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEKME 1: GÜVENLİK KONTROLLERİ */}
      {/* ========================================================================= */}
      {activeTab === 'controls' && (
        <div className="space-y-4">
          {/* Hızlı İşlem Barı */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Durum Özeti:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                <Check className="w-3 h-3" />
                10 Kural Aktif
              </span>
              {testedCount > 0 && (
                <span className="text-slate-500 text-[11px]">
                  {testedCount}/10 test edildi ({safeCount} korumalı)
                </span>
              )}
            </div>

            <button
              onClick={runAllTests}
              disabled={runningAll}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {runningAll ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Tüm Kontrolleri Otomatik Test Et</span>
            </button>
          </div>

          {/* 10 Basit Kontrol Kartı */}
          <div className="space-y-2.5">
            {SECURITY_CONTROLS.map((item) => {
              const res = results[item.id];
              const isLoading = loadingTestId === item.id;
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {item.id}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      </div>
                    </div>

                    {/* Aksiyon Butonları */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => runTest(item.id, 'secure')}
                        disabled={isLoading || runningAll}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isLoading && res?.mode !== 'vulnerable' ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 fill-current" />
                        )}
                        <span>Test Et</span>
                      </button>

                      <button
                        onClick={() => runTest(item.id, 'vulnerable')}
                        disabled={isLoading || runningAll}
                        className="text-[11px] text-slate-400 hover:text-rose-600 font-medium px-2 py-1 transition cursor-pointer"
                        title="Korumasız durumda nasıl davrandığını kıyaslayın"
                      >
                        {isLoading && res?.mode === 'vulnerable' ? (
                          <RefreshCw className="w-3 h-3 animate-spin inline" />
                        ) : (
                          'Açık Halini Gör'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Test Sonuç Bandı (Test edildiyse görünür) */}
                  {res && (
                    <div
                      className={`p-3 rounded-lg border text-xs flex flex-col gap-1.5 ${
                        res.isSafe
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50/60 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-semibold">
                          {res.isSafe ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span>{res.message}</span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 shrink-0">
                          <span className="px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-[10px] font-bold">
                            HTTP {res.statusCode}
                          </span>
                          <span>{res.latencyMs} ms</span>

                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="text-slate-600 hover:text-slate-900 ml-1 cursor-pointer"
                            title="Teknik Detayları Aç/Kapat"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Açılır Teknik Detay */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-1.5">
                          <div className="text-[11px] text-slate-600">
                            <strong>Savunma Kuralı:</strong> {item.shortMitigation}
                          </div>
                          <pre className="bg-slate-900 text-emerald-400 p-2.5 rounded text-[11px] font-mono overflow-x-auto max-h-36">
                            {JSON.stringify(res.rawJson, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEKME 2: DENETİM LOGLARI */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Arama ve Filtre */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Loglarda ara (kullanıcı, IP, olay)..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">Tüm Seviyeler</option>
                <option value="CRITICAL">Sadece Kritik</option>
                <option value="WARNING">Uyarılar</option>
                <option value="INFO">Bilgi</option>
              </select>

              <button
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                <span>Yenile</span>
              </button>

              <button
                onClick={exportCsv}
                disabled={filteredLogs.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV İndir</span>
              </button>
            </div>
          </div>

          {/* Temiz & Sade Log Tablosu */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Zaman</th>
                    <th className="px-4 py-3">Olay</th>
                    <th className="px-4 py-3">Kullanıcı</th>
                    <th className="px-4 py-3">IP Adresi</th>
                    <th className="px-4 py-3">Önem</th>
                    <th className="px-4 py-3">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      const isCritical = log.severity === 'CRITICAL';
                      const isWarning = log.severity === 'WARNING';
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {log.username || 'Anonymous'}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {log.ipAddress || '-'}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-800'
                                  : isWarning
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {log.severity || 'INFO'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-slate-600 max-w-md truncate" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        {loadingLogs ? 'Yükleniyor...' : 'Kayıt bulunamadı.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityLabPage;
