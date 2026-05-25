class Zombie {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = ZOMBIE_SPEED_NORMAL;
    this.path = [];
    this.aiMode = 'expand'; // expand: 땅 넓히기, chase: 추격
    this.modeTimer = 0;
    this.targetX = x;
    this.targetY = y;
  }

  update(p) {
    this.modeTimer++;
    if (this.modeTimer > 120) { // 2초마다 행동 패턴 주기 전환
      this.aiMode = p.random(1) < 0.6 ? 'expand' : 'chase';
      this.modeTimer = 0;
      if (this.aiMode === 'expand') {
        this.targetX = p.random(0, p.width);
        this.targetY = p.random(0, p.height);
      }
    }

    let tx = this.targetX;
    let ty = this.targetY;

    if (this.aiMode === 'chase' && players.length > 0) {
      // 살아있는 플레이어 추격
      let alivePlayers = players.filter(pl => pl.alive);
      if (alivePlayers.length > 0) {
        tx = alivePlayers[0].x;
        ty = alivePlayers[0].y;
      }
    }

    // 대상 좌표로 부드럽게 이동
    let angle = p.atan2(ty - this.y, tx - this.x);
    this.x += p.cos(angle) * this.speed;
    this.y += p.sin(angle) * this.speed;
    this.x = p.constrain(this.x, 0, p.width - 1);
    this.y = p.constrain(this.y, 0, p.height - 1);

    // 현재 밟고 있는 타일 좌표 계산
    let currentR = Math.floor(this.y / TILE_SIZE);
    let currentC = Math.floor(this.x / TILE_SIZE);

    if (grid) {
      let currentTile = grid.tiles[currentR]?.[currentC];
      if (currentTile) {
        // 내 땅이 아닌 곳(빈 땅, 플레이어 땅 등)을 지날 때 실시간 보라색 영역 오염 점령!
        if (currentTile.owner !== OWNER_ZOMBIE) {
          grid.setOwner(currentR, currentC, OWNER_ZOMBIE, null);
          
          // 실시간으로 꼬리 추적 배열에 기록 (충돌 판정용)
          if (!this.path.some(pt => pt.r === currentR && pt.c === currentC)) {
            this.path.push({ r: currentR, c: currentC });
          }
        } else {
          // 자기 영역인 보라색 땅에 다시 닿으면 가두었던 꼬리 영역 확정 빌드!
          if (this.path.length > 0) {
            grid.floodFillEnclosed(this.path, OWNER_ZOMBIE, null);
            this.path = []; // 꼬리 초기화
          }
        }
      }
    }
  }

  draw(p) {
    // 실시간 좀비 보라색 꼬리선 드로우
    p.stroke(138, 43, 226);
    p.strokeWeight(3);
    p.noFill();
    p.beginShape();
    for (let pt of this.path) {
      p.vertex(pt.c * TILE_SIZE + TILE_SIZE / 2, pt.r * TILE_SIZE + TILE_SIZE / 2);
    }
    p.endShape();

    // 좀비 본체 그리기
    p.noStroke();
    p.fill(128, 0, 128);
    p.ellipse(this.x, this.y, 16, 16);
    p.fill(255, 0, 0);
    p.ellipse(this.x - 3, this.y - 2, 3, 3);
    p.ellipse(this.x + 3, this.y - 2, 3, 3);
  }

  isPathContains(px, py) {
    let pr = Math.floor(py / TILE_SIZE);
    let pc = Math.floor(px / TILE_SIZE);
    return this.path.some(pt => pt.r === pr && pt.c === pc);
  }
}

// 초기화 시 사방 구석 모서리에 안정적인 2x2 크기의 보라색 스타팅 기지 고정 함수
function initZombies() {
  zombies = [];
  let spawns = [
    { r: 2, c: 2 },
    { r: 2, c: COLS - 4 },
    { r: ROWS - 4, c: 2 },
    { r: ROWS - 4, c: COLS - 4 }
  ];

  for (let pos of spawns) {
    zombies.push(new Zombie(pos.c * TILE_SIZE + TILE_SIZE / 2, pos.r * TILE_SIZE + TILE_SIZE / 2));
    
    // 2x2 정사각형 컴팩트 홈 빌드
    for (let dr = 0; dr < 2; dr++) {
      for (let dc = 0; dc < 2; dc++) {
        if (grid) {
          grid.setOwner(pos.r + dr, pos.c + dc, OWNER_ZOMBIE, null);
        }
      }
    }
  }
}
