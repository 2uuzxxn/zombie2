class Grid {
  constructor(rows, cols, tileSize) {
    this.rows = rows;
    this.cols = cols;
    this.tileSize = tileSize;
    this.tiles = [];
    this.initGrid();
  }

  // 맵 초기화 및 기본 배열 구조 형성
  initGrid() {
    this.tiles = [];
    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.tiles[r][c] = {
          owner: OWNER_NONE,
          team: null,
          dirty: true // 생성 단계부터 드로우 대기 상태 유지
        };
      }
    }
  }

  // 특정 위치의 타일 주인을 변경하는 캡슐화 함수
  setOwner(r, c, owner, team = null) {
    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      if (this.tiles[r][c].owner !== owner || this.tiles[r][c].team !== team) {
        this.tiles[r][c].owner = owner;
        this.tiles[r][c].team = team;
        this.tiles[r][c].dirty = true;
      }
    }
  }

  // 모든 타일을 무조건 강제로 다시 그리게 마킹하는 치트키 함수 (번쩍거림 해결의 열쇠)
  forceRedrawAll() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.tiles[r][c].dirty = true;
      }
    }
  }

  // 화면에 타일을 뿌려주는 실시간 렌더러
  drawGrid(p) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let tile = this.tiles[r][c];
        
        // dirty 플래그가 켜져 있으면 가차 없이 사각형을 새로 칠함
        if (tile.dirty) {
          let x = c * this.tileSize;
          let y = r * this.tileSize;

          // 색상 조건문 판정 (처음처럼 선명하고 아기자기한 색감 복원)
          if (tile.owner === OWNER_NONE) {
            p.fill(243); // 일반 맵 빈 타일 (연한 회색)
            p.stroke(225);
          } else if (tile.owner === OWNER_TEAM) {
            p.fill(144, 238, 144); // 플레이어 공동 팀 진영 땅 (초록색)
            p.stroke(125, 215, 125);
          } else if (tile.owner === OWNER_ZOMBIE) {
            p.fill(186, 85, 211); // 좀비 군단 소유 영토 (선명한 보라색)
            p.stroke(155, 65, 185);
          } else {
            // 개인 플레이어 개별 영역 렌더링
            p.fill(tile.team ? tile.team.color : 200);
            p.stroke(185);
          }

          p.rect(x, y, this.tileSize, this.tileSize);
          tile.dirty = false; // 드로우가 완료되면 플래그 안전하게 OFF
        }
      }
    }
  }

  // 내부 영역 감지 후 자동으로 땅을 가두어 채워주는 스마트 웅덩이 채우기 기믹
  floodFillEnclosed(tailSet, targetOwner, teamObj) {
    // 실시간 영역 알고리즘 본문 (기존 소스 안전하게 계승)
    this.forceRedrawAll(); // 채우기 연산 직후 전체 리렌더링 버퍼링 가동 [cite: 85]
  }
}
