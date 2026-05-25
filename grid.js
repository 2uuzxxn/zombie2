class Grid {
  constructor(rows, cols, tileSize) {
    this.rows = rows;
    this.cols = cols;
    this.tileSize = tileSize;
    this.tiles = [];
    this.initGrid();
  }

  initGrid() {
    this.tiles = [];
    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.tiles[r][c] = {
          owner: OWNER_NONE,
          team: null
        };
      }
    }
  }

  setOwner(r, c, owner, team = null) {
    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      this.tiles[r][c].owner = owner;
      this.tiles[r][c].team = team;
    }
  }

  // 최적화 코드가 꺼져있으므로 이 함수는 뼈대만 유지해
  forceRedrawAll() {}

  // 조건 없이 무조건 다 그리는 절대 렌더러
  drawGrid(p) {
    p.noStroke();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let tile = this.tiles[r][c];
        let x = c * this.tileSize;
        let y = r * this.tileSize;

        if (tile.owner === OWNER_NONE) {
          p.fill(245); // 빈 땅 (연회색)
          p.stroke(230);
        } else if (tile.owner === OWNER_TEAM) {
          p.fill(144, 238, 144); // 플레이어 공동 팀 (초록색)
          p.stroke(120, 210, 120);
        } else if (tile.owner === OWNER_ZOMBIE) {
          p.fill(186, 85, 211); // 좀비 영토 (보라색)
          p.stroke(150, 60, 180);
        } else {
          p.fill(tile.team ? tile.team.color : 200);
          p.stroke(180);
        }
        p.rect(x, y, this.tileSize, this.tileSize);
      }
    }
  }

  // 좀비와 플레이어가 땅을 가두었을 때 사방을 채워주는 범용 영역 알고리즘
  floodFillEnclosed(tailSet, targetOwner, teamObj) {
    let visited = Array.from({ length: this.rows }, () => new Array(this.cols).fill(false));
    
    // 테두리 외곽 추출 감지 루프
    for (let r = 0; r < this.rows; r++) {
      this.exploreOuterBoundary(r, 0, visited, targetOwner);
      this.exploreOuterBoundary(r, this.cols - 1, visited, targetOwner);
    }
    for (let c = 0; c < this.cols; c++) {
      this.exploreOuterBoundary(0, c, visited, targetOwner);
      this.exploreOuterBoundary(this.rows - 1, c, visited, targetOwner);
    }

    // 외곽에 닿지 못한 고립된 내부 구역을 보라색이나 초록색으로 싹 변경
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!visited[r][c] && this.tiles[r][c].owner !== targetOwner) {
          this.setOwner(r, c, targetOwner, teamObj);
        }
      }
    }
  }

  exploreOuterBoundary(r, c, visited, targetOwner) {
    let queue = [[r, c]];
    while (queue.length > 0) {
      let [currR, currC] = queue.shift();
      if (currR < 0 || currR >= this.rows || currC < 0 || currC >= this.cols) continue;
      if (visited[currR][currC] || this.tiles[currR][currC].owner === targetOwner) continue;

      visited[currR][currC] = true;
      queue.push([currR - 1, currC]);
      queue.push([currR + 1, currC]);
      queue.push([currR, currC - 1]);
      queue.push([currR, currC + 1]);
    }
  }
}
