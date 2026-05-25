// zombie.js — 좀비 이동, 꼬리, 점령 및 자동 영역 확장 AI

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

    // AI 성향 설정을 위한 타이머 (영역 확장 모드 vs 플레이어 추격 모드)
    this.aiMode = 'expand'; // 'expand' 또는 'chase'
    this.modeTimer = Math.floor(Math.random() * (180 - 60) + 60); // 모드 유지 시간 (2~3초)
    
    // 초기 2x2 집(영역) 생성하기
    this._createInitialHome();
  }

  get speed() {
    return zombieBloodTimer > 0 ? ZOMBIE_SPEED_BOOSTED : ZOMBIE_SPEED_NORMAL;
  }

  // 처음에 생성될 때 2x2 크기의 안전한 집(좀비 땅)을 깔아주는 함수
  _createInitialHome() {
    for (let dr = 0; dr < 2; dr++) {
      for (let dc = 0; dc < 2; dc++) {
        let nr = this.r + dr;
        let nc = this.c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          setOwner(nr, nc, OWNER_ZOMBIE);
        }
      }
    }
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
    // 1. AI 모드 스위칭 (주기적으로 추격과 확장을 번갈아가며 수행)
    this.modeTimer--;
    if (this.modeTimer <= 0) {
      this.aiMode = p.random() < 0.6 ? 'expand' : 'chase'; // 60% 확률로 영역 확장 우선
      this.modeTimer = Math.floor(p.random(90, 240));     // 다음 변경까지의 시간
    }

    // 2. 현재 위치의 땅 주인 확인
    const currentOwner = getOwner(this.r, this.c);

    // 3. 방향 전환 타이밍 계산 (막혔거나, 꼬리가 없는데 자기 땅 위에서 나갈 때, 혹은 무작위)
    let needsNewDirection = false;
    
    // 전방이 벽이거나 장애물일 때
    let nextR = this.r + this.dr;
    let nextC = this.c + this.dc;
    if (nextR < 0 || nextR >= ROWS || nextC < 0 || nextC >= COLS) {
      needsNewDirection = true;
    }

    // 자기 땅 경계선에서 밖으로 나가 모험을 시작하려 할 때 무작위 방향 전환
    if (currentOwner === OWNER_ZOMBIE && this.tail.length === 0 && p.random() < 0.1) {
      needsNewDirection = true;
    }

    // 일정한 무작위 확률로 방향 전환 (움직임의 불확실성 제공)
    if (p.random() < ZOMBIE_RANDOM_CHANCE) {
      needsNewDirection = true;
    }

    if (needsNewDirection || (this.dr === 0 && this.dc === 0)) {
      this._chooseSmartDirection(players, p);
    }

    // 4. 실제로 한 칸 이동
    this.r += this.dr;
    this.c += this.dc;

    // 벽 경계값 예외 처리
    this.r = Math.max(0, Math.min(ROWS - 1, this.r));
    this.c = Math.max(0, Math.min(COLS - 1, this.c));

    // 5. 이동 후 땅 점령 및 꼬리 로직 처리
    const newOwner = getOwner(this.r, this.c);

    if (newOwner === OWNER_ZOMBIE) {
      // 좀비가 밖을 돌다가 자기 땅으로 복귀함 -> 가두어놓은 영역을 보라색 땅으로 채움!
      if (this.tail.length > 0) {
        let tailSet = new Set(this.tail.map(t => `${t.r},${t.c}`));
        
        // grid.js에 정의된 floodFillEnclosed를 호출하여 영역 굳히기
        if (typeof floodFillEnclosed === 'function') {
          floodFillEnclosed(tailSet, OWNER_ZOMBIE, null);
        } else {
          // 예외 보충용 직접 채우기
          for (let t of this.tail) {
            setOwner(t.r, t.c, OWNER_ZOMBIE);
          }
        }
        this.tail = []; // 꼬리 초기화
      }
    } else {
      // 외부 영역(빈 땅이나 플레이어 땅)을 지나가는 중 -> 꼬리를 남기며 전진
      // 자기 자신의 꼬리와 부딪히지 않았는지 체크
      if (this.tail.some(t => t.r === this.r && t.c === this.c)) {
        // 좀비가 스스로 꼬리를 꼬아 끊은 경우 -> 꼬리 소멸 및 일시 정지 후 탈출
        this.tail = [];
        this._chooseSmartDirection(players, p);
        return;
      }
      
      // 꼬리 배열에 추가
      this.tail.push({ r: this.r, c: this.c });
    }
  }

  // 지능적인 방향 결정 시스템 (자동 확장 및 추격 믹스)
  _chooseSmartDirection(players, p) {
    const dirs = [
      { dr: -1, dc: 0 }, // 상
      { dr: 1, dc: 0 },  // 하
      { dr: 0, dc: -1 }, // 좌
      { dr: 0, dc: 1 }   // 우
    ];

    // 유효한 방향(벽이 아닌 곳) 필터링
    let validDirs = dirs.filter(d => {
      let nr = this.r + d.dr;
      let nc = this.c + d.dc;
      return nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS;
    });

    if (validDirs.length === 0) return;

    // 역주행(바로 직전 왔던 길)을 가급적 피하기 위한 필터링
    if (validDirs.length > 1) {
      validDirs = validDirs.filter(d => !(d.dr === -this.dr && d.dc === -this.dc));
    }

    // 살아있는 플레이어 타겟 선정
    let targets = players.filter(pl => pl && pl.alive);

    // AI 모드에 따른 방향 점수 매기기
    let bestDir = validDirs[0];
    let bestScore = -Infinity;

    for (let d of validDirs) {
      let nr = this.r + d.dr;
      let nc = this.c + d.dc;
      let score = p.random(-1, 1); // 기본 랜덤 가중치 점수 (이로 인해 다양한 방향으로 퍼짐)

      if (this.aiMode === 'chase' && targets.length > 0) {
        // [플레이어 추격 모드] 플레이어와 가까워지는 방향에 높은 점수
        let minDist = Infinity;
        for (let t of targets) {
          let dist = Math.abs(nr - t.r) + Math.abs(nc - t.c);
          if (dist < minDist) minDist = dist;
        }
        score += (100 - minDist) * 2;
      } else {
        // [영역 확장 모드] 자신들의 땅이 아닌 곳(빈 땅, 플레이어 땅)을 개척하도록 유도
        let tileOwner = getOwner(nr, nc);
        if (tileOwner !== OWNER_ZOMBIE) {
          score += 25; // 개척하는 방향에 가산점!
        }
        
        // 만약 이미 꼬리가 길어졌다면(영역을 크게 그렸다면), 안전하게 자기 땅으로 돌아오도록 유도
        if (this.tail.length > 8 && tileOwner === OWNER_ZOMBIE) {
          score += 50;
        }
      }

      // 최고 점수를 가진 방향 선택
      if (score > bestScore) {
        bestScore = score;
        bestDir = d;
      }
    }

    this.dr = bestDir.dr;
    this.dc = bestDir.dc;
  }

  draw(p) {
    if (!this.alive) return;

    // 좀비가 맵을 넓힐 때 만드는 보라색 실시간 꼬리(선) 그리기
    p.noStroke();
    p.fill(156, 39, 176, 180); // 반투명 보라색 꼬리
    for (const t of this.tail) {
      p.rect(t.c * TILE_SIZE + 2, t.r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4, 2);
    }

    // 좀비 본체 그리기
    const x = this.c * TILE_SIZE, y = this.r * TILE_SIZE;
    p.fill(zombieBloodTimer > 0 ? '#E65100' : '#4A148C'); // 일반 시 짙은 보라색, 폭주시 주황색
    p.rect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 5);

    // 좀비 눈 (빨간색 눈빛)
    p.fill(255, 50, 50);
    p.ellipse(x + 5, y + 7, 3, 3);
    p.ellipse(x + 13, y + 7, 3, 3);
  }
}

// 기존 스폰 및 업데이트 로직 유지
function initZombies() {
  zombies = [];
  zombieBloodTimer = 0;
  zombieSpawnTimer = 0;
  // 스폰 위치를 모서리와 중앙 벽면으로 분산 배치
  const pos = [
    [2, 2], [2, COLS - 3], [ROWS - 3, 2], [ROWS - 3, COLS - 3], 
    [Math.floor(ROWS / 2), 2], [2, Math.floor(COLS / 2)]
  ];
  for (let i = 0; i < Math.min(ZOMBIE_COUNT, pos.length); i++) {
    zombies.push(new Zombie(pos[i][0], pos[i][1]));
  }
}

function updateZombies(players, p) {
  if (zombieBloodTimer > 0) zombieBloodTimer--;

  zombieSpawnTimer++;
  if (zombieSpawnTimer >= ZOMBIE_SPAWN_INTERVAL && zombies.length < ZOMBIE_MAX) {
    zombieSpawnTimer = 0;
    _spawnZombie(p);
  }

  for (const z of zombies) {
    z.update(players, p);
  }
}

function _spawnZombie(p) {
  const edges = [
    [2, Math.floor(p.random(2, COLS - 3))],
    [ROWS - 3, Math.floor(p.random(2, COLS - 3))],
    [Math.floor(p.random(2, ROWS - 3)), 2],
    [Math.floor(p.random(2, ROWS - 3)), COLS - 3]
  ];
  const pick = p.random(edges);
  zombies.push(new Zombie(pick[0], pick[1]));
}

function drawZombies(p) {
  for (const z of zombies) {
    z.draw(p);
  }
}
