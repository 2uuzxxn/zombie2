// sketch.js — 게임의 심장

let phase = PHASE_LOBBY;
let gameTimer = 0;
let betrayalTriggered = false;
let winner = null;
let soloTimer = 0;
let deadPlayerId = null;

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  frameRate(FRAME_RATE);
  textFont('monospace');
  resetGame();
}

function resetGame() {
  initGrid();
  // ── [순서 수정] 플레이어를 먼저 만들고 좀비를 나중에 만들어야 좀비 집이 안 지워져! ──
  initPlayers();  // 초록색 플레이어 팀 땅을 먼저 생성
  initZombies();  // 보라색 좀비 기지(3x3)를 그 위에 덮어써서 보금자리 확보!
  initTiles(this);
  
  gameTimer = GAME_TOTAL_TIME * FRAME_RATE;
  betrayalTriggered = false;
  winner = null;
  betrayalAnnounceFade = 0;
  soloTimer = 0;
  deadPlayerId = null;
  notifications = [];
  phase = PHASE_LOBBY;
}

function draw() {
  background(COLOR_EMPTY);

  if (phase === PHASE_LOBBY) { drawLobby(this); return; }

  if (phase === PHASE_END) {
    drawGrid(this); drawZombies(this);
    playerA.draw(this); playerB.draw(this);
    drawResultScreen(this, countTiles(), winner);
    return;
  }

  gameTimer--;
  const timeLeftSec = gameTimer / FRAME_RATE;

  if (!betrayalTriggered && timeLeftSec <= BETRAYAL_TRIGGER_TIME) {
    _triggerBetrayal();
  }

  if (phase === PHASE_SOLO) {
    soloTimer--;
    if (soloTimer <= 0) _reviveDeadPlayer();
  }

  updateTiles(this);
  updateZombies([playerA, playerB], this);
  if (playerA.alive) playerA.update(playerB, zombies, phase, this);
  if (playerB.alive) playerB.update(playerA, zombies, phase, this);

  _checkEndConditions(timeLeftSec);

  drawGrid(this);
  drawTiles(this);
  drawZombies(this);
  playerA.draw(this); playerB.draw(this);
  drawBetrayalAnnounce(this);
  drawUI(this, phase, timeLeftSec, countTiles());
}

function _triggerBetrayal() {
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  const pA = playerA.alive ? {r:playerA.r,c:playerA.c} : {r:Math.floor(ROWS/2)-3,c:Math.floor(COLS/2)};
  const pB = playerB.alive ? {r:playerB.r,c:playerB.c} : {r:Math.floor(ROWS/2)+3,c:Math.floor(COLS/2)};
  voronoiSplit(pA, pB);
  playerA.setPhase(PHASE_BETRAYAL);
  playerB.setPhase(PHASE_BETRAYAL);
  for (const t of playerA.tail) setOwner(t.r, t.c, OWNER_A);
  for (const t of playerB.tail) setOwner(t.r, t.c, OWNER_B);
  showBetrayalAnnounce(this);
}

function _checkEndConditions(timeLeftSec) {
  if (gameTimer <= 0) { _endGame('timer'); return; }

  if (!playerA.alive && !playerB.alive) { _endGame('both_dead'); return; }

  if (phase === PHASE_COOP) {
    if (!playerA.alive || !playerB.alive) {
      phase = PHASE_SOLO;
      deadPlayerId = !playerA.alive ? 'A' : 'B';
      soloTimer = SOLO_TIME_LIMIT * FRAME_RATE;
      const survivor = deadPlayerId === 'A' ? 'B' : 'A';
      showNotification(survivor,
        `P${deadPlayerId} 사망! ${SOLO_TIME_LIMIT}초 후 부활 & 배신 30초!`, '#FF9800');
    }
  }

  if (phase === PHASE_BETRAYAL) {
    if (!playerA.alive && playerB.alive) { winner = 'B'; phase = PHASE_END; return; }
    if (!playerB.alive && playerA.alive) { winner = 'A'; phase = PHASE_END; return; }
  }
}

function _reviveDeadPlayer() {
  const midR = Math.floor(ROWS/2);
  const midC = Math.floor(COLS/2);
  const survivor = deadPlayerId === 'A' ? playerB : playerA;
  const dead     = deadPlayerId === 'A' ? playerA : playerB;

  const deadSpawnR = midR + (deadPlayerId === 'A' ? -3 : 3);
  const deadSpawnC = midC;

  voronoiSplit({r:deadSpawnR, c:deadSpawnC}, {r:survivor.r, c:survivor.c});

  const deadOwner = deadPlayerId === 'A' ? OWNER_A : OWNER_B;
  dead.revive(deadSpawnR, deadSpawnC, deadOwner);

  gameTimer = EMERGENCY_BETRAYAL_TIME * FRAME_RATE;
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  playerA.setPhase(PHASE_BETRAYAL);
  playerB.setPhase(PHASE_BETRAYAL);
  deadPlayerId = null;

  showBetrayalAnnounce(this);
  showNotification('A', '부활! 배신 타이머 30초 발동!', '#FF5252');
}

function _endGame(reason) {
  phase = PHASE_END;
  const counts = countTiles();
  if (reason === 'timer') {
    if (playerA.alive && playerB.alive) {
      if (counts.A > counts.A) winner = 'A';
      else if (counts.B > counts.A) winner = 'B';
      else winner = 'draw';
    } else if (playerA.alive) {
      winner = 'A';
    } else if (playerB.alive) {
      winner = 'B';
    } else {
      winner = 'zombie';
    }
  } else {
    winner = 'zombie';
  }
}

function keyPressed() {
  if (phase === PHASE_LOBBY && keyCode === 32) { phase = PHASE_COOP; return; }
  if (phase === PHASE_END && (key==='r'||key==='R')) { resetGame(); return; }
  if (phase===PHASE_COOP || phase===PHASE_SOLO || phase===PHASE_BETRAYAL) {
    playerA.handleKeyPressed(keyCode);
    playerB.handleKeyPressed(keyCode);
  }
}

function mousePressed() {
  const cx=CANVAS_W/2, cy=CANVAS_H/2;
  if (phase===PHASE_END &&
      mouseX>cx-80&&mouseX<cx+80&&mouseY>cy+58&&mouseY<cy+96) { resetGame(); }
  if (phase===PHASE_LOBBY &&
      mouseX>cx-100&&mouseX<cx+100&&mouseY>cy+80&&mouseY<cy+126) { phase=PHASE_COOP; }
}
