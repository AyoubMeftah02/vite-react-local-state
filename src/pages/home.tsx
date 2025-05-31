import Navbar from '@/components/navbar';
import MapComp from '@/components/map';
import { useWallet } from '@/providers/WalletProvider';

const Home = () => {
  const { userAccount, formatAddress, logout } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50">
      {userAccount && (
        <div className="flex justify-end items-center p-2.5 text-right text-gray-800">
          <span className="font-mono text-sm">
            Connected: {formatAddress(userAccount)}
          </span>
          <button
            onClick={logout}
            className="ml-3 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
      <header className="p-4 bg-black shadow-sm">
        <Navbar />
      </header>
      <main className="container mx-auto p-4">
        <MapComp userAccount={userAccount || ''} />
      </main>
    </div>
  );
};

export default Home;
