const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(900, 900); 
    p.frameRate(60);
    resetGame();
  };

  p.draw = () => {
    p.background(255);

    // 1. 배경 맵 타일 그리기 (상시 노출)
    if (grid) {
      grid.drawGrid(p); 
    }

    // 2. 게임 물리 연산 및 캐릭터 구동
    if (currentPhase === PHASE_GAME) {
      updateGameSession(p);
      
      // [치명적 버그 해결 포인트!] 매 프레임마다 좀비와 플레이어의 충돌을 감지합니다.
      checkAllCollisions(); 
    } else {
      drawUIOverlay(p);
    }
  };

  // 모든 개체의 생사여탈권을 쥐고 흔드는 마스터 충돌 감지기
  function checkAllCollisions() {
    if (!players || !zombies) return;

    // 좀비 배열과 플레이어 배열을 이중 루프로 돌며 전수 조사!
    for (let i = zombies.length - 1; i >= 0; i--) {
      let zombie = zombies[i];
      
      for (let j = players.length - 1; j >= 0; j--) {
        let player = players[j];
        
        // 플레이어가 이미 죽은 상태라면 패스
        if (!player.alive) continue;

        // 좀비와 플레이어의 가로세로 중심축 좌표 거리 계산
        let d = p.dist(player.x, player.y, zombie.x, zombie.y);
        
        // 타일 크기(12) 기준으로 몸통끼리 정면충돌했을 때 (킬 판정)
        if (d < 12) {
          // 좀비가 플레이어를 사냥함!
          player.die(); 
          // (필요시) 플레이어를 죽인 좀비에게 점수나 킬 알림을 ui에 보낼 수도 있어!
        }

        // [확장 기믹] 좀비가 플레이어의 움직이는 '꼬리(선)'를 밟았을 때도 플레이어 사망 판정
        if (player.isPathContains && player.isPathContains(zombie.x, zombie.y)) {
          player.die();
        }
        
        // [반격 기믹] 플레이어가 좀비의 '꼬리'를 밟아 좀비를 처치하는 판정
        if (zombie.isPathContains && zombie.isPathContains(player.x, player.y)) {
          zombies.splice(i, 1); // 꼬리 잡힌 좀비는 배열에서 즉시 제거(사망)!
          break; // 이번 좀비는 죽었으므로 다음 좀비 연산으로 이동
        }
      }
    }
  }

  function resetGame() {
    grid = new Grid(75, 75, 12); 
    initPlayers(); 
    if (typeof initZombies === 'function') {
      initZombies();
    }
  }
};

new p5(sketch);
