import { useState, useEffect, useRef } from 'react';
import { Plus, ToggleLeft, ToggleRight, Edit2, Check, X, Loader2, Building2, AlertCircle, Mail, Image as ImageIcon, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  
  // YENİ FİRMA STATE'LERİ
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyLogo, setNewCompanyLogo] = useState(null); // Base64 formatında
  
  // DÜZENLEME STATE'LERİ
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ name: '', email: '', logo: '' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/api/companies');
      setCompanies(response.data);
    } catch (error) { toast.error("Şirket listesi yüklenemedi!"); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  // 🌟 RESMİ BASE64'E ÇEVİRME MOTORU 🌟
  const handleLogoUpload = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Sınırı
        toast.error("Logo dosyası 2MB'dan büyük olamaz!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditing) {
          setEditingData(prev => ({ ...prev, logo: reader.result }));
        } else {
          setNewCompanyLogo(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) { toast.error("Firma adı boş olamaz!"); return; }
    setIsSubmitting(true);
    const loadToast = toast.loading("Yeni firma sisteme ekleniyor...");
    try {
      await api.post('/api/companies', { 
        name: newCompanyName, 
        email: newCompanyEmail,
        logo: newCompanyLogo,
        status: 'S' 
      });
      setNewCompanyName('');
      setNewCompanyEmail('');
      setNewCompanyLogo(null);
      if(fileInputRef.current) fileInputRef.current.value = ''; // Inputu temizle
      toast.success("Firma başarıyla eklendi.", { id: loadToast });
      fetchCompanies();
    } catch (error) { 
      toast.error("Firma eklenirken hata oluştu!", { id: loadToast });
    } finally { setIsSubmitting(false); }
  };

  const startEdit = (company) => {
    setEditingId(company.id);
    setEditingData({ name: company.name, email: company.email || '', logo: company.logo || '' });
    setConfirmingId(null); 
  };

  const handleUpdateCompany = async (id) => {
    if (!editingData.name.trim()) { toast.error("Firma adı boş bırakılamaz!"); return; }
    const loadToast = toast.loading("Firma güncelleniyor...");
    try {
      await api.put(`/api/companies/${id}`, { 
        name: editingData.name,
        email: editingData.email,
        logo: editingData.logo
      });
      setEditingId(null);
      toast.success("Firma başarıyla güncellendi.", { id: loadToast });
      fetchCompanies();
    } catch (error) { toast.error("Güncelleme başarısız!", { id: loadToast }); }
  };

  const confirmTogglePassive = async (id) => {
    const loadToast = toast.loading("Firma pasife alınıyor...");
    try {
      await api.delete(`/api/companies/${id}`);
      toast.success("Firma pasif yapıldı.", { id: loadToast });
      setConfirmingId(null);
      fetchCompanies();
    } catch (error) { toast.error("İşlem başarısız!", { id: loadToast }); }
  };

  const handleToggleActive = async (company) => {
    const loadToast = toast.loading("Firma aktif ediliyor...");
    try {
      await api.put(`/api/companies/${company.id}`, { name: company.name, status: 'S' });
      toast.success("Firma yeniden aktif edildi.", { id: loadToast });
      fetchCompanies();
    } catch (error) { toast.error("Aktif etme başarısız!", { id: loadToast }); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pageIn pb-10">
      
      {/* 🌟 ÜST BAŞLIK 🌟 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-gray-900 text-white rounded-xl shadow-md"><Building2 size={24} /></div>
            Kurumsal Müşteri Yönetimi
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Sisteme kayıtlı firmaları yönetin, e-posta ve logolarını tanımlayın.</p>
        </div>
      </div>

      {/* 🌟 YENİ FİRMA EKLEME KARTI 🌟 */}
      <div className="seba-card bg-gradient-to-r from-gray-50 to-white border-dashed border-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Yeni Firma Tanımla</h3>
        <form onSubmit={handleAddCompany} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-4">
            <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><Building2 size={12}/> Firma / Kurum Adı *</label>
            <input type="text" disabled={isSubmitting} className="seba-input" placeholder="Örn: Seba Lojistik A.Ş." value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} />
          </div>
          
          <div className="md:col-span-3">
            <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><Mail size={12}/> E-Posta Adresi</label>
            <input type="email" disabled={isSubmitting} className="seba-input" placeholder="info@firma.com" value={newCompanyEmail} onChange={(e) => setNewCompanyEmail(e.target.value)} />
          </div>

          <div className="md:col-span-3">
            <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><ImageIcon size={12}/> Firma Logosu</label>
            <div className="relative">
              <input type="file" accept="image/*" disabled={isSubmitting} className="hidden" ref={fileInputRef} onChange={(e) => handleLogoUpload(e, false)} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="seba-input flex items-center justify-center gap-2 hover:bg-gray-100 transition text-gray-500">
                <UploadCloud size={16} /> {newCompanyLogo ? 'Logo Yüklendi ✅' : 'Logo Seç (Max 2MB)'}
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <button type="submit" disabled={isSubmitting} className="seba-btn-primary w-full h-[42px] shadow-lg">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span>{isSubmitting ? "Ekleniyor..." : "Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 🌟 FİRMA LİSTESİ TABLOSU 🌟 */}
      <div className="seba-card !p-0 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase font-black tracking-wider border-b border-gray-200">
                <th className="p-4 px-6 w-20">Logo</th>
                <th className="p-4 px-6">Firma Bilgileri</th>
                <th className="p-4 px-6 w-32 text-center">Durum</th>
                <th className="p-4 px-6 text-right w-56">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {companies.length > 0 ? (
                companies.map(company => (
                  <tr key={company.id} className={`hover:bg-gray-50/80 transition group ${company.status === 'D' ? 'bg-gray-50/50' : ''}`}>
                    
                    {/* LOGO SÜTUNU */}
                    <td className="p-4 px-6">
                      <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center overflow-hidden bg-white shadow-sm ${company.status === 'D' ? 'opacity-50 grayscale border-gray-200' : 'border-gray-100'}`}>
                        {editingId === company.id ? (
                           // Düzenleme modunda logoyu değiştirebilme
                           <div className="relative w-full h-full cursor-pointer group/logo" onClick={() => editFileInputRef.current?.click()}>
                              {editingData.logo ? <img src={editingData.logo} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-[9px] text-gray-400 text-center leading-tight">Logo<br/>Seç</span>}
                              <div className="absolute inset-0 bg-black/50 hidden group-hover/logo:flex items-center justify-center"><UploadCloud size={14} className="text-white"/></div>
                              <input type="file" accept="image/*" className="hidden" ref={editFileInputRef} onChange={(e) => handleLogoUpload(e, true)} />
                           </div>
                        ) : (
                          // Normal görünüm
                          company.logo ? (
                            <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-300 uppercase">YOK</span>
                          )
                        )}
                      </div>
                    </td>
                    
                    {/* FİRMA VE EMAIL BİLGİLERİ */}
                    <td className="p-4 px-6">
                      {editingId === company.id ? (
                        <div className="space-y-2">
                          <input type="text" className="seba-input !py-1.5 !px-3 shadow-inner w-full text-xs font-bold" placeholder="Firma Adı" value={editingData.name} onChange={(e) => setEditingData(prev => ({...prev, name: e.target.value}))} />
                          <input type="email" className="seba-input !py-1.5 !px-3 shadow-inner w-full text-xs" placeholder="E-Posta" value={editingData.email} onChange={(e) => setEditingData(prev => ({...prev, email: e.target.value}))} />
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className={`font-black text-[15px] ${company.status === 'D' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{company.name}</span>
                          <span className="text-[11px] font-medium text-gray-500 mt-0.5 flex items-center gap-1">
                            <Mail size={10} /> {company.email || 'E-posta belirtilmemiş'}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    {/* DURUM BAdge */}
                    <td className="p-4 px-6 text-center align-middle">
                      {company.status === 'S' ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> Pasif
                        </span>
                      )}
                    </td>
                    
                    {/* İŞLEMLER */}
                    <td className="p-4 px-6 text-right align-middle">
                      {editingId === company.id ? (
                        <div className="flex justify-end items-center gap-2">
                          <button onClick={() => handleUpdateCompany(company.id)} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-xl border border-green-200 transition shadow-sm" title="Kaydet"><Check size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-xl border border-gray-200 transition shadow-sm" title="İptal"><X size={18} /></button>
                        </div>
                      ) : confirmingId === company.id ? (
                        <div className="flex justify-end items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100 animate-fadeIn shadow-sm">
                          <AlertCircle size={14} className="text-red-500" />
                          <span className="text-[11px] text-red-700 font-bold mr-1">Emin misin?</span>
                          <button onClick={() => confirmTogglePassive(company.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">Evet</button>
                          <button onClick={() => setConfirmingId(null)} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition">Hayır</button>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => startEdit(company)} 
                            className={`p-2 rounded-xl border transition shadow-sm ${company.status === 'D' ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50'}`}
                            disabled={company.status === 'D'} title={company.status === 'D' ? 'Pasif firmalar düzenlenemez' : 'Firmayı Düzenle'}
                          >
                            <Edit2 size={16} />
                          </button>
                          {company.status === 'S' ? (
                            <button onClick={() => setConfirmingId(company.id)} className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl transition shadow-sm" title="Pasife Al">
                              <ToggleRight size={16} />
                            </button>
                          ) : (
                            <button onClick={() => handleToggleActive(company)} className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-200 hover:bg-green-50 rounded-xl transition shadow-sm" title="Yeniden Aktif Et">
                              <ToggleLeft size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100"><Building2 size={32} className="opacity-50" /></div>
                      <p className="text-sm font-bold text-gray-500">Sisteme kayıtlı hiçbir firma bulunamadı.</p>
                      <p className="text-xs mt-1">Yukarıdaki paneli kullanarak ilk firmayı ekleyebilirsiniz.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default CompanyManagement;