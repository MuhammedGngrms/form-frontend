import { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight, Edit2, Check, X, HelpCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

function QuestionManagement() {
  const [questions, setQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newInputType, setNewInputType] = useState('YES_NO');
  
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingType, setEditingType] = useState('YES_NO');

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Satır içi onayı tutacağımız state (Hangi sorunun silme butonuna basıldı?)
  const [confirmingId, setConfirmingId] = useState(null);

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/forms/templates/1/questions');
      setQuestions(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Sorular yüklenirken bir hata oluştu!");
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      toast.error("Soru açıklaması boş bırakılamaz!");
      return;
    }

    setIsSubmitting(true);
    const loadToast = toast.loading("Kontrol maddesi ekleniyor...");
    try {
      const nextOrder = questions.length + 1;
      await api.post('/questions', {
        questionText: newQuestionText,
        inputType: newInputType,
        orderIndex: nextOrder
      });
      setNewQuestionText('');
      toast.success("Kontrol maddesi başarıyla eklendi.", { id: loadToast });
      fetchQuestions();
    } catch (error) {
      console.error(error);
      toast.error("Ekleme işlemi başarısız!", { id: loadToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setEditingText(q.questionText);
    setEditingType(q.inputType);
    setConfirmingId(null); // Düzenlemeye geçilirse silme onayını kapat
  };

  const handleUpdateQuestion = async (q) => {
    if (!editingText.trim()) {
      toast.error("Soru açıklaması boş olamaz!");
      return;
    }
    const loadToast = toast.loading("Madde güncelleniyor...");
    try {
      await api.put(`/questions/${q.id}`, {
        questionText: editingText,
        inputType: editingType,
        orderIndex: q.orderIndex
      });
      setEditingId(null);
      toast.success("Kontrol maddesi güncellendi.", { id: loadToast });
      fetchQuestions();
    } catch (error) {
      console.error(error);
      toast.error("Güncelleme hatası!", { id: loadToast });
    }
  };

  // Eski window.confirm yerine sadece "Evet" dendiğinde çalışacak fonksiyon
  const confirmTogglePassive = async (id) => {
    const loadToast = toast.loading("Madde gizleniyor...");
    try {
      await api.delete(`/questions/${id}`);
      toast.success("Madde pasif yapıldı (Formlardan gizlendi).", { id: loadToast });
      setConfirmingId(null); // İşlem bitince onayı kapat
      fetchQuestions();
    } catch (error) {
      console.error(error);
      toast.error("İşlem başarısız!", { id: loadToast });
    }
  };

  const handleToggleActive = async (q) => {
    const loadToast = toast.loading("Madde aktif ediliyor...");
    try {
      await api.put(`/questions/${q.id}`, {
        questionText: q.questionText,
        inputType: q.inputType,
        orderIndex: q.orderIndex,
        status: 'S'
      });
      toast.success("Madde başarıyla aktif edildi.", { id: loadToast });
      fetchQuestions();
    } catch (error) {
      console.error(error);
      toast.error("Aktif etme hatası!", { id: loadToast });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-6 md:p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center space-x-2">
        <HelpCircle className="text-red-600" />
        <span>Bakım Formu Soru Ayarları</span>
      </h2>

      <form onSubmit={handleAddQuestion} className="mb-8 bg-gray-50 p-4 rounded-lg border flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-gray-700 font-medium mb-1 text-sm">Yeni Kontrol Maddesi</label>
          <input type="text" disabled={isSubmitting} className="w-full border p-2.5 rounded bg-white focus:ring-2 focus:ring-red-500" placeholder="Örn: Pompa odası temiz mi?" value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-gray-700 font-medium mb-1 text-sm">Cevap Tipi</label>
          <select disabled={isSubmitting} className="w-full border p-2.5 rounded bg-white" value={newInputType} onChange={(e) => setNewInputType(e.target.value)}>
            <option value="YES_NO">Evet / Hayır</option>
            <option value="TEXT">Yazı Alanı</option>
          </select>
        </div>
        <button type="submit" disabled={isSubmitting} className={`font-medium py-2.5 px-5 rounded flex items-center justify-center space-x-2 w-full md:w-auto text-white transition ${isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          <span>{isSubmitting ? "Ekleniyor..." : "Madde Ekle"}</span>
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white text-sm">
              <th className="p-3 w-16 text-center">Sıra</th>
              <th className="p-3">Kontrol Maddesi Açıklaması</th>
              <th className="p-3 w-32">Giriş Tipi</th>
              <th className="p-3 w-24 text-center">Durum</th>
              <th className="p-3 text-right w-64">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, index) => (
              <tr key={q.id} className="border-b hover:bg-gray-50 transition text-sm">
                <td className="p-3 text-center font-bold text-gray-500">{index + 1}</td>
                <td className="p-3 font-medium text-gray-800">
                  {editingId === q.id ? (
                    <input type="text" className="border p-1.5 rounded w-full" value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                  ) : (
                    <span className={q.status === 'D' ? 'line-through text-gray-400' : ''}>{q.questionText}</span>
                  )}
                </td>
                <td className="p-3">
                  {editingId === q.id ? (
                    <select className="border p-1.5 rounded w-full" value={editingType} onChange={(e) => setEditingType(e.target.value)}>
                      <option value="YES_NO">Evet / Hayır</option>
                      <option value="TEXT">Metin</option>
                    </select>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                      {q.inputType === 'YES_NO' ? 'Evet / Hayır' : 'Yazı Alanı'}
                    </span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {q.status === 'S' ? (
                    <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-bold">Aktif</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-xs font-bold">Pasif</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  {editingId === q.id ? (
                    // 1. DÜZENLEME MODU
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleUpdateQuestion(q)} className="bg-blue-600 text-white p-1.5 rounded"><Check size={16} /></button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white p-1.5 rounded"><X size={16} /></button>
                    </div>
                  ) : confirmingId === q.id ? (
                    // 2. EMİN MİSİNİZ ONAY MODU
                    <div className="flex justify-end items-center space-x-2">
                      <span className="text-xs text-red-600 font-bold mr-1">Emin misin?</span>
                      <button onClick={() => confirmTogglePassive(q.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold transition">Evet</button>
                      <button onClick={() => setConfirmingId(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-xs font-bold transition">Hayır</button>
                    </div>
                  ) : (
                    // 3. STANDART BUTONLAR
                    <div className="flex justify-end space-x-2 items-center">
                      <button onClick={() => startEdit(q)} className="bg-yellow-500 text-white p-1.5 rounded hover:bg-yellow-600" title="Düzenle"><Edit2 size={16} /></button>
                      {q.status === 'S' ? (
                        <button onClick={() => setConfirmingId(q.id)} className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700" title="Pasife Al"><ToggleRight size={16} /></button>
                      ) : (
                        <button onClick={() => handleToggleActive(q)} className="bg-gray-600 text-white p-1.5 rounded hover:bg-gray-700" title="Aktif Et"><ToggleLeft size={16} /></button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QuestionManagement;