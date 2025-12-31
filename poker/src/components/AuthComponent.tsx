import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

function AuthNotConfigured() {
  return (
    <div className="text-yellow-400 text-sm">Authentication not configured</div>
  );
}

function PrivyAuth({ onAddressChange }: { onAddressChange: (address: string) => void }) {
  const { authenticated, user, ready, logout, login } = usePrivy();
  const { wallets } = useWallets();
  const [accountAddress, setAccountAddress] = useState<string>('');

  useEffect(() => {
    if (authenticated && ready) {
      // Get embedded wallet address
      const embeddedWallet = wallets?.find((w) => (w as any).walletClientType === 'privy');
      if (embeddedWallet?.address) {
        setAccountAddress(embeddedWallet.address);
        onAddressChange(embeddedWallet.address);
      }
    } else {
      setAccountAddress('');
      onAddressChange('');
    }
  }, [authenticated, ready, wallets, onAddressChange]);

  if (!ready) {
    return <div className="text-white text-sm">Loading...</div>;
  }

  if (!authenticated) {
    return (
      <button onClick={login} className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
        Sign In
      </button>
    );
  }

  const displayName = user?.email?.address || (accountAddress ? `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}` : 'User');

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-green-400">{displayName}</span>
      <button onClick={logout} className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
        Logout
      </button>
    </div>
  );
}

export default function AuthComponent({ onAddressChange }: { onAddressChange: (address: string) => void }) {
  const privyAppId = (import.meta as any).env?.VITE_PRIVY_APP_ID as string | undefined;
  if (!privyAppId) {
    return <AuthNotConfigured />;
  }
  return <PrivyAuth onAddressChange={onAddressChange} />;
}
