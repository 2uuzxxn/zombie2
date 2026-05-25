class Player {
  constructor(id, x, y, col, isBot = false) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.color = col;
    this.isBot = isBot;
    this.speed = 4.5;
    this.alive = true;
    this.path = [];
    this.dirX = 0;
    this.dirY = 0;
  }

  update(p) {
    if (!this.alive) return;

    if (!this.isBot) {
      // 키보드 방향키 조작 연동
      if (p.keyIsDown(p.LEFT_ARROW)) { this.dirX = -1; this.dirY = 0; }
      else if (p.keyIsDown(p.RIGHT_ARROW)) { this.dirX = 1; this.dirY = 0; }
      else if (p.keyIsDown(p.UP_ARROW)) { this.dirX = 0; this.dirY = -1; }
      else if (p.keyIsDown(p.DOWN_ARROW)) { this.dirX = 0; this.dirY = 1; }
    }

    this.x += this.dirX * this.speed;
    this.y += this.dirY * this.speed;
    this.x = p.constrain(this.x, 0, p.width - 1);
    this.y = p.constrain(this.y, 0, p.height - 1);

    let r = Math.floor(this.y / TILE_SIZE);
    let c = Math.floor(this.x / TILE_SIZE);

    if (grid) {
      let tile = grid.tiles[r]?.[c];
      if (tile) {
        if (tile.owner !== OWNER_TEAM) {
          if (!this.path.some(pt => pt.r === r && pt.c === c)) {
            this.path.push({ r: r, c: c });
          }
        } else {
          if (this.path.length > 0) {
            grid.floodFillEnclosed(this.path, OWNER_TEAM, this);
            this.path = [];
          }
        }
      }
    }
  }

  draw(p) {
    if (!this.alive) return;

    // 움직일 때 남는 꼬리선 그리기
    p.stroke(this.color);
    p.strokeWeight(4);
    p.noFill();
    p.beginShape();
    for (let pt of this.path) {
      p.vertex(pt.c * TILE_SIZE + TILE_SIZE / 2, pt.r * TILE_SIZE + TILE_SIZE / 2);
    }
    p.endShape();

    // 캐릭터 본체 사각형
    p.noStroke();
    p.fill(this.color);
    p.rect(this.x - 8, this.y - 8, 16, 16, 4);
  }

  die() {
    this.alive = false;
    this.path = [];
    console.log(`플레이어(${this.id})가 전사했습니다.`);
  }

  isPathContains(zx, zy) {
    let zr = Math.floor(zy / TILE_SIZE);
    let zc = Math.floor(zx / TILE_SIZE);
    return this.path.some(pt => pt.r === zr && pt.c === zc);
  }
}

function initPlayers() {
  players = [
    new Player('Player1', 450, 450, '#228B22', false) // 중앙 생존 스폰
  ];

  // 중앙 안락한 초록색 시작 영토 공급
  let midR = Math.floor(ROWS / 2);
  let midC = Math.floor(COLS / 2);
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      if (grid) grid.setOwner(midR + dr, midC + dc, OWNER_TEAM, players[0]);
    }
  }
}
