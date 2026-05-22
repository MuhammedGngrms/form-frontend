import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Building2, Users, TrendingUp, Activity, Loader2, 
  PlusCircle, History, Settings, UserCheck, Calendar, ArrowRight, FileEdit 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import api from '../api';

function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalForms: 0,
    totalCompanies: 0,
    totalUsers: 0,
    monthlyTrends: [],
    technicianFormCounts: []
  });
  const [recentForms, setRecentForms] = useState([]); // Son kayıtlar için state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. İstatistikleri Çek
        const statsRes = await api.get('/api/dashboard/stats');
        setStats(statsRes.data);

        // 2. Son Kayıtları Çek (Arşiv uç noktasından ilk sayfayı (0) ve 5 kaydı istiyoruz)
        const recentRes = await api.get('/api/forms/submittedWithPage', {
          params: { page: 0, size: 5, search: '' }
        });
        // Backend Page yapısı dönüyorsa content'i al, düz liste dönüyorsa array'i al (Yedekli mimari)
        setRecentForms(recentRes.data?.content ? recentRes.data.content : (Array.isArray(recentRes.data) ? recentRes.data.slice(0, 5) : []));
      } catch (error) {
        console.error("Dashboard verileri çekilemedi", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin text-red-600 mb-4" size={40} />
        <p className="text-gray-500 font-medium animate-pulse">Komuta merkezi yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* KARŞILAMA ALANI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hoş Geldiniz, <span className="text-red-600">{user?.username}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Seba Yangın Sistemleri operasyon özetini aşağıdan inceleyebilirsiniz.</p>
        </div>
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-100 font-semibold text-sm shadow-inner shrink-0">
          <Activity size={18} className="animate-pulse" />
          Sistem Durumu: Aktif ve Sağlıklı
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Toplam Bakım Formu</p>
              <h3 className="text-3xl font-black text-gray-900">{stats.totalForms}</h3>
            </div>
            <div className="bg-red-100 text-red-600 p-3 rounded-xl"><FileText size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Kayıtlı Müşteri / Firma</p>
              <h3 className="text-3xl font-black text-gray-900">{stats.totalCompanies}</h3>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Building2 size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Aktif Saha Personeli</p>
              <h3 className="text-3xl font-black text-gray-900">{stats.totalUsers}</h3>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-xl"><Users size={24} /></div>
          </div>
        </div>
      </div>

      {/* HIZLI KISAYOLLAR PANELİ */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Hızlı Aksiyon Kısayolları</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          {/* HERKESİN (TEKNİSYEN + ADMİN) GÖRECEĞİ BUTONLAR */}
          <Link to="/yeni-form" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-red-50 rounded-xl border border-gray-100 hover:border-red-100 transition group text-sm font-bold text-gray-700 hover:text-red-600">
            <PlusCircle size={20} className="text-gray-400 group-hover:text-red-500" />
            <span>Direkt Form Aç</span>
          </Link>
          <Link to="/gecmis-formlar" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition group text-sm font-bold text-gray-700">
            <History size={20} className="text-gray-400 group-hover:text-gray-900" />
            <span>Arşivi Görüntüle</span>
          </Link>

          {/* SADECE ADMİNLERİN GÖRECEĞİ BUTONLAR */}
          {isAdmin && isAdmin() && (
            <>
              <Link to="/personel-yonetimi" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition group text-sm font-bold text-gray-700">
                <Users size={20} className="text-gray-400 group-hover:text-gray-900" />
                <span>Ekibi Yönet</span>
              </Link>
              <Link to="/sistem-loglari" className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition group text-sm font-bold text-gray-700">
                <Settings size={20} className="text-gray-400 group-hover:text-gray-900" />
                <span>Sistem Logları</span>
              </Link>
            </>
          )}
          
        </div>
      </div>

      {/* ANALİTİK VE GRAFİK ALANI + PERSONEL PERFORMANS YAN YANA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL/ORTA KISIM: 6 AYLIK GRAFİK */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <TrendingUp className="text-gray-400" size={20} />
            <h2 className="text-base font-bold text-gray-800">Aylık Form Doldurma Trendi</h2>
          </div>
          <div className="h-70 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyTrends} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorForm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="formSayisi" name="Form Sayısı" stroke="#dc2626" strokeWidth={2.5} fillOpacity={1} fill="url(#colorForm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SAĞ KISIM: SAHA PERSONELİ LİGİ (PERFORMANS) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
              <UserCheck className="text-gray-400" size={20} />
              <h2 className="text-base font-bold text-gray-800">Personel Form Dağılımı</h2>
            </div>
            
            <div className="space-y-3 max-h-62.5 overflow-y-auto pr-1">
              {stats.technicianFormCounts?.length > 0 ? (
                stats.technicianFormCounts.map((tech, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs uppercase">
                        {tech.username?.substring(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-gray-700">{tech.username}</span>
                    </div>
                    <span className="bg-red-50 text-red-600 font-extrabold text-xs px-2 py-1 rounded-lg border border-red-100">
                      {tech.count} Form
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">Henüz veri bulunamadı.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* EN ALT ALAN: SON 5 BAKIM KAYDI TABLOSU */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <History size={18} className="text-red-500" />
            Sisteme Düşen Son Bakım Kayıtları
          </h2>
          <Link to="/gecmis-formlar" className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition">
            Tüm Arşivi Gör <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentForms.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-150 text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-100 font-bold">
                  <th className="py-3 px-6">ID / Tarih</th>
                  <th className="py-3 px-6">Firma Name</th>
                  <th className="py-3 px-6">Saha Teknisyeni</th>
                  <th className="py-3 px-6 text-right">Eylem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {recentForms.map((item) => {
                  const formObj = item.filledForm ? item.filledForm : item;
                  return (
                    <tr key={formObj.id} className="hover:bg-gray-50/60 transition group">
                      <td className="py-3.5 px-6 font-bold text-gray-900">
                        #{formObj.id}
                        <span className="text-gray-400 font-medium text-[10px] mt-0.5 flex items-center gap-0.5">
                          <Calendar size={10} /> {new Date(formObj.visitDate || formObj.createdDate).toLocaleDateString('tr-TR')}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-gray-800">
                        {formObj.company?.name || 'Bilinmeyen Firma'}
                      </td>
                      <td className="py-3.5 px-6 text-gray-600 font-medium">
                        {formObj.technicianName}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link to={`/form-duzenle/${formObj.id}`} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 hover:text-red-600 px-2.5 py-1.5 rounded-lg font-bold shadow-sm hover:bg-red-50 hover:border-red-100 transition">
                          <FileEdit size={12} /> Düzenle
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10 text-gray-400">Henüz kaydedilmiş bir form bulunmuyor.</div>
          )}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;