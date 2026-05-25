class ItemBox {
  constructor(r, c, type) {
    this.r = r;
    this.c = c;
    this.type = type;
  }

  draw(p) {
    let x = this.c * TILE_SIZE + TILE_SIZE / 2;
    let y = this.r * TILE_SIZE + TILE_SIZE / 2;
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.type, x, y);
  }
}

let itemBoxes = [];

function updateTiles(p) {
  // [요청 반영] 언제나 화면에 최소 4개 이상의 아이템 상자가 유지되도록 강제 보충하는 실시간 감지 기믹
  while (itemBoxes.length < 4) {
    let randR = Math.floor(p.random(0, ROWS));
    let randC = Math.floor(p.random(0, COLS));
    
    // 무소유 빈 땅에만 깔끔하게 스폰 유도
    if (grid && grid.tiles[randR]?.[randC].owner === OWNER_NONE) {
      let types = [BOX_TYPE_MEDICINE, BOX_TYPE_BLOOD, BOX_TYPE_DRINK];
      let selectedType = p.random(types);
      itemBoxes.push(new ItemBox(randR, randC, selectedType));
    }
  }

  // 상자 화면 드로우
  for (let box of itemBoxes) {
    box.draw(p);
  }
}
