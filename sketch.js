const sketch = (p) => {
  p.setup = () => {
    // 75x75 타일이 한눈에 쏙 들어오는 가로 900px, 세로 900px 전장 생성
    p.createCanvas(900, 900); 
    p.frameRate(60);
    resetGame();
  };

  p.draw = () => {
    // [치명적인 버그 해결 포인트!] 
    // 화면을 지우는 background 연산이 수행되더라도 타일이 증발하지 않도록 
    // 매 프레임 렌더링 직전에 전방위 타일의 dirty 신호를 켜서 강제로 화면에 붙박아버립니다.
    if (grid) {
      grid.forceRedrawAll(); // 맵 영역이 흰색 배경에 덮어쓰기 당하는 현상 원천 차단!
      grid.drawGrid(p);      // 이제 플레이어(초록)와 좀비(보라)의 땅이 눈에 항상 보입니다.
    }

    // 게임 메인 세션 루프 및 캐릭터, 아이템 박스 구동
    if (currentPhase === PHASE_GAME) {
      updateGameSession(p);
    } else {
      drawUIOverlay(p);
    }
  };

  function resetGame() {
    // 1. 맵 레이아웃(그리드)을 최상위 경로에 새롭게 선언
    grid = new Grid(75, 75, 12); 

    // 2. 플레이어 진영 및 초록색 팀 베이스라인 영역 초기화
    initPlayers(); 

    // 3. 좀비들을 생성하고 사방 구석 모서리에 보라색 2x2 좀비 기지를 굳건히 배치
    if (typeof initZombies === 'function') {
      initZombies();
    }

    // 4. 세팅이 끝난 첫 프레임부터 맵 전체를 확실하게 렌더링하라고 명령 유도
    grid.forceRedrawAll();
  }
};

// p5.js 인스턴스 최종 바인딩 실행 코드
new p5(sketch);
