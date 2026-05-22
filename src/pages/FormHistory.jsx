import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, ChevronLeft, ChevronRight, Calendar, User, Building, Loader2, ShieldCheck, Edit3, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

function FormHistory() {
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // SAYFALAMA VE ARAMA STATE'LERİ
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const fetchPaginatedForms = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/forms/submittedWithPage', {
          params: {
            page: currentPage,
            size: pageSize,
            search: searchTerm
          }
        });

        const data = response.data;
        if (data && data.content) {
          setForms(data.content);
          setTotalPages(data.totalPages);
          setTotalElements(data.totalElements);
        } else {
          setForms(Array.isArray(data) ? data : []);
          setTotalPages(1);
          setTotalElements(Array.isArray(data) ? data.length : 0);
        }
      } catch (error) {
        console.error(error);
        toast.error("Form arşivi yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchPaginatedForms();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pageIn">
      
      {/* BAŞLIK VE ARAMA BARI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Geçmiş Form Arşivi</h2>
          <p className="text-sm text-gray-500">Sistemde kayıtlı toplam <span className="font-semibold text-red-600">{totalElements}</span> adet bakım formu bulundu.</p>
        </div>

        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 text-sm transition bg-white shadow-sm"
            placeholder="Firma, teknisyen veya yetkili ara..."
          />
        </div>
      </div>

      {/* VERİ TABLOSU */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="animate-spin text-red-600 mb-2" size={32} />
          <p className="text-gray-500 text-sm animate-pulse">Arşiv taranıyor...</p>
        </div>
      ) : forms.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6 font-semibold">Form ID / Tarih</th>
                  <th className="py-4 px-6 font-semibold">Müşteri (Firma) / Yetkili</th>
                  <th className="py-4 px-6 font-semibold">Teknisyen</th>
                  <th className="py-4 px-6 font-semibold">Kayıt Denetimi (Audit)</th>
                  <th className="py-4 px-6 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {forms.map((item) => {
                  const formObj = item.filledForm ? item.filledForm : item;
                  
                  // Dinamik seçilen visitDate yoksa oluşturulma tarihine güvenli dönüş (fallback) yapıyoruz
                  const displayDate = formObj.visitDate || formObj.createdDate;

                  return (
                    <tr key={formObj.id} className="hover:bg-gray-50/80 transition group">
                      
                      {/* ID ve DINAMIK SEÇİLEN TARİH */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">#{formObj.id}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1 font-medium">
                          <Calendar size={12} /> {displayDate ? new Date(displayDate).toLocaleDateString('tr-TR') : '-'}
                        </div>
                      </td>
                      
                      {/* FİRMA VE YENİ EKLENEN FİRMA YETKİLİSİ BİLGİSİ */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <Building size={16} className="text-gray-400 group-hover:text-red-500 transition" />
                          {formObj.company?.name || 'Bilinmeyen Firma'}
                        </div>
                        {/* Veritabanına yeni kaydettiğimiz firma yetkilisini burada sergiliyoruz */}
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1 font-medium">
                          <UserCheck size={13} className="text-gray-400" /> 
                          Yetkili: <span className="text-gray-600 font-semibold ml-0.5">{formObj.companyOfficialName || 'Belirtilmedi'}</span>
                        </div>
                      </td>
                      
                      {/* TEKNİSYEN */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                          <User size={16} className="text-gray-400" />
                          {formObj.technicianName}
                        </div>
                      </td>

                      {/* KAYIT DENETIMI (JPA AUDITING YEDEKLİ SİSTEMİ) */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 text-xs">
                          {/* Oluşturan Bilgisi */}
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded bg-purple-100 text-purple-600" title="Oluşturan">
                              <ShieldCheck size={12} />
                            </span>
                            <span className="text-gray-500 font-medium">
                              Oluşturan: <span className="text-gray-900 font-bold">{formObj.createdUser || formObj.technicianName || 'SYSTEM'}</span>
                            </span>
                          </div>
                          
                          {/* Güncelleyen Bilgisi */}
                          {formObj.updateUser && formObj.updateUser !== formObj.createdUser && (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-600" title="Son Güncelleyen">
                                <Edit3 size={12} />
                              </span>
                              <span className="text-gray-500 font-medium text-[11px]">
                                Revize: <span className="text-gray-900 font-bold">{formObj.updateUser}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* İŞLEM BUTONU (Doğru Düzenleme URL'i ile Senkronize) */}
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/form-duzenle/${formObj.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 px-3 py-2 rounded-xl transition border border-transparent hover:border-red-100 shadow-sm"
                        >
                          <FileText size={14} /> Detay / Düzenle
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SAYFA LAMA (PAGINATION) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500 font-medium">
                Toplam <span className="font-bold text-gray-700">{totalPages}</span> sayfadan <span className="font-bold text-gray-700">{currentPage + 1}.</span> sayfa gösteriliyor
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  <ChevronLeft size={16} />
                </button>

                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`w-9 h-9 text-xs font-bold rounded-xl transition shadow-sm ${
                      currentPage === index
                        ? 'bg-red-600 text-white shadow-red-600/20'
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages - 1}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
          Arama kriterlerine uygun veya sisteme kayıtlı hiçbir form bulunamadı.
        </div>
      )}
    </div>
  );
}

export default FormHistory;