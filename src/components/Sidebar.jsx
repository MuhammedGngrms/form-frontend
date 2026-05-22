import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  History, 
  Building2, 
  HelpCircle, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Settings,
  Users,
  Terminal
} from 'lucide-react';
import ProfileModal from './ProfileModal';

function Sidebar() {
  const { logout, isAdmin, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  // Hangi sayfada olduğumuzu anlayıp menüde kırmızı/gri vurgu yapmak için kanca
  const isActive = (path) => location.pathname === path;

  return (
    <aside 
    className={`bg-gray-900 text-white h-screen sticky top-0 p-4 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-xl border-r border-gray-800 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
    }`}
    >
      {/* DARALTMA / GENİŞLETME OK BUTONU */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-7 -right-3 bg-red-600 text-white p-1 rounded-full border-2 border-gray-900 hover:bg-red-700 transition z-10"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="space-y-6">
        {/* LOGO VE BAŞLIK ALANI */}
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4 overflow-hidden h-10">
          <div className="bg-red-600 text-white p-2 rounded-lg shrink-0">
            <ShieldAlert size={20} />
          </div>
          {!isCollapsed && (
            <span className="text-base font-black tracking-wider text-red-500 animate-fadeIn Tomsan-nowrap whitespace-nowrap">
              SEBA YANGIN
            </span>
          )}
        </div>
        
        {/* LİNKLER VE NAVİGASYON */}
        <nav className="flex flex-col space-y-1.5">
          <Link 
            to="/" 
            className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all group ${
              isActive('/') 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            title="Sistem Özeti"
          >
            <LayoutDashboard size={20} className="shrink-0" />
            {!isCollapsed && <span className="animate-fadeIn">Sistem Özeti</span>}
          </Link>

          <Link 
            to="/yeni-form" 
            className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all group ${
              isActive('/yeni-form') 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            title="Yeni Form Oluştur"
          >
            <FileSpreadsheet size={20} className="shrink-0" />
            {!isCollapsed && <span className="animate-fadeIn">Yeni Form Oluştur</span>}
          </Link>

          <Link 
            to="/gecmis-formlar" 
            className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all group ${
              isActive('/gecmis-formlar') 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            title="Geçmiş Form Arşivi"
          >
            <History size={20} className="shrink-0" />
            {!isCollapsed && <span className="animate-fadeIn">Geçmiş Form Arşivi</span>}
          </Link>
          
          {/* SADECE ADMİNLERİN GÖREBİLECEĞİ YÖNETİM SAYFALARI */}
          {isAdmin && isAdmin() && (
            <>
              <div className="border-t border-gray-800 my-4"></div>
              {!isCollapsed && (
                <div className="text-[11px] text-gray-500 uppercase tracking-widest px-3 mb-2 animate-fadeIn font-bold">
                  Yönetim
                </div>
              )}
              
              <Link 
                to="/musteri-yonetimi" 
                className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive('/musteri-yonetimi') 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="Müşteri Yönetimi"
              >
                <Building2 size={20} className="shrink-0" />
                {!isCollapsed && <span className="animate-fadeIn">Müşteri Yönetimi</span>}
              </Link>

              <Link 
                to="/sablon-yonetimi" 
                className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive('/sablon-yonetimi') 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="Sistem Hareket Logları"
              >
                <HelpCircle size={20} className="shrink-0" />
                {!isCollapsed && <span className="animate-fadeIn">Şablon Yönetimi</span>}
              </Link>

              <Link 
                to="/personel-yonetimi" 
                className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive('/personel-yonetimi') 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="Saha Personeli Yönetimi"
                >
                <Users size={20} className="shrink-0" />
                {!isCollapsed && <span className="animate-fadeIn">Personel Yönetimi</span>}
              </Link>

              <Link 
                to="/sistem-loglari" 
                className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive('/sistem-loglari') 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="Sistem Hareket Logları"
              >
                <Terminal size={20} className="shrink-0" />
                {!isCollapsed && <span className="animate-fadeIn">Sistem Logları</span>}
              </Link>
              
            </>
          )}
        </nav>
      </div>

      {/* ALT PANEL: AKTİF PROFİL KARTI VE ÇIKIŞ DÜĞMESİ */}
      <div className="mt-auto space-y-2.5">
        
        {/* KULLANICI PROFİL DETAY ALANI */}
        <div className="flex items-center justify-between bg-gray-800/40 border border-gray-800/80 p-2.5 rounded-xl text-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Kullanıcı baş harflerinden oluşan mini avatar */}
            <div className="w-8 h-8 rounded-lg bg-red-600/10 text-red-400 font-black flex items-center justify-center shrink-0 uppercase border border-red-500/10">
              {user?.username ? user.username.substring(0, 2) : 'US'}
            </div>
            {!isCollapsed && (
              <div className="truncate animate-fadeIn">
                <p className="font-semibold text-gray-200 leading-tight truncate">{user?.username || 'Kullanıcı'}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                  {user?.roles?.includes('ROLE_ADMIN') ? 'Yönetici' : 'Teknisyen'}
                </p>
              </div>
            )}
          </div>
          
          {/* Menü açıkken profil düzenleme çarkını göster */}
          {!isCollapsed && (
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition shrink-0"
              title="Profil Ayarları"
            >
              <Settings size={16} className="hover:rotate-45 transition-transform duration-200" />
            </button>
          )}
        </div>

        {/* GÜVENLİ ÇIKIŞ BUTONU */}
        <button 
          onClick={logout} 
          className="flex items-center gap-3 bg-gray-800 text-red-400 hover:bg-red-950/40 hover:text-red-400 p-3 rounded-xl text-sm font-bold transition-all w-full group shadow-inner"
          title="Güvenli Çıkış"
        >
          <LogOut size={20} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
          {!isCollapsed && <span className="animate-fadeIn">Güvenli Çıkış</span>}
        </button>
      </div>

      {/* ŞİFRE DEĞİŞTİRME AÇILIR PANELİ */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </aside>
  );
}

export default Sidebar;