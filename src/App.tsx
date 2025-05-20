import { useState } from "react"
import { useSyncProviders } from "./hooks/useSyncProviders"
import "./App.css"

// Define the structure for MetaMask-like errors
interface MMError {
  code: number;
  message: string;
}

// Define the structure for EIP6963 provider details (assuming it's globally available or implicitly typed from useSyncProviders)
// If EIP6963ProviderDetail is not globally defined, it should be imported or defined here.
// type EIP6963ProviderDetail = { /* ... structure ... */ };

const App = () => {
  // State for the currently selected wallet provider's details
  const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail>()
  // State for the user's connected account address
  const [userAccount, setUserAccount] = useState<string>("")
  // Fetches the list of available EIP-6963 providers
  const providers = useSyncProviders()

  // State for storing error messages
  const [errorMessage, setErrorMessage] = useState("")
  // Function to clear the error message
  const clearError = () => setErrorMessage("")
  // Function to set an error message
  const setError = (error: string) => setErrorMessage(error)
  // Boolean flag indicating if there is an active error message
  const isError = !!errorMessage

  // Formats an Ethereum address for display (e.g., 0x123...abc)
  // Display a readable user address.
  const formatAddress = (addr: string) => {
    // The original line: const upperAfterLastTwo = addr.slice(0, 2) + addr.slice(2);
    // This effectively means upperAfterLastTwo is the same as addr.
    // Keeping original logic for now, but it could be simplified to just use 'addr'.
    const upperAfterLastTwo = addr.slice(0, 2) + addr.slice(2)
    return `${upperAfterLastTwo.substring(0, 5)}...${upperAfterLastTwo.substring(39)}`
  }

  // Handles the connection process when a wallet provider is selected
  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    try {
      // Request accounts from the selected provider
      const accounts = await providerWithInfo.provider.request({
        method: "eth_requestAccounts"
      }) as string[]

      // Update state with the selected wallet and user account
      setSelectedWallet(providerWithInfo)
      setUserAccount(accounts?.[0])
      clearError() // Clear any previous errors on successful connection
    } catch (error) {
      console.error("Connection Error:", error)
      // Assert the error object to the MMError interface to access code and message
      // It's good practice to ensure 'error' actually matches this structure in a real app
      const mmError: MMError = error as MMError
      setError(`Code: ${mmError.code} \nError Message: ${mmError.message}`)
    }
  }
  
  // Main component render method
  return (
    <div className="App">
      {/* Section to display detected wallet providers */}
      <h2>Wallets Detected:</h2>
      <div className="providers">
        {
          providers.length > 0 ? providers?.map((provider: EIP6963ProviderDetail) => (
            <button key={provider.info.uuid} onClick={() => handleConnect(provider)} >
              <img src={provider.info.icon} alt={provider.info.name} />
              <div>{provider.info.name}</div>
            </button>
          )) :
            <div>
              {/* Message displayed when no providers are detected */}
              No Announced Wallet Providers
            </div>
        }
      </div>
      <hr />
      {/* Section to display selected wallet information */}
      <h2>{userAccount ? "Selected Wallet:" : "No Wallet Selected"}</h2>
      {userAccount && selectedWallet && // Ensure both userAccount and selectedWallet are available
        <div className="selectedWallet">
          <img src={selectedWallet.info.icon} alt={selectedWallet.info.name} />
          <div>{selectedWallet.info.name}</div>
          <div>({formatAddress(userAccount)})</div>
        </div>
      }
      {/* Section to display error messages */}
      <div className="mmError" style={isError ? { backgroundColor: "brown", color: "white", padding: "10px", marginTop: "10px", borderRadius: "5px" } : {}}>
        {isError &&
          <div onClick={clearError} style={{ cursor: "pointer" }}>
            <strong>Error:</strong> {errorMessage}
            <br />
            <small>(click to dismiss)</small>
          </div>
        }
      </div>
    </div>
  )
}

export default App