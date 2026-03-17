export default function ResultScreen({ winner, isHost, hostWantsRematch, onHostDecision, onPlayerRematch, onLeaveGame }) {

  const getWinnerMessage = () => {
    if (winner === 'mafia') return '🔫 MAFIJA POBEĐUJE!';
    if (winner === 'innocent') return '👥 GRAĐANI POBEĐUJU!';
    if (winner === 'joker') return '🃏 DŽOKER POBEĐUJE!';
    return 'KRAJ IGRE';
  };

  const getWinnerColor = () => {
    if (winner === 'mafia') return 'from-red-600 to-red-900';
    if (winner === 'innocent') return 'from-emerald-600 to-emerald-900';
    if (winner === 'joker') return 'from-yellow-500 to-orange-600';
    return 'from-slate-600 to-slate-900';
  };

  const getWinnerEmoji = () => {
    if (winner === 'mafia') return '🔫';
    if (winner === 'innocent') return '👥';
    if (winner === 'joker') return '🃏';
    return '🎮';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-xl border-2 border-red-900/40 rounded-3xl p-12 shadow-2xl max-w-2xl w-full">

        {/* Winner Display */}
        <div className="text-center mb-12">
          <div className={`inline-block bg-gradient-to-br ${getWinnerColor()} rounded-3xl p-8 mb-6 shadow-2xl`}>
            <div className="text-9xl mb-4">{getWinnerEmoji()}</div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tight">
              {getWinnerMessage()}
            </h2>
          </div>
        </div>

        {/* BUG FIX: Host vidi dugmad za odluku, igrači čekaju hostovu odluku */}
        {isHost ? (
          // HOST: Bira da li želi rematch
          <div className="space-y-4">
            <p className="text-white text-center font-bold text-lg mb-6">
              Želiš li da igraš ponovo?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onHostDecision(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white py-5 rounded-xl font-black text-xl uppercase tracking-wider shadow-xl transition-all transform hover:scale-105"
              >
                Da, Igraj Ponovo
              </button>
              <button
                onClick={() => onHostDecision(false)}
                className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-5 rounded-xl font-black text-xl uppercase tracking-wider shadow-xl transition-all transform hover:scale-105"
              >
                Ne, Izađi
              </button>
            </div>
          </div>
        ) : (
          // IGRAČI: Čekaju hostovu odluku ili reaguju na nju
          <div className="space-y-4">
            {!hostWantsRematch ? (
              // Host još nije odlučio — čekaj
              <div className="text-center py-6">
                <div className="text-4xl mb-4 animate-pulse">⏳</div>
                <p className="text-slate-300 font-bold text-lg uppercase">
                  Čekanje na odluku domaćina...
                </p>
              </div>
            ) : (
              // Host želi rematch — igrač bira
              <div>
                <p className="text-emerald-400 text-center font-bold text-lg mb-6 uppercase">
                  🎮 Host želi da igra ponovo!
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={onPlayerRematch}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white py-5 rounded-xl font-black text-xl uppercase tracking-wider shadow-xl transition-all transform hover:scale-105"
                  >
                    Pridruži Se
                  </button>
                  <button
                    onClick={onLeaveGame}
                    className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-5 rounded-xl font-black text-xl uppercase tracking-wider shadow-xl transition-all transform hover:scale-105"
                  >
                    Izađi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}