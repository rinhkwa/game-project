let player;
let stars = [];
let rareStars = [];
let bgStars = [];
let satellites = [];
let nextRareStarTime = 0;
let goodColor;
let badColor;
let score = 0;
let lives = 3;
let spawnRate = 40;

let boyImg;                   
let boy2Img;
let boy3Img;
let satImg;

let gameFont;   // ← NEW FONT

// loading
let gameState = "loading";
let loadingProgress = 0;
let loadingTimer = 0;
let loadingAngle = 0;

let bgMusic;

// jump physics
let gravity = 0.5;
let jumpPower = -8;
let canJump = true;

// emotions
let inactivityTimer = 0;
let INACTIVITY_TIME = 80;

let buildings = [];

// preload files
function preload() {
  boyImg = loadImage('boy.png');
  boy2Img = loadImage('boy2.png');
  boy3Img = loadImage('boy3.png');
  satImg  = loadImage('sat.png');
  bgMusic = loadSound('song.mp3');

  gameFont = loadFont('font.ttf'); //load font
}

function setup() {
  createCanvas(500, 450);
  noSmooth();

  textFont(gameFont);

  goodColor = color(255,230,100);
  badColor  = color(200,200,200);

  player = new Player();
  generateBuildings();

  // background stars
  for (let i = 0; i < 200; i++) {
    bgStars.push({
      x: random(width),
      y: random(height * 0.8),
      a: random(50, 200)
    });
  }

  // satellites background
  satellites = [
    { x:80, y:80,   rotation:2,    w:35, h:35 },
    { x:220, y:120, rotation:-1.5, w:35, h:35 },
    { x:440, y:60,  rotation:1.2,  w:35, h:35 },
    { x:140, y:220, rotation:1.3,  w:35, h:35 },
    { x:360, y:200, rotation:0.5,  w:35, h:35 }
  ];

  nextRareStarTime = frameCount + int(random(600,1200));
}


function draw() {
  if (gameState === "loading") {
    drawLoadingScreen();
    return;
  }

  if (gameState === "playing") {
    updateGame();
  }
}

function updateGame() {
  checkInactivity();
  drawBackground();

  // spawn stars
  if (frameCount % spawnRate === 0) {
    stars.push(new Star());
  }

  // update stars
  for (let i = stars.length - 1; i >= 0; i--) {
    let s = stars[i];
    s.update();
    s.show();

    // collision with player
    if (s.hits(player)) {
      if (s.type === "good") {
        score++;
        player.useBoy2Image = true;
        player.useBoy3Image = false;
      } else {
        lives--;
        player.useBoy2Image = false;
        player.useBoy3Image = true;
      }
      inactivityTimer = 0;
      stars.splice(i, 1);
      continue;
    }

    if (s.offscreen()) stars.splice(i, 1);
  }

  // spawn rare star
  if (frameCount >= nextRareStarTime) {
    rareStars.push(new RareStar());
    nextRareStarTime = frameCount + int(random(600,1200));
  }

  // update rare star
  for (let i = rareStars.length - 1; i >= 0; i--) {
    let r = rareStars[i];
    r.update();
    r.show();

    if (r.hits(player)) {
      score += 10;
      player.useBoy2Image = true;
      player.useBoy3Image = false;
      inactivityTimer = 0;
      rareStars.splice(i, 1);
      continue;
    }
    if (r.offscreen()) rareStars.splice(i, 1);
  }

  player.update();
  player.show();

  // display UI
  textFont(gameFont);
  fill(250);
  textSize(20);
  text("Score: " + score, 60, 60);
  text("Lives: " + lives, 60, 40);

  // game over
  if (lives <= 0) {
    gameOverScreen();
    gameState = "gameOver";
    noLoop();
  }
}

function drawLoadingScreen() {
  drawBackground();             
  fill(0,200);
  rect(0,0,width,height);

  let cx = width/2, cy = height/2;

  noFill();
  stroke(40,60,80);
  strokeWeight(16);
  circle(cx, cy, 160);

  // rotating arc
  stroke(210,230,255);
  strokeWeight(12);
  loadingAngle += 0.1;
  arc(
    cx, cy, 160, 160,
    loadingAngle,
    loadingAngle + TWO_PI * (loadingProgress / 100)
  );

  textFont(gameFont);
  fill(255);
  noStroke();
  textAlign(CENTER,CENTER);
  textSize(28);
  text("Loading...", cx, cy - 120);
  textSize(25);
  text(floor(loadingProgress) + "%", cx, cy);
  text("Controls:WASD/arrow keys", cx, cy - 190);
  text("Click to start! Catch yellow stars!", cx, cy + 120);
  
  loadingTimer++;
  if (loadingTimer % 2 === 0)
    loadingProgress = min(100, loadingProgress + random(0.3,1.2));

  if (loadingProgress >= 100)
    gameState = "playing";
}


// emotion reset for inactivity
function checkInactivity() {
  let isMoving =
    keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW) ||
    keyIsDown(65) || keyIsDown(68) ||
    keyIsDown(87) || keyIsDown(UP_ARROW);

  if (!isMoving) {
    inactivityTimer++;
    if (inactivityTimer >= INACTIVITY_TIME) {
      player.useBoy2Image = false;
      player.useBoy3Image = false;
    }
  } else {
    inactivityTimer = 0;
  }
}


// enable music by click
function mousePressed() {
  userStartAudio();
  if (bgMusic && !bgMusic.isPlaying()) {
    bgMusic.loop();
    bgMusic.setVolume(0.4);
  }
}


// player class
class Player {
  constructor() {
    this.w = 50;
    this.h = 50;
    this.x = width / 2;
    this.y = height - this.h - 8;

    this.speed = 2;
    this.vy = 0;
    this.facingRight = false;

    this.useBoy2Image = false;
    this.useBoy3Image = false;
  }

  update() {
    let left  = keyIsDown(LEFT_ARROW) || keyIsDown(65);
    let right = keyIsDown(RIGHT_ARROW) || keyIsDown(68);

    if (left) this.x -= this.speed;
    if (right) this.x += this.speed;

    if (left && !right) this.facingRight = false;
    if (right && !left) this.facingRight = true;

    this.x = constrain(this.x, this.w/2, width - this.w/2);

    this.vy += gravity;
    this.y += this.vy;

    const groundY = height - this.h - 8;
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      canJump = true;
    }
  }

  show() {
    push();
    translate(this.x, this.y);
    imageMode(CENTER);

    if (this.facingRight) scale(-1, 1);

    let img =
      this.useBoy3Image ? boy3Img :
      this.useBoy2Image ? boy2Img : boyImg;

    image(img, 0, 0, 120, 160);
    pop();
  }
}


// regular star
class Star {
  constructor() {
    this.x = random(8, width - 8);
    this.y = -10;

    this.r = 5;
    this.speed = random(1, 2.5);
    this.type = random() < 0.7 ? "good" : "bad";
  }

  update() { this.y += this.speed; }

  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(this.type === "good" ? goodColor : badColor);
    rectMode(CENTER);
    rect(0,0,this.r,this.r);
    rect(0,-this.r,this.r/2,this.r/2);
    rect(0,this.r,this.r/2,this.r/2);
    rect(-this.r,0,this.r/2,this.r/2);
    rect(this.r,0,this.r/2,this.r/2);
    pop();
  }

  offscreen() { return this.y > height + this.r; }

  hits(player) {
    return dist(this.x, this.y, player.x, player.y) <
           this.r + max(player.w, player.h) * 0.5;
  }
}


// rare star
class RareStar {
  constructor() {
    this.x = random(40, width - 40);
    this.y = -40;

    this.r = random(5, 10);
    this.speed = random(3, 4.5);

    this.angle = 0;
    this.rotationSpeed = random(0.03, 0.06);
  }

  update() {
    this.y += this.speed;
    this.angle += this.rotationSpeed;
  }

  show() {
    push();
    translate(this.x, this.y);
    noStroke();

    fill(255,225,120,120);
    for (let i = 0; i < 5; i++) ellipse(0,0,this.r+i*8);

    rotate(this.angle);

    fill(255,230,120);
    rectMode(CENTER);
    rect(0,0,this.r,this.r);
    rect(0,-this.r/2,this.r/2,this.r/2);
    rect(0,this.r/2,this.r/2,this.r/2);
    rect(-this.r/2,0,this.r/2,this.r/2);
    rect(this.r/2,0,this.r/2,this.r/2);

    pop();
  }

  offscreen() { return this.y > height + this.r; }

  hits(player) {
    return dist(this.x,this.y,player.x,player.y) <
           this.r/2 + max(player.w,player.h)*0.5;
  }
}


// create building rows
function generateBuildings() {
  buildings = [];
  let x = 0;

  while (x < width * 2) {
    let w = 50;
    let h = int(random(100,190));
    let y = height - 8;

    let building = { x, y, w, h, windows: [] };

    let winSize = 4;
    let startY = y - 17;

    for (let row = 0; row < 20; row++) {
      let wy = startY - row * 12;
      for (let col = 0; col < 5; col++) {
        let wx = x + 6 + col * 9;
        if (wy > y - h)
          building.windows.push({ x: wx, y: wy, size: winSize });
      }
    }

    buildings.push(building);
    x += w + 5;
  }
}


function drawBackground() {
  background(10,10,30);

  // vertical gradient sky
  for (let y = 0; y < height; y++) {
    let c = lerpColor(color(10,30,30), color(10,10,30), y / height);
    stroke(c);
    line(0, y, width, y);
  }

  // small background stars
  noStroke();
  for (let s of bgStars) {
    fill(255,240,180,s.a);
    rect(s.x, s.y, 1.5, 1.5);
  }

  // satellites
  imageMode(CENTER);
  for (let s of satellites) {
    push();
    translate(s.x, s.y);
    rotate(s.rotation);
    if (satImg) image(satImg, 0, 0, s.w, s.h);
    pop();
  }

  // moon
  drawMoon(width - 100, 100, 4);

  // ground
  fill(25,20,15);
  rect(0, height - 8, width, 8);

  // buildings
  for (let b of buildings) {
    fill(20,20,35,240);
    rect(b.x, b.y - b.h, b.w, b.h);

    fill(200,210,220);
    for (let w of b.windows)
      rect(w.x, w.y, w.size, w.size);
  }
}


// moon
function drawMoon(x, y, s) {
  push();
  translate(x,y);
  noStroke();

  fill(255,215,120,180);
  circle(0,0,10*s);

  fill(10,26,30);
  circle(2*s,-1*s,10*s);

  pop();
}


// game over
function gameOverScreen() {
  fill(0,200);
  rect(0,0,width,height);

  textAlign(CENTER,CENTER);
  fill(255);
  textFont(gameFont);
  textSize(50);

  text("GAME OVER", width/2, height/2 - 40);
  text("Score: " + score, width/2, height/2 + 35);
}


// controls
function keyPressed() {
  if (gameState !== "playing") return;

  if ((keyCode === 87 || keyCode === UP_ARROW) && canJump) {
    player.vy = jumpPower;
    canJump = false;
  }
}
