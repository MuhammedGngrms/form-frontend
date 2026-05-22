import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, CheckCircle, XCircle, Loader2, KeyRound, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Yeni Kullanıcı Ekleme Form State'leri
  const [showAddForm, setShowAddForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. TÜM PERSONELİ BACKEND'DEN ÇEK
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Personel listesi yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. YENİ TEKNİSYEN KAYDETME
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Kullanıcı adı ve şifre boş bırakılamaz!");
      return;
    }
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır!");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/admin/users', {
        username: username.trim(),
        password: password
      });
      
      toast.success(`${username} teknisyeni başarıyla sisteme eklendi.`);
      setUsername('');
      setPassword('');
      setShowAddForm(false);
      fetchUsers(); // Listeyi tazelemek için yeniden çekiyoruz
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data || "Kullanıcı eklenirken bir hata oluştu.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. KULLANICI AKTİF / PASİF DURUMUNU DEĞİŞTİRME (Toggle Status)
  const handleToggleStatus = async (userId, currentUsername) => {
    try {
      await api.put(`/api/admin/users/${userId}/toggle`);
      toast.success(`${currentUsername} personeli durumu güncellendi.`);
      fetchUsers(); // Durumu ekranda hemen yansıtmak için listeyi tazele
    } catch (error) {
      console.error(error);
      toast.error("Durum güncellenirken bir hata oluştu.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 min-w-0">
      
      {/* BAŞLIK VE YENİ EKLEME BUTONU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-red-600" size={26} />
            Saha Personeli Yönetimi
          </h2>
          <p className="text-sm text-gray-500">Sistemdeki aktif/pasif tüm teknisyenleri ve yetkilerini bu panelden yönetebilirsiniz.</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-red-600/10 transition shrink-0 self-start sm:self-center"
        >
          <UserPlus size={18} />
          {showAddForm ? "Formu Kapat" : "Yeni Teknisyen Ekle"}
        </button>
      </div>

      {/* YENİ TEKNİSYEN EKLEME FORMU (HIZLI PANEL) */}
      {showAddForm && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-scaleUp">
          <h3 className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus size={16} className="text-red-500" /> Yeni Personel Bilgileri
          </h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-gray-600 text-xs font-semibold mb-1.5">Kullanıcı Adı</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                  placeholder="Örn: ahmet_seba"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 text-xs font-semibold mb-1.5">Giriş Şifresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <KeyRound size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                  placeholder="En az 6 karakter"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm py-2.5 px-5 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <span>Teknisyeni Tanımla</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* PERSONEL LİSTE TABLOSU */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="animate-spin text-red-600 mb-2" size={32} />
          <p className="text-gray-500 text-sm">Ekip listesi yükleniyor...</p>
        </div>
      ) : users.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6 font-semibold">Kullanıcı Adı</th>
                  <th className="py-4 px-6 font-semibold">Sistem Rolü</th>
                  <th className="py-4 px-6 font-semibold">Durum</th>
                  <th className="py-4 px-6 font-semibold text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {users.map((person) => {
                  const isActiveUser = person.status === 'S';
                  const isAdminUser = person.roles?.some(r => r.name === 'ROLE_ADMIN');

                  return (
                    <tr key={person.id} className="hover:bg-gray-50/50 transition">
                      {/* Kullanıcı Adı */}
                      <td className="py-4 px-6 font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-black uppercase border border-gray-200">
                          {person.username.substring(0, 2)}
                        </div>
                        {person.username}
                      </td>
                      
                      {/* Rol */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                          isAdminUser 
                            ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          <Shield size={12} />
                          {isAdminUser ? 'Yönetici (Admin)' : 'Saha Teknisyeni'}
                        </span>
                      </td>

                      {/* Durum Etiketi */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          isActiveUser ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {isActiveUser ? (
                            <>
                              <CheckCircle size={14} /> <span>Aktif (Giriş Yapabilir)</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={14} /> <span>Pasif (Erişim Engelli)</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Aksiyon Düğmesi (Durum Değiştirme) */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleStatus(person.id, person.username)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm border ${
                            isActiveUser
                              ? 'bg-white hover:bg-red-50 text-red-600 border-red-100 hover:border-red-200'
                              : 'bg-green-600 hover:bg-green-700 text-white border-transparent'
                          }`}
                        >
                          {isActiveUser ? "Erişimi Engelle (Pasif Yap)" : "Erişimi Aç (Aktif Yap)"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
          Sistemde tanımlı hiçbir kullanıcı bulunamadı.
        </div>
      )}
    </div>
  );
}

export default UserManagement;