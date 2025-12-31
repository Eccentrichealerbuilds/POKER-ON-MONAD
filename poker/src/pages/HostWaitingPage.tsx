import { useState } from 'react';
import { Copy, Check, Users, Play, Settings, Home } from 'lucide-react';
import { Button, Card } from '../components/ui/Shared';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { useGame } from '../context/GameContext';

interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost?: boolean;
}

interface HostWaitingPageProps {
  tableCode: string;
  onStartGame: () => void;
  onBackHome: () => void;
}

export function HostWaitingPage({ tableCode, onStartGame, onBackHome }: HostWaitingPageProps) {
  const [copied, setCopied] = useState(false);
  const { players, tableSettings } = useGame();

  // Build players list from game context
  const playersList: Player[] = players
    .filter(name => name && name.trim())
    .map((name, idx) => ({
      id: String(idx),
      name,
      avatar: ['👤', '🦁', '🐋', '🎯', '🚀', '💎', '🔥', '⚡', '🎲', '🃏'][idx % 10],
      isHost: idx === 0
    }));

  const handleCopy = () => {
    navigator.clipboard.writeText(tableCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-500">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBackHome}>
            <Home className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>
          <ConnectionStatus />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-serif">Waiting for Players</h1>
          <p className="text-zinc-400">
            Share the code below to invite friends to your table.
          </p>
        </div>

        {/* Table Code Card */}
        <Card className="p-6 bg-zinc-900 border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-zinc-800 rounded-lg">
              <Users className="w-6 h-6 text-zinc-300" />
            </div>
            <div>
              <div className="text-sm text-zinc-400">Table Code</div>
              <div className="text-2xl font-mono font-bold tracking-wider text-zinc-100">
                {tableCode}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleCopy} className="w-full md:w-auto min-w-[140px]">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Table Settings */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Table Settings
            </h3>
            <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Small Blind</span>
                <span className="font-mono">{tableSettings?.smallBlind || 10} MON</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Big Blind</span>
                <span className="font-mono">{tableSettings?.bigBlind || 20} MON</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Start Stack</span>
                <span className="font-mono">{tableSettings?.startingChips || 1000} MON</span>
              </div>
              <div className="pt-3 mt-3 border-t border-zinc-800">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  <Settings className="w-3 h-3 mr-2" />
                  Edit Settings
                </Button>
              </div>
            </Card>
          </div>

          {/* Players List */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Joined Players ({playersList.length}/10)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playersList.map(player => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 animate-in slide-in-from-bottom-2"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl">
                    {player.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {player.name}
                      {player.isHost && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">
                          HOST
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">Ready</div>
                  </div>
                </div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: Math.max(0, 10 - playersList.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800"></div>
                  <div className="text-sm text-zinc-600">Waiting for player...</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800 flex justify-center">
          <div className="w-full max-w-4xl flex justify-end">
            <Button
              size="lg"
              onClick={onStartGame}
              className="w-full sm:w-auto px-8"
              disabled={playersList.length < 2}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Game {playersList.length < 2 && '(Need 2+ players)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
