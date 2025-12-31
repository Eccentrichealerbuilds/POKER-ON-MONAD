import React from 'react';
import { useGame } from '../context/GameContext';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const { lastTxHash } = useGame();
  return (
    <header className="flex justify-between items-center mb-4">
      <Link to="/" className="text-2xl font-bold text-purple-400 hover:text-purple-300">Monad Poker</Link>
      <div className="flex items-center gap-2">
        {lastTxHash && (
          <div className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded">
            <span className="text-xs text-purple-300 truncate max-w-[120px]" title={lastTxHash}>{lastTxHash.slice(0, 10)}…</span>
            <button
              onClick={() => navigator.clipboard.writeText(lastTxHash)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] px-2 py-0.5 rounded"
            >Copy</button>
          </div>
        )}
      </div>
    </header>
  );
};