import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { Activity } from 'lucide-react';

// Bileşenler ve Sayfalar
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewForm from './pages/NewForm';
import FormHistory from './pages/FormHistory';
import EditForm from './pages/EditForm'; // Düzenleme sayfanızın import adı farklıysa güncelleyin
import CompanyManagement from './pages/CompanyManagement';
import QuestionManagement from './pages/QuestionManagement';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import SystemLogs from './pages/SystemLogs';
import TemplateManagement from './pages/TemplateManagement';

// 1. ADIM: GÜVENLİK DUVARI BİLEŞENİ (Giriş Kontrolü)
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Sayfa yüklenirken boş ekran yerine şık bir yükleniyor göster
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Activity className="animate-spin text-red-600" size={36} />
      </div>
    );
  }

  // Giriş yapmamışsa doğrudan Login sayfasına şutla
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Eğer bu sayfa sadece Admin'e özelse ve giren kişi Admin değilse Dashboard'a at
  if (allowedRoles && !allowedRoles.some(role => user.roles?.includes(role))) {
    return <Navigate to="/" replace />;
  }

  // Her şey yolundaysa sayfayı göster
  return children;
}

// 2. ADIM: PROJENİN ANA ORKESTRASI
function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="flex bg-gray-50 min-h-screen font-sans">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

        {/* Kullanıcı giriş yaptıysa Sol Menüyü göster, yapmadıysa (Login ekranındaysa) gizle */}
        {user && <Sidebar />}

        {/* Ana İçerik Alanı */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto h-full min-w-0 bg-gray-50/50">
          <Routes>
            {/* Halka Açık Tek Rota: Login */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

            {/* KORUMALI ROTALAR (Giriş Yapılması Şart Olanlar) */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/yeni-form" element={
              <ProtectedRoute>
                <NewForm />
              </ProtectedRoute>
            } />
            
            <Route path="/gecmis-formlar" element={
              <ProtectedRoute>
                <FormHistory />
              </ProtectedRoute>
            } />

            <Route path="/form-duzenle/:id" element={
              <ProtectedRoute>
                <EditForm />
              </ProtectedRoute>
            } />

            {/* SADECE SÜPER ADMİNLERİN GİREBİLECEĞİ ÖZEL AYAR SAYFALARI */}
            <Route path="/musteri-yonetimi" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <CompanyManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/soru-yonetimi" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <QuestionManagement />
              </ProtectedRoute>
            } />

            <Route 
              path="/personel-yonetimi" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/sistem-loglari" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <SystemLogs />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/sablon-yonetimi" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <TemplateManagement />
                </ProtectedRoute>
              } 
            />

            {/* Yanlış veya Olmayan Bir Link Girilirse Otomatik Dashboard'a Yönlendir */}
            <Route path="*" replace element={<Navigate to="/" />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;