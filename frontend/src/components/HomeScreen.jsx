import { useState } from 'react';

export default function HomeScreen({ onCreateRoom, onJoinRoom, connecting }) {
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    
    if (mode === 'create') {
      onCreateRoom(roomCode.toUpperCase(), playerName);
    } else {
      onJoinRoom(roomCode.toUpperCase(), playerName);
    }
  };

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-xl border-2 border-red-900/40 rounded-3xl p-12 shadow-2xl max-w-md w-full">
          <div className="text-center mb-12">
            <h1 className="text-7xl font-black text-white mb-4 tracking-tight">
              MAFIJA
            </h1>
            <p className="text-red-500 text-xl font-bold uppercase tracking-widest">
              Online Igra
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-5 rounded-xl font-black text-xl uppercase tracking-wider shadow-xl transition-all transform hover:scale-105"
            >
              Napravi Sobu
            </button>
            
            <button
              onClick={() => setMode('join')}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white py-5 rounded-xl font-black text-xl uppercase tracking-wider shadow-xl transition-all transform hover:scale-105"
            >
              Pridruži Se
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-xl border-2 border-red-900/40 rounded-3xl p-12 shadow-2xl max-w-md w-full">
        <button
          onClick={() => setMode(null)}
          className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          ← Nazad
        </button>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-white mb-2">
            {mode === 'create' ? 'Napravi Sobu' : 'Pridruži Se'}
          </h2>
          <p className="text-slate-400 text-sm">
            {mode === 'create' ? 'Kreiraj novu igru' : 'Uđi u postojeću sobu'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-300 font-bold mb-2 uppercase text-sm">
              Tvoje Ime
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-slate-900/50 border-2 border-slate-700 text-white px-4 py-3 rounded-lg focus:border-red-500 outline-none transition-colors"
              placeholder="Unesi ime..."
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-2 uppercase text-sm">
              Kod Sobe
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-900/50 border-2 border-slate-700 text-white px-4 py-3 rounded-lg focus:border-red-500 outline-none transition-colors uppercase tracking-widest text-center text-2xl font-black"
              placeholder="ABCD"
              maxLength={6}
              required
            />
          </div>

          {mode === 'create' && (
            <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm text-center">
                📊 Minimum 4 igrača, maksimum 15
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={connecting}
            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:from-slate-600 disabled:to-slate-700 text-white py-4 rounded-xl font-black text-lg uppercase tracking-wider shadow-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {connecting ? 'Povezivanje...' : mode === 'create' ? 'Kreiraj Sobu' : 'Pridruži Se'}
          </button>
        </form>
      </div>
    </div>
  );
}