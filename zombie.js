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
    
    // 좀비마다 고유한 순찰 목표점 (영역 확장을 위한 타겟)
    this.patrolTarget = null;
    this.patrolTimer = 0;
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
    // 1. 좀비 꼬리가 너무 길어지면 (약 6칸 이상), 안전하게 자기 영역으로 돌아가서 땅을 굳히도록 유도
    let isHeadingHome = false;
    let targetR = this.r;
    let targetC = this.c;

    if (this.tail.length >= 6) {
      // 가장 가까운 자기 좀비 땅 찾기
      let minHomeDist = Infinity;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (getOwner(r, c) === OWNER_ZOMBIE) {
            let d = Math.abs(r - this.r) + Math.abs(c - this.c);
            if (d < minHomeDist) {
              minHomeDist = d;
              targetR = r;
              targetC = c;
              isHeadingHome = true;
            }
          }
        }
      }
    }

    // 2. 집으로 돌아가는 상태가 아니라면, 영역 확장을 위한 스마트 AI 구동
    if (!isHeadingHome) {
      // 30프레임(약 1초)마다 혹은 목표지에 도달하면 새로운 빈 땅을 순찰 목표로 설정
      this.patrolTimer--;
      if (!this.patrolTarget || this.patrolTimer <= 0 || (this.r === this.patrolTarget.r && this.c === this.patrolTarget.c)) {
        // 무작위 빈 타일이나 플레이어 땅 중에서 목표를 선정하여 강제 확장 유도
        let attempts = 0;
        while (attempts < 20) {
          let rr = Math.floor(p.random(1, ROWS - 1));
          let cc = Math.floor(p.random(1, COLS - 1));
          if (getOwner(rr, cc) !== OWNER_ZOMBIE) {
            this.patrolTarget = { r: rr, c: cc };
            break;
          }
          attempts++;
        }
        this.patrolTimer = Math.floor(p.random(45, 90)); // 1.5초~3초간 유지
      }

      // 60% 확률로는 영역 확장 순찰, 40% 확률로는 근처 플레이어 습격 (밸런스 조절)
      if (p.random() < 0.6 && this.patrolTarget) {
        targetR = this.patrolTarget.r;
        targetC = this.patrolTarget.c;
      } else {
        // 원래 있던 플레이어 추적 로직
        let minDist = Infinity;
        for (const pl of players) {
          if (!pl.alive) continue;
          const targets = pl.tail.length > 0 ? pl.tail : [{ r: pl.r, c: pl.c }];
          for (const t of targets) {
            const d = Math.abs(t.r - this.r) + Math.abs(t.c - this.c);
            if (d < minDist) { minDist = d; targetR = t.r; targetC = t.c; }
          }
        }
      }
    }

    // 3. 목표 방향 결정 및 꺾기 직진 방지 (플레이어처럼 좌/우 회전 유도)
    if (p.random() < 0.15) { 
      // 15%의 확률로 진행 방향 근처로 꺾어 원형태(땅 점령) 동선 그리게 유도
      this._randomDir(p);
    } else {
      const dr = Math.sign(targetR - this.r);
      const dc = Math.sign(targetC - this.c);

      // 현재 직진 방향의 반대로 역주행하는 것을 방지하면서 꺾기
      if (dr !== 0 && dc !== 0) {
        if (p.random() < 0.5) {
          if (dr !== -this.dr) { this.dr = dr; this.dc = 0; }
        } else {
          if (dc !== -this.dc) { this.dr = 0; this.dc = dc; }
        }
      } else if (dr !== 0 && dr !== -this.dr) {
        this.dr = dr; this.dc = 0;
      } else if (dc !== 0 && dc !== -this.dc) {
        this.dr = 0; this.dc = dc;
      }
    }

    const nr = this.r + this.dr;
    const nc = this.c + this.dc;

    // 맵 경계: 반사
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      this._randomDir(p);
      return;
    }

    // 꼬리(줄) 관리 & 영역 점령
    const isOnOwned = getOwner(this.r, this.c) === OWNER_ZOMBIE;
    if (isOnOwned) {
      if (this.tail.length > 0) {
        const tailSet = new Set(this.tail.map(t => `${t.r},${t.c}`));
        // 중요: grid.js의 floodFillEnclosed를 호출해 좀비 꼬리 내부를 보라색(OWNER_ZOMBIE)으로 채움!
        floodFillEnclosed(tailSet, OWNER_ZOMBIE, p);
        this.tail = [];
      }
    } else {
      this.tail.push({ r: this.r, c: this.c });
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

  // 플레이어가 좀비 꼬리(줄)를 밟으면 → 좀비 사망
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
    // 역주행 차단 로직 포함된 안전한 랜덤 방향
    const validDirs = dirs.filter(d => !(d[0] === -this.dr && d[1] === -this.dc));
    const d = validDirs[Math.floor(p.random(validDirs.length))];
    this.dr = d[0]; this.dc = d[1];
  }

  draw(p) {
    if (!this.alive) return;
    // 꼬리(줄) 그리기
    p.noStroke();
    p.fill(zombieBloodTimer > 0 ? p.color(200,0,0,160) : p.color(120,50,180,160));
    for (const t of this.tail) {
      p.rect(t.c*TILE_SIZE+4, t.r*TILE_SIZE+4, TILE_SIZE-8, TILE_SIZE-8, 2);
    }
    // 본체
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

function createZombieInitialArea(startR, startC) {
  for (let r = startR; r < startR + 2; r++) {
    for (let c = startC; c < startC + 2; c++) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        setOwner(r, c, OWNER_ZOMBIE);
      }
    }
  }
}

function initZombies() {
  zombies = [];
  zombieBloodTimer = 0;
  zombieSpawnTimer = 0;
  const pos = [
    [3,3],[3,COLS-4],[ROWS-4,3],[ROWS-4,COLS-4],[ROWS/2|0,3],[3,COLS/2|0]
  ];
  for (let i = 0; i < Math.min(ZOMBIE_COUNT, pos.length); i++) {
    const r = pos[i][0];
    const c = pos[i][1];
    zombies.push(new Zombie(r, c));
    createZombieInitialArea(r, c);
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
  zombies.push(new Zombie(pos[0], pos[1]));
  createZombieInitialArea(pos[0], pos[1]);
}

function drawZombies(p) {
  for (const z of zombies) z.draw(p);
}
