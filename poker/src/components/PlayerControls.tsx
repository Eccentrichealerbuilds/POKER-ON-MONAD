import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerAction } from '../types';
export const PlayerControls = () => {
  // All hooks must be at the top, before any conditional returns
  const [raiseAmount, setRaiseAmount] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);

  const {
    gameState,
    currentPlayerIndex,
    performAction,
    turnDeadline
  } = useGame();

  // Countdown effect - must be before any returns
  useEffect(() => {
    if (!turnDeadline) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const sec = Math.max(0, Math.floor((turnDeadline - Date.now()) / 1000));
      setRemaining(sec);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [turnDeadline]);

  // Now we can have conditional returns
  if (!gameState || currentPlayerIndex === null) {
    return null;
  }
  const currentPlayer = gameState.players[currentPlayerIndex];
  const mySeatName = ((typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mySeatName')) || '').trim();
  const isMyTurn = !!(mySeatName && currentPlayer?.name === mySeatName);

  if (gameState.stage === 'Showdown') {
    return <div className="bg-gray-800 p-4 rounded-xl mb-8 text-center">
        <div className="text-xl">Showdown</div>
      </div>;
  }
  if (!isMyTurn) {
    return null;
  }

  const toCall = gameState.currentBet - currentPlayer.currentBet;
  const canCheck = toCall === 0;
  const minRaise = Math.max(gameState.bigBlind, gameState.lastRaiseAmount);
  const maxRaise = currentPlayer.chips;

  // Initialize raise amount if not set - use effect pattern instead of inline setState
  const effectiveRaiseAmount = raiseAmount === 0 && minRaise > 0 ? minRaise : raiseAmount;
  const handleRaiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setRaiseAmount(isNaN(value) ? 0 : value);
  };
  return <div className="bg-gray-800 p-4 rounded-xl mb-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <div className="text-lg mb-2 md:mb-0">
          <span className="text-purple-400 font-bold">
            {currentPlayer.name}'s turn
          </span>
          <span className="ml-2 bg-yellow-600 text-white px-2 py-1 rounded-md text-xs">
            You are controlling this player
          </span>
        </div>
        <div className="text-sm text-gray-300">
          {toCall > 0 ? <span>Call: {toCall} chips</span> : <span>You can check</span>}
        </div>
      </div>
      <div className="flex items-center justify-center mb-2">
        {turnDeadline && <span className={`text-sm font-mono ${remaining<=5?'text-red-400':'text-green-400'}`}>⏱ {remaining}s</span>}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <button onClick={() => performAction(PlayerAction.Fold)} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium transition">
          Fold
        </button>
        {canCheck ? <button onClick={() => performAction(PlayerAction.Check)} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition">
            Check
          </button> : <button onClick={() => performAction(PlayerAction.Call)} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition">
            Call {toCall}
          </button>}
        <div className="flex items-center">
          <input type="range" min={Math.min(minRaise, maxRaise)} max={maxRaise} value={effectiveRaiseAmount} onChange={handleRaiseChange} className="mr-2 w-32" />
          <input type="number" min={Math.min(minRaise, maxRaise)} max={maxRaise} value={effectiveRaiseAmount} onChange={handleRaiseChange} className="w-20 bg-gray-700 text-white px-2 py-1 rounded-lg mr-2" />
          <button onClick={() => performAction(PlayerAction.Raise, effectiveRaiseAmount)} disabled={effectiveRaiseAmount < minRaise || effectiveRaiseAmount > maxRaise} className={`${effectiveRaiseAmount >= minRaise && effectiveRaiseAmount <= maxRaise ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'} px-6 py-2 rounded-lg font-medium transition`}>
            Raise
          </button>
        </div>
        <button onClick={() => performAction(PlayerAction.AllIn)} className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition">
          All In ({currentPlayer.chips})
        </button>
      </div>
    </div>;
};