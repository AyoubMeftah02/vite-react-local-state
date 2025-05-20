// src/types/eip6963.ts

// Standard EIP-1193 provider interface
export interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (eventName: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (eventName: string, listener: (...args: unknown[]) => void) => void;
  // Add other EIP-1193 methods if your application uses them
}

// EIP-6963 ProviderInfo interface
export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string; // data URI RFC 2397
  rdns: string;
}

// EIP-6963 ProviderDetail interface, which includes ProviderInfo and the EIP-1193 provider instance
export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

// EIP-6963 AnnounceProviderEvent interface for the custom event
export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  detail: EIP6963ProviderDetail;
}