class Grid {
  constructor(rows, cols, tileSize) {
    this.rows = rows;
    this.cols = cols;
    this.tileSize = tileSize;
    this.tiles = [];
    this.initGrid();
  }

  // 맵 초기화
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

  // 특정 타일의 주인을 바꿀 때
  setOwner(r, c, owner, team = null) {
    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      this.tiles[r][c].owner = owner;
      this.tiles[r][c].team = team;
    }
  }

  // 하위 호환성을 위해 함수 뼈대는 유지 (이제 아무것도 안 해도 무조건 그려짐!)
  forceRedrawAll() {
    // 최적화 락 해제를 위해 비워둠
  }

  // [핵심 변경] 매 프레임 모든 타일을 무조건 강제로 그리는 절대 영역 렌더러
  drawGrid(p) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let tile = this.tiles[r][c];
        let x = c * this.tileSize;
        let y = r * this.tileSize;

        // 색상 판정 - 한 치의 오차도 없이 무조건 칠하기!
        if (tile.owner === OWNER_NONE) {
          p.fill(243); // 일반 빈 땅 (연한 회색)
          p.stroke(225);
        } else if (tile.owner === OWNER_TEAM) {
          p.fill(144, 238, 144); // 플레이어 공동 팀 영역 (초록색)
          p.stroke(125, 215, 125);
        } else if (tile.owner === OWNER_ZOMBIE) {
          p.fill(186, 85, 211); // 좀비 영역 (선명한 보라색)
          p.stroke(155, 65, 185);
        } else {
          // 개별 플레이어 영역
          p.fill(tile.team ? tile.team.color : 200);
          p.stroke(185);
        }

        p.rect(x, y, this.tileSize, this.tileSize);
      }
    }
  }

  // 영역 가두기 시스템
  floodFillEnclosed(tailSet, targetOwner, teamObj) {
    // 기존 영역 채우기 알고리즘 구동부
  }
}
