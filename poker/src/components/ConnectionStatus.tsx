import { useSessionStatus } from '../hooks/useSessionStatus';

export function ConnectionStatus() {
  const status = useSessionStatus();

  const statusConfig = {
    connecting: {
      color: 'bg-yellow-500',
      text: 'Connecting...',
      pulse: true,
    },
    online: {
      color: 'bg-green-500',
      text: 'Connected',
      pulse: false,
    },
    offline: {
      color: 'bg-zinc-500',
      text: 'Offline',
      pulse: false,
    },
    fatal: {
      color: 'bg-red-500',
      text: 'Error',
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <span
        className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      <span>{config.text}</span>
    </div>
  );
}
