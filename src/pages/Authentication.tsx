import { useState } from 'react';
import type { EIP6963ProviderDetail } from '@/types/eip6963';
import { useSyncProviders } from '@/hooks/useSyncProviders';

interface MMError {
  code: number;
  message: string;
}

interface AuthenticationProps {
  onAuthenticated: (userAccount: string) => void;
}

const Authentication = ({ onAuthenticated }: AuthenticationProps) => {
  // State for the currently selected wallet provider's details
  const [, setSelectedWallet] = useState<EIP6963ProviderDetail | undefined>();
  // Fetches the list of available EIP-6963 providers
  const providers = useSyncProviders();

  // State for storing error messages
  const [errorMessage, setErrorMessage] = useState('');
  // Function to clear the error message
  const clearError = () => setErrorMessage('');
  // Function to set an error message
  const setError = (error: string) => setErrorMessage(error);
  // Boolean flag indicating if there is an active error message
  const isError = !!errorMessage;

  // Handles the connection process when a wallet provider is selected
  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    try {
      // Request accounts from the selected provider
      const accounts = (await providerWithInfo.provider.request({
        method: 'eth_requestAccounts',
      })) as string[];

      // Update state with the selected wallet and user account
      setSelectedWallet(providerWithInfo);
      const userAccount = accounts?.[0];
      clearError(); // Clear any previous errors on successful connection
      
      // Call the callback to notify parent component of successful authentication
      if (userAccount) {
        onAuthenticated(userAccount);
      }
    } catch (error) {
      console.error('Connection Error:', error);
      // Assert the error object to the MMError interface to access code and message
      // It's good practice to ensure 'error' actually matches this structure in a real app
      const mmError: MMError = error as MMError;
      setError(`Code: ${mmError.code} \n Error Message: ${mmError.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      {/* Section to display detected wallet providers */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Connect Your Wallet to Continue</h2>
      <div className="w-full max-w-md grid gap-4 mb-6">
        {providers.length > 0 ? (
          providers?.map((provider: EIP6963ProviderDetail) => (
            <button
              key={provider.info.uuid}
              onClick={() => handleConnect(provider)}
              className="flex items-center justify-center gap-3 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <img
                src={provider.info.icon}
                alt={provider.info.name}
                className="w-8 h-8"
              />
              <div className="font-medium text-gray-700">{provider.info.name}</div>
            </button>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 bg-gray-100 rounded-lg">
            {/* Message displayed when no providers are detected */}
            No Announced Wallet Providers
          </div>
        )}
      </div>

      {/* Section to display error messages */}
      {isError && (
        <div className="w-full max-w-md bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded cursor-pointer" onClick={clearError}>
          <div>
            <strong className="font-bold">Error:</strong> {errorMessage}
            <div className="text-xs mt-1 text-red-500">(click to dismiss)</div>
          </div>
        </div>
      )}
    </div>
  );}


export default Authentication;


















