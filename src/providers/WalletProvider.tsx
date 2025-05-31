import  { useState, createContext, useContext } from 'react';
import type {ReactNode} from 'react'
import type { EIP6963ProviderDetail } from '@/types/eip6963';

interface WalletContextType {
  userAccount: string | null;
  selectedWallet: EIP6963ProviderDetail | null;
  isAuthenticated: boolean;
  setUserAccount: (account: string | null) => void;
  setSelectedWallet: (wallet: EIP6963ProviderDetail | null) => void;
  formatAddress: (addr: string) => string;
  logout: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  // State for the currently selected wallet provider's details
  const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail | null>(null);
  // State for the user's connected account address
  const [userAccount, setUserAccount] = useState<string | null>(null);

  const isAuthenticated = !!userAccount;

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 5)}...${addr.substring(39)}`;
  };

  const logout = () => {
    setUserAccount(null);
    setSelectedWallet(null);
  };

  const value: WalletContextType = {
    userAccount,
    selectedWallet,
    isAuthenticated,
    setUserAccount,
    setSelectedWallet,
    formatAddress,
    logout,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};