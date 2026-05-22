import { useState } from 'react';
import { X, Lock, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function ProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validasyonlar
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Lütfen tüm alanları doldurun!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalıdır!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler birbiriyle uyuşmuyor!");
      return;
    }

    setIsSubmitting(true);
    const loadToast = toast.loading("Şifreniz güncelleniyor...");

    try {
      // Java Backend'de yazdığımız /api/auth/change-password ucuna istek atıyoruz
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      toast.success("Şifreniz başarıyla değiştirildi.", { id: loadToast });
      
      // Formu temizle ve kapat
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data || "Şifre değiştirilirken bir hata oluştu.";
      toast.error(errorMsg, { id: loadToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 m-4 relative animate-scaleUp">
        
        {/* KAPATMA BUTONU */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
        >
          <X size={18} />
        </button>

        {/* BAŞLIK VE KULLANICI DETAYI */}
        <div className="flex items-center gap-3 border-b pb-4 mb-5">
          <div className="bg-red-50 text-red-600 p-2.5 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Profil Ayarları</h3>
            <p className="text-xs text-gray-500">
              Oturum Açan: <span className="font-semibold text-gray-700">{user?.username}</span> ({user?.roles?.includes('ROLE_ADMIN') ? 'Yönetici' : 'Teknisyen'})
            </p>
          </div>
        </div>

        {/* ŞİFRE DEĞİŞTİRME FORMU */}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1.5">Mevcut Şifre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 text-sm transition"
                placeholder="Şu anki şifreniz"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1.5">Yeni Şifre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound size={16} />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 text-sm transition"
                placeholder="En az 6 karakter"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1.5">Yeni Şifre (Tekrar)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound size={16} />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 text-sm transition"
                placeholder="Yeni şifrenizi doğrulayın"
              />
            </div>
          </div>

          {/* AKSİYON BUTONLARI */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/10 transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Güncelleniyor...</span>
                </>
              ) : (
                <span>Şifreyi Güncelle</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ProfileModal;