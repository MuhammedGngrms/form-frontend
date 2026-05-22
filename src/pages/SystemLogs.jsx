import { useState, useEffect } from 'react';
import { 
  Terminal, ShieldAlert, ShieldCheck, KeyRound, RefreshCw, 
  Clock, User, AlertCircle, Loader2, FilePlus2, FileEdit,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // SAYFALAMA VE FİLTRELEME STATE'LERİ
  const [filterAction, setFilterAction] = useState('HEPSİ');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20; // Her sayfada 20 log gösterelim

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Backend'e sayfa numarası, boyutu ve filtreyi gönderiyoruz
      const response = await api.get('/admin/logs', {
        params: {
          page: currentPage,
          size: pageSize,
          action: filterAction
        }
      });
      
      const data = response.data;
      if (data && data.content) {
        setLogs(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      }
    } catch (error) {
      console.error(error);
      toast.error("Sistem günlükleri yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sayfa numarası veya filtre değiştiğinde API'yi tekrar çağır
  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterAction]);

  // Filtre değiştirildiğinde her zaman 1. sayfaya (0'a) dön
  const handleFilterChange = (type) => {
    setFilterAction(type);
    setCurrentPage(0);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'PERSONEL_ENGELLEME': return { bg: 'bg-red-50 text-red-700 border-red-100', icon: <ShieldAlert size={14} /> };
      case 'PERSONEL_AKTİFLEŞTİRME': return { bg: 'bg-green-50 text-green-700 border-green-100', icon: <ShieldCheck size={14} /> };
      case 'ŞİFRE_DEĞİŞTİRME': return { bg: 'bg-blue-50 text-blue-700 border-blue-100', icon: <KeyRound size={14} /> };
      case 'FORM_OLUŞTURMA': return { bg: 'bg-purple-50 text-purple-700 border-purple-100', icon: <FilePlus2 size={14} /> };
      case 'FORM_GÜNCELLEME': return { bg: 'bg-amber-50 text-amber-700 border-amber-100', icon: <FileEdit size={14} /> };
      case 'MÜŞTERİ_KAYDI': return { bg: 'bg-teal-50 text-teal-700 border-teal-100', icon: <Building2 size={14} /> };
      default: return { bg: 'bg-gray-50 text-gray-700 border-gray-100', icon: <AlertCircle size={14} /> };
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 min-w-0">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Terminal className="text-gray-900" size={26} />
            Sistem Hareket Logları
          </h2>
          <p className="text-sm text-gray-500">
            Toplam <span className="font-bold text-red-600">{totalElements}</span> adet sistem kaydı bulundu.
          </p>
        </div>
        <button onClick={fetchLogs} className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl transition border border-gray-200 shadow-sm shrink-0">
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Tazele
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['HEPSİ', 'FORM_OLUŞTURMA', 'FORM_GÜNCELLEME', 'PERSONEL_ENGELLEME', 'ŞİFRE_DEĞİŞTİRME'].map((type) => (
          <button
            key={type}
            onClick={() => handleFilterChange(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border shadow-sm ${
              filterAction === type
                ? 'bg-gray-900 text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="animate-spin text-gray-800 mb-2" size={32} />
          <p className="text-gray-500 text-sm">Güvenlik kayıtları çekiliyor...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 relative border-l-2 border-gray-100 pl-6 space-y-6">
            {logs.map((log) => {
              const badge = getActionBadge(log.action);
              return (
                <div key={log.id} className="relative group animate-fadeIn">
                  <div className="absolute -left-7.75 top-1 bg-white border-2 border-gray-200 group-hover:border-gray-900 w-3 h-3 rounded-full transition-colors"></div>
                  <div className="bg-gray-50/30 hover:bg-gray-50 p-4 rounded-xl border border-gray-100 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md border uppercase ${badge.bg}`}>
                          {badge.icon} {log.action.replace('_', ' ')}
                        </span>
                        <div className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                          <Clock size={12} /> {new Date(log.timestamp).toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm font-medium leading-relaxed">{log.description}</p>
                    </div>
                    <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-gray-200/60 shrink-0">
                      <span className="text-xs text-gray-400 font-medium">Aktör:</span>
                      <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                        <User size={12} className="text-gray-400" /> {log.username}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SAYFALAMA KONTROLLERİ */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500 font-medium">
                Toplam <span className="font-bold text-gray-700">{totalPages}</span> sayfadan <span className="font-bold text-gray-700">{currentPage + 1}.</span> sayfa
              </div>
              <div className="flex items-center gap-1.5">
                <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition">
                  <ChevronLeft size={16} />
                </button>
                <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
          Seçilen kriterde hareket kaydı bulunamadı.
        </div>
      )}
    </div>
  );
}

export default SystemLogs;