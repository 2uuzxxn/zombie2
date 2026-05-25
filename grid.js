// grid.js — 게임판 관리

let grid = [];

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = { owner: OWNER_NONE, type: TILE_TYPE_NORMAL, dirty: true };
    }
  }
}

function setOwner(r, c, owner) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  if (grid[r][c].owner !== owner) {
    grid[r][c].owner = owner;
    grid[r][c].dirty = true;
  }
}

function getOwner(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
  return grid[r][c].owner;
}

function drawGrid(p) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = grid[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      p.fill(tileColor(tile.owner));
      p.noStroke();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      p.stroke(COLOR_GRID);
      p.strokeWeight(0.3);
      p.noFill();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      tile.dirty = false;
    }
  }
}

function tileColor(owner) {
  switch (owner) {
    case OWNER_TEAM:   return COLOR_TEAM;
    case OWNER_A:      return COLOR_A;
    case OWNER_B:      return COLOR_B;
    case OWNER_ZOMBIE: return COLOR_ZOMBIE;
    default:           return COLOR_EMPTY;
  }
}

// ── [핵심 수정] 이제 플레이어뿐만 아니라 좀비 진영도 안쪽 영역을 채울 수 있도록 알고리즘 개선 ──
function floodFillEnclosed(tailSet, owner, p) {
  const visited = new Set();
  const queue = [];

  // 외곽 경계선에서 탐색 시작
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || r === ROWS-1 || c === 0 || c === COLS-1) {
        const key = `${r},${c}`;
        // 현재 채우려는 주인의 땅(owner)이나 움직이는 꼬리(tailSet)가 '아닌' 모든 공간을 외부로 취급
        if (!tailSet.has(key) && grid[r][c].owner !== owner && !visited.has(key)) {
          visited.add(key);
          queue.push([r, c]);
        }
      }
    }
  }

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of dirs) {
      const nr = r+dr, nc = c+dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key) || tailSet.has(key)) continue;
      // 외부에서 타고 들어갈 때, 내 땅(owner)을 만나면 막힘
      if (grid[nr][nc].owner === owner) continue;
      visited.add(key);
      queue.push([nr, nc]);
    }
  }

  // 꼬리 흔적을 내 땅으로 확정 변경
  for (const key of tailSet) {
    const [r, c] = key.split(',').map(Number);
    setOwner(r, c, owner);
  }
  
  // 외부 탐색(visited)에 걸리지 않은 '갇힌 내부 공간'을 내 땅으로 전부 채우기!
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r},${c}`;
      if (!visited.has(key) && !tailSet.has(key)) {
        setOwner(r, c, owner);
      }
    }
  }
}

// Voronoi 분할: 배신 시 팀 영역을 두 플레이어 위치 기준으로 분할
function voronoiSplit(posA, posB) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].owner === OWNER_TEAM) {
        const dA = Math.abs(r-posA.r) + Math.abs(c-posA.c);
        const dB = Math.abs(r-posB.r) + Math.abs(c-posB.c);
        grid[r][c].owner = dA <= dB ? OWNER_A : OWNER_B;
        grid[r][c].dirty = true;
      }
    }
  }
}

function countTiles() {
  let counts = { team: 0, A: 0, B: 0, Z: 0, none: 0 };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const o = grid[r][c].owner;
      if (o === OWNER_TEAM) counts.team++;
      else if (o === OWNER_A) counts.A++;
      else if (o === OWNER_B) counts.B++;
      else if (o === OWNER_ZOMBIE) counts.Z++;
      else counts.none++;
    }
  }
  return counts;
}

function applyAreaBomb(centerR, centerC, owner) {
  for (let r = centerR-BOMB_RADIUS; r <= centerR+BOMB_RADIUS; r++) {
    for (let c = centerC-BOMB_RADIUS; c <= centerC+BOMB_RADIUS; c++) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      if (Math.abs(r-centerR)+Math.abs(c-centerC) <= BOMB_RADIUS) {
        if (grid[r][c].owner === OWNER_NONE) setOwner(r, c, owner);
      }
    }
  }
}
