// Extends WindowEventMap interface, including a custom event eip6963:announceProvider.
declare global {
  interface WindowEventMap {
    'eip6963:announceProvider': CustomEvent;
  }
}

import type { EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from '@/types/eip6963';

// Array that stores detected wallet providers and their details.
let providers: EIP6963ProviderDetail[] = [];


export const store = {
  
  value: () => providers,
  
  subscribe: (callback: () => void) => {
    function onAnnouncement(event: EIP6963AnnounceProviderEvent) {
      if (providers.map((p) => p.info.uuid).includes(event.detail.info.uuid))
        return;
      providers = [...providers, event.detail];
      callback();
    }
    window.addEventListener('eip6963:announceProvider', onAnnouncement);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () =>
      window.removeEventListener('eip6963:announceProvider', onAnnouncement);
  },
};
