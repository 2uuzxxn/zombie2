// 메인 게임 인스턴스 루프 설정 예시 (p5.js 인스턴스 모드 구조)
const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(900, 900); // 75x75 타일이 쏙 들어가는 고정 크기 화면
    p.frameRate(60);
    resetGame();
  };

  p.draw = () => {
    p.background(255);

    // 1. 배경 타일 판을 먼저 그리기
    if (grid) {
      grid.drawGrid(p);
    }

    // 2. 게임 메인 루프 업데이트 및 개체 렌더링
    if (currentPhase === PHASE_GAME) {
      updateGameSession(p);
    } else {
      drawUIOverlay(p);
    }
  };

  function resetGame() {
    // [순서 교정 핵심 포인트!] 
    // 1. 맵 시스템(그리드)을 가장 먼저 깨끗하게 생성합니다.
    grid = new Grid(75, 75, 12); 

    // 2. 플레이어 진영과 초록색 공동 시작 땅(OWNER_TEAM)을 먼저 깝니다.
    initPlayers(); 

    // 3. 마지막으로 좀비들을 스폰시키면서 그 발밑에 보라색 2x2 좀비 기지를 덮어씌웁니다.
    // 이렇게 해야 플레이어 땅에 밀려 좀비 집이 지워지는 버그가 안 생겨!
    if (typeof initZombies === 'function') {
      initZombies();
    }

    // 4. 세팅이 끝났으니 맵 전체 타일을 한 번 싹 화면에 그리라고 명령을 보냅니다.
    grid.forceRedrawAll();
  }
};

// p5 인스턴스 최종 구동 및 연결 코드
new p5(sketch);
