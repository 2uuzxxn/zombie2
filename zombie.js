// zombie.js
// - 꼬리(줄)를 끊겨야만 죽음
// - 자신의 땅 영역 보유 가능
// - 계속 생성됨 (최대 수 유지)
// - 플레이어 줄을 끊어도 좀비는 죽지 않음

let zombieBloodTimer = 0;
let zombieSpawnTimer = 0;
const ZOMBIE_SPAWN_INTERVAL = 300; // 10초마다 좀비 추가 생성
const ZOMBIE_MAX = 12;             // 최대 좀비 수

class Zombie {
  constructor(r, c) {
    this.r = r;
    this.c = c;
    this.dr = 0;
    this.dc = 1;
    this.moveAccum = 0;
    this.tail = [];
    this.alive = true;
  }

  get speed() {
    return zombieBloodTimer > 0 ? ZOMBIE_SPEED_BOOSTED : ZOMBIE_SPEED_NORMAL;
  }

  update(players, p) {
    if (!this.alive) return;
    this.moveAccum += this.speed / FRAME_RATE;
    while (this.moveAccum >= 1) {
      this.moveAccum -= 1;
      this._step(players, p);
      if (!this.alive) return;
    }
  }

  _step(players, p) {
    // 방향 결정
    if (p.random() < ZOMBIE_RANDOM_CHANCE) {
      this._randomDir(p);
    } else {
      let targetR = this.r, targetC = this.c, minDist = Infinity;
      for (const pl of players) {
        if (!pl.alive) continue;
        const targets = pl.tail.length > 0 ? pl.tail : [{ r: pl.r, c: pl.c }];
        for (const t of targets) {
          const d = Math.abs(t.r-this.r) + Math.abs(t.c-this.c);
          if (d < minDist) { minDist = d; targetR = t.r; targetC = t.c; }
        }
      }
      const dr = Math.sign(targetR - this.r);
      const dc = Math.sign(targetC - this.c);
      if (dr !== 0 && dc !== 0) {
        if (p.random() < 0.5) { this.dr = dr; this.dc = 0; }
        else { this.dr = 0; this.dc = dc; }
      } else if (dr !== 0) { this.dr = dr; this.dc = 0; }
        else if (dc !== 0) { this.dr = 0; this.dc = dc; }
        else { this._randomDir(p); }
    }

    const nr = this.r + this.dr;
    const nc = this.c + this.dc;

    // 맵 경계: 반사 (죽지 않음)
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      this._randomDir(p);
      return;
    }

    // 좀비 영역 점령 및 꼬리 관리 시스템
    const isOnOwned = getOwner(this.r, this.c) === OWNER_ZOMBIE;
    if (isOnOwned) {
      if (this.tail.length > 0) {
        const tailSet = new Set(this.tail.map(t => `${t.r},${t.c}`));
        floodFillEnclosed(tailSet, OWNER_ZOMBIE, null);
        this.tail = [];
      }
    } else {
      this.tail.push({ r: this.r, c: this.c });
      
      // 좀비가 빈 땅(OWNER_NONE)을 지나갈 때는 즉시 좀비 땅으로 칠하면서 전진!
      if (getOwner(this.r, this.c) === OWNER_NONE) {
        setOwner(this.r, this.c, OWNER_ZOMBIE);
      }
    }

    // 플레이어 꼬리(줄) 끊기
    for (const pl of players) {
      if (!pl.alive) continue;
      const hitIdx = pl.tail.findIndex(t => t.r === nr && t.c === nc);
      if (hitIdx !== -1) {
        pl._cutTailAt(nr, nc);
      }
    }

    this.r = nr;
    this.c = nc;
  }

  cutTailAt(r, c) {
    const idx = this.tail.findIndex(t => t.r === r && t.c === c);
    if (idx !== -1) {
      for (let i = idx; i < this.tail.length; i++) {
        setOwner(this.tail[i].r, this.tail[i].c, OWNER_NONE);
      }
      this.tail.splice(idx);
      this._die();
    }
  }

  _die() {
    this.alive = false;
    for (const t of this.tail) setOwner(t.r, t.c, OWNER_NONE);
    this.tail = [];
  }

  _randomDir(p) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    const d = dirs[Math.floor(p.random(dirs.length))];
    this.dr = d[0]; this.dc = d[1];
  }

  draw(p) {
    if (!this.alive) return;
    p.noStroke();
    p.fill(zombieBloodTimer > 0 ? p.color(200,0,0,160) : p.color(120,50,180,160));
    for (const t of this.tail) {
      p.rect(t.c*TILE_SIZE+4, t.r*TILE_SIZE+4, TILE_SIZE-8, TILE_SIZE-8, 2);
    }
    const x = this.c*TILE_SIZE, y = this.r*TILE_SIZE;
    p.fill(zombieBloodTimer > 0 ? '#E53935' : '#AB47BC');
    p.noStroke();
    p.rect(x+2, y+2, TILE_SIZE-4, TILE_SIZE-4, 4);
    p.fill(255, 50, 50);
    p.ellipse(x+6, y+7, 4, 4);
    p.ellipse(x+12, y+7, 4, 4);
  }
}

let zombies = [];

function initZombies() {
  zombies = [];
  zombieBloodTimer = 0;
  zombieSpawnTimer = 0;

  // ── [버그 수정] 좌표 연산에 안전한 Math.floor를 사용하여 온전한 숫자 데이터 배열 생성 ──
  const midR = Math.floor(ROWS / 2);
  const midC = Math.floor(COLS / 2);
  
  const pos = [
    [3, 3], 
    [3, COLS - 4], 
    [ROWS - 4, 3], 
    [ROWS - 4, COLS - 4], 
    [midR, 3], 
    [3, midC]
  ];
  
  // 좀비 생성 및 집(보라색 영역 3x3) 강제 생성
  for (let i = 0; i < Math.min(ZOMBIE_COUNT, pos.length); i++) {
    const startR = pos[i][0];
    const startC = pos[i][1];
    zombies.push(new Zombie(startR, startC));
    
    // 스폰 위치 주변 3x3 타일을 좀비 땅으로 확실하게 칠해버림!
    for (let r = startR - 1; r <= startR + 1; r++) {
      for (let c = startC - 1; c <= startC + 1; c++) {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          setOwner(r, c, OWNER_ZOMBIE);
        }
      }
    }
  }
}

function updateZombies(players, p) {
  if (zombieBloodTimer > 0) zombieBloodTimer--;

  zombieSpawnTimer++;
  if (zombieSpawnTimer >= ZOMBIE_SPAWN_INTERVAL && zombies.length < ZOMBIE_MAX) {
    zombieSpawnTimer = 0;
    _spawnZombie(p);
  }

  for (const z of zombies) z.update(players, p);

  for (let i = zombies.length-1; i >= 0; i--) {
    if (!zombies[i].alive) zombies.splice(i, 1);
  }
}

function _spawnZombie(p) {
  const corners = [
    [Math.floor(p.random(2,6)), Math.floor(p.random(2,6))],
    [Math.floor(p.random(2,6)), Math.floor(p.random(COLS-6, COLS-2))],
    [Math.floor(p.random(ROWS-6,ROWS-2)), Math.floor(p.random(2,6))],
    [Math.floor(p.random(ROWS-6,ROWS-2)), Math.floor(p.random(COLS-6,COLS-2))],
  ];
  const pos = corners[Math.floor(p.random(corners.length))];
  const zR = pos[0];
  const zC = pos[1];
  
  zombies.push(new Zombie(zR, zC));
  setOwner(zR, zC, OWNER_ZOMBIE);
}

function drawZombies(p) {
  for (const z of zombies) z.draw(p);
}

function drawZombies(p) {
  for (const z of zombies) z.draw(p);
}
