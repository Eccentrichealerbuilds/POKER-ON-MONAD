import React, { useState } from 'react';
import { X, ArrowLeft, Search } from 'lucide-react';
import { Button, Input, Label, Card } from '../ui/Shared';

interface JoinTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinTable: (data: { code: string; nickname: string }) => void;
}

export function JoinTableModal({ isOpen, onClose, onJoinTable }: JoinTableModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleFindTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setIsLoading(true);
    // Simulate API lookup
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 600);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    onJoinTable({ code, nickname: nickname.trim() });
  };

  const reset = () => {
    setStep(1);
    setCode('');
    setNickname('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="text-zinc-500 hover:text-zinc-300 transition-colors mr-1">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-zinc-100">
              {step === 1 ? 'Join Table' : 'Table Found'}
            </h2>
          </div>
          <button onClick={reset} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleFindTable} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableCode">Table Link or Code</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  id="tableCode"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Paste code here..."
                  className="pl-9"
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-zinc-500">
                Enter the unique code shared by the table host.
              </p>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Find Table'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-zinc-200">Poker Table</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-900/50">
                  Ready to Join
                </span>
              </div>
              <div className="text-sm text-zinc-400">
                <span>Code: {code}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinNickname">Your Nickname</Label>
              <Input
                id="joinNickname"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Enter your display name"
                required
                autoFocus
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full">
                Join Now
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
