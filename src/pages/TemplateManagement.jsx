import { useState, useEffect } from 'react';
import { Plus, Save, X, Layers, Trash2, ChevronRight, FileText, Loader2, HelpCircle, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

function TemplateManagement() {
  const [templates, setTemplates] = useState([]);
  
  // Arayüz Kontrolleri
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Düzenleme (Edit) modunda mıyız?
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  // Form (Şablon) Verisi
  const [formData, setFormData] = useState({
    name: '',
    sections: []
  });

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/api/forms/templates');
      setTemplates(response.data);
    } catch (error) {
      toast.error("Şablonlar yüklenemedi!");
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // --- YENİ ŞABLON OLUŞTURMA MODUNU AÇ ---
  const handleOpenCreate = () => {
    setEditingTemplateId(null);
    setFormData({ name: '', sections: [] });
    setIsCreating(true);
  };

  // --- MEVCUT ŞABLONU DÜZENLEME MODUNU AÇ ---
  const handleEditTemplate = async (id) => {
    const loadToast = toast.loading("Şablon verileri çekiliyor...");
    try {
      const response = await api.get(`/api/forms/templates/${id}`);
      const t = response.data;
      
      // Gelen veriyi form state'imize uyarlıyoruz (Sürükle-bırak/Düzenleme yapabilmek için tempId ekliyoruz)
      setFormData({
        name: t.title || t.name,
        sections: t.sections.map(sec => ({
          id: sec.id, // Veritabanı ID'si (Güncelleme için lazım)
          tempId: Date.now() + Math.random(), // Arayüz key'i
          name: sec.name,
          questions: sec.questions.map(q => ({
            id: q.id,
            tempId: Date.now() + Math.random(),
            questionText: q.questionText,
            inputType: q.inputType || 'RADIO'
          }))
        }))
      });
      
      setEditingTemplateId(id); // Düzenleme modundayız
      setIsCreating(true); // Aynı builder ekranını aç
      toast.dismiss(loadToast);
    } catch (error) {
      console.error(error);
      toast.error("Şablon yüklenemedi!", { id: loadToast });
    }
  };

  // --- DİNAMİK FORM OLUŞTURUCU (BUILDER) FONKSİYONLARI ---
  const handleAddSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { tempId: Date.now(), name: '', questions: [] }]
    }));
  };

  const handleSectionNameChange = (secTempId, newName) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => sec.tempId === secTempId ? { ...sec, name: newName } : sec)
    }));
  };

  const handleRemoveSection = (secTempId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(sec => sec.tempId !== secTempId)
    }));
  };

  const handleAddQuestion = (secTempId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.tempId === secTempId 
          ? { ...sec, questions: [...sec.questions, { tempId: Date.now(), questionText: '', inputType: 'RADIO' }] }
          : sec
      )
    }));
  };

  const handleQuestionChange = (secTempId, qTempId, newText) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.tempId === secTempId 
          ? { ...sec, questions: sec.questions.map(q => q.tempId === qTempId ? { ...q, questionText: newText } : q) }
          : sec
      )
    }));
  };

  const handleRemoveQuestion = (secTempId, qTempId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.tempId === secTempId 
          ? { ...sec, questions: sec.questions.filter(q => q.tempId !== qTempId) }
          : sec
      )
    }));
  };

  // --- ŞABLONU BACKEND'E KAYDET (POST VEYA PUT) ---
  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) { toast.error("Şablon adı boş olamaz!"); return; }
    if (formData.sections.length === 0) { toast.error("En az bir bölüm (Pompa) eklemelisiniz!"); return; }

    setIsSubmitting(true);
    const loadToast = toast.loading(editingTemplateId ? "Şablon güncelleniyor..." : "Yeni şablon oluşturuluyor...");

    try {
      const payload = {
        name: formData.name,
        title: formData.name,
        description: "",
        status: 'S',
        sections: formData.sections.map((sec, secIdx) => ({
          id: sec.id, // Eğer varsa ID'sini gönder (Backend anlasın)
          name: sec.name,
          displayOrder: secIdx + 1,
          questions: sec.questions.map((q, qIdx) => ({
            id: q.id, // Eğer varsa ID'sini gönder
            questionText: q.questionText,
            inputType: 'RADIO',
            displayOrder: qIdx + 1
          }))
        }))
      };

      if (editingTemplateId) {
        // DÜZENLEME (UPDATE)
        await api.put(`/api/forms/templates/${editingTemplateId}`, payload);
        toast.success("Şablon başarıyla güncellendi!", { id: loadToast });
      } else {
        // YENİ OLUŞTURMA (CREATE)
        await api.post('/api/forms/templates', payload);
        toast.success("Yeni Şablon kullanıma hazır!", { id: loadToast });
      }
      
      setIsCreating(false);
      setEditingTemplateId(null);
      setFormData({ name: '', sections: [] });
      fetchTemplates(); 
    } catch (error) {
      console.error(error);
      toast.error("İşlem sırasında hata oluştu!", { id: loadToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pageIn pb-10">
      
      {/* 🌟 ÜST BAŞLIK 🌟 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md shadow-red-600/20"><HelpCircle size={24} /></div>
            Form Şablon Yönetimi
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Sahada kullanılacak formların tasarımlarını oluşturun veya mevcutları düzenleyin.</p>
        </div>
        {!isCreating && (
          <button onClick={handleOpenCreate} className="seba-btn-primary shadow-lg shadow-red-600/30">
            <Plus size={18} /> Yeni Şablon Oluştur
          </button>
        )}
      </div>

      {isCreating ? (
        /* =================================================================================
           YENİ ŞABLON OLUŞTURMA & DÜZENLEME (BUILDER) EKRANI
           ================================================================================= */
        <div className="space-y-6 animate-fadeIn">
          
          <div className="seba-card bg-gray-900 text-white border-none shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
             <div className="relative z-10 flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    {editingTemplateId ? <><Edit3 size={14}/> Şablonu Düzenliyorsunuz</> : 'Form Şablonu Adı (Ana Başlık)'}
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-lg font-black outline-none focus:border-red-500 transition text-white placeholder:text-gray-600" 
                    placeholder="Örn: KÖPÜKLÜ SÖNDÜRME SİSTEMİ BAKIM FORMU" 
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} 
                  />
                </div>
             </div>
          </div>

          <div className="space-y-6">
            {formData.sections.map((sec, secIndex) => (
              <div key={sec.tempId} className="seba-card border-t-4 border-gray-800 shadow-lg relative">
                <button onClick={() => handleRemoveSection(sec.tempId)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Bu Bölümü Sil">
                   <Trash2 size={18} />
                </button>

                <div className="flex items-center gap-3 mb-6 pr-12">
                  <div className="w-8 h-8 bg-gray-100 text-gray-800 font-black rounded-lg flex items-center justify-center border border-gray-300 shadow-sm">{secIndex + 1}</div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bölüm / Cihaz Adı</label>
                    <input 
                      type="text" 
                      className="seba-input font-black text-gray-800 !text-base" 
                      placeholder="Örn: JOKEY POMPA" 
                      value={sec.name} 
                      onChange={(e) => handleSectionNameChange(sec.tempId, e.target.value)} 
                    />
                  </div>
                </div>

                <div className="pl-11 space-y-3">
                  {sec.questions.length > 0 && <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bu Bölümdeki Kontrol Soruları</label>}
                  
                  {sec.questions.map((q, qIndex) => (
                    <div key={q.tempId} className="flex items-center gap-3 animate-fadeIn">
                      <span className="text-sm font-bold text-gray-400 w-5 text-right">{qIndex + 1}.</span>
                      <input 
                        type="text" 
                        className="seba-input flex-1 !py-2" 
                        placeholder="Soruyu yazınız... (Örn: Vana açık mı?)" 
                        value={q.questionText} 
                        onChange={(e) => handleQuestionChange(sec.tempId, q.tempId, e.target.value)} 
                      />
                      <button onClick={() => handleRemoveQuestion(sec.tempId, q.tempId)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  
                  <button onClick={() => handleAddQuestion(sec.tempId)} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition px-2 py-1 rounded hover:bg-blue-50">
                    <Plus size={14} /> Yeni Soru Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition cursor-pointer" onClick={handleAddSection}>
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 text-gray-600 mb-3"><Plus size={24}/></div>
             <span className="font-bold text-gray-700">Yeni Bölüm (Pompa/Sayfa) Ekle</span>
             <span className="text-xs text-gray-400 mt-1">Her bölüm PDF'te ayrı bir sayfa olarak basılır.</span>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-4 bg-[#fbfbfb]/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100">
             <button onClick={() => { setIsCreating(false); setEditingTemplateId(null); }} className="seba-btn-secondary px-8">İptal Et</button>
             <button onClick={handleSaveTemplate} disabled={isSubmitting} className="seba-btn-primary px-10 shadow-lg shadow-red-600/30">
               {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
               {editingTemplateId ? 'Güncellemeleri Kaydet' : 'Şablonu Yayına Al'}
             </button>
          </div>

        </div>
      ) : (
        /* =================================================================================
           MEVCUT ŞABLONLAR LİSTESİ
           ================================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length > 0 ? templates.map(template => (
            <div key={template.id} className="seba-card group hover:-translate-y-1 transition-all duration-300 border-t-4 border-gray-900 flex flex-col justify-between">
               <div>
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-2.5 bg-gray-100 rounded-xl text-gray-700"><FileText size={20} /></div>
                   <span className="bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">Aktif</span>
                 </div>
                 <h3 className="font-black text-gray-900 text-lg leading-tight mb-2 uppercase">{template.title || template.name}</h3>
                 <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Layers size={14} /> İçerik: {template.sections?.length || 0} Bölüm / Sayfa</p>
               </div>
               <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={() => handleEditTemplate(template.id)} 
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg"
                  >
                    <Edit3 size={14} /> İncele / Düzenle
                  </button>
               </div>
            </div>
          )) : (
            <div className="col-span-full seba-card py-16 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400"><HelpCircle size={32}/></div>
               <h3 className="font-bold text-gray-800 text-lg mb-1">Henüz hiç şablonunuz yok.</h3>
               <p className="text-sm text-gray-500 mb-6">Sahada kullanılacak ilk bakım formunu oluşturmaya başlayın.</p>
               <button onClick={handleOpenCreate} className="seba-btn-primary shadow-lg shadow-red-600/30">
                 <Plus size={18} /> Şablon Oluştur
               </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default TemplateManagement;