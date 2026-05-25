const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(900, 900);
    p.frameRate(60);
    resetGame();
  };

  p.draw = () => {
    // 1. 화면 초기화
    p.background(255);

    // 2. 오리지널 전체 렌더 시스템 구동 (이제 무조건 상시 노출!)
    if (grid) {
      grid.drawGrid(p);
    }

    // 3. 아이템 박스 실시간 자동 생성 및 렌더링
    if (currentPhase === PHASE_GAME) {
      updateTiles(p);

      // 플레이어 제어 및 렌더링
      for (let player of players) {
        player.update(p);
        player.draw(p);
      }

      // 좀비 AI 구동 및 렌더링
      for (let zombie of zombies) {
        zombie.update(p);
        zombie.draw(p);
      }

      // [버그 완전 타파] 상호 교전 및 꼬리 자르기 전투 충돌 연산 레이더 가동
      checkCombatCollisions(p);

      // 메인 생존자 체크로 게임오버 판정
      let playerAlive = players.some(pl => pl.alive);
      if (!playerAlive) {
        currentPhase = PHASE_OVER;
      }
    } else {
      drawUIOverlay(p);
    }
  };

  p.mousePressed = () => {
    if (currentPhase === PHASE_LOBBY || currentPhase === PHASE_OVER) {
      resetGame();
      currentPhase = PHASE_GAME;
    }
  };

  function resetGame() {
    // 플레이어 스폰 -> 좀비 기지 스폰 순서 엄격 교정으로 덮어쓰기 버그 예방
    grid = new Grid(ROWS, COLS, TILE_SIZE);
    initPlayers();
    if (typeof initZombies === 'function') {
      initZombies();
    }
  }

  function checkCombatCollisions(p) {
    if (!players || !zombies) return;

    for (let i = zombies.length - 1; i >= 0; i--) {
      let zombie = zombies[i];

      for (let j = players.length - 1; j >= 0; j--) {
        let player = players[j];
        if (!player.alive) continue;

        // 좀비와 플레이어의 픽셀 거리 계산
        let d = p.dist(player.x, player.y, zombie.x, zombie.y);

        // 몸통끼리 스쳤을 때 -> 플레이어 가차 없이 물려 사망
        if (d < 14) {
          player.die();
        }

        // 좀비가 뱀처럼 기어가는 플레이어의 꼬리를 밟았을 때 -> 플레이어 즉사
        if (player.isPathContains && player.isPathContains(zombie.x, zombie.y)) {
          player.die();
        }

        // 플레이어가 도망치다 대담하게 좀비의 꼬리를 끊었을 때 -> 좀비 격파 사망!
        if (zombie.isPathContains && zombie.isPathContains(player.x, player.y)) {
          zombies.splice(i, 1);
          break; // 죽은 좀비의 내부 연산 즉시 탈출
        }
      }
    }
  }
};

// 독립된 p5.js 인스턴스 최종 트리거 바인딩
new p5(sketch);
