import { useState, useRef, useEffect } from 'react';

const roleConfig = {
  mafia: { emoji: '🔫', gradient: 'from-red-600 to-red-900', color: 'border-red-900/50' },
  doctor: { emoji: '⚕️', gradient: 'from-emerald-500 to-emerald-800', color: 'border-emerald-900/50' },
  police: { emoji: '🚔', gradient: 'from-blue-500 to-blue-800', color: 'border-blue-900/50' },
  dama: { emoji: '👑', gradient: 'from-purple-500 to-purple-800', color: 'border-purple-900/50' },
  joker: { emoji: '🃏', gradient: 'from-yellow-500 to-red-600', color: 'border-yellow-900/50' },
  innocent: { emoji: '👤', gradient: 'from-slate-400 to-slate-700', color: 'border-slate-700/50' }
};

const roleDescriptions = {
  mafia: '🔫 Ti si MAFIJA!\n\nSvake noći biraš igrača kojeg želiš da eliminišeš.\n\nCilj: Eliminiši sve nevine igrače!',
  doctor: '⚕️ Ti si DOKTOR!\n\nSvake noći možeš da spaseš jednog igrača od mafije.\n\nCilj: Pomozi građanima da pobede!',
  police: '🚔 Ti si POLICIJA!\n\nSvake noći možeš da otkriješ pravu ulogu jednog igrača.\n\nCilj: Pronađi mafiju i pomozi građanima!',
  dama: '👑 Ti si DAMA!\n\nSvake noći možeš da ućutkaš jednog igrača - ne može da priča tokom diskusije.\n\nCilj: Pomozi građanima da pobede!',
  joker: '🃏 Ti si DŽOKER!\n\nNemaš posebnu noćnu moć.\nPobeđuješ ako te igrači eliminišu glasanjem!\n\nCilj: Natera igrače da te izbace!',
  innocent: '👤 Ti si GRAĐANIN!\n\nNemaš posebnu moć.\nKoristi diskusiju i glasanje mudro.\n\nCilj: Pronađi i eliminiši sve mafije!'
};

function getRoleDisplayName(role) {
  if (!role) return 'UČITAVANJE...';
  const names = {
    mafia: 'MAFIJA',
    doctor: 'DOKTOR',
    police: 'POLICIJA',
    dama: 'DAMA',
    joker: 'DŽOKER',
    innocent: 'GRAĐANIN'
  };
  return names[role] || role.toUpperCase();
}

export default function GameScreen({ gameState, onSelectTarget, onSkipAction, onSendMessage, onCastVote }) {
  const [chatInput, setChatInput] = useState('');
  const [mafiaChatInput, setMafiaChatInput] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const lupaRef = useRef(null);
  const chatEndRef = useRef(null);

  const {
    playerId, myRole, players, deadPlayers, gamePhase,
    mafiaTarget, doctorTarget, policeTarget, policeRevealedRole,
    silencedPlayer, votes, chatMessages, timer, roomCode,
    mafiaPartners, nightInfo, mafiaChat
  } = gameState;

  const isDead = deadPlayers.includes(playerId);
  const alivePlayers = players.filter(p => !deadPlayers.includes(p.id));
  const deadPlayersList = players.filter(p => deadPlayers.includes(p.id));
  const isMyTurn = myRole === gamePhase?.replace('Turn', '');
  const myConfig = roleConfig[myRole] || roleConfig.innocent;
  const hasMafiaChat = mafiaPartners && mafiaPartners.length >= 1;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleMouseEnterLupa = () => {
    if (lupaRef.current) {
      const rect = lupaRef.current.getBoundingClientRect();
      const tooltipWidth = 288;
      let left = rect.left;
      if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }
      setTooltipPos({
        top: rect.bottom + 8,
        left: left
      });
      setTooltipVisible(true);
    }
  };

  const handleMouseLeaveLupa = () => {
    setTooltipVisible(false);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  const handleSendMafiaChat = (e) => {
    e.preventDefault();
    if (mafiaChatInput.trim()) {
      onSendMessage(mafiaChatInput, true);
      setMafiaChatInput('');
    }
  };

  const getPhaseTitle = () => {
    const titles = {
      mafiaTurn: 'MOĆ MAFIJE',
      doctorTurn: 'MOĆ DOKTORA',
      policeTurn: 'MOĆ POLICIJE',
      damaTurn: 'MOĆ DAME',
      chat: 'DISKUSIJA',
      voting: 'GLASANJE'
    };
    return titles[gamePhase] || 'IGRA';
  };

  const timerColor = timer <= 30 ? 'text-red-400' : timer <= 60 ? 'text-yellow-400' : 'text-white';
  const timerPercent = (timer / 120) * 100;
  const progressColor = timer <= 30 ? 'bg-red-500' : timer <= 60 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen p-4 md:p-8">

      {/* TOOLTIP - FIXED */}
      {tooltipVisible && myRole && (
        <div
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 9999,
            width: '288px'
          }}
        >
          <div className="bg-gray-900 border-2 border-red-700 rounded-xl p-4 shadow-2xl">
            <p className="text-white text-sm whitespace-pre-line leading-relaxed">
              {roleDescriptions[myRole]}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-4">

        {/* HEADER */}
        <div className="bg-black/40 backdrop-blur-xl border-2 border-red-900/40 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-slate-400 text-xs uppercase mb-2">Soba: {roomCode}</p>
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 shadow-xl font-black uppercase bg-gradient-to-r ${myConfig.gradient} ${myConfig.color} text-white`}>
                  <span className="text-2xl">{myConfig.emoji}</span>
                  <span>{getRoleDisplayName(myRole)}</span>
                </div>
                <button
                  ref={lupaRef}
                  onMouseEnter={handleMouseEnterLupa}
                  onMouseLeave={handleMouseLeaveLupa}
                  className="w-10 h-10 rounded-full bg-black/40 border-2 border-white/20 flex items-center justify-center text-xl hover:bg-black/60 hover:border-white/40 transition-all"
                >
                  🔍
                </button>
              </div>
            </div>
            {gamePhase === 'chat' && (
              <div className="bg-black/30 p-4 rounded-xl border-2 border-white/10 min-w-[140px]">
                <p className="text-xs text-slate-400 uppercase mb-1">⏱️ Vreme</p>
                <p className={`text-3xl font-black font-mono ${timerColor}`}>
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </p>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressColor} transition-all duration-1000 rounded-full`}
                    style={{ width: `${timerPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GROBLJE */}
        {deadPlayersList.length > 0 && (
          <div className="bg-black/40 backdrop-blur-xl border-2 border-slate-700/50 rounded-2xl p-4 shadow-2xl">
            <h4 className="text-slate-400 text-xs uppercase font-bold mb-3">
              💀 Groblje ({deadPlayersList.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {deadPlayersList.map(player => (
                <div key={player.id} className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2">
                  <span className="text-lg opacity-60">
                    {roleConfig[gameState.roles?.[player.id]]?.emoji || '👤'}
                  </span>
                  <div>
                    <p className="text-slate-400 text-xs font-bold line-through">{player.name}</p>
                    <p className="text-slate-500 text-xs">
                      {getRoleDisplayName(gameState.roles?.[player.id])}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MRTAV SI */}
        {isDead && (
          <div className="bg-black/60 backdrop-blur-xl border-2 border-slate-700 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">💀</div>
            <h3 className="text-2xl text-slate-300 font-black uppercase mb-2">Mrtav Si</h3>
            <p className="text-slate-400 text-sm uppercase">Čekanje...</p>
          </div>
        )}

        {/* NOĆNE FAZE */}
        {!isDead && ['mafiaTurn', 'doctorTurn', 'policeTurn', 'damaTurn'].includes(gamePhase) && (
          <div>
            {!isMyTurn ? (
              <div className="bg-black/60 backdrop-blur-xl border-2 border-slate-700 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4 animate-pulse">🌙</div>
                <h3 className="text-xl text-slate-300 font-black uppercase">Čekanje</h3>
                <p className="text-slate-400 uppercase mt-2">{getPhaseTitle()} u toku...</p>
              </div>
            ) : gamePhase === 'policeTurn' && policeRevealedRole ? (
              <div className={`bg-black/60 backdrop-blur-xl border-2 ${roleConfig.police.color} rounded-2xl p-6 shadow-2xl`}>
                <h3 className="text-2xl text-white font-black uppercase text-center mb-6">{getPhaseTitle()}</h3>
                <div className="bg-blue-950/30 border-2 border-blue-900/50 rounded-xl p-6 text-center mb-6">
                  <p className="text-slate-300 text-xs uppercase mb-3">🔍 Rezultat</p>
                  <p className="text-3xl font-black text-white mb-4">
                    {players.find(p => p.id === policeRevealedRole.player)?.name}
                  </p>
                  <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xl font-black uppercase bg-gradient-to-r ${roleConfig[policeRevealedRole.role]?.gradient || roleConfig.innocent.gradient} border-2 text-white`}>
                    {roleConfig[policeRevealedRole.role]?.emoji} {getRoleDisplayName(policeRevealedRole.role)}
                  </div>
                </div>
                <button onClick={onSkipAction} className={`w-full bg-gradient-to-r ${roleConfig.police.gradient} text-white py-4 rounded-xl font-black uppercase`}>
                  ▶ Nastavi
                </button>
              </div>
            ) : gamePhase === 'damaTurn' && silencedPlayer ? (
              <div className={`bg-black/60 backdrop-blur-xl border-2 ${roleConfig.dama.color} rounded-2xl p-6 shadow-2xl`}>
                <h3 className="text-2xl text-white font-black uppercase text-center mb-6">{getPhaseTitle()}</h3>
                <div className="bg-purple-950/30 border-2 border-purple-900/50 rounded-xl p-6 text-center mb-6">
                  <p className="text-slate-300 text-xs uppercase mb-3">🤫 Ućutkan Igrač</p>
                  <p className="text-3xl font-black text-white">
                    {players.find(p => p.id === silencedPlayer)?.name}
                  </p>
                </div>
                <button onClick={onSkipAction} className={`w-full bg-gradient-to-r ${roleConfig.dama.gradient} text-white py-4 rounded-xl font-black uppercase`}>
                  ▶ Nastavi
                </button>
              </div>
            ) : (
              <div className={`bg-black/60 backdrop-blur-xl border-2 ${myConfig.color} rounded-2xl p-6 shadow-2xl`}>
                <div className="text-center mb-6">
                  <div className="inline-block mb-4">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${myConfig.gradient} flex items-center justify-center text-5xl border-4 ${myConfig.color}`}>
                      {myConfig.emoji}
                    </div>
                  </div>
                  <h3 className="text-2xl text-white font-black uppercase">{getPhaseTitle()}</h3>
                </div>

                {/* MAFIJA TAJNI CHAT */}
                {gamePhase === 'mafiaTurn' && myRole === 'mafia' && hasMafiaChat && (
                  <div className="mb-6 bg-red-950/30 border-2 border-red-800 rounded-xl p-4">
                    <h4 className="text-red-300 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                      🔒 Tajni Mafija Chat
                      <span className="text-xs text-red-400">
                        (sa {mafiaPartners.map(m => m.name).join(', ')})
                      </span>
                    </h4>
                    <div className="bg-black/30 rounded-lg p-3 h-32 overflow-y-auto mb-3 space-y-2">
                      {mafiaChat && mafiaChat.map(msg => (
                        <div key={msg.id} className="bg-red-900/20 rounded p-2">
                          <p className="text-red-300 font-bold text-xs">{msg.playerName}</p>
                          <p className="text-white text-sm">{msg.content}</p>
                        </div>
                      ))}
                      {(!mafiaChat || mafiaChat.length === 0) && (
                        <p className="text-red-400/50 text-xs text-center py-4">
                          Komunicirajte sa partnerima...
                        </p>
                      )}
                    </div>
                    <form onSubmit={handleSendMafiaChat} className="flex gap-2">
                      <input
                        type="text"
                        value={mafiaChatInput}
                        onChange={(e) => setMafiaChatInput(e.target.value)}
                        className="flex-1 bg-black/30 border border-red-800 text-white px-3 py-2 rounded text-sm focus:border-red-500 outline-none"
                        placeholder="Tajna poruka..."
                        maxLength={150}
                      />
                      <button type="submit" className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold">
                        Pošalji
                      </button>
                    </form>
                  </div>
                )}

                {/* LISTA IGRAČA */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {alivePlayers.map(player => {
                    const isSelected =
                      (gamePhase === 'mafiaTurn' && mafiaTarget === player.id) ||
                      (gamePhase === 'doctorTurn' && doctorTarget === player.id) ||
                      (gamePhase === 'policeTurn' && policeTarget === player.id);
                    const isMafiaPartner = mafiaPartners && mafiaPartners.some(m => m.id === player.id);

                    return (
                      <button
                        key={player.id}
                        onClick={() => onSelectTarget(player.id)}
                        className={`py-6 flex flex-col items-center gap-2 rounded-xl transition-all ${
                          isSelected
                            ? `bg-gradient-to-br ${myConfig.gradient} border-2 ${myConfig.color} text-white shadow-2xl`
                            : 'bg-slate-900/70 border-2 border-slate-700 hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl ${isSelected ? 'bg-white/20 border-2 border-white/30' : 'bg-slate-800 border-2 border-slate-600'}`}>
                          👤
                        </div>
                        <span className={`font-black uppercase ${isMafiaPartner ? 'text-red-500' : ''}`}>
                          {player.name}
                          {isMafiaPartner && ' 🔫'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={onSkipAction} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold uppercase border-2 border-slate-700">
                  Preskoči
                </button>
              </div>
            )}
          </div>
        )}

        {/* CHAT FAZA */}
        {!isDead && gamePhase === 'chat' && (
          <div className="bg-black/60 backdrop-blur-xl border-2 border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-2xl text-white font-black uppercase mb-4 text-center">💬 {getPhaseTitle()}</h3>

            {nightInfo && (
              <div className={`mb-4 p-4 rounded-xl border-2 text-center font-bold text-lg ${
                nightInfo.type === 'killed'
                  ? 'bg-red-950/50 border-red-800 text-red-300'
                  : nightInfo.type === 'saved'
                  ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                  : 'bg-slate-950/50 border-slate-700 text-slate-300'
              }`}>
                {nightInfo.text}
              </div>
            )}

            <div className="bg-slate-900/50 rounded-xl p-4 h-64 overflow-y-auto mb-4 space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-red-400 font-bold text-sm">{msg.playerName}</p>
                  <p className="text-white">{msg.content}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {silencedPlayer !== playerId ? (
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-900/50 border-2 border-slate-700 text-white px-4 py-3 rounded-lg focus:border-red-500 outline-none"
                  placeholder="Poruka..."
                  maxLength={200}
                />
                <button type="submit" className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 rounded-lg font-bold">
                  Pošalji
                </button>
              </form>
            ) : (
              <p className="text-center text-red-400 font-bold uppercase">🤫 Ućutkan si</p>
            )}
          </div>
        )}

        {/* GLASANJE */}
        {!isDead && gamePhase === 'voting' && (
          <div className="bg-black/60 backdrop-blur-xl border-2 border-red-900/50 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-3xl text-white font-black uppercase mb-6 text-center">🗳️ GLASANJE</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {alivePlayers.map(player => {
                const isMafiaPartner = mafiaPartners && mafiaPartners.some(m => m.id === player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => onCastVote(player.id)}
                    disabled={votes[playerId]}
                    className={`py-6 flex flex-col items-center gap-2 rounded-xl transition-all ${
                      votes[playerId] === player.id
                        ? 'bg-gradient-to-br from-red-600 to-red-900 border-2 border-red-700 text-white shadow-2xl'
                        : 'bg-slate-900/70 border-2 border-slate-700 hover:bg-slate-800 text-slate-200 disabled:opacity-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-3xl">
                      👤
                    </div>
                    <span className={`font-black uppercase ${isMafiaPartner ? 'text-red-500' : ''}`}>
                      {player.name}
                      {isMafiaPartner && ' 🔫'}
                    </span>
                    <span className="text-xs">
                      Glasova: {Object.values(votes).filter(v => v === player.id).length}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onCastVote(null)}
              disabled={votes[playerId]}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold uppercase border-2 border-slate-700 disabled:opacity-50"
            >
              Preskoči Glasanje
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
