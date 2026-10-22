import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Ship,
  Anchor,
  Boxes,
  Users,
  CalendarDays,
  Layers,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Server,
  BarChart3,
  Zap,
  TrendingUp,
  Cpu,
  PieChart as PieIcon,
  Play,
} from 'lucide-react';
import { dataSeedService, reportService } from '../services/api';
import type {
  DatabaseStats,
  DashboardChartsData,
  PerformanceComparisonResult,
  MonthlyVisitItem,
  ShipTypeDistributionItem,
  CargoTypeBreakdownItem,
  OperationReportItem,
} from '../services/api';

const PIE_COLORS = [
  '#2563eb', // Blue
  '#0d9488', // Teal
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#e11d48', // Rose
  '#059669', // Emerald
  '#475569', // Slate
  '#ea580c', // Orange
];

/**
 * Saf React & SVG Tabanlı Aylık Seferler Çubuk Grafiği
 * Sıfır harici bağımlılık, anında yüklenme ve tam güvenilirlik
 */
const MonthlyVisitsBarChart: React.FC<{ data: MonthlyVisitItem[] }> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-slate-400">Görüntülenecek sefer verisi bulunamadı.</div>;
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.docked, d.scheduled, d.departed)), 10);
  const chartHeight = 150;

  return (
    <div className="space-y-3">
      {/* Lejant */}
      <div className="flex items-center gap-4 text-xs text-slate-600 justify-end">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
          <span>Rıhtımda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
          <span>Planlandı</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-slate-400"></span>
          <span>Ayrıldı</span>
        </div>
      </div>

      {/* Sütun Alanı */}
      <div className="relative h-52 flex items-end justify-between gap-3 pt-6 pb-6 border-b border-slate-100">
        {/* Yatay ızgara çizgileri */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-slate-400 w-full" />
          <div className="border-b border-slate-400 w-full" />
          <div className="border-b border-slate-400 w-full" />
        </div>

        {data.map((item, idx) => {
          const hDocked = Math.round((item.docked / maxVal) * chartHeight);
          const hScheduled = Math.round((item.scheduled / maxVal) * chartHeight);
          const hDeparted = Math.round((item.departed / maxVal) * chartHeight);

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {hoveredIdx === idx && (
                <div className="absolute -top-14 z-30 bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                  <div className="font-bold text-slate-300">{item.month}</div>
                  <div className="text-emerald-400">Rıhtımda: {item.docked}</div>
                  <div className="text-blue-400">Planlandı: {item.scheduled}</div>
                  <div className="text-slate-300">Ayrıldı: {item.departed}</div>
                </div>
              )}

              {/* 3'lü Sütunlar */}
              <div className="w-full flex items-end justify-center gap-1 h-full">
                <div
                  className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${Math.max(4, hDocked)}px` }}
                  title={`Rıhtımda: ${item.docked}`}
                />
                <div
                  className="w-2.5 sm:w-3.5 bg-blue-600 rounded-t transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${Math.max(4, hScheduled)}px` }}
                  title={`Planlandı: ${item.scheduled}`}
                />
                <div
                  className="w-2.5 sm:w-3.5 bg-slate-400 rounded-t transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${Math.max(4, hDeparted)}px` }}
                  title={`Ayrıldı: ${item.departed}`}
                />
              </div>

              {/* Ay Etiketi */}
              <span className="text-[10px] text-slate-500 mt-2 font-medium truncate max-w-[55px]">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Saf SVG Donut Grafiği - Gemi Tipi Kompozisyonu
 */
const ShipTypeDonutChart: React.FC<{ data: ShipTypeDistributionItem[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-xs text-slate-400">Gemi tipi verisi bulunamadı.</div>;
  }

  const total = data.reduce((acc, d) => acc + d.count, 0) || 1;
  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = 0;
  const slices = data.map((item, idx) => {
    const fraction = item.count / total;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -currentAngle;
    currentAngle += fraction * circumference;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      color: PIE_COLORS[idx % PIE_COLORS.length],
      percent: Math.round(fraction * 100),
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-64 pt-2">
      {/* SVG Donut Halka */}
      <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {slices.map((slice, idx) => (
            <circle
              key={idx}
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              className="transition-all duration-500 hover:opacity-80 cursor-pointer"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-bold text-slate-800">{total}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Toplam Gemi</span>
        </div>
      </div>

      {/* Lejant Listesi */}
      <div className="flex-1 space-y-1.5 max-h-56 overflow-y-auto pr-1 w-full text-xs">
        {slices.map((slice, idx) => (
          <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50">
            <div className="flex items-center gap-2 truncate max-w-[130px]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-slate-700 truncate">{slice.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{slice.count}</span>
              <span className="text-[10px] text-slate-400 w-8 text-right font-medium">%{slice.percent}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Saf CSS/Tailwind Kargo Hacmi Dağılımı Çubuğu
 */
const CargoTypeBarChart: React.FC<{ data: CargoTypeBreakdownItem[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-xs text-slate-400">Kargo verisi bulunamadı.</div>;
  }
  const maxWeight = Math.max(...data.map((d) => d.totalWeightTons), 1);

  return (
    <div className="h-64 overflow-y-auto pr-2 space-y-3 pt-2">
      {data.map((item, idx) => {
        const percent = Math.min(100, Math.round((item.totalWeightTons / maxWeight) * 100));
        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-semibold text-slate-800">{item.type}</span>
                <span className="text-[10px] text-slate-400">({item.count} sevkiyat)</span>
              </div>
              <strong className="text-amber-700 font-bold">{item.totalWeightTons.toLocaleString('tr-TR')} Ton</strong>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(3, percent)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const PerformanceReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'charts' | 'benchmark' | 'database'>('charts');

  // Veritabanı sayaçları
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [seedingData, setSeedingData] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Grafik verileri
  const [chartData, setChartData] = useState<DashboardChartsData | null>(null);
  const [loadingCharts, setLoadingCharts] = useState(false);

  // Benchmark ve Telemetri durumu
  const [benchmarkResult, setBenchmarkResult] = useState<PerformanceComparisonResult | null>(null);
  const [telemetryPreview, setTelemetryPreview] = useState<OperationReportItem[]>([]);
  const [runningBenchmark, setRunningBenchmark] = useState(false);
  const [sampleSize, setSampleSize] = useState<number>(50);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await dataSeedService.getStats();
      setStats(data);
    } catch {
      // offline / mock fallback
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCharts = async () => {
    try {
      setLoadingCharts(true);
      const data = await reportService.getDashboardCharts();
      setChartData(data);
    } catch (err) {
      console.error('Grafik verisi yüklenirken hata:', err);
    } finally {
      setLoadingCharts(false);
    }
  };

  const handleRunBenchmark = async () => {
    try {
      setRunningBenchmark(true);
      const [result, previewRes] = await Promise.all([
        reportService.getPerformanceComparison(sampleSize),
        reportService.getOptimizedReport(1, 10),
      ]);
      setBenchmarkResult(result);
      setTelemetryPreview(previewRes.items || []);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Telemetri testi çalıştırılırken hata oluştu.',
      });
    } finally {
      setRunningBenchmark(false);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm('Test verisi oluşturulacak. Devam etmek istiyor musunuz?')) return;
    try {
      setSeedingData(true);
      setMessage(null);
      await dataSeedService.generateMassData();
      await Promise.all([fetchStats(), fetchCharts()]);
      setMessage({ type: 'success', text: 'Test verileri başarıyla oluşturuldu.' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Veri yükleme sırasında hata oluştu.',
      });
    } finally {
      setSeedingData(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Test verileri temizlenecektir. Devam etmek istiyor musunuz?')) return;
    try {
      setResettingData(true);
      setMessage(null);
      await dataSeedService.resetToInitial();
      await Promise.all([fetchStats(), fetchCharts()]);
      setMessage({ type: 'success', text: 'Veriler başarıyla sıfırlandı.' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Veri sıfırlama sırasında hata oluştu.',
      });
    } finally {
      setResettingData(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCharts();
  }, []);

  const totalRecords = stats
    ? stats.shipCount + stats.portCount + stats.visitCount + stats.cargoCount + stats.crewCount + stats.assignmentCount
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Üst Başlık */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sistem ve Veritabanı Performansı</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Raporlar, Analitik & Veri Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filo hareketleri, liman doluluk oranları ve sorgu performans verileri.
          </p>
        </div>

        {/* Tab Menüsü */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'charts'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Filo Grafikleri</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('benchmark');
              if (!benchmarkResult && !runningBenchmark) {
                handleRunBenchmark();
              }
            }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'benchmark'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Sorgu Performansı</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Veri Yönetimi</span>
          </button>
        </div>
      </div>

      {/* Mesaj Bildirimi */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* TAB 1: GRAFİKLER & ANALİTİK */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Filo KPI Mini Özeti */}
          {chartData?.fleet && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Toplam Gemi</span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">
                  {chartData.fleet.totalShips.toLocaleString('tr-TR')}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Kayıtlı Filo</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Aktif Sefer</span>
                <span className="text-xl font-bold text-blue-600 mt-1 block">
                  {chartData.fleet.activeVoyages.toLocaleString('tr-TR')}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Seyir / Rıhtım</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Rıhtımda</span>
                <span className="text-xl font-bold text-emerald-600 mt-1 block">
                  {chartData.fleet.dockedShips.toLocaleString('tr-TR')}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Yanaşık Gemi</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Taşınan Kargo</span>
                <span className="text-xl font-bold text-amber-600 mt-1 block">
                  {chartData.fleet.totalCargoTons.toLocaleString('tr-TR')} t
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Toplam Yük Tonajı</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Personel</span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">
                  {chartData.fleet.totalCrew.toLocaleString('tr-TR')}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Kayıtlı Mürettebat</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Aktif Görevde</span>
                <span className="text-xl font-bold text-teal-600 mt-1 block">
                  {chartData.fleet.assignedCrew.toLocaleString('tr-TR')}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Gemideki Personel</span>
              </div>
            </div>
          )}

          {/* Grafikler 2x2 Izgara */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grafik 1: Aylık Sefer Trendleri (Saf SVG Bar Chart) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  Aylık Sefer & Uğrak Trendleri
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Planlanan, rıhtıma yanaşan ve tamamlanan seferlerin aylık dağılımı
                </p>
              </div>

              {loadingCharts ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Grafikler hazırlanıyor...
                </div>
              ) : (
                <MonthlyVisitsBarChart data={chartData?.monthlyVisits || []} />
              )}
            </div>

            {/* Grafik 2: Gemi Tiplerine Göre Dağılım (Saf SVG Donut) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-teal-600" />
                  Filo Gemi Tipi Kompozisyonu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filodaki gemilerin operasyonel sınıflarına göre dağılımı
                </p>
              </div>

              {loadingCharts ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Yükleniyor...
                </div>
              ) : (
                <ShipTypeDonutChart data={chartData?.shipTypeDistribution || []} />
              )}
            </div>

            {/* Grafik 3: Kargo Türü ve Tonaj Dağılımı */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-amber-600" />
                  Kargo Türü ve Tonaj Hacmi (Metrik Ton)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Taşınan yük türlerine göre toplam metrik tonaj hacmi
                </p>
              </div>

              {loadingCharts ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Yükleniyor...
                </div>
              ) : (
                <CargoTypeBarChart data={chartData?.cargoTypeBreakdown || []} />
              )}
            </div>

            {/* Grafik 4: Liman Rıhtım Doluluk Oranları */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-indigo-600" />
                  Yoğun Limanlarda Rıhtım Doluluk Oranları (%)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  En yoğun limanlardaki mevcut yanaşık gemi / kapasite oranları
                </p>
              </div>

              <div className="h-64 w-full overflow-y-auto pr-2 space-y-3 pt-2">
                {loadingCharts ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Yükleniyor...
                  </div>
                ) : chartData?.topPortOccupancy && chartData.topPortOccupancy.length > 0 ? (
                  chartData.topPortOccupancy.map((port, idx) => {
                    const isFull = port.occupancyPercent >= 100;
                    const isHigh = port.occupancyPercent >= 60;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">{port.portName}</span>
                          <span className="text-slate-500">
                            {port.dockedCount} / {port.capacity} Gemi ({port.occupancyPercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, port.occupancyPercent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Liman doluluk verisi bulunamadı.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERİTABANI VE SORGU PERFORMANSI */}
      {activeTab === 'benchmark' && (
        <div className="space-y-6">
          {/* Kontrol Paneli */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                Sorgu Performansı
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Standart ve optimize sorguların yürütme süreleri ve veritabanı tur sayıları.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <label htmlFor="sampleSizeSelect" className="font-medium">Kayıt Sayısı:</label>
                <select
                  id="sampleSizeSelect"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(Number(e.target.value))}
                  disabled={runningBenchmark}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value={20}>20 Sefer Kaydı</option>
                  <option value={50}>50 Sefer Kaydı</option>
                  <option value={100}>100 Sefer Kaydı</option>
                </select>
              </div>

              <button
                onClick={handleRunBenchmark}
                disabled={runningBenchmark}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {runningBenchmark ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Test Çalıştırılıyor...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Performans Testini Çalıştır</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Benchmark Sonuç Kartları */}
          {benchmarkResult && (
            <div className="space-y-6">
              {/* Özet Metrikler */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold uppercase">
                    <span>SQL Sorgu Sayısı</span>
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800 mt-2">
                    {benchmarkResult.optimizedSingleQuery.sqlQueryCount}{' '}
                    <span className="text-xs font-normal text-slate-500">/ {benchmarkResult.inefficientNPlusOne.sqlQueryCount}</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    %{benchmarkResult.queryReductionPercentage} daha az sorgu
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold uppercase">
                    <span>Yürütme Süresi</span>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800 mt-2">
                    {benchmarkResult.optimizedSingleQuery.executionTimeMs} ms{' '}
                    <span className="text-xs font-normal text-slate-500">/ {benchmarkResult.inefficientNPlusOne.executionTimeMs} ms</span>
                  </div>
                  <p className="text-[11px] text-blue-600 font-medium mt-1">
                    {benchmarkResult.speedupFactor}x kat daha hızlı
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold uppercase">
                    <span>Test Edilen Kayıt</span>
                    <Layers className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800 mt-2">
                    {benchmarkResult.totalRecordsAnalyzed} Sefer
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    İlişkili kargo ve personel kayıtları dahil
                  </p>
                </div>
              </div>

              {/* İki Yaklaşımın Kıyaslaması */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Standart Sorgu */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 uppercase">
                        Standart (N+1)
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 mt-1">Döngüsel İlişkisel Yükleme</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-rose-600">
                        {benchmarkResult.inefficientNPlusOne.sqlQueryCount} SQL
                      </div>
                      <span className="text-[10px] text-slate-400">Toplam Sorgu</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Yürütme Süresi:</span>
                      <strong className="text-slate-800">{benchmarkResult.inefficientNPlusOne.executionTimeMs} ms</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Bellek / Takip:</span>
                      <strong className="text-slate-700">Aktif (ChangeTracker)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Sorgu Modeli:</span>
                      <strong className="text-slate-700">Kayıt başına alt sorgular</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Optimize Sorgu */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase">
                        Optimize (DTO)
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 mt-1">Tekil Projeksiyon & No-Tracking</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-emerald-600">
                        {benchmarkResult.optimizedSingleQuery.sqlQueryCount} SQL
                      </div>
                      <span className="text-[10px] text-slate-400">Toplam Sorgu</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Yürütme Süresi:</span>
                      <strong className="text-emerald-700 font-bold">{benchmarkResult.optimizedSingleQuery.executionTimeMs} ms</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Bellek / Takip:</span>
                      <strong className="text-emerald-700">Devre Dışı (AsNoTracking)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Sorgu Modeli:</span>
                      <strong className="text-emerald-700">Doğrudan DTO Projeksiyonu</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimize Sorgu Sonuçları Tablosu */}
              {telemetryPreview.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase">
                        Sorgu Sonuçları
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      İlk 10 Kayıt
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2.5">Sefer ID</th>
                          <th className="px-4 py-2.5">Gemi</th>
                          <th className="px-4 py-2.5">Liman</th>
                          <th className="px-4 py-2.5">Varış Tarihi</th>
                          <th className="px-4 py-2.5">Kargo Kalem / Ton</th>
                          <th className="px-4 py-2.5">Görevli Personel</th>
                          <th className="px-4 py-2.5">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {telemetryPreview.map((item) => (
                          <tr key={item.visitId} className="hover:bg-slate-50/60">
                            <td className="px-4 py-2 font-mono font-medium text-slate-500">#{item.visitId}</td>
                            <td className="px-4 py-2 font-semibold text-slate-900">{item.shipName}</td>
                            <td className="px-4 py-2 text-slate-700">{item.portName}</td>
                            <td className="px-4 py-2 text-slate-600">{new Date(item.arrivalDate).toLocaleDateString('tr-TR')}</td>
                            <td className="px-4 py-2 font-medium text-slate-800">
                              {item.cargoCount} kalem ({item.totalCargoWeightTons?.toLocaleString() || 0} ton)
                            </td>
                            <td className="px-4 py-2 text-slate-700">{item.crewCount} Personel</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERİTABANI & TOPLU VERİ YÖNETİMİ */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Eylemler Paneli */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                Veri Yönetimi
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Örnek test verilerini oluşturabilir veya sıfırlayabilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={fetchStats}
                disabled={loadingStats}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
                <span>Yenile</span>
              </button>

              <button
                onClick={handleSeedData}
                disabled={seedingData || resettingData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{seedingData ? 'Yükleniyor...' : 'Test Verisi Oluştur'}</span>
              </button>

              <button
                onClick={handleResetData}
                disabled={resettingData || seedingData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{resettingData ? 'Temizleniyor...' : 'Verileri Sıfırla'}</span>
              </button>
            </div>
          </div>

          {/* Kayıt Sayıları İstatistik Kartları */}
          {stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Gemiler</span>
                    <Ship className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-2">{stats.shipCount.toLocaleString('tr-TR')}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Kayıtlı Gemi</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Limanlar</span>
                    <Anchor className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-2">{stats.portCount.toLocaleString('tr-TR')}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Küresel Liman</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Ziyaretler</span>
                    <CalendarDays className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-2">{stats.visitCount.toLocaleString('tr-TR')}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Sefer / Uğrak</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Yükler</span>
                    <Boxes className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-2">{stats.cargoCount.toLocaleString('tr-TR')}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Sevkiyat / Kargo</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Mürettebat</span>
                    <Users className="w-4 h-4 text-teal-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-2">{stats.crewCount.toLocaleString('tr-TR')}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Kayıtlı Personel</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Atamalar</span>
                    <Layers className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-2">{stats.assignmentCount.toLocaleString('tr-TR')}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Aktif Görevlendirme</span>
                </div>
              </div>

              {/* Sistem & Altyapı Özeti */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-500" />
                  Veritabanı ve Altyapı Durumu
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block">Toplam Tablo Kaydı</span>
                      <strong className="text-slate-800 text-sm font-bold block mt-0.5">
                        {totalRecords.toLocaleString('tr-TR')} Kayıt
                      </strong>
                    </div>
                    <HardDrive className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block">Veritabanı Durumu</span>
                      <strong className="text-emerald-700 text-sm font-bold block mt-0.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Bağlantı Aktif
                      </strong>
                    </div>
                    <Database className="w-4 h-4 text-emerald-500" />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block">Son Senkronizasyon</span>
                      <strong className="text-slate-800 text-sm font-bold block mt-0.5">
                        {stats.checkedAt
                          ? new Date(stats.checkedAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '-'}
                      </strong>
                    </div>
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
