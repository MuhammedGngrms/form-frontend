import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("Lütfen kullanıcı adı ve şifrenizi girin!");
      return;
    }

    setIsSubmitting(true);
    const loadToast = toast.loading("Kimlik doğrulanıyor...");

    try {
      const response = await api.post('/api/auth/login', { username, password });
      
      // 1. Önce veriyi hafızaya yazıp Context'i tetikliyoruz
      login(response.data);
      
      toast.success(`Hoş geldiniz, ${response.data.username}!`, { id: loadToast });
      
      // 2. GARANTİ YÖNLENDİRME: React Router bazen render anında takılabiliyor.
      // navigate('/') yerine doğrudan sayfa penceresini ana sayfaya kırıyoruz.
      // Bu sayede hem hafıza temizleniyor hem de ProtectedRoute sıfırdan tetikleniyor.
      setTimeout(() => {
        window.location.href = '/';
      }, 500);

    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 401) {
        toast.error("Kullanıcı adı veya şifre hatalı!", { id: loadToast });
      } else {
        toast.error("Sunucuya bağlanılamadı. Lütfen sistemi kontrol edin.", { id: loadToast });
      }
      setIsSubmitting(false); // Sadece hata durumunda submit'i kapatıyoruz
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 font-sans">
      <div className="flex w-full h-full md:h-auto md:max-w-4xl bg-white md:rounded-2xl shadow-2xl overflow-hidden">
        
        {/* SOL ALAN: KURUMSAL GÖRSEL VE KARŞILAMA (Mobil cihazlarda gizlenir) */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-red-700 to-red-950 p-12 flex-col justify-between text-white relative">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xl font-black tracking-wider">
              <div className="bg-white text-red-700 p-1.5 rounded-lg">
                <ShieldAlert size={24} />
              </div>
              <span>SEBA YANGIN</span>
            </div>
            <p className="text-red-200 text-xs">Saha Bakım ve Form Takip Otomasyonu</p>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold leading-tight">Güvenlik ve Kontrol <br />Tek Noktada.</h1>
            <p className="text-red-100 text-sm leading-relaxed opacity-80">
              Saha periyodik bakım formlarını dijitalleştirin, kilitli e-imza altyapısıyla resmi evraklarınızı anında arşivleyin.
            </p>
          </div>

          <p className="text-xs text-red-300 opacity-60">© 2026 Seba Yangın Söndürme Sistemleri v2.0</p>
        </div>

        {/* SAĞ ALAN: GİRİŞ FORMU */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
          <div className="mb-8 md:hidden flex flex-col items-center text-center">
            <h2 className="text-2xl font-black text-red-600 tracking-wide">SEBA YANGIN</h2>
            <p className="text-xs text-gray-500 mt-1">Form Takip Otomasyonu</p>
          </div>

          <div className="mb-6 hidden md:block">
            <h2 className="text-2xl font-bold text-gray-800">Sisteme Giriş Yapın</h2>
            <p className="text-sm text-gray-500 mt-1">Lütfen size tanımlanan hesap bilgilerini kullanın.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Kullanıcı Adı Girişi */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1.5">Kullanıcı Adı</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  disabled={isSubmitting}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 text-sm transition"
                  placeholder="Kullanıcı adınız"
                />
              </div>
            </div>

            {/* Şifre Girişi */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1.5">Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 text-sm transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 text-white transition shadow-lg ${
                isSubmitting 
                  ? 'bg-red-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/20 hover:shadow-red-700/30'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <span>Sisteme Giriş Yap</span>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Login;