// **ボードの定義**
const GRID_SIZE = 6;       // マスの数（6x6）
const CELL_SIZE = 60;      // 1マスあたりのピクセルサイズ
let BOARD_WIDTH;           // ボードの幅（GRID_SIZE * CELL_SIZE）
let BOARD_HEIGHT;          // ボードの高さ（GRID_SIZE * CELL_SIZE）
let CANVAS_HEIGHT;         // キャンバスの全体の高さ

// **ゲーム要素**
let snake;                 // スネークの体節を保持する配列 (例: [{x: 3, y: 3}, ...])
let food;                  // フードの位置 {x, y}
let direction;             // 現在の進行方向 (p5.jsのベクトル {x: 1, y: 0} など)
let nextDirection;         // 次のフレームで適用する進行方向 (操作のバッファ)

// **ゲーム状態**
const MOVE_INTERVAL = 750; // 移動間隔をミリ秒で定義 (1000ミリ秒 = 1秒)
let lastMoveTime = 0;      // 最後にスネークが移動した時間 (ミリ秒)
// ⭐ 変更: 初期状態を 'title' に設定
let gameState = 'title';   // 'title', 'playing', 'gameover'
let score = 0;

// =======================================================
// ⭐ 脱皮機能の追加変数
// =======================================================
let hasShedSkin = false;   // 脱皮ボタンが使用済みかどうか (trueなら使用済み)
const SHED_KEY = 'shed';   // 脱皮ボタンを識別するためのキー

// **操作ボタン**
const BUTTON_RADIUS = 25; // ボタンの半径
let buttonPositions = {}; // 各ボタンの中心座標を保持

// =======================================================
// ⭐ タイトル画面用の変数
// =======================================================
let titleImage; // 読み込んだ画像を保持する変数
const PLAY_BUTTON_WIDTH = 150;
const PLAY_BUTTON_HEIGHT = 50;

// =======================================================
// ⭐ 画像の読み込み (preloadで実行)
// =======================================================
function preload() {
    // 添付された画像ファイルを読み込む
    // ファイル名が 'background4.jpeg' であると仮定します
    titleImage = loadImage('backgroundHebi.jpg'); 
}

function setup() {
    BOARD_WIDTH = GRID_SIZE * CELL_SIZE;
    BOARD_HEIGHT = GRID_SIZE * CELL_SIZE;
    CANVAS_HEIGHT = BOARD_HEIGHT + 100; // ボード + 下の操作ボタン用の空間を確保
    // ⭐ 変更: キャンバスのサイズを BOARD_WIDTH と CANVAS_HEIGHT で作成
    createCanvas(BOARD_WIDTH, CANVAS_HEIGHT); 

    // ゲームの初期化（snake, food, directionなどの設定）
    initializeGame();
    
    // ボタンの位置を計算（ボードの下、中央揃え）
    let centerX = BOARD_WIDTH / 2;
    let startY = BOARD_HEIGHT + 50; // ボードの下の空間の中央
    let spacing = 70;

    buttonPositions = {
        'up':    { x: centerX,          y: startY - 30,  dx: 0, dy: -1 },
        'down':  { x: centerX,          y: startY + 30,  dx: 0, dy: 1 },
        'left':  { x: centerX - spacing, y: startY,      dx: -1, dy: 0 },
        'right': { x: centerX + spacing, y: startY,      dx: 1, dy: 0 },
        // ⭐ 脱皮ボタンの位置追加 (右側にもう1個)
        [SHED_KEY]: { x: centerX + spacing * 2, y: startY, dx: 0, dy: 0 }
    };

    frameRate(60); // 描画の滑らかさを維持
}

// ゲームの初期化処理
function initializeGame() {
    // スネークの初期位置 (中央付近)
    snake = [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }];
    
    // 初期進行方向 (右)
    direction = createVector(1, 0); 
    nextDirection = createVector(1, 0);

    // 最初のフードを生成
    placeFood();
    
    score = 0;
    // ⭐ 変更: ゲームプレイ開始時、またはリスタート時は 'playing' に設定
    // ※ setup() の初期値は 'title' のまま
    // gameState は mousePressed() で 'playing' に変更されます。
    
    // ⭐ リスタート時に脱皮ボタンの使用状態をリセット
    hasShedSkin = false; 
}

function draw() {
    // ⭐ 変更: gameState に応じて描画内容を切り替える
    if (gameState === 'title') {
        drawTitleScreen();
    } else {
        // ⭐ 変更: ゲームプレイ中/ゲームオーバー時の背景を白に
        background(255); 
        
        // **ゲームボードの描画** (白背景の上にマス目を描画)
        drawBoard(); 

        if (gameState === 'playing') {
            // **スネークの移動** (一定時間ごとに実行)
            if (millis() - lastMoveTime > MOVE_INTERVAL) {
                updateSnake();
                lastMoveTime = millis();
            }

            // **スネークの描画**
            drawSnake();

            // **フードの描画**
            drawFood();

            // **スコアの描画**
            drawScore();
            
        } else if (gameState === 'gameover') {
            // **ゲームオーバー画面**
            drawGameOver();
        }
        
        // **操作ボタンの描画** (ゲーム状態に関わらず描画)
        drawButtons();
    }
}

// =======================================================
// ⭐ タイトル画面の描画関数
// =======================================================
function drawTitleScreen() {
    // 1. 背景画像を描画
    // 画像をキャンバス全体に合わせて描画
    image(titleImage, 0, 0, width, height);

    // 2. 「PLAY」ボタンを描画 (中央配置)
    let centerX = width / 2;
    let centerY = height / 2;

    // ボタンの形状 (四角形)
    fill(0, 150, 0, 200); // 濃い緑の半透明
    stroke(255);          // 白い枠線
    strokeWeight(3);
    rectMode(CENTER);
    rect(centerX, centerY, PLAY_BUTTON_WIDTH, PLAY_BUTTON_HEIGHT, 10); // 角丸

    // ボタンのテキスト
    fill(255); // 白
    noStroke();
    textSize(36);
    textAlign(CENTER, CENTER);
    text('PLAY', centerX, centerY);
}

// ボードの描画 (白背景に合わせた色に変更)
function drawBoard() {
    noFill();
    stroke(200); // 枠線は薄い灰色
    // ボード全体の枠線
    rect(0, 0, BOARD_WIDTH, BOARD_HEIGHT); 

    // マス目の描画 (補助線)
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            rect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

// スネークの描画 (変更なし)
function drawSnake() {
    noStroke();

    // スネークの各体節を描画
    for (let i = 0; i < snake.length; i++) {
        let x = snake[i].x * CELL_SIZE;
        let y = snake[i].y * CELL_SIZE;

        if (i === 0) {
            // 頭 (先頭): 黒色
            fill(0);
        } else {
            // 胴体: 濃い緑色
            fill(0, 100, 0); 
        }
        
        rect(x, y, CELL_SIZE, CELL_SIZE);
    }
}

// フードの描画 (変更なし)
function drawFood() {
    fill(200, 0, 0); // フードの色 (赤)
    noStroke();
    let x = food.x * CELL_SIZE + CELL_SIZE / 2; // マスの中心X
    let y = food.y * CELL_SIZE + CELL_SIZE / 2; // マスの中心Y
    let r = CELL_SIZE * 0.3; // 三角形のサイズ

    // 三角形を描画
    triangle(
        x, y - r,
        x - r, y + r / 2,
        x + r, y + r / 2
    );
}

// 操作ボタンの描画 (変更なし)
function drawButtons() {
    for (let key in buttonPositions) {
        let pos = buttonPositions[key];
        
        // ボタンの輪郭
        stroke(50);
        strokeWeight(2);
        
        if (key === SHED_KEY) {
            // 脱皮ボタン
            if (hasShedSkin) {
                // 使用済み: 灰色で薄く描画
                fill(150, 150, 150, 150); 
            } else {
                // 未使用: 黄色
                fill(255, 200, 0); 
            }

            // ひし形の描画
            push();
            translate(pos.x, pos.y);
            rotate(PI / 4); // 45度回転させてひし形にする
            rect(-BUTTON_RADIUS, -BUTTON_RADIUS, BUTTON_RADIUS * 2, BUTTON_RADIUS * 2);
            pop();
            
            // ひし形中央のテキスト
            fill(0);
            textSize(12);
            textAlign(CENTER, CENTER);
            text("脱皮", pos.x, pos.y);
            
        } else {
            // 通常の方向ボタン
            fill(100, 100, 250, 200); // ボタンの色 (青)
            ellipse(pos.x, pos.y, BUTTON_RADIUS * 2);

            // ボタン上の矢印 (変更なし)
            fill(255); // 白
            push();
            translate(pos.x, pos.y);
            let arrowSize = BUTTON_RADIUS * 0.6;
            
            if (key === 'up') {
                triangle(0, -arrowSize, -arrowSize, arrowSize / 2, arrowSize, arrowSize / 2);
            } else if (key === 'down') {
                triangle(0, arrowSize, -arrowSize, -arrowSize / 2, arrowSize, -arrowSize / 2);
            } else if (key === 'left') {
                triangle(-arrowSize, 0, arrowSize / 2, -arrowSize, arrowSize / 2, arrowSize);
            } else if (key === 'right') {
                triangle(arrowSize, 0, -arrowSize / 2, -arrowSize, -arrowSize / 2, arrowSize);
            }
            pop();
        }
    }
}

// スコアの描画 (変更なし)
function drawScore() {
    fill(0);
    textSize(24);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 10, BOARD_HEIGHT + 10);
    
    // ⭐ 脱皮ボタンの状態をスコア付近に表示
    fill(hasShedSkin ? color(200, 0, 0) : color(0, 150, 0));
    textSize(16);
    textAlign(LEFT, TOP);
    let statusText = hasShedSkin ? '脱皮: 使用済み' : '脱皮: 使用可能';
    text(statusText, 10, BOARD_HEIGHT + 35);
}

// ゲームオーバー画面 (変更なし)
function drawGameOver() {
    fill(0, 150); // 半透明の黒
    rect(0, 0, BOARD_WIDTH, height);

    fill(255, 0, 0); // 赤
    textSize(48);
    textAlign(CENTER, CENTER);
    text('GAME OVER', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 30);

    textSize(32);
    fill(255);
    text(`Final Score: ${score}`, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 20);
    
    textSize(20);
    text('Click to Restart', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 70);
}

// スネークの移動と判定 (変更なし)
function updateSnake() {
    // 次の移動で適用する方向を現在の進行方向にする
    direction = nextDirection;

    // スネークの新しい頭の位置を計算
    let head = snake[0];
    let newHead = { 
        x: head.x + direction.x, 
        y: head.y + direction.y 
    };

    // **1. 衝突判定 (壁)**
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || 
        newHead.y < 0 || newHead.y >= GRID_SIZE) {
        gameState = 'gameover';
        return;
    }

    // **2. 衝突判定 (胴体)**
    for (let i = 1; i < snake.length; i++) {
        if (newHead.x === snake[i].x && newHead.y === snake[i].y) {
            gameState = 'gameover';
            return;
        }
    }

    // **新しい頭を挿入**
    snake.unshift(newHead);

    // **3. 食事判定**
    if (newHead.x === food.x && newHead.y === food.y) {
        // 食べる: 尻尾は削除しない (体が伸びる)
        score++;
        placeFood(); // 新しいフードを生成
    } else {
        // 食べない: 尻尾を削除 (移動)
        snake.pop();
    }
}

// フードをランダムな空きマスに配置 (変更なし)
function placeFood() {
    let availableCells = [];
    
    // 全てのマスをチェック
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            let isSnake = false;
            // スネークの体と重なっていないかチェック
            for (let segment of snake) {
                if (segment.x === x && segment.y === y) {
                    isSnake = true;
                    break;
                }
            }
            if (!isSnake) {
                availableCells.push({ x: x, y: y });
            }
        }
    }

    // 空いているマスからランダムに選択
    if (availableCells.length > 0) {
        let index = floor(random(availableCells.length));
        food = availableCells[index];
    } else {
        // 全てのマスが埋まった (めったに起こらない)
        console.log("Game Win!");
        gameState = 'gameover'; // または別の勝利状態
    }
}

// 脱皮処理を実装する新しい関数 (変更なし)
function performShedSkin() {
    // 1. 使用回数制限のチェック
    if (hasShedSkin) {
        console.log("脱皮ボタンは既に使用されています。");
        return;
    }
    
    // 2. スネークの長さを半分にする
    let currentLength = snake.length;
    let newLength = floor(currentLength / 2); // 小数点以下切り捨て

    // 胴体を切り詰める (newLengthの分だけ残す)
    snake.splice(newLength); 
    
    console.log(`脱皮を実行: 長さ ${currentLength} -> ${newLength}`);

    // 3. スコアのペナルティ (5点減点、ただし0点未満にはならない)
    score -= 5;
    if (score < 0) {
        score = 0; // 0点未満になる場合は0点にする
    }
    
    // 4. ボタンを使用済みにする
    hasShedSkin = true;
}

function mousePressed() {
    // ⭐ 変更: タイトル画面のクリック判定を追加
    if (gameState === 'title') {
        let centerX = width / 2;
        let centerY = height / 2;
        
        // PLAYボタンのクリック領域判定
        if (mouseX > centerX - PLAY_BUTTON_WIDTH / 2 &&
            mouseX < centerX + PLAY_BUTTON_WIDTH / 2 &&
            mouseY > centerY - PLAY_BUTTON_HEIGHT / 2 &&
            mouseY < centerY + PLAY_BUTTON_HEIGHT / 2) {
            
            // ボタンがクリックされたらゲーム開始
            initializeGame(); // 初期化
            gameState = 'playing';
        }
        return;
    }
    
    // ゲームオーバー状態の場合、クリックでリスタート (変更なし)
    if (gameState === 'gameover') {
        // キャンバス内のクリックでのみ反応させる
        if (mouseX > 0 && mouseX < BOARD_WIDTH && mouseY > 0 && mouseY < height) {
            initializeGame();
            gameState = 'playing'; // リスタートで playing に戻す
        }
        return;
    }

    // ゲームプレイ中の場合、ボタンのクリックをチェック (変更なし)
    for (let key in buttonPositions) {
        let pos = buttonPositions[key];
        
        // 脱皮ボタンはひし形として描画しているが、当たり判定は円で行います (簡単のため)
        let d = dist(mouseX, mouseY, pos.x, pos.y);
        
        if (d < BUTTON_RADIUS) {
            // ボタンがクリックされた
            
            if (key === SHED_KEY) {
                // ⭐ 脱皮ボタンの処理を実行
                performShedSkin();
            } else {
                // 通常の方向ボタンの処理
                let newDir = createVector(pos.dx, pos.dy);

                // **180度反転する方向転換を禁止**
                if (direction.x + newDir.x !== 0 || direction.y + newDir.y !== 0) {
                    nextDirection = newDir; 
                }
            }
            break;
        }
    }
}

function keyPressed() {
    // 方向キーによる操作 (変更なし)
    if (gameState === 'playing') {
        let newDir;

        if (keyCode === UP_ARROW) {
            newDir = createVector(0, -1);
        } else if (keyCode === DOWN_ARROW) {
            newDir = createVector(0, 1);
        } else if (keyCode === LEFT_ARROW) {
            newDir = createVector(-1, 0);
        } else if (keyCode === RIGHT_ARROW) {
            newDir = createVector(1, 0);
        } else {
            return; // その他のキーは無視
        }

        // **180度反転する方向転換を禁止**
        if (newDir && (direction.x + newDir.x !== 0 || direction.y + newDir.y !== 0)) {
            nextDirection = newDir;
        }
    }
}