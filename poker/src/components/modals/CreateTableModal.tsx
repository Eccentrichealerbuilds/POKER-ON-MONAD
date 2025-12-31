import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Input, Label, Card } from '../ui/Shared';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTable: (data: {
    nickname: string;
    startStack: number;
    smallBlind: number;
    bigBlind: number;
  }) => void;
}

export function CreateTableModal({ isOpen, onClose, onCreateTable }: CreateTableModalProps) {
  const [nickname, setNickname] = useState('');
  const [startStack, setStartStack] = useState('1000');
  const [smallBlind, setSmallBlind] = useState('10');
  const [bigBlind, setBigBlind] = useState('20');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTable({
      nickname: nickname.trim() || 'Player',
      startStack: parseInt(startStack) || 1000,
      smallBlind: parseInt(smallBlind) || 10,
      bigBlind: parseInt(bigBlind) || 20
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-100">Create Table</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startStack">Start Stack (MON)</Label>
              <Input
                id="startStack"
                type="number"
                value={startStack}
                onChange={e => setStartStack(e.target.value)}
                required
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="players">Max Players</Label>
              <Input
                id="players"
                type="number"
                defaultValue="10"
                disabled
                className="opacity-50 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smallBlind">Small Blind</Label>
              <Input
                id="smallBlind"
                type="number"
                value={smallBlind}
                onChange={e => setSmallBlind(e.target.value)}
                required
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bigBlind">Big Blind</Label>
              <Input
                id="bigBlind"
                type="number"
                value={bigBlind}
                onChange={e => setBigBlind(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Table
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
