import { useState } from 'react';
import { Button, Input, Label, Card } from '../ui/Shared';

interface PlayerJoinModalProps {
  isOpen: boolean;
  onJoin: (nickname: string) => void;
}

export function PlayerJoinModal({ isOpen, onJoin }: PlayerJoinModalProps) {
  const [nickname, setNickname] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onJoin(nickname.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800 shadow-2xl">
        <h2 className="text-xl font-bold text-zinc-100 mb-6">Join Table</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Your Nickname</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Enter your display name"
              required
              autoFocus
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full">
              Join Game
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
