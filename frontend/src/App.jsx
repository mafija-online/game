import { useState, useEffect } from 'react';
import { socket, connectSocket } from './utils/socket';
import HomeScreen from './components/HomeScreen';
import Lobby from './components/Lobby';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';

function App() {
  const [gameState, setGameState] = useState({
    phase: 'home',
    roomCode: null,
    playerId: null,
    playerName: null,
    hostId: null,
    isHost: false,
    players: [],
    myRole: null,
    mafiaPartners: [],
    deadPlayers: [],
    mafiaTarget: null,
    doctorTarget: null,
    policeTarget: null,
    policeRevealedRole: null,
    silencedPlayer: null,
    poisonedPlayers: [],
    votes: {},
    chatMessages: [],
    mafiaChat: [],
    timer: 120,
    winner: null,
    nightInfo: null,
    gamePhase: null,
    countdown: null,
    roleRevealed: false,
    hostWantsRematch: false
  });

  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    connectSocket();

    socket.on('room-created', ({ roomCode, hostId, player }) => {
      setGameState(prev => ({
        ...prev,
        phase: 'lobby',
        roomCode,
        playerId: socket.id,
        playerName: player.name,
        hostId,
        isHost: true,
        players: [player]
      }));
      setConnecting(false);
    });

    socket.on('room-joined', ({ roomCode, hostId, player, players }) => {
      setGameState(prev => ({
        ...prev,
        phase: 'lobby',
        roomCode,
        playerId: socket.id,
        playerName: player.name,
        hostId,
        isHost: false,
        players
      }));
      setConnecting(false);
    });

    socket.on('players-updated', ({ players }) => {
      setGameState(prev => ({ ...prev, players }));
    });

    socket.on('countdown', ({ count }) => {
      setGameState(prev => ({ ...prev, countdown: count, phase: 'countdown' }));
    });

    socket.on('role-assigned', ({ role, mafiaPartners }) => {
      setGameState(prev => ({
        ...prev,
        myRole: role,
        mafiaPartners: mafiaPartners || [],
        roleRevealed: false,
        phase: 'roleReveal'
      }));

      setTimeout(() => {
        setGameState(prev => ({ ...prev, roleRevealed: true }));
      }, 4000);
    });

    socket.on('game-state-update', (update) => {
      setGameState(prev => ({
        ...prev,
        phase: update.phase === 'ended' ? 'ended'
          : update.phase === 'lobby' ? 'lobby'
          : update.phase === 'countdown' ? 'countdown'
          : update.phase === 'roleReveal' ? 'roleReveal'
          : 'game',
        gamePhase: update.phase,
        nightInfo: update.phase === 'voting' ? null : prev.nightInfo,
        mafiaChat: update.phase === 'mafiaTurn' ? prev.mafiaChat : [],
        deadPlayers: update.deadPlayers || prev.deadPlayers,
        mafiaTarget: update.mafiaTarget,
        doctorTarget: update.doctorTarget,
        policeTarget: update.policeTarget,
        policeRevealedRole: update.policeRevealedRole,
        silencedPlayer: update.silencedPlayer,
        poisonedPlayers: update.poisonedPlayers || prev.poisonedPlayers,
        votes: update.votes || {},
        timer: update.timer,
        winner: update.winner,
        players: update.players || prev.players,
        // BUG FIX: hostWantsRematch nikad nije undefined
        hostWantsRematch: update.hostWantsRematch ?? false
      }));
    });

    socket.on('chat-message', ({ message }) => {
      setGameState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, message] }));
    });

    socket.on('mafia-chat-message', ({ message }) => {
      setGameState(prev => ({ ...prev, mafiaChat: [...prev.mafiaChat, message] }));
    });

    socket.on('vote-cast', ({ playerId, targetId }) => {
      setGameState(prev => ({ ...prev, votes: { ...prev.votes, [playerId]: targetId } }));
    });

    socket.on('timer-update', ({ timer }) => {
      setGameState(prev => ({ ...prev, timer }));
    });

    socket.on('host-changed', ({ hostId }) => {
      setGameState(prev => ({ ...prev, hostId, isHost: socket.id === hostId }));
    });

    socket.on('night-results', ({ killed, saved, targetName }) => {
      let nightMessage = null;
      if (killed) {
        nightMessage = { type: 'killed', text: `💀 ${targetName} je ubijen tokom noći!` };
      } else if (saved) {
        nightMessage = { type: 'saved', text: `⚕️ ${targetName} je spašen od mafije!` };
      } else {
        nightMessage = { type: 'peaceful', text: `🌙 Noć je prošla mirno...` };
      }
      setGameState(prev => ({ ...prev, nightInfo: nightMessage }));
    });

    socket.on('host-wants-rematch', () => {
      // BUG FIX: Postavi hostWantsRematch na true kada host odluči
      setGameState(prev => ({ ...prev, hostWantsRematch: true }));
    });

    socket.on('return-to-lobby', () => {
      // BUG FIX: Resetuj sve relevantno stanje kada se vraćamo u lobby
      setGameState(prev => ({
        ...prev,
        phase: 'lobby',
        winner: null,
        hostWantsRematch: false,
        myRole: null,
        mafiaPartners: [],
        deadPlayers: [],
        mafiaTarget: null,
        doctorTarget: null,
        policeTarget: null,
        policeRevealedRole: null,
        silencedPlayer: null,
        poisonedPlayers: [],
        votes: {},
        chatMessages: [],
        mafiaChat: [],
        nightInfo: null,
        gamePhase: null,
        roleRevealed: false,
        timer: 120
      }));
    });

    socket.on('host-left', () => {
      setError('Host je napustio igru!');
      setTimeout(() => {
        goHome();
      }, 5000);
    });

    socket.on('host-left-lobby', () => {
      setError('Host je napustio lobby!');
      setTimeout(() => {
        goHome();
      }, 3000);
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setConnecting(false);
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('players-updated');
      socket.off('countdown');
      socket.off('role-assigned');
      socket.off('game-state-update');
      socket.off('chat-message');
      socket.off('mafia-chat-message');
      socket.off('vote-cast');
      socket.off('timer-update');
      socket.off('host-changed');
      socket.off('night-results');
      socket.off('host-wants-rematch');
      socket.off('return-to-lobby');
      socket.off('host-left');
      socket.off('host-left-lobby');
      socket.off('error');
    };
  }, []);

  const createRoom = (roomCode, playerName) => {
    setConnecting(true);
    socket.emit('create-room', { roomCode, playerName });
  };

  const joinRoom = (roomCode, playerName) => {
    setConnecting(true);
    socket.emit('join-room', { roomCode, playerName });
  };

  const startGame = (chatDuration = 120) => {
    socket.emit('start-game', { roomCode: gameState.roomCode, chatDuration });
  };

  const selectTarget = (targetId) => {
    socket.emit('select-target', { roomCode: gameState.roomCode, targetId });
  };

  const skipAction = () => {
    socket.emit('skip-action', { roomCode: gameState.roomCode });
  };

  const sendMessage = (message, isMafiaChat = false) => {
    socket.emit('send-message', { roomCode: gameState.roomCode, message, isMafiaChat });
  };

  const castVote = (targetId) => {
    socket.emit('cast-vote', { roomCode: gameState.roomCode, targetId });
  };

  const hostRematchDecision = (wantsRematch) => {
    socket.emit('host-rematch-decision', { roomCode: gameState.roomCode, wantsRematch });
    if (wantsRematch) {
      // BUG FIX: Host ide kroz isti flow kao ostali igrači
      // NE menjaj phase odmah — return-to-lobby event će to uraditi
      socket.emit('player-rematch', { roomCode: gameState.roomCode });
    } else {
      goHome();
    }
  };

  const playerRematch = () => {
    socket.emit('player-rematch', { roomCode: gameState.roomCode });
  };

  const leaveGame = () => {
    socket.emit('leave-game', { roomCode: gameState.roomCode });
    goHome();
  };

  const goHome = () => {
    if (gameState.roomCode && gameState.phase === 'lobby') {
      socket.emit('leave-lobby', { roomCode: gameState.roomCode });
    }

    setGameState({
      phase: 'home',
      roomCode: null,
      playerId: null,
      playerName: null,
      hostId: null,
      isHost: false,
      players: [],
      myRole: null,
      mafiaPartners: [],
      nightInfo: null,
      mafiaChat: [],
      deadPlayers: [],
      mafiaTarget: null,
      doctorTarget: null,
      policeTarget: null,
      policeRevealedRole: null,
      silencedPlayer: null,
      poisonedPlayers: [],
      votes: {},
      chatMessages: [],
      timer: 120,
      winner: null,
      gamePhase: null,
      countdown: null,
      roleRevealed: false,
      hostWantsRematch: false
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-950 to-black relative overflow-hidden">
      <div className="falling-card">🂡</div>
      <div className="falling-card">🂱</div>
      <div className="falling-card">🃁</div>
      <div className="falling-card">🃑</div>
      <div className="falling-card">🂢</div>
      <div className="falling-card">🂲</div>
      <div className="falling-card">🃂</div>
      <div className="falling-card">🃒</div>
      <div className="falling-card">🂣</div>
      <div className="falling-card">🂳</div>
      <div className="falling-card">🃃</div>
      <div className="falling-card">🃓</div>
      <div className="falling-card">🂤</div>
      <div className="falling-card">🂴</div>
      <div className="falling-card">🃄</div>
      <div className="falling-card">🃔</div>
      <div className="falling-card">🂥</div>
      <div className="falling-card">🂵</div>
      <div className="falling-card">🃅</div>
      <div className="falling-card">🃕</div>
      <div className="falling-card">🂦</div>
      <div className="falling-card">🂶</div>
      <div className="falling-card">🃆</div>
      <div className="falling-card">🃖</div>
      <div className="falling-card">🂧</div>
      <div className="falling-card">🂷</div>
      <div className="falling-card">🃇</div>
      <div className="falling-card">🃗</div>
      <div className="falling-card">🂨</div>
      <div className="falling-card">🂸</div>
      <div className="falling-card">🃈</div>
      <div className="falling-card">🃘</div>
      <div className="falling-card">🂩</div>
      <div className="falling-card">🂹</div>
      <div className="falling-card">🃉</div>
      <div className="falling-card">🃙</div>
      <div className="falling-card">🂪</div>
      <div className="falling-card">🂺</div>
      <div className="falling-card">🃊</div>
      <div className="falling-card">🃚</div>
      <div className="falling-card">🂫</div>
      <div className="falling-card">🂻</div>
      <div className="falling-card">🃋</div>
      <div className="falling-card">🃛</div>
      <div className="falling-card">🂭</div>
      <div className="falling-card">🂽</div>
      <div className="falling-card">🃍</div>
      <div className="falling-card">🃝</div>
      <div className="falling-card">🂮</div>
      <div className="falling-card">🂾</div>
      <div className="falling-card">🃎</div>
      <div className="falling-card">🃞</div>
      <div className="falling-card">🃏</div>
      <div className="falling-card">🃟</div>
      <div className="falling-card">🂠</div>
      <div className="falling-card">🂿</div>

      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-bounce">
          {error}
        </div>
      )}

      {gameState.phase === 'countdown' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-white text-2xl font-bold uppercase mb-8 tracking-widest">Igra počinje za...</p>
            <div className="countdown-number text-white font-black" style={{ fontSize: '20rem', lineHeight: 1 }}>
              {gameState.countdown}
            </div>
          </div>
        </div>
      )}

      {gameState.phase === 'roleReveal' && gameState.myRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-slate-400 text-xl uppercase tracking-widest mb-8">Tvoja uloga je...</p>
            <div className="card-flip-container">
              <div className="card-flip">
                <div className="card-front">
                  <div className="text-9xl">🂠</div>
                </div>
                <div className="card-back">
                  <div className={`w-48 h-64 rounded-2xl bg-gradient-to-br ${
                    gameState.myRole === 'mafia' ? 'from-red-600 to-red-900' :
                    gameState.myRole === 'doctor' ? 'from-emerald-500 to-emerald-800' :
                    gameState.myRole === 'police' ? 'from-blue-500 to-blue-800' :
                    gameState.myRole === 'dama' ? 'from-purple-500 to-purple-800' :
                    gameState.myRole === 'joker' ? 'from-yellow-500 to-red-600' :
                    'from-slate-400 to-slate-700'
                  } flex flex-col items-center justify-center border-4 border-white/20 shadow-2xl`}>
                    <div className="text-7xl mb-4">
                      {gameState.myRole === 'mafia' ? '🔫' :
                       gameState.myRole === 'doctor' ? '⚕️' :
                       gameState.myRole === 'police' ? '🚔' :
                       gameState.myRole === 'dama' ? '👑' :
                       gameState.myRole === 'joker' ? '🃏' : '👤'}
                    </div>
                    <p className="text-white font-black text-2xl uppercase">
                      {gameState.myRole === 'mafia' ? 'MAFIJA' :
                       gameState.myRole === 'doctor' ? 'DOKTOR' :
                       gameState.myRole === 'police' ? 'POLICIJA' :
                       gameState.myRole === 'dama' ? 'DAMA' :
                       gameState.myRole === 'joker' ? 'DŽOKER' : 'GRAĐANIN'}
                    </p>
                    {gameState.mafiaPartners && gameState.mafiaPartners.length > 0 && (
                      <p className="text-red-200 text-xs mt-3 text-center px-4">
                        Partner: {gameState.mafiaPartners.map(m => m.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-8 uppercase tracking-widest animate-pulse">
              Igra počinje za trenutak...
            </p>
          </div>
        </div>
      )}

      {gameState.phase === 'home' && (
        <HomeScreen
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          connecting={connecting}
        />
      )}

      {gameState.phase === 'lobby' && (
        <Lobby
          gameState={gameState}
          onStartGame={startGame}
          onCancel={goHome}
        />
      )}

      {gameState.phase === 'game' && (
        <GameScreen
          gameState={gameState}
          onSelectTarget={selectTarget}
          onSkipAction={skipAction}
          onSendMessage={sendMessage}
          onCastVote={castVote}
        />
      )}

      {gameState.phase === 'ended' && (
        <ResultScreen
          winner={gameState.winner}
          isHost={gameState.isHost}
          hostWantsRematch={gameState.hostWantsRematch}
          onHostDecision={hostRematchDecision}
          onPlayerRematch={playerRematch}
          onLeaveGame={leaveGame}
        />
      )}
    </div>
  );
}

export default App;