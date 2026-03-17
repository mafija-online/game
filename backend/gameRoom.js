export class GameRoom {
  constructor(code, hostId, io) {
    this.code = code;
    this.maxPlayers = 15;
    this.hostId = hostId;
    this.io = io;
    this.players = [];
    this.phase = 'lobby';
    this.roles = {};
    this.deadPlayers = [];
    this.mafiaTarget = null;
    this.doctorTarget = null;
    this.policeTarget = null;
    this.policeRevealedRole = null;
    this.silencedPlayer = null;
    this.poisonedPlayers = [];
    this.votes = {};
    this.chatMessages = [];
    this.mafiaChat = [];
    this.timer = null;
    this.timerInterval = null;
    this.votingTimerInterval = null;
    this.chatDuration = 120;
    this.hostWantsRematch = null;
    this._playerNames = new Map(); // Čuva imena igrača kroz rematch
  }

  addPlayer(socketId, name, isHost) {
    this.players.push({ id: socketId, name, isHost });
    this._playerNames.set(socketId, name); // Zapamti ime
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.id !== socketId);
  }

  hasPlayer(socketId) {
    return this.players.some(p => p.id === socketId);
  }

  getPlayer(socketId) {
    return this.players.find(p => p.id === socketId);
  }

  getPlayers() {
    return this.players;
  }

  assignNewHost() {
    if (this.players.length > 0) {
      this.hostId = this.players[0].id;
      this.players[0].isHost = true;
    }
  }

  // BUG FIX: Proverava da li uloga postoji I da li je igrač sa tom ulogom živ
  hasRole(role) {
    return Object.entries(this.roles).some(
      ([playerId, r]) => r === role && !this.deadPlayers.includes(playerId)
    );
  }

  startGame(chatDuration = 120) {
    this.phase = 'countdown';
    this.chatDuration = chatDuration;
    this.hostWantsRematch = null;

    let count = 3;
    const countdownInterval = setInterval(() => {
      this.io.to(this.code).emit('countdown', { count });
      count--;
      if (count < 0) {
        clearInterval(countdownInterval);
        this.assignRoles();
      }
    }, 1000);
  }

  assignRoles() {
    const count = this.players.length;
    const roles = [];

    if (count >= 4 && count <= 6) {
      roles.push('mafia', 'doctor', 'police');
      while (roles.length < count) roles.push('innocent');
    }
    else if (count >= 7 && count <= 9) {
      roles.push('mafia', 'mafia', 'doctor', 'police', 'dama');
      while (roles.length < count) roles.push('innocent');
    }
    else if (count >= 10 && count <= 12) {
      roles.push('mafia', 'mafia', 'doctor', 'police', 'dama', 'joker');
      while (roles.length < count) roles.push('innocent');
    }
    else if (count >= 13 && count <= 15) {
      roles.push('mafia', 'mafia', 'mafia', 'doctor', 'police', 'dama', 'joker');
      while (roles.length < count) roles.push('innocent');
    }

    const shuffled = roles.sort(() => Math.random() - 0.5);

    this.players.forEach((player, index) => {
      this.roles[player.id] = shuffled[index];
    });

    this.phase = 'roleReveal';

    this.players.forEach(player => {
      const mafiaPartners = this.roles[player.id] === 'mafia'
        ? this.players.filter(p => p.id !== player.id && this.roles[p.id] === 'mafia')
        : [];

      this.io.to(player.id).emit('role-assigned', {
        role: this.roles[player.id],
        mafiaPartners
      });
    });

    setTimeout(() => {
      this.startMafiaTurn();
    }, 4000);
  }

  startMafiaTurn() {
    this.phase = 'mafiaTurn';
    // Resetuj sve targete na početku svake nove noći
    this.mafiaTarget = null;
    this.doctorTarget = null;
    this.policeTarget = null;
    this.policeRevealedRole = null;
    this.silencedPlayer = null;
    this.broadcastGameState();
  }

  startDoctorTurn() {
    if (!this.hasRole('doctor')) {
      this.startPoliceTurn();
      return;
    }
    this.phase = 'doctorTurn';
    this.doctorTarget = null;
    this.broadcastGameState();
  }

  startPoliceTurn() {
    if (!this.hasRole('police')) {
      this.startDamaTurn();
      return;
    }
    this.phase = 'policeTurn';
    this.policeTarget = null;
    this.policeRevealedRole = null;
    this.broadcastGameState();
  }

  startDamaTurn() {
    if (!this.hasRole('dama')) {
      this.resolveNight();
      return;
    }
    this.phase = 'damaTurn';
    this.silencedPlayer = null;
    this.broadcastGameState();
  }

  resolveNight() {
    let killed = false;
    let saved = false;
    let targetName = '';

    if (this.mafiaTarget && this.mafiaTarget !== this.doctorTarget) {
      this.deadPlayers.push(this.mafiaTarget);
      killed = true;
      targetName = this.players.find(p => p.id === this.mafiaTarget)?.name || 'Nepoznat';
    } else if (this.mafiaTarget && this.mafiaTarget === this.doctorTarget) {
      saved = true;
      targetName = this.players.find(p => p.id === this.mafiaTarget)?.name || 'Nepoznat';
    }

    this.io.to(this.code).emit('night-results', { killed, saved, targetName });

    // BUG FIX: Proveri pobednika odmah posle noći, pre chat faze
    const alivePlayers = this.players.filter(p => !this.deadPlayers.includes(p.id));
    const aliveMafia = alivePlayers.filter(p => this.roles[p.id] === 'mafia');
    const aliveInnocent = alivePlayers.filter(p => this.roles[p.id] !== 'mafia');

    if (aliveMafia.length === 0) {
      setTimeout(() => this.endGame('innocent'), 2000);
      return;
    }
    if (aliveMafia.length >= aliveInnocent.length) {
      setTimeout(() => this.endGame('mafia'), 2000);
      return;
    }

    this.startChatPhase();
  }

  startChatPhase() {
    this.phase = 'chat';
    this.timer = this.chatDuration;
    this.chatMessages = [];
    this.mafiaChat = [];
    this.broadcastGameState();

    this.timerInterval = setInterval(() => {
      this.timer--;
      this.io.to(this.code).emit('timer-update', { timer: this.timer });

      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
        this.startVoting();
      }
    }, 1000);
  }

  startVoting() {
    this.phase = 'voting';
    this.votes = {};
    this.silencedPlayer = null;
    this.broadcastGameState();

    this.votingTimerInterval = setTimeout(() => {
      this.resolveVoting();
    }, 30000);
  }

  resolveVoting() {
    if (this.votingTimerInterval) {
      clearTimeout(this.votingTimerInterval);
      this.votingTimerInterval = null;
    }

    const voteCounts = {};
    Object.values(this.votes).forEach(targetId => {
      if (targetId) {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
    });

    let maxVotes = 0;
    let eliminated = null;
    Object.entries(voteCounts).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminated = playerId;
      }
    });

    if (eliminated && maxVotes > 0) {
      this.deadPlayers.push(eliminated);
    }

    this.checkWinCondition();
  }

  checkWinCondition() {
    const alivePlayers = this.players.filter(p => !this.deadPlayers.includes(p.id));
    const aliveMafia = alivePlayers.filter(p => this.roles[p.id] === 'mafia');
    const aliveInnocent = alivePlayers.filter(p => this.roles[p.id] !== 'mafia');

    const lastEliminated = this.deadPlayers[this.deadPlayers.length - 1];
    const jokerEliminatedByVote = lastEliminated && this.roles[lastEliminated] === 'joker';

    if (jokerEliminatedByVote) {
      this.endGame('joker');
    } else if (aliveMafia.length === 0) {
      this.endGame('innocent');
    } else if (aliveMafia.length >= aliveInnocent.length) {
      this.endGame('mafia');
    } else {
      this.startMafiaTurn();
    }
  }

  endGame(winner) {
    this.phase = 'ended';
    clearInterval(this.timerInterval);
    if (this.votingTimerInterval) {
      clearTimeout(this.votingTimerInterval);
    }
    this.io.to(this.code).emit('game-state-update', {
      phase: 'ended',
      winner,
      players: this.getPlayers(),
      deadPlayers: this.deadPlayers,
      roles: this.roles,
      hostWantsRematch: false
    });
  }

  handleTargetSelection(socketId, targetId) {
    const role = this.roles[socketId];

    if (this.phase === 'mafiaTurn' && role === 'mafia') {
      this.mafiaTarget = targetId;
      this.broadcastGameState();
      setTimeout(() => {
        if (this.phase === 'mafiaTurn') this.startDoctorTurn();
      }, 2000);
    } else if (this.phase === 'doctorTurn' && role === 'doctor') {
      this.doctorTarget = targetId;
      this.broadcastGameState();
      setTimeout(() => {
        if (this.phase === 'doctorTurn') this.startPoliceTurn();
      }, 2000);
    } else if (this.phase === 'policeTurn' && role === 'police') {
      this.policeTarget = targetId;
      this.policeRevealedRole = {
        player: targetId,
        role: this.roles[targetId]
      };
      this.broadcastGameState();
    } else if (this.phase === 'damaTurn' && role === 'dama') {
      this.silencedPlayer = targetId;
      this.broadcastGameState();
      setTimeout(() => {
        if (this.phase === 'damaTurn') this.resolveNight();
      }, 2000);
    }
  }

  handleSkipAction(socketId) {
    const role = this.roles[socketId];

    if (this.phase === 'mafiaTurn' && role === 'mafia') {
      this.startDoctorTurn();
    } else if (this.phase === 'doctorTurn' && role === 'doctor') {
      this.startPoliceTurn();
    } else if (this.phase === 'policeTurn' && role === 'police') {
      this.startDamaTurn();
    } else if (this.phase === 'damaTurn' && role === 'dama') {
      this.resolveNight();
    }
  }

  handleChatMessage(socketId, message, isMafiaChat = false) {
    const player = this.getPlayer(socketId);
    if (!player) return;

    const msg = {
      id: Date.now() + Math.random(),
      playerId: socketId,
      playerName: player.name,
      content: message,
      timestamp: Date.now()
    };

    if (isMafiaChat && this.roles[socketId] === 'mafia') {
      this.mafiaChat.push(msg);
      const mafiaPlayers = this.players.filter(p => this.roles[p.id] === 'mafia');
      mafiaPlayers.forEach(p => {
        this.io.to(p.id).emit('mafia-chat-message', { message: msg });
      });
    } else {
      this.chatMessages.push(msg);
      this.io.to(this.code).emit('chat-message', { message: msg });
    }
  }

  handleVote(socketId, targetId) {
    this.votes[socketId] = targetId;
    this.io.to(this.code).emit('vote-cast', { playerId: socketId, targetId });

    const alivePlayers = this.players.filter(p => !this.deadPlayers.includes(p.id));
    if (Object.keys(this.votes).length === alivePlayers.length) {
      this.resolveVoting();
    }
  }

  handleHostRematchDecision(wantsRematch) {
    this.hostWantsRematch = wantsRematch;

    if (wantsRematch) {
      // BUG FIX: Samo obavesti igrače da host želi rematch, NE resetuj sobu još
      this.io.to(this.code).emit('host-wants-rematch');
    } else {
      this.io.to(this.code).emit('host-left');
    }
  }

  handlePlayerRematch(socketId) {
    // Resetuj stanje sobe samo jednom (pri prvom pozivu)
    if (this.phase !== 'lobby') {
      this.deadPlayers = [];
      this.roles = {};
      this.votes = {};
      this.chatMessages = [];
      this.mafiaChat = [];
      this.mafiaTarget = null;
      this.doctorTarget = null;
      this.policeTarget = null;
      this.policeRevealedRole = null;
      this.silencedPlayer = null;
      this.poisonedPlayers = [];
      this.phase = 'lobby';
      this.hostWantsRematch = null;
      // Resetuj lobby listu — samo igrači koji potvrde ulaze ponovo
      this.players = [];
    }

    // Pronađi originalne podatke igrača iz stare liste (čuvamo ih privremeno)
    // Dodaj igrača u lobby tek sada kada je potvrdio
    const alreadyInLobby = this.players.some(p => p.id === socketId);
    if (!alreadyInLobby) {
      const isHost = socketId === this.hostId;
      // Ime igrača dolazi iz socket sesije — server ga pamti
      // Koristimo privremenu mapu imena ako postoji
      const playerName = this._playerNames?.get(socketId) || 'Igrač';
      this.players.push({ id: socketId, name: playerName, isHost });
    }

    // Vrati igrača u lobby
    this.io.to(socketId).emit('return-to-lobby');
    // Obavesti sve u sobi o ažuriranoj listi
    this.io.to(this.code).emit('players-updated', { players: this.getPlayers() });
  }

  handleHostLeaveLobby() {
    this.io.to(this.code).emit('host-left-lobby');
  }

  removePlayerFromGame(socketId) {
    this.removePlayer(socketId);

    if (socketId === this.hostId) {
      if (this.players.length > 0) {
        this.assignNewHost();
        this.io.to(this.code).emit('host-changed', { hostId: this.hostId });
        this.io.to(this.code).emit('host-left');
        return false;
      } else {
        return true;
      }
    }

    return false;
  }

  broadcastGameState() {
    this.io.to(this.code).emit('game-state-update', {
      phase: this.phase,
      players: this.getPlayers(),
      deadPlayers: this.deadPlayers,
      mafiaTarget: this.mafiaTarget,
      doctorTarget: this.doctorTarget,
      policeTarget: this.policeTarget,
      policeRevealedRole: this.policeRevealedRole,
      silencedPlayer: this.silencedPlayer,
      poisonedPlayers: this.poisonedPlayers,
      votes: this.votes,
      timer: this.timer,
      hostWantsRematch: this.hostWantsRematch ?? false
    });
  }
}