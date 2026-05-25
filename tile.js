// tile.js — 랜덤 박스 3종 실시간 리스폰 및 관리 시스템

let boxes = [];
const MIN_BOX_COUNT = 4; // ── [핵심 조건] 맵에 항상 유지되어야 하는 최소 상자 개수 ──

function initTiles(p) {
  boxes = [];
  // 최초 시작 시 맵에 상자 배치
  _checkAndReplenishBoxes(p);
}

// ── [실시간 감지 추가] sketch.js의 draw() 루프에서 매 프레임마다 호출되어 상자 개수를 체크 ──
function updateTiles(p) {
  _checkAndReplenishBoxes(p);
}

// 상자 개수를 감지하고 4개 미만이면 임의의 자리에 임의의 보너스 타일을 추가하는 함수
function _checkAndReplenishBoxes(p) {
  const types = [BOX_TYPE_MEDICINE, BOX_TYPE_BLOOD, BOX_TYPE_ENERGY];
  const midR = Math.floor(ROWS / 2);
  const midC = Math.floor(COLS / 2);

  // 현재 상자 개수가 최소 기준(4개)보다 적다면 부족한 만큼 반복해서 새로 생성
  while (boxes.length < MIN_BOX_COUNT) {
    let placed = false;
    let attempts = 0;

    // 무한 루프 방지를 위해 최대 300번까지만 안전하게 빈 공간 탐색
    while (!placed && attempts < 300) {
      attempts++;
      const r = Math.floor(p.random(5, ROWS - 5));
      const c = Math.floor(p.random(5, COLS - 5));

      // 1. 플레이어들의 중앙 시작 영역 근처는 제외
      if (Math.abs(r - midR) < 7 && Math.abs(c - midC) < 9) continue;

      // 2. 다른 상자와 너무 다닥다닥 붙지 않도록 최소 4타일 간격 유지
      if (boxes.some(b => Math.abs(b.r - r) < 4 && Math.abs(b.c - c) < 4)) continue;

      // 3. 랜덤으로 아이템 타입 결정 (약, 피, 에너지드링크 중 하나)
      const randomType = p.random(types);

      // 상자 배열에 추가
      boxes.push({ r, c, type: randomType });
      placed = true;
    }

    // 만약 공간이 너무 빽빽해서 300번의 시도 동안 자리를 못 찾았다면, 간격 조건을 완화해서 강제 생성
    if (!placed) {
      const r = Math.floor(p.random(5, ROWS - 5));
      const c = Math.floor(p.random(5, COLS - 5));
      const randomType = p.random(types);
      boxes.push({ r, c, type: randomType });
    }
  }
}

function drawTiles(p) {
  for (const box of boxes) {
    // 75x75 확대 맵 밸런스에 맞춰 박스 크기를 2.5배(타일 2.5칸 크기)로 렌더링 최적화
    const size = TILE_SIZE * 2.5; 
    const x = box.c * TILE_SIZE - size / 4;
    const y = box.r * TILE_SIZE - size / 4;
    const blink = Math.sin(p.frameCount * 0.12) > 0;

    p.push();
    p.noStroke();
    switch (box.type) {
      case BOX_TYPE_MEDICINE: p.fill(blink ? '#43A047' : '#2E7D32'); break;
      case BOX_TYPE_BLOOD:    p.fill(blink ? '#E53935' : '#B71C1C'); break;
      case BOX_TYPE_ENERGY:   p.fill(blink ? '#FFD600' : '#F9A825'); break;
    }
    p.rect(x + 1, y + 1, size - 2, size - 2, 4);

    // 아이콘 정중앙 배치
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12); // 타일이 촘촘해진 만큼 아이콘 가독성 수정
    p.fill(255);
    let icon = '';
    switch (box.type) {
      case BOX_TYPE_MEDICINE: icon = '💊'; break;
      case BOX_TYPE_BLOOD:    icon = '🩸'; break;
      case BOX_TYPE_ENERGY:   icon = '⚡'; break;
    }
    p.text(icon, x + size / 2, y + size / 2);
    p.pop();
  }
}

// 플레이어가 박스 중심 근처에 가면 획득 판정 (넓어진 맵에 맞춰 반경 조정)
function checkTilePickup(player, zombiesArr, phase, p) {
  for (let i = boxes.length - 1; i >= 0; i--) {
    const box = boxes[i];
    const dist = Math.abs(box.r - player.r) + Math.abs(box.c - player.c);
    if (dist <= 1) { // 1타일 이내 근접 시 즉시 획득
      _applyBoxEffect(box, player, phase, p);
      boxes.splice(i, 1); // 먹은 상자는 배열에서 삭제 -> 다음 프레임에서 실시간 자동 보충 발동!
    }
  }
}

function _applyBoxEffect(box, player, phase, p) {
  switch (box.type) {
    case BOX_TYPE_MEDICINE: {
      const owner = phase === PHASE_COOP ? OWNER_TEAM : player.owner;
      applyAreaBomb(player.r, player.c, owner);
      player.bombFlash = 20;
      showNotification(player.id, '약 획득: 보너스 땅이 주어지는 약을 먹었다!', '#43A047');
      break;
    }
    case BOX_TYPE_BLOOD: {
      zombieBloodTimer = ZOMBIE_BLOOD_DURATION;
      showNotification(player.id, '피 획득: 피를 밟았다 좀비속도가 이제 빨라진다!', '#E53935');
      break;
    }
    case BOX_TYPE_ENERGY: {
      player.boostTimer = BOOST_DURATION;
      player.steelTailTimer = STEEL_TAIL_DURATION;
      showNotification(player.id, '에너지드링크 획득: 속도와 강철꼬리를 갖는 에너지드링크를 마셨다!', '#FFD600');
      break;
    }
  }
}
