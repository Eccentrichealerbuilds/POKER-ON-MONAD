import { Loader2, ShieldCheck, Info, Home } from 'lucide-react';
import { Button, Card } from '../components/ui/Shared';

interface JoinerWaitingPageProps {
  tableCode: string;
  nickname: string;
  onLeave: () => void;
}

export function JoinerWaitingPage({ tableCode, nickname, onLeave }: JoinerWaitingPageProps) {
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500 text-center">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center mb-4 mx-auto">
            <Loader2 className="w-10 h-10 text-zinc-400 animate-spin" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-green-900/80 text-green-400 p-1.5 rounded-full border border-green-800">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-serif">Waiting for Host</h1>
          <p className="text-zinc-400">
            You have joined the table. The game will begin when the host starts it.
          </p>
        </div>

        <Card className="p-6 bg-zinc-900/50 border-zinc-800 text-left space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
            <span className="text-sm text-zinc-500">Table Code</span>
            <span className="font-mono font-medium">{tableCode}</span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
            <span className="text-sm text-zinc-500">Your Nickname</span>
            <span className="font-medium">{nickname}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-500">Status</span>
            <span className="text-sm text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Connected
            </span>
          </div>
        </Card>

        <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4 flex gap-3 text-left">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200/80">
            Don't close this window. You will be automatically redirected to the game table once it starts.
          </p>
        </div>

        <Button variant="outline" onClick={onLeave} className="w-full">
          <Home className="w-4 h-4 mr-2" />
          Leave Table & Go Home
        </Button>
      </div>
    </div>
  );
}
