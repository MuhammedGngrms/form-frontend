import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa ilk açıldığında tarayıcı hafızasında daha önce kaydedilmiş bir kullanıcı var mı bak
    const storedUser = localStorage.getItem('seba_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Giriş Yapma Fonksiyonu
  const login = (authData) => {
    const userData = {
      token: authData.token,
      username: authData.username,
      roles: authData.roles // ['ROLE_ADMIN'] veya ['ROLE_TECHNICIAN']
    };
    setUser(userData);
    localStorage.setItem('seba_user', JSON.stringify(userData));
  };

  // Çıkış Yapma Fonksiyonu
  const logout = () => {
    setUser(null);
    localStorage.removeItem('seba_user');
    window.location.href = '/login';
  };

  // Kullanıcının Admin olup olmadığını jet hızıyla kontrol eden yardımcı fonksiyon
  const isAdmin = () => user?.roles?.includes('ROLE_ADMIN');

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}