const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(900, 900); // 75x75 타일이 쏙 들어가는 900x900 화면 크기
    p.frameRate(60);
    resetGame();
  };

  p.draw = () => {
    // 1. 화면 전체를 흰색으로 깨끗하게 지웁니다.
    p.background(255);

    // 2. 그 즉시 하얀 바탕 위에 좀비 땅과 플레이어 땅을 강제로 먼저 칠해버립니다.
    if (grid) {
      grid.drawGrid(p); 
    }

    // 3. 그 위에 캐릭터들과 아이템 상자를 얹어서 렌더링합니다.
    if (currentPhase === PHASE_GAME) {
      updateGameSession(p);
    } else {
      drawUIOverlay(p);
    }
  };

  function resetGame() {
    // 맵 그리드 시스템 먼저 로드
    grid = new Grid(75, 75, 12); 

    // 플레이어 영역 및 초록색 시작 땅 초기화
    initPlayers(); 

    // 좀비 스폰 및 발밑에 2x2 보라색 집 생성
    if (typeof initZombies === 'function') {
      initZombies();
    }
  }
};

// p5 인스턴스 최종 구동
new p5(sketch);
