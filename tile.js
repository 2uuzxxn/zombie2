// tile.js — 아이템 박스(타일) 생성, 관리 및 획득 처리

let tiles = [];

function initTiles(p) {
  tiles = [];
  spawnTiles(p);
}

function spawnTiles(p) {
  const types = [BOX_TYPE_MEDICINE, BOX_TYPE_BLOOD, BOX_TYPE_ENERGY];
  
  for (let type of types) {
    for (let i = 0; i < BOX_COUNT_EACH; i++) {
      let r, c;
      // 안전한 빈 공간에 아이템 스폰 (좀비 기지나 플레이어 시작 땅 피해 생성)
      let attempts = 0;
      do {
        r = Math.floor(p.random(2, ROWS - 2));
        c = Math.floor(p.random(2, COLS - 2));
        attempts++;
      } while (getOwner(r, c) !== OWNER_NONE && attempts < 100);

      tiles.push({ r, c, type });
    }
  }
}

function updateTiles(p) {
  // 아이템이 모두 먹혔을 때 재스폰 규칙 등을 원하시면 추가할 수 있습니다.
  if (tiles.length === 0) {
    spawnTiles(p);
  }
}

function drawTiles(p) {
  p.push();
  for (let t of tiles) {
    const x = t.c * TILE_SIZE;
    const y = t.r * TILE_SIZE;
    
    p.strokeWeight(1);
    p.stroke(255, 200);
    
    if (t.type === BOX_TYPE_MEDICINE) {
      p.fill('#26A69A'); // 약: 민트색/초록빛
      p.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4, 3);
      p.fill(255); p.noStroke(); p.textAlign(p.CENTER, p.CENTER); p.textSize(10);
      p.text('💊', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    } 
    else if (t.type === BOX_TYPE_BLOOD) {
      p.fill('#D32F2F'); // 피: 빨간색
      p.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4, 3);
      p.fill(255); p.noStroke(); p.textAlign(p.CENTER, p.CENTER); p.textSize(10);
      p.text('🩸', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    } 
    else if (t.type === BOX_TYPE_ENERGY) {
      p.fill('#FFB300'); // 에너지드링크: 주황/노란색
      p.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4, 3);
      p.fill(255); p.noStroke(); p.textAlign(p.CENTER, p.CENTER); p.textSize(10);
      p.text('⚡', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    }
  }
  p.pop();
}

function checkTilePickup(player, zombiesArr, phase, p) {
  if (!player.alive) return;

  for (let i = tiles.length - 1; i >= 0; i--) {
    let t = tiles[i];
    if (player.r === t.r && player.c === t.c) {
      // 아이템 획득 이벤트 처리
      if (t.type === BOX_TYPE_MEDICINE) {
        // 💊 약: 획득자 진영의 폭탄 투하 효과 (보너스 땅 자동 점령)
        applyAreaBomb(t.r, t.c, player.owner);
        player.bombFlash = 15;
        showNotification(player.id, `P${player.id}가 약(💊)을 먹어 주변을 점령했습니다!`, '#26A69A');
      } 
      else if (t.type === BOX_TYPE_BLOOD) {
        // 🩸 피: 모든 좀비 일시 폭주 및 속도 가속
        zombieBloodTimer = ZOMBIE_BLOOD_DURATION;
        showNotification(player.id, `🚨 경고: 피(🩸) 오염으로 좀비들이 폭주합니다!`, '#D32F2F');
      } 
      else if (t.type === BOX_TYPE_ENERGY) {
        // ⚡ 에너지드링크: 플레이어 가속 및 일정 시간 강철꼬리(무적) 부여
        player.boostTimer = BOOST_DURATION;
        player.steelTailTimer = STEEL_TAIL_DURATION;
        showNotification(player.id, `P${player.id} 에너지드링크(⚡) 장착! 폭주 및 강철꼬리!`, '#FFB300');
      }
      
      // 획득한 아이템 삭제
      tiles.splice(i, 1);
    }
  }
}
