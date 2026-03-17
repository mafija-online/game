import { useState } from 'react';

export default function Lobby({ gameState, onStartGame, onCancel }) {
  const { roomCode, players, isHost, hostId } = gameState;
  const [chatDuration, setChatDuration] = useState(120);

  const getPosition = (seconds) => {
    return ((seconds - 30) / (300 - 30)) * 100;
  };

  const handleStartGame = () => {
    if (players.length < 4) {
      alert('Potrebno je minimum 4 igrača!');
      return;
    }
    onStartGame(chatDuration);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-xl border-2 border-red-900/40 rounded-3xl p-8 shadow-2xl max-w-2xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-red-900/30 border-2 border-red-700 rounded-xl px-6 py-3 mb-4">
            <p className="text-slate-400 text-xs uppercase mb-1">Kod Sobe</p>
            <p className="text-white text-4xl font-black tracking-widest">{roomCode}</p>
          </div>
          
          {isHost && (
            <p className="text-emerald-400 font-bold text-sm uppercase">
              👑 Ti si Host
            </p>
          )}
        </div>

        {/* Player List */}
        <div className="mb-8">
          <h3 className="text-xl text-white font-black uppercase mb-4">
            👥 Igrači ({players.length})
          </h3>
          <div className="bg-slate-900/50 rounded-xl p-4 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {players.map(player => (
                <div
                  key={player.id}
                  className="bg-slate-800/50 rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-white font-bold">{player.name}</span>
                  {player.id === hostId && (
                    <span className="text-yellow-400 text-sm">👑 Host</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-2 text-center">
            Čekanje igrača... (minimum 4, maksimum 15)
          </p>
        </div>

        {/* Chat Duration Settings (Host Only) */}
        {isHost && (
          <div className="mb-8 bg-slate-900/30 border border-slate-700 rounded-xl p-6">
            <h4 className="text-white font-bold text-sm uppercase mb-4 flex items-center gap-2">
              ⏱️ Trajanje Diskusije
            </h4>
            
            {/* Slider */}
            <div className="mb-6 relative">
              <input
                type="range"
                min="30"
                max="300"
                step="30"
                value={chatDuration}
                onChange={(e) => setChatDuration(Number(e.target.value))}
                className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
              
              {/* Labels */}
              <div className="relative mt-2 h-6">
                <span 
                  className="absolute text-xs text-slate-400 transform -translate-x-1/2"
                  style={{ left: `${getPosition(30)}%` }}
                >
                  30s
                </span>
                <span 
                  className="absolute text-xs text-slate-400 transform -translate-x-1/2"
                  style={{ left: `${getPosition(60)}%` }}
                >
                  1m
                </span>
                <span 
                  className="absolute text-xs text-slate-400 transform -translate-x-1/2"
                  style={{ left: `${getPosition(90)}%` }}
                >
                  1.5m
                </span>
                <span 
                  className="absolute text-xs text-slate-400 transform -translate-x-1/2"
                  style={{ left: `${getPosition(120)}%` }}
                >
                  2m
                </span>
                <span 
                  className="absolute text-xs text-slate-400 transform -translate-x-1/2"
                  style={{ left: `${getPosition(150)}%` }}
                >
                  2.5m
                </span>
                <span 
                  className="absolute text-xs text-slate-400 transform -translate-x-1/2"
                  style={{ left: `${getPosition(180)}%` }}
                >
                  3m
                </span>
                <span 
                  className="absolute text-xs text-slate-400 transform -translate-x-1/2"
                  style={{ left: `${getPosition(210)}%` }}
                >
                  3.5m
                </span>
                <span 
                  className="absolute text-xs text-slate-400 transform -translate-x-1/2"
                  style={{ left: `${getPosition(240)}%` }}
                >
                  4m
                </span>
                <span 
                  className="absolute text-xs text-slate-400 transform -translate-x-1/2"
                  style={{ left: `${getPosition(270)}%` }}
                >
                  4.5m
                </span>
                <span 
                  className="absolute text-xs text-slate-400 transform -translate-x-1/2"
                  style={{ left: `${getPosition(300)}%` }}
                >
                  5m
                </span>
              </div>
            </div>

            {/* Current Value Display */}
            <div className="text-center mb-6">
              <p className="text-white text-3xl font-black">
                {Math.floor(chatDuration / 60)}:{(chatDuration % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-slate-400 text-xs uppercase">Minuta</p>
            </div>

            {/* Quick Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setChatDuration(60)}
                className={`py-3 rounded-lg font-bold text-sm transition-all ${
                  chatDuration === 60
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Brzo
              </button>
              <button
                onClick={() => setChatDuration(120)}
                className={`py-3 rounded-lg font-bold text-sm transition-all ${
                  chatDuration === 120
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Normalno
              </button>
              <button
                onClick={() => setChatDuration(180)}
                className={`py-3 rounded-lg font-bold text-sm transition-all ${
                  chatDuration === 180
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Sporo
              </button>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={players.length < 4}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 disabled:from-slate-600 disabled:to-slate-700 text-white py-4 rounded-xl font-black text-lg uppercase tracking-wider shadow-xl transition-all disabled:cursor-not-allowed"
            >
              {players.length < 4 ? `Potrebno još ${4 - players.length} igrača` : 'Započni Igru'}
            </button>
          ) : (
            <div className="bg-slate-900/50 border-2 border-slate-700 rounded-xl py-4 text-center">
              <p className="text-slate-400 uppercase text-sm font-bold">
                Čekanje hosta da započne igru...
              </p>
            </div>
          )}

          <button
            onClick={onCancel}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold uppercase tracking-wider transition-all"
          >
            Odustani
          </button>
        </div>
      </div>
    </div>
  );
}