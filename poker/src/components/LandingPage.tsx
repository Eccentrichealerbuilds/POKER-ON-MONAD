import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { CreateTableModal } from './modals/CreateTableModal';
import { JoinTableModal } from './modals/JoinTableModal';
import { Toaster, toast } from 'sonner';
import { Copy, LogOut, Plus, Users, Key, Send, Check, Wallet, ChevronLeft } from 'lucide-react';
import { formatEther, parseEther, createWalletClient, custom, type Address } from 'viem';
import { getPublicClient, monadTestnet } from '../entropyDealerV2';
import { Button, Input, Label, Card } from './ui/Shared';
import { ConnectionStatus } from './ConnectionStatus';

export const LandingPage: FC = () => {
  const navigate = useNavigate();
  const { login, authenticated, user, logout, exportWallet } = usePrivy();
  const { wallets } = useWallets();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  const embeddedWallet = wallets?.find(wallet => wallet.walletClientType === 'privy');
  const embeddedAddress = embeddedWallet?.address as string | undefined;
  const shortAddress = embeddedAddress ? `${embeddedAddress.slice(0, 6)}...${embeddedAddress.slice(-4)}` : '';
  const username = user?.email?.address || shortAddress || 'Anonymous';

  // Fetch live on-chain balance for embedded wallet
  const [embeddedBalance, setEmbeddedBalance] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetchBalance = async () => {
      try {
        if (embeddedAddress) {
          const client = getPublicClient();
          const bal = await client.getBalance({ address: embeddedAddress as Address });
          if (!cancelled) setEmbeddedBalance(Number.parseFloat(formatEther(bal)).toLocaleString(undefined, { maximumFractionDigits: 4 }));
        } else if (!cancelled) {
          setEmbeddedBalance(null);
        }
      } catch {
        if (!cancelled) setEmbeddedBalance(null);
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [embeddedAddress]);

  const handleCopyAddress = () => {
    if (!embeddedAddress) return;
    navigator.clipboard.writeText(embeddedAddress);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      setIsFlipped(false);
      toast.info('You have been logged out');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportKey = async () => {
    if (!embeddedAddress) {
      toast.error('No embedded wallet found');
      return;
    }
    try {
      if (typeof exportWallet === 'function') {
        await exportWallet({ address: embeddedAddress as Address });
      } else {
        toast.info('Export unavailable. Use wallet UI to export.');
      }
    } catch (e: any) {
      toast.error(`Failed to export key${e?.message ? `: ${e.message}` : ''}`);
    }
  };

  const handleSend = async () => {
    if (!embeddedWallet || !embeddedAddress) {
      toast.error('No embedded wallet found');
      return;
    }
    if (!sendRecipient || !/^0x[0-9a-fA-F]{40}$/.test(sendRecipient)) {
      toast.error('Enter a valid recipient address');
      return;
    }
    const amt = Number(sendAmount);
    if (!sendAmount || !Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      setIsSending(true);
      const provider = await embeddedWallet.getEthereumProvider();
      const walletClient = createWalletClient({ chain: monadTestnet, transport: custom(provider) });
      const value = parseEther(sendAmount);
      const hash = await walletClient.sendTransaction({
        account: embeddedAddress as Address,
        to: sendRecipient as Address,
        value,
      });
      const client = getPublicClient();
      await client.waitForTransactionReceipt({ hash });
      // Refresh balance
      try {
        const bal = await client.getBalance({ address: embeddedAddress as Address });
        setEmbeddedBalance(Number.parseFloat(formatEther(bal)).toLocaleString(undefined, { maximumFractionDigits: 4 }));
      } catch {}
      toast.success('Transaction confirmed');
      setSendRecipient('');
      setSendAmount('');
      setIsFlipped(false);
    } catch (e: any) {
      toast.error(`Transaction failed${e?.message ? `: ${e.message}` : ''}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTable = (data: { nickname: string; startStack: number; smallBlind: number; bigBlind: number }) => {
    setShowCreate(false);
    const roomId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? (crypto.randomUUID() as string).slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
    try {
      sessionStorage.setItem('pendingCreate', JSON.stringify({
        roomId,
        nickname: data.nickname,
        stack: data.startStack,
        sb: data.smallBlind,
        bb: data.bigBlind
      }));
    } catch {}
    navigate(`/game/${roomId}`);
  };

  const handleJoinTable = (data: { code: string; nickname: string }) => {
    setShowJoin(false);
    // Extract room ID from code/link
    let roomId = data.code;
    try {
      const url = new URL(data.code);
      const m = url.pathname.match(/(?:^|\/)game\/([A-Za-z0-9_-]+)/);
      if (m) roomId = m[1];
    } catch {
      roomId = data.code.replace(/[^A-Za-z0-9_-]/g, '');
    }
    try {
      sessionStorage.setItem('pendingJoin', JSON.stringify({ nickname: data.nickname }));
    } catch {}
    navigate(`/game/${roomId}`);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800">
      {/* Navbar */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-950 font-bold font-serif">
              M
            </div>
            <span className="font-serif font-bold text-lg tracking-tight">
              Monad Poker
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus />
            {authenticated && (
              <>
                <span className="text-sm text-zinc-400 hidden sm:inline-block">
                  Signed in as{' '}
                  <span className="text-zinc-100 font-medium">{username}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoading}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {!authenticated ? (
          // Pre-Auth View
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4 max-w-lg">
              <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight text-zinc-100">
                Pure Poker.
                <br />
                <span className="text-zinc-500">No Distractions.</span>
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed">
                Experience the next generation of decentralized poker on Monad.
                Minimal latency, maximum transparency. Join the table today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md justify-center">
              <Button size="lg" onClick={handleLogin} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? 'Connecting...' : 'SIGN IN'}
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setShowJoin(true)}>
                Join Table
              </Button>
            </div>
          </div>
        ) : (
          // Post-Auth View
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            {/* Left Column: Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Lobby</h2>
                <p className="text-zinc-400">
                  Select a table or create your own to get started.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card
                  className="p-6 hover:bg-zinc-900 transition-colors cursor-pointer group border-zinc-800"
                  onClick={() => setShowCreate(true)}
                >
                  <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-zinc-700 transition-colors">
                    <Plus className="w-5 h-5 text-zinc-100" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Create Table</h3>
                  <p className="text-sm text-zinc-400">
                    Host a private game for friends or a public tournament.
                  </p>
                </Card>

                <Card
                  className="p-6 hover:bg-zinc-900 transition-colors cursor-pointer group border-zinc-800"
                  onClick={() => setShowJoin(true)}
                >
                  <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-zinc-700 transition-colors">
                    <Users className="w-5 h-5 text-zinc-100" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Join Table</h3>
                  <p className="text-sm text-zinc-400">
                    Enter a room code to jump into the action immediately.
                  </p>
                </Card>
              </div>
            </div>

            {/* Right Column: Wallet Card */}
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Wallet</h2>
                  <span className="text-xs text-zinc-500 font-mono">MONAD TESTNET</span>
                </div>

                {/* Flippable Card Container */}
                <div className="relative w-full aspect-[1.586/1] group perspective-1000 mb-4 sm:mb-6">
                  <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* FRONT OF CARD */}
                    <div className="absolute w-full h-full backface-hidden">
                      <Card className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 shadow-xl relative overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                        <div className="flex justify-between items-start z-10">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-zinc-800 rounded-lg">
                              <Wallet className="w-5 h-5 text-zinc-300" />
                            </div>
                            <span className="font-medium text-zinc-300">Main Wallet</span>
                          </div>
                          <div className="flex items-center gap-2 bg-zinc-900/50 rounded-full px-3 py-1 border border-zinc-800">
                            <span className="text-xs font-mono text-zinc-400">{shortAddress}</span>
                            <button onClick={handleCopyAddress} className="text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none" aria-label="Copy address">
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="z-10">
                          <div className="text-zinc-400 text-sm font-medium mb-1">Total Balance</div>
                          <div className="text-4xl font-bold text-zinc-100 tracking-tight flex items-baseline gap-2">
                            {embeddedBalance ?? '—'}{' '}
                            <span className="text-lg text-zinc-500 font-normal">MON</span>
                          </div>
                        </div>

                        <div className="z-10 pt-4 border-t border-zinc-800/50">
                          <Button className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200" onClick={() => setIsFlipped(true)}>
                            <Send className="w-4 h-4 mr-2" />
                            Send Token
                          </Button>
                        </div>
                      </Card>
                    </div>

                    {/* BACK OF CARD */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 pointer-events-auto" style={{ zIndex: isFlipped ? 10 : -1 }}>
                      <Card className="w-full h-full p-6 flex flex-col bg-zinc-900 border-zinc-800 shadow-xl relative touch-auto">
                        <div className="flex items-center justify-between mb-6 relative z-20">
                          <button
                            type="button"
                            onClick={() => setIsFlipped(false)}
                            className="flex items-center text-sm text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px] -ml-2 pl-2 pr-3 touch-manipulation"
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back
                          </button>
                          <span className="text-sm font-medium text-zinc-300">Send MON</span>
                        </div>

                        <div className="space-y-5 flex-1 relative z-10">
                          <div className="space-y-2">
                            <Label htmlFor="recipient" className="text-sm">Recipient Address</Label>
                            <Input
                              id="recipient"
                              placeholder="0x..."
                              className="bg-zinc-950/50 border-zinc-800 h-10 text-sm touch-manipulation"
                              type="text"
                              value={sendRecipient}
                              onChange={(e) => setSendRecipient(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="amount" className="text-sm">Amount (MON)</Label>
                            <div className="relative">
                              <Input
                                id="amount"
                                placeholder="0.00"
                                className="bg-zinc-950/50 border-zinc-800 h-10 text-sm pr-16 touch-manipulation"
                                type="number"
                                step="0.01"
                                value={sendAmount}
                                onChange={(e) => setSendAmount(e.target.value)}
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-800 touch-manipulation"
                                onClick={() => embeddedBalance && setSendAmount(embeddedBalance.replace(/,/g, ''))}
                              >
                                MAX
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-zinc-800/50 relative z-20">
                          <Button
                            type="button"
                            variant="outline"
                            size="md"
                            className="w-full border-zinc-700 min-h-[44px] touch-manipulation"
                            onClick={handleExportKey}
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Export Key
                          </Button>
                          <Button
                            type="button"
                            size="md"
                            className="w-full min-h-[44px] touch-manipulation"
                            onClick={handleSend}
                            disabled={isSending}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {isSending ? 'Sending...' : 'Send Now'}
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Warning text - shifts down when card is flipped */}
                <div className={`p-3 sm:p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50 transition-all duration-700 ${isFlipped ? 'mt-16 sm:mt-20' : ''}`}>
                  <p className="text-[11px] sm:text-xs text-zinc-500 text-center leading-relaxed">
                    Your keys are stored locally. Never share your private key with anyone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateTableModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreateTable={handleCreateTable}
      />
      <JoinTableModal
        isOpen={showJoin}
        onClose={() => setShowJoin(false)}
        onJoinTable={handleJoinTable}
      />

      {/* CSS for 3D Flip Effect */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .touch-auto {
          touch-action: auto;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-bottom-4 {
          from { transform: translateY(1rem); }
          to { transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.5s ease-out, slide-in-from-bottom-4 0.5s ease-out;
        }
      `}</style>

      <Toaster position="top-center" richColors />
    </div>
  );
};

export default LandingPage;
