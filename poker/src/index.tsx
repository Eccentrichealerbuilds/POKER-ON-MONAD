import { Buffer } from 'buffer';
// Ensure Buffer is available globally for libraries that expect Node's Buffer
if (!(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

// Suppress React warning about `isActive` prop from Privy library
const originalWarn = console.warn;
const originalError = console.error;
const suppressIsActive = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('isActive')) {
    return true;
  }
  return false;
};
console.warn = (...args) => {
  if (suppressIsActive(...args)) return;
  originalWarn.apply(console, args);
};
console.error = (...args) => {
  if (suppressIsActive(...args)) return;
  originalError.apply(console, args);
};
import './index.css';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { App } from "./App";
import { monadTestnet } from './entropyDealerV2';

// Privy App ID should be set in poker/.env as VITE_PRIVY_APP_ID
const privyAppId = ((import.meta as any).env?.VITE_PRIVY_APP_ID || '') as string;

const container = document.getElementById('root');
if (container) {
  if (!privyAppId) {
    console.warn('[Privy] VITE_PRIVY_APP_ID is missing in poker/.env. Authentication will not work.');
  }
  const root = createRoot(container);
  root.render(
    <PrivyProvider
      appId={privyAppId}
      config={{
        embeddedWallets: {
          createOnLogin: 'users-without-wallets', // Auto-create wallet on email login
        },
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
        loginMethodsAndOrder: {
          primary: ['email'],
          overflow: ['google', 'discord'],
        },
        appearance: {
          theme: 'dark',
          accentColor: '#7C3AED', // Purple color matching your UI
          showWalletLoginFirst: false, // Prioritize email login
        },
      }}
    >
      <App />
    </PrivyProvider>
  );
}