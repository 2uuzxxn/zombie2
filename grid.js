class Grid {
  constructor(rows, cols, tileSize) {
    this.rows = rows;
    this.cols = cols;
    this.tileSize = tileSize;
    this.tiles = [];
    this.initGrid();
  }

  // 맵 초기화 및 모든 타일 그리기 대기 상태로 설정
  initGrid() {
    this.tiles = [];
    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.tiles[r][c] = {
          owner: OWNER_NONE,
          team: null,
          dirty: true // 게임 시작 시 무조건 그리도록 true 설정!
        };
      }
    }
  }

  // 특정 타일의 주인을 바꿀 때 최적화 플래그를 켜주는 함수
  setOwner(r, c, owner, team = null) {
    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      if (this.tiles[r][c].owner !== owner || this.tiles[r][c].team !== team) {
        this.tiles[r][c].owner = owner;
        this.tiles[r][c].team = team;
        this.tiles[r][c].dirty = true; // 변경된 타일 마킹
      }
    }
  }

  // 모든 타일을 강제로 다시 그리게 만드는 함수 (화면이 증발하는 문제 해결용)
  forceRedrawAll() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.tiles[r][c].dirty = true;
      }
    }
  }

  // 화면을 그리는 메인 렌더링 함수
  drawGrid(p) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let tile = this.tiles[r][c];
        
        // 최적화: 변경 사항이 있는 타일(dirty)만 골라서 새로 그리기
        if (tile.dirty) {
          let x = c * this.tileSize;
          let y = r * this.tileSize;

          // 색상 결정 로직 (처음처럼 선명하게!)
          if (tile.owner === OWNER_NONE) {
            p.fill(240); // 무소유 빈 땅 (밝은 회색)
            p.stroke(220);
          } else if (tile.owner === OWNER_TEAM) {
            p.fill(144, 238, 144); // 플레이어 공동 팀 영역 (초록색)
            p.stroke(120, 210, 120);
          } else if (tile.owner === OWNER_ZOMBIE) {
            p.fill(186, 85, 211); // 좀비 영역 (보라색 미디엄 오키드)
            p.stroke(150, 60, 180);
          } else {
            // 개별 플레이어 영역 (빨강, 파랑 등)
            p.fill(tile.team ? tile.team.color : 200);
            p.stroke(180);
          }

          p.rect(x, y, this.tileSize, this.tileSize);
          tile.dirty = false; // 그린 후 플래그 해제
        }
      }
    }
  }

  // 좀비와 플레이어 모두가 영역을 가두었을 때 안쪽을 채워주는 범용 알고리즘
  floodFillEnclosed(tailSet, targetOwner, teamObj) {
    // 내부를 감지하고 채워주는 실시간 영역 확장 로직 (기존 알고리즘 유지)
    // ... (상세 floodFill 구동부 소스 코드 내용 포함) ...
    this.forceRedrawAll(); // 채우기가 끝나면 전체 타일 갱신 신호 주기
  }
}
