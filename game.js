const scene = document.querySelector('.game-scene');
const hero = document.querySelector('.hero');
const ground = document.querySelector('.ground');
const platforms = [...document.querySelectorAll('.platform')];
const coins = [...document.querySelectorAll('.coin')];
const scoreElement = document.querySelector('#score');
const flag = document.querySelector('.flag');
const winScreen = document.querySelector('.win-screen');
const playAgain = document.querySelector('#play-again');
const nextLevel = document.querySelector('#next-level');
const shopButton = document.querySelector('#shop-button');
const shopPanel = document.querySelector('.shop-panel');
const shopItems = document.querySelectorAll('.shop-item');
const world = document.querySelector('.world');
const holes = [...document.querySelectorAll('.hole')];

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

    if (level === 4 && heroY < -hero.offsetHeight) {
      showDeathScreen();
      return;
    }

    if (level !== 4 && heroY <= 0) {
      heroY = 0;
      verticalVelocity = 0;
      isGrounded = true;
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
    nextLevel.hidden = level >= 4;
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
  scene.classList.toggle('level-two', level === 2);
  scene.classList.toggle('level-three', level === 3);
  scene.classList.toggle('level-four', level === 4);
  won = false;
  hero.hidden = false;
  heroX = scene.clientWidth / 2 - hero.offsetWidth / 2;
  heroY = 0;
  if (level === 4) {
    heroY = scene.clientHeight - document.querySelector('.platform-one').offsetTop;
  }
  verticalVelocity = 0;
  isGrounded = true;
  score = 0;
  nextLevel.hidden = level >= 4;
  scoreElement.textContent = score;
  coins.forEach((coin) => { coin.hidden = false; });
  winScreen.hidden = true;
  hero.style.left = `${heroX}px`;
  world.style.transform = level === 3 ? 'translateX(0)' : 'translateX(0)';
});

function restartFromLevelOne() {
  level = 1;
  scene.classList.remove('level-two', 'level-three', 'level-four');
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

moveHero();
