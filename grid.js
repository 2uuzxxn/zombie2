// grid.js — 게임판 관리 및 저사양 PC 최적화 렌더링

let grid = [];
let isFirstRender = true; // 게임 시작 시 전체 화면을 한 번 그리기 위한 플래그

function initGrid() {
  grid = [];
  isFirstRender = true; // 리셋 시 첫 렌더링 플래그 초기화
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
    grid[r][c].dirty = true; // ── [최적화] 땅 주인이 바뀌었을 때만 그리도록 마킹 ──
  }
}

function getOwner(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
  return grid[r][c].owner;
}

// ── [저사양 최적화 버전] drawGrid 함수 대폭 개조 ──
function drawGrid(p) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = grid[r][c];
      
      // 첫 렌더링이거나, 타일에 변화가 생겼을 때만(dirty === true) 그림을 새로 그립니다.
      if (isFirstRender || tile.dirty) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        
        // 타일 내부 색상 칠하기
        p.fill(tileColor(tile.owner));
        p.noStroke();
        p.rect(x, y, TILE_SIZE, TILE_SIZE);
        
        // 격자 테두리 선 칠하기
        p.stroke(COLOR_GRID);
        p.strokeWeight(0.2); // 타일이 작아진 만큼 격자 선도 얇게 최적화
        p.noFill();
        p.rect(x, y, TILE_SIZE, TILE_SIZE);
        
        tile.dirty = false; // 렌더링이 끝났으므로 마킹 해제
      }
    }
  }
  isFirstRender = false; // 첫 프레임 전체 렌더링 완료
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

// 좀비와 플레이어 공용 내부 영역 채우기 알고리즘
function floodFillEnclosed(tailSet, owner, p) {
  const visited = new Set();
  const queue = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || r === ROWS-1 || c === 0 || c === COLS-1) {
        const key = `${r},${c}`;
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
      if (grid[nr][nc].owner === owner) continue;
      visited.add(key);
      queue.push([nr, nc]);
    }
  }

  for (const key of tailSet) {
    const [r, c] = key.split(',').map(Number);
    setOwner(r, c, owner);
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r},${c}`;
      if (!visited.has(key) && !tailSet.has(key)) {
        setOwner(r, c, owner);
      }
    }
  }
}

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
        setOwner(r, c, owner); // 아이템을 먹었을 때도 주인이 바뀌므로 내부에서 dirty 처리가 자동으로 됨
      }
    }
  }
}
