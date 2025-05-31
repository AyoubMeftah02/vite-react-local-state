import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/home';
import Authentication from '@/pages/Authentication';
import { WalletProvider, useWallet } from '@/providers/WalletProvider';

const AppRoutes = () => {
  const { isAuthenticated, setUserAccount } = useWallet();

  const handleAuthenticated = (account: string) => {
    setUserAccount(account);
  };

  return (
    <Routes>
      {isAuthenticated ? (
        <>
          <Route path="/home" element={<Home />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Authentication onAuthenticated={handleAuthenticated} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
};

const Main = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </WalletProvider>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<Main />);
}
