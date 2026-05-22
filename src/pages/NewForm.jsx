import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import api from '../api';
import toast from 'react-hot-toast';
import { Loader2, Download, Save, LayoutTemplate, Building2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function NewForm() {
  const { user } = useAuth();
  
  // --- TEMEL VERİLER (BACKEND'DEN GELECEK) ---
  const [companies, setCompanies] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // --- SEÇİMLER ---
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // --- KULLANICI BİLGİLERİ ---
  const [technicianName, setTechnicianName] = useState('');
  const [officialName, setOfficialName] = useState(''); 
  const [generalNotes, setGeneralNotes] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]); // YENİ EKLENEN

  // --- FORM VERİLERİ (DİNAMİK) ---
  const [sectionData, setSectionData] = useState({}); 
  const [sectionNotes, setSectionNotes] = useState({}); 
  const [answers, setAnswers] = useState({});
  const [answerNotes, setAnswerNotes] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const techSigRef = useRef(null);
  const officialSigRef = useRef(null);

  const pumpSpecs = [
    { key: 'model', label: 'Pompa Modeli' },
    { key: 'seriNo', label: 'Pompa Seri No' },
    { key: 'motorModel', label: 'Motor Modeli' },
    { key: 'motorSeri', label: 'Motor Seri No' },
    { key: 'panoModel', label: 'K.Panosu Modeli' },
    { key: 'panoSeri', label: 'K.Panosu Seri No' },
    { key: 'basinc', label: 'Basınç Değerleri' }
  ];

  useEffect(() => {
    if (user?.username) setTechnicianName(user.username);
  }, [user]);

  // GERÇEK VERİLERİ VERİTABANINDAN ÇEKİYORUZ
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const companyRes = await api.get('/api/companies?status=S');
        setCompanies(companyRes.data);

        const templateRes = await api.get('/api/forms/templates');
        // Sadece aktif şablonları filtrele (Opsiyonel)
        setTemplates(templateRes.data.filter(t => t.status !== 'D'));
      } catch (error) { 
        toast.error("Sistem verileri yüklenirken hata oluştu!"); 
        console.error(error); 
      }
    };
    fetchInitialData();
  }, []);

  // Şablon değiştiğinde eski verileri temizle ve yeni şablona göre state'leri hazırla
  const handleTemplateChange = (e) => {
    const tId = parseInt(e.target.value);
    setSelectedTemplateId(tId);
    
    const template = templates.find(t => t.id === tId);
    if (template) {
      const initialData = {};
      const initialNotes = {};
      template.sections.forEach(s => { initialData[s.id] = {}; initialNotes[s.id] = ''; });
      setSectionData(initialData);
      setSectionNotes(initialNotes);
      setAnswers({});
      setAnswerNotes({});
      setGeneralNotes('');
    }
  };

  const handleSectionDataChange = (secId, field, value) => setSectionData(prev => ({ ...prev, [secId]: { ...prev[secId], [field]: value } }));
  // 🌟 ÇOKLU SEÇİM FONKSİYONU (Checkbox Mantığı)
  const handleAnswerChange = (qId, option) => {
    setAnswers(prev => {
      // Mevcut cevabı al, yoksa boş string dönsün ve virgül ile bölüp diziye çevir
      const currentVal = prev[qId] || '';
      let currentArr = currentVal ? currentVal.split(',') : [];

      if (currentArr.includes(option)) {
        // Eğer tıklanan seçenek zaten varsa, diziden çıkar (Seçimi kaldır)
        currentArr = currentArr.filter(item => item !== option);
      } else {
        // Yoksa diziye ekle (Seç)
        currentArr.push(option);
      }

      // Diziyi tekrar araya virgül koyarak string'e çevir ve state'e yaz
      return { ...prev, [qId]: currentArr.join(',') };
    });
  };
  const handleNoteChange = (qId, value) => setAnswerNotes(prev => ({ ...prev, [qId]: value }));
  const handleSecNoteChange = (secId, value) => setSectionNotes(prev => ({ ...prev, [secId]: value }));

  const clearTechSig = () => techSigRef.current?.clear();
  const clearOfficialSig = () => officialSigRef.current?.clear();

  const activeTemplate = templates.find(t => t.id === selectedTemplateId);
  const activeCompany = companies.find(c => c.id == selectedCompany);

  // 🌟 ÇOK SAYFALI PDF MOTORU 🌟
  const generatePDF = async () => {
    setIsPdfGenerating(true);
    const toastId = toast.loading("Resmi çok sayfalı PDF hazırlanıyor...");
    try {
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pdfWidth = 210;
      const pageElements = document.querySelectorAll('.print-only-page');
      
      for (let i = 0; i < pageElements.length; i++) {
        const imgData = await toPng(pageElements[i], { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        if (i < pageElements.length - 1) pdf.addPage();
      }
      
      pdf.save(`${activeTemplate?.title || 'Seba_Form'}_${activeCompany?.name.substring(0,10)}_${new Date().toLocaleDateString()}.pdf`);
      toast.success("PDF İndirildi!", { id: toastId });
    } catch (err) { toast.error("Hata oluştu!", { id: toastId }); } 
    finally { setIsPdfGenerating(false); }
  };

  // 🌟 GERÇEK VERİLERİ BACKEND'E (JAVA) GÖNDERME 🌟
  const handleSubmit = async () => {
    if (!selectedCompany) { toast.error("Lütfen Firma alanını doldurun!"); return; }
    if (!activeTemplate) { toast.error("Lütfen bir şablon seçin!"); return; }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Form veritabanına işleniyor...");

    const techSignature = (techSigRef.current && !techSigRef.current.isEmpty()) ? techSigRef.current.getCanvas().toDataURL('image/png') : null;
    const officialSignature = (officialSigRef.current && !officialSigRef.current.isEmpty()) ? officialSigRef.current.getCanvas().toDataURL('image/png') : null;

    // Java'daki FormSubmissionDTO yapısıyla birebir eşleşen Payload:
    const payload = {
      companyId: parseInt(selectedCompany),
      templateId: selectedTemplateId,
      technicianName: technicianName,
      companyOfficialName: officialName,
      generalNotes: generalNotes,
      technicianSignatureUrl: techSignature,
      companyOfficialSignatureUrl: officialSignature,
      visitDate: visitDate, // Seçtiğimiz dinamik tarih gidiyor
      
      filledSections: Object.keys(sectionData).map(secId => ({
        sectionId: parseInt(secId),
        technicalData: JSON.stringify(sectionData[secId]),
        notes: sectionNotes[secId] || "" // Pompa özel notu DTO'ya gidiyor
      })),
      
      answers: Object.keys(answers).map(qId => ({
        questionId: parseInt(qId),
        answerValue: answers[qId],
        notes: answerNotes[qId] || ""
      }))
    };

    try {
      // NOKTA ATIŞI: Java Controller'daki @PostMapping("/submit") ucuyla eşitledik!
      await api.post('/api/forms/submit', payload); 
      
      toast.success("Müthiş! Yangın bakım formu sisteme başarıyla işlendi.", { id: loadingToast });
      
      // Kayıt sonrası sayfayı temizle ve listeye yönlendir
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) { 
      console.error(error);
      toast.error("Form gönderilirken bir hata oluştu!", { id: loadingToast }); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-pageIn">
      
      {/* 🌟 1. ADIM: KURULUM VE SEÇİM KARTI 🌟 */}
      <div className="seba-card bg-gray-900 text-white border-none shadow-xl">
        <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2 mb-6 text-red-500 border-b border-gray-700 pb-3">
          <LayoutTemplate size={20} /> Form Kurulum Paneli
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">1. Form Şablonunu Seçin</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-red-500 transition" value={selectedTemplateId} onChange={handleTemplateChange}>
              <option value="">-- Hangi Formu Dolduracaksınız? --</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.title || t.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Building2 size={14}/> 2. Müşteri (Firma) Seçin</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-red-500 transition" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
              <option value="">-- Müşteri Seçiniz --</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* 🌟 2. ADIM: EĞER ŞABLON SEÇİLDİYSE FORMU GÖSTER 🌟 */}
      {activeTemplate && selectedCompany && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* EKRAN İÇİN GÖRSEL ANTET (LOGOLAR VE BAŞLIK) */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center border-b-4 border-red-600 pb-6 mb-6">
              
              {/* SOL LOGO (Seba) */}
              <div className="w-32 h-16 flex items-center justify-center">
                <img 
                    src="/nmfire-teknik-servis.jpg" 
                    alt="Seba Yangın" 
                    className="max-w-full max-h-full object-contain" 
                />
              </div>
              
              {/* ORTA BAŞLIK */}
              <div className="text-center flex-1 px-4">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">
                  {activeTemplate.title || activeTemplate.name}
                </h1>
                <div className="mt-2 inline-flex items-center">
                  <input 
                    type="date" 
                    className="text-sm font-bold text-gray-600 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg border border-gray-200 outline-none focus:border-red-400 focus:bg-white transition cursor-pointer text-center"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                  />
                </div>
              </div>

              {/* SAĞ LOGO (SEÇİLEN FİRMAYA ÖZEL LOGO) */}
              <div className="w-32 h-16 bg-white flex items-center justify-center rounded-xl border-2 border-gray-100 overflow-hidden shadow-sm">
                 {activeCompany?.logo ? (
                   <img src={activeCompany.logo} alt="Firma Logo" className="w-full h-full object-contain p-1" />
                 ) : (
                   <span className="text-[9px] font-bold text-gray-400 text-center px-1 uppercase">{activeCompany?.name}</span>
                 )}
              </div>

            </div>

            {/* POMPA TEKNİK BİLGİ MATRİSİ */}
            <div className="overflow-x-auto">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cihaz Teknik Özellikleri</h3>
              <table className="w-full text-left border-2 border-gray-300 border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="p-2.5 border-r-2 border-gray-300 font-black text-xs text-gray-700 uppercase">Kriter</th>
                    {activeTemplate.sections.map(s => (
                      <th key={s.id} className="p-2.5 border-r-2 border-gray-300 text-center font-black text-xs uppercase text-gray-700">{s.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pumpSpecs.map(spec => (
                    <tr key={spec.key} className="border-b border-gray-200">
                      <td className="p-2.5 border-r-2 border-gray-300 font-bold bg-gray-50 text-xs text-gray-600">{spec.label}</td>
                      {activeTemplate.sections.map(s => (
                        <td key={s.id} className="p-0 border-r-2 border-gray-300">
                          <input type="text" className="w-full p-2.5 outline-none text-xs text-center focus:bg-red-50 font-medium" placeholder="" value={sectionData[s.id]?.[spec.key] || ''} onChange={e => handleSectionDataChange(s.id, spec.key, e.target.value)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SÜREKLİ AKAN (SCROLLING) SORU BÖLÜMLERİ */}
          <div className="space-y-6">
            {activeTemplate.sections.map((sec, index) => (
              <div key={sec.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-sm">{index + 1}</div>
                  <h2 className="font-black text-lg uppercase tracking-tight text-gray-800">{sec.name} KONTROLLERİ</h2>
                </div>
                
                <div className="space-y-2 mb-5">
                  {sec.questions.map((q, idx) => (
                    <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition border border-transparent hover:border-gray-200">
                      <span className="font-bold text-gray-700 text-sm flex-1"><span className="text-gray-400 mr-2">{idx + 1}.</span>{q.questionText}</span>
                      <div className="flex items-center gap-6 shrink-0">
                        {/* EVET */}
                        <div onClick={() => handleAnswerChange(q.id, 'EVET')} className="flex items-center gap-2 cursor-pointer">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${(answers[q.id] || '').includes('EVET') ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
                            {(answers[q.id] || '').includes('EVET') && <div className="w-2.5 h-2.5 rounded-[2px] bg-green-600"></div>}
                          </div>
                          <span className={`text-xs font-bold ${(answers[q.id] || '').includes('EVET') ? 'text-green-700' : 'text-gray-500'}`}>EVET</span>
                        </div>

                        {/* HAYIR */}
                        <div onClick={() => handleAnswerChange(q.id, 'HAYIR')} className="flex items-center gap-2 cursor-pointer">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${(answers[q.id] || '').includes('HAYIR') ? 'border-red-600 bg-red-50' : 'border-gray-300'}`}>
                            {(answers[q.id] || '').includes('HAYIR') && <div className="w-2.5 h-2.5 rounded-[2px] bg-red-600"></div>}
                          </div>
                          <span className={`text-xs font-bold ${(answers[q.id] || '').includes('HAYIR') ? 'text-red-700' : 'text-gray-500'}`}>HAYIR</span>
                        </div>
                        <input type="text" className="w-60 bg-white border border-gray-200 focus:border-red-400 rounded-lg px-3 py-1.5 text-xs outline-none shadow-sm" placeholder="Not..." value={answerNotes[q.id] || ''} onChange={e => handleNoteChange(q.id, e.target.value)} />
                      </div>
                    </div>
                  ))}
                  {sec.questions.length === 0 && <div className="text-xs font-bold text-gray-400 italic p-3 text-center">Bu bölümde soru bulunmuyor.</div>}
                </div>

                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                  <label className="block text-xs font-bold text-red-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                     <CheckCircle size={14}/> {sec.name} İÇİN ÖZEL AÇIKLAMA / NOT
                  </label>
                  <textarea 
                    className="w-full bg-white border border-red-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-red-200 resize-none h-16" 
                    placeholder="Bu pompaya ait arızalar veya notlar..."
                    value={sectionNotes[sec.id] || ''}
                    onChange={e => handleSecNoteChange(sec.id, e.target.value)}
                  ></textarea>
                </div>
              </div>
            ))}
          </div>

          {/* İMZA VE ONAY ALANI */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <h2 className="font-black text-lg uppercase tracking-tight text-gray-800 mb-6 border-b pb-3">Onay ve İmzalar</h2>
             
             <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tüm Form İçin Genel Açıklama</label>
                <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-red-400 h-20 resize-none" value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} placeholder="Formla ilgili genel değerlendirmeler..."></textarea>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Teknisyen Adı Soyadı</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-center font-bold text-gray-800 outline-none" value={technicianName} onChange={e => setTechnicianName(e.target.value)} />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-1">
                      <SignatureCanvas ref={techSigRef} penColor="#1e3a8a" canvasProps={{width: 400, height: 120, className: 'mx-auto cursor-crosshair'}} />
                  </div>
                  <button onClick={clearTechSig} className="w-full text-[10px] font-bold text-red-500 hover:text-red-700 transition">İMZAYI TEMİZLE</button>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Firma Yetkilisi Adı Soyadı</label>
                  <input type="text" className="w-full bg-white border border-gray-300 focus:border-red-500 rounded-xl p-3 text-center font-bold text-gray-800 outline-none shadow-sm" placeholder="Yetkilinin adını giriniz..." value={officialName} onChange={e => setOfficialName(e.target.value)} />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-1 hover:border-red-300 transition">
                      <SignatureCanvas ref={officialSigRef} penColor="#1e3a8a" canvasProps={{width: 400, height: 120, className: 'mx-auto cursor-crosshair'}} />
                  </div>
                  <button onClick={clearOfficialSig} className="w-full text-[10px] font-bold text-red-500 hover:text-red-700 transition">İMZAYI TEMİZLE</button>
                </div>
             </div>
          </div>

          {/* AKSİYON BUTONLARI */}
          <div className="flex justify-end gap-3 sticky bottom-4 z-10">
            <button onClick={generatePDF} disabled={isPdfGenerating} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3.5 px-6 rounded-xl shadow-xl transition">
              {isPdfGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              PDF Çıktısı Al
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-10 rounded-xl shadow-xl shadow-red-600/30 transition">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Sisteme Kaydet
            </button>
          </div>

        </div>
      )}


      {/* =========================================================================
          🌟 PDF TASARIM ALANI (SADECE PDF İÇİN ÇİZİLEN GİZLİ YER) 🌟
          ========================================================================= */}
      {activeTemplate && selectedCompany && (
        <div className="fixed top-[-9999px] left-[-9999px]">
          
          {/* SAYFA 1: ANTET, POMPA MATRİSİ VE İLK BÖLÜM (1. POMPA) */}
          <div className="print-only-page w-[800px] bg-white p-8 flex flex-col justify-between" style={{ minHeight: '1120px' }}>
            <div>
              {/* Başlık ve Logolar */}
              <div className="flex justify-between items-center border-b-4 border-red-600 pb-4 mb-4">
                <div className="w-24 h-14 flex items-center justify-center overflow-hidden">
                   <img src="/nmfire-teknik-servis.jpg" alt="Seba Yangın" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="text-center flex-1 px-4">
                  <h1 className="text-lg font-black uppercase">{activeTemplate.title || activeTemplate.name}</h1>
                  <h2 className="text-xs font-bold text-gray-700 mt-1 uppercase">{activeCompany?.name}</h2>
                </div>
                <div className="w-24 h-14 bg-white flex items-center justify-center border-2 border-gray-200 overflow-hidden rounded-lg">
                   {activeCompany?.logo ? (
                     <img src={activeCompany.logo} className="w-full h-full object-contain p-0.5" />
                   ) : (
                     <span className="text-[8px] font-bold text-gray-400 text-center px-1 uppercase">{activeCompany?.name}</span>
                   )}
                </div>
              </div>

              {/* Matris Tablosu */}
              <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2">CİHAZ TEKNİK ÖZELLİKLERİ VE MATRİSİ</h3>
              <table className="w-full border border-black border-collapse text-[10px] mb-6">
                  <thead>
                      <tr className="bg-gray-100">
                          <th className="p-1.5 border border-black font-black uppercase text-left">Kriter</th>
                          {activeTemplate.sections?.map(s => <th key={s.id} className="p-1.5 border border-black font-black uppercase text-center">{s.name}</th>)}
                      </tr>
                  </thead>
                  <tbody>
                      {pumpSpecs.map(spec => (
                          <tr key={spec.key}>
                              <td className="p-1.5 border border-black font-bold bg-gray-50">{spec.label}</td>
                              {activeTemplate.sections?.map(s => <td key={s.id} className="p-1.5 border border-black text-center">{sectionData[s.id]?.[spec.key] || '-'}</td>)}
                          </tr>
                      ))}
                  </tbody>
              </table>

              {/* 1. BÖLÜM KONTROLLERİ (JOKEY POMPA) - İlk Sayfaya Entegre Edildi */}
              {activeTemplate.sections && activeTemplate.sections.length > 0 && (
                <div>
                  <div className="flex justify-between items-center border-b-2 border-red-600 pb-1 mb-3">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase">{activeTemplate.sections[0].name} KONTROLLERİ</h2>
                  </div>
                  <table className="w-full border border-black text-[10px] mb-3">
                      <thead>
                          <tr className="bg-gray-100">
                              <th className="border border-black p-1.5 w-8 text-center">No</th>
                              <th className="border border-black p-1.5 text-left">Kontrol Adımı</th>
                              <th className="border border-black p-1.5 w-10 text-center">E</th>
                              <th className="border border-black p-1.5 w-10 text-center">H</th>
                              <th className="border border-black p-1.5">Açıklama</th>
                          </tr>
                      </thead>
                      <tbody>
                          {activeTemplate.sections[0].questions?.map((q, idx) => (
                              <tr key={q.id}>
                                  <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                                  <td className="border border-black p-1.5">{q.questionText}</td>
                                  <td className="border border-black p-1 text-center align-middle">
                                    <div className={`w-3 h-3 border border-black rounded-[2px] mx-auto flex items-center justify-center ${(answers[q.id] || '').includes('EVET') ? 'bg-black' : ''}`}></div>
                                  </td>
                                  <td className="border border-black p-1 text-center align-middle">
                                    <div className={`w-3 h-3 border border-black rounded-[2px] mx-auto flex items-center justify-center ${(answers[q.id] || '').includes('HAYIR') ? 'bg-black' : ''}`}></div>
                                  </td>
                                  <td className="border border-black p-1.5 italic">{answerNotes[q.id] || ''}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  <div className="border border-black p-2 text-[10px] min-h-[40px]">
                      <strong>{activeTemplate.sections[0].name} Bölüm Notları:</strong> {sectionNotes[activeTemplate.sections[0].id]}
                  </div>
                </div>
              )}
            </div>

            {/* İlk Sayfa İmzaları */}
            <div className="mt-auto">
              <PDFSignatureFooter techName={technicianName} offName={officialName} techSig={techSigRef} offSig={officialSigRef} generalNotes={generalNotes} />
            </div>
          </div>

          {/* SONRAKİ SAYFALAR: KALAN POMPALAR İÇİN (2. Bölümden İtibaren) AYRI SAYFA */}
          {activeTemplate.sections?.slice(1).map(sec => (
            <div key={`pdf-sec-${sec.id}`} className="print-only-page w-[800px] bg-white p-8 flex flex-col justify-between" style={{ minHeight: '1120px' }}>
                <div>
                  <div className="flex justify-between items-center border-b-2 border-red-600 pb-2 mb-6">
                    <h1 className="text-sm font-black uppercase flex-1">{activeTemplate.title || activeTemplate.name}</h1>
                    <h2 className="text-[10px] font-bold text-gray-500 uppercase">{sec.name} KONTROLLERİ</h2>
                  </div>

                  <table className="w-full border border-black text-[11px] mb-4">
                      <thead>
                          <tr className="bg-gray-100">
                              <th className="border border-black p-2 w-8 text-center">No</th>
                              <th className="border border-black p-2 text-left">Kontrol Adımı</th>
                              <th className="border border-black p-2 w-10 text-center">E</th>
                              <th className="border border-black p-2 w-10 text-center">H</th>
                              <th className="border border-black p-2">Açıklama</th>
                          </tr>
                      </thead>
                      <tbody>
                          {sec.questions?.map((q, idx) => (
                              <tr key={q.id}>
                                  <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                                  <td className="border border-black p-2">{q.questionText}</td>
                                  <td className="border border-black p-1 text-center align-middle">
                                    <div className={`w-3 h-3 border border-black rounded-[2px] mx-auto flex items-center justify-center ${(answers[q.id] || '').includes('EVET') ? 'bg-black' : ''}`}></div>
                                  </td>
                                  <td className="border border-black p-1 text-center align-middle">
                                    <div className={`w-3 h-3 border border-black rounded-[2px] mx-auto flex items-center justify-center ${(answers[q.id] || '').includes('HAYIR') ? 'bg-black' : ''}`}></div>
                                  </td>
                                  <td className="border border-black p-2 italic">{answerNotes[q.id] || ''}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  <div className="border border-black p-3 text-[11px] min-h-[60px]">
                      <strong>{sec.name} Bölüm Notları:</strong> {sectionNotes[sec.id]}
                  </div>
                </div>

                <div className="mt-auto">
                  <PDFSignatureFooter techName={technicianName} offName={officialName} techSig={techSigRef} offSig={officialSigRef} />
                </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// PDF İMZA FOOTER BİLEŞENİ
function PDFSignatureFooter({ techName, offName, techSig, offSig, generalNotes }) {
    return (
        <div className="mt-8 border-t-2 border-black pt-4">
            {generalNotes && (
               <div className="text-[10px] mb-4 border border-gray-300 p-2 italic">
                  <strong>Genel Form Açıklaması:</strong> {generalNotes}
               </div>
            )}
            <div className="flex justify-around">
              <div className="text-center w-64">
                  <div className="text-[11px] font-black uppercase mb-1">{techName || '....................'}</div>
                  <div className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-widest border-t border-gray-300 pt-1">Teknisyen İmzası</div>
                  <div className="h-14 border border-gray-300 flex items-center justify-center bg-gray-50">
                      {techSig.current && !techSig.current.isEmpty() && <img src={techSig.current.getCanvas().toDataURL()} className="max-h-full" />}
                  </div>
              </div>
              <div className="text-center w-64">
                  <div className="text-[11px] font-black uppercase mb-1">{offName || '....................'}</div>
                  <div className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-widest border-t border-gray-300 pt-1">Firma Yetkilisi İmzası</div>
                  <div className="h-14 border border-gray-300 flex items-center justify-center bg-gray-50">
                      {offSig.current && !offSig.current.isEmpty() && <img src={offSig.current.getCanvas().toDataURL()} className="max-h-full" />}
                  </div>
              </div>
            </div>
        </div>
    );
}

export default NewForm;