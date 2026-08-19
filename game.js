const scene = document.querySelector('.game-scene');
const hero = document.querySelector('.hero');
const ground = document.querySelector('.ground');
const platforms = [...document.querySelectorAll('.platform')];
const coins = [...document.querySelectorAll('.coin')];
const scoreElement = document.querySelector('#score');
const levelIndicator = document.querySelector('#level-indicator');
const flag = document.querySelector('.flag');
const winScreen = document.querySelector('.win-screen');
const playAgain = document.querySelector('#play-again');
const nextLevel = document.querySelector('#next-level');
const shopButton = document.querySelector('#shop-button');
const shopPanel = document.querySelector('.shop-panel');
const shopItems = document.querySelectorAll('.shop-item');
const world = document.querySelector('.world');
const holes = [...document.querySelectorAll('.hole')];
const touchButtons = [...document.querySelectorAll('.touch-button')];
const settingsButton = document.querySelector('#settings-button');
const settingsPanel = document.querySelector('#settings-panel');
const touchToggle = document.querySelector('#touch-toggle');

const speed = 6;
const jumpStrength = 16;
const gravity = 0.65;
const keys = new Set();
let heroX = scene.clientWidth / 2 - hero.offsetWidth / 2;
let heroY = 0;
let verticalVelocity = 0;
let isGrounded = true;
let score = 0;
let totalCoins = 0;
let won = false;
let level = 1;

function updateLevelIndicator() {
  levelIndicator.textContent = `Level ${level}`;
}

const savedTouchControls = localStorage.getItem('mario-touch-controls');
const touchControlsEnabled = savedTouchControls === 'true';
touchToggle.checked = touchControlsEnabled;
scene.classList.toggle('touch-enabled', touchControlsEnabled);

function moveHero() {
  if (won) {
    requestAnimationFrame(moveHero);
    return;
  }

  if (keys.has('ArrowLeft')) heroX -= speed;
  if (keys.has('ArrowRight')) heroX += speed;

  // A platform only supports the hero while their horizontal edges overlap.
  // If the hero walks past an edge, begin falling immediately.
  if (isGrounded && heroY > 0) {
    const groundTop = scene.clientHeight - ground.offsetHeight;
    const heroBottom = groundTop - heroY;
    const standingOnPlatform = platforms.some((platform) => {
      const platformRect = platform.getBoundingClientRect();
      const platformTop = platformRect.top - scene.getBoundingClientRect().top;
      const overlapsHorizontally = heroX + hero.offsetWidth > platformRect.left - scene.getBoundingClientRect().left && heroX < platformRect.right - scene.getBoundingClientRect().left;
      return Math.abs(heroBottom - platformTop) < 1 && overlapsHorizontally;
    });

    if (!standingOnPlatform) {
      isGrounded = false;
    }
  }

  const previousHeroY = heroY;
  if (!isGrounded) {
    heroY += verticalVelocity;
    verticalVelocity -= gravity;

    if (heroY <= 0) {
      heroY = 0;
      verticalVelocity = 0;
      isGrounded = true;

      const heroRight = heroX + hero.offsetWidth;
      const inLevelSeventeenGap = level === 17 && heroX >= scene.clientWidth * 0.30 && heroRight <= scene.clientWidth * 0.65;
      const offRightGround = level === 16 && heroRight < scene.clientWidth / 2;
      if (inLevelSeventeenGap || offRightGround) {
        showDeathScreen();
        return;
      }
    }

    // Land only while falling, and only when crossing a platform from above.
    if (verticalVelocity <= 0 && !isGrounded) {
      const sceneRect = scene.getBoundingClientRect();
      const groundTop = scene.clientHeight - ground.offsetHeight;
      const previousHeroBottom = groundTop - previousHeroY;
      const currentHeroBottom = groundTop - heroY;
      const heroRight = heroX + hero.offsetWidth;

      for (const platform of platforms) {
        const platformRect = platform.getBoundingClientRect();
        const platformLeft = platformRect.left - sceneRect.left;
        const platformTop = platformRect.top - sceneRect.top;
        const overlapsHorizontally = heroRight > platformLeft && heroX < platformLeft + platformRect.width;
        const crossedPlatformTop = previousHeroBottom <= platformTop && currentHeroBottom >= platformTop;

        if (overlapsHorizontally && crossedPlatformTop) {
          heroY = groundTop - platformTop;
          verticalVelocity = 0;
          isGrounded = true;
          break;
        }
      }
    }
  }

  const maxX = scene.clientWidth - hero.offsetWidth;
  heroX = Math.max(0, Math.min(heroX, maxX));

  hero.style.left = `${heroX}px`;
  hero.style.bottom = `${ground.offsetHeight + heroY}px`;
  hero.style.transform = 'none';

  const allCoinsCollected = coins.every((coin) => coin.hidden);
  if (level > 1 && heroY <= 0) {
    const heroCenter = heroX + hero.offsetWidth / 2;
    const fellInHole = holes.some((hole) => heroCenter > hole.offsetLeft && heroCenter < hole.offsetLeft + hole.offsetWidth);
    if (fellInHole) showDeathScreen();
  }

  world.style.transform = 'translateX(0)';

  const heroRect = hero.getBoundingClientRect();
  for (const coin of coins) {
    if (coin.hidden) continue;
    const coinRect = coin.getBoundingClientRect();
    const touching = heroRect.left < coinRect.right && heroRect.right > coinRect.left && heroRect.top < coinRect.bottom && heroRect.bottom > coinRect.top;
    if (touching) {
      coin.hidden = true;
      score += 1;
      totalCoins += 1;
      scoreElement.textContent = totalCoins;
    }
  }

  const flagRect = flag.getBoundingClientRect();
  if (allCoinsCollected && heroRect.right > flagRect.left && heroRect.left < flagRect.right && heroRect.bottom > flagRect.top && heroRect.top < flagRect.bottom) {
    won = true;
    hero.hidden = true;
    nextLevel.hidden = level >= 25;
    winScreen.hidden = false;
  }

  requestAnimationFrame(moveHero);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    keys.add(event.key);
  }

  if (event.code === 'Space' && isGrounded) {
    event.preventDefault();
    verticalVelocity = jumpStrength;
    isGrounded = false;
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key);
});

// Touch buttons use the same controls as the keyboard, so both input methods
// can be used interchangeably (including holding a direction to run).
touchButtons.forEach((button) => {
  const control = button.dataset.key;

  const press = (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    button.classList.add('pressed');
    if (button.dataset.jump === 'true' && isGrounded && !won) {
      verticalVelocity = jumpStrength;
      isGrounded = false;
    }
    if (control === 'Space') {
      if (isGrounded && !won) {
        verticalVelocity = jumpStrength;
        isGrounded = false;
      }
      return;
    }
    keys.add(control);
  };

  const release = (event) => {
    event.preventDefault();
    button.classList.remove('pressed');
    if (control !== 'Space') keys.delete(control);
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});

window.addEventListener('resize', () => {
  const maxX = scene.clientWidth - hero.offsetWidth;
  heroX = Math.max(0, Math.min(heroX, maxX));
});

playAgain.addEventListener('click', () => {
  if (document.querySelector('.win-card h1').textContent === 'YOU DIED!') {
    restartFromLevelOne();
    return;
  }
  won = false;
  heroX = scene.clientWidth / 2 - hero.offsetWidth / 2;
  heroY = 0;
  verticalVelocity = 0;
  isGrounded = true;
  score = 0;
  scoreElement.textContent = totalCoins;
  coins.forEach((coin) => { coin.hidden = false; });
  hero.hidden = false;
  winScreen.hidden = true;
  hero.style.left = `${heroX}px`;
});

nextLevel.addEventListener('click', () => {
  level += 1;
  updateLevelIndicator();
  scene.className = scene.className.replace(/\blevel-(?:twenty-five|twenty-four|twenty-three|twenty-two|twenty-one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/g, '');
  const levelNames = ['', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five'];
  scene.classList.add(`level-${levelNames[level]}`);
  won = false;
  hero.hidden = false;
  heroX = scene.clientWidth / 2 - hero.offsetWidth / 2;
  heroY = 0;
  verticalVelocity = 0;
  isGrounded = true;
  score = 0;
  nextLevel.hidden = level >= 25;
  scoreElement.textContent = score;
  coins.forEach((coin) => { coin.hidden = false; });
  winScreen.hidden = true;
  hero.style.left = `${heroX}px`;
  world.style.transform = 'translateX(0)';
});

function restartFromLevelOne() {
  level = 1;
  updateLevelIndicator();
  scene.classList.remove('level-two', 'level-three', 'level-four', 'level-five', 'level-six', 'level-seven', 'level-eight', 'level-nine', 'level-ten', 'level-eleven', 'level-twelve', 'level-thirteen', 'level-fourteen', 'level-fifteen', 'level-sixteen', 'level-seventeen', 'level-eighteen', 'level-nineteen', 'level-twenty', 'level-twenty-one', 'level-twenty-two', 'level-twenty-three', 'level-twenty-four', 'level-twenty-five');
  won = false;
  document.querySelector('.win-card h1').textContent = 'YOU WIN!';
  hero.hidden = false;
  heroX = scene.clientWidth / 2 - hero.offsetWidth / 2;
  heroY = 0;
  verticalVelocity = 0;
  isGrounded = true;
  score = 0;
  scoreElement.textContent = totalCoins;
  coins.forEach((coin) => { coin.hidden = false; });
  nextLevel.hidden = false;
  winScreen.hidden = true;
  world.style.transform = 'translateX(0)';
  hero.style.left = `${heroX}px`;
}

function showDeathScreen() {
  won = true;
  hero.hidden = true;
  document.querySelector('.win-card h1').textContent = 'YOU DIED!';
  nextLevel.hidden = true;
  winScreen.hidden = false;
  setTimeout(() => {
    if (won) restartFromLevelOne();
  }, 1400);
}

shopButton.addEventListener('click', () => {
  shopPanel.hidden = !shopPanel.hidden;
});

shopItems.forEach((item) => {
  item.querySelector('button').addEventListener('click', () => {
    const price = Number(item.dataset.price);
    if (totalCoins < price) return;
    totalCoins -= price;
    scoreElement.textContent = totalCoins;
    hero.style.setProperty('--hero-color', item.dataset.color);
    item.querySelector('button').textContent = 'Owned';
    item.querySelector('button').disabled = true;
  });
});

settingsButton.addEventListener('click', () => {
  settingsPanel.hidden = !settingsPanel.hidden;
  settingsButton.setAttribute('aria-expanded', String(!settingsPanel.hidden));
});

touchToggle.addEventListener('change', () => {
  scene.classList.toggle('touch-enabled', touchToggle.checked);
  localStorage.setItem('mario-touch-controls', String(touchToggle.checked));
});

moveHero();
