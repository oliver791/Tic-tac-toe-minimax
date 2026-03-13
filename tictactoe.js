'use strict';

// ============================================================
//  CONSTANTES
// ============================================================

const EMPTY    = 0;
const HUMAN    = 1;
const COMPUTER = 2;

/** Toutes les lignes gagnantes (indices 0-8). */
const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],   // lignes
  [0, 3, 6], [1, 4, 7], [2, 5, 8],   // colonnes
  [0, 4, 8], [2, 4, 6]                // diagonales
];

// ============================================================
//  TRADUCTIONS (i18n)
// ============================================================

const TEXTS = {
  fr: {
    humanStart   : 'Je commence',
    computerStart: "L'ordinateur commence",
    timer        : 'Minuteur',
    humanWin     : 'Bravo, vous avez gagné !',
    computerWin  : "L'ordinateur a gagné !",
    draw         : 'Égalité !',
    gameOver     : 'La partie est terminée !',
    yourScore    : 'Ton score',
    computerScore: "Score de l'ordinateur",
    drawLabel    : 'Égalité',
    playTime     : 'Temps de jeu',
    hour : 'heure',  hours  : 'heures',
    minute: 'minute', minutes: 'minutes',
    second: 'seconde', seconds: 'secondes',
    playingSince(h, hL, m, mL, s, sL) {
      return `Vous jouez depuis ${h} ${hL}, ${m} ${mL} et ${s} ${sL}`;
    }
  },
  en: {
    humanStart   : 'I start',
    computerStart: 'Computer starts',
    timer        : 'Timer',
    humanWin     : 'Congratulations, you won!',
    computerWin  : 'Computer wins!',
    draw         : 'Draw!',
    gameOver     : 'Game over!',
    yourScore    : 'Your score',
    computerScore: 'Computer score',
    drawLabel    : 'Draw',
    playTime     : 'Playing time',
    hour : 'hour',  hours  : 'hours',
    minute: 'minute', minutes: 'minutes',
    second: 'second', seconds: 'seconds',
    playingSince(h, hL, m, mL, s, sL) {
      return `Playing for ${h} ${hL}, ${m} ${mL} and ${s} ${sL}`;
    }
  }
};

// ============================================================
//  ÉTAT DU JEU
// ============================================================

let board    = [];
let gameOver = false;
let lang     = 'fr';

const scores = { human: 0, computer: 0, draw: 0 };

// Timer
let timerStarted  = false;
let timerSeconds   = 0;
let timerInterval  = null;

// ============================================================
//  UTILITAIRES
// ============================================================

/** Raccourci pour accéder aux textes traduits. */
function t(key) {
  return TEXTS[lang][key];
}

/** Renvoie toutes les cellules du DOM. */
function getCells() {
  return document.querySelectorAll('.cell');
}

/** Vérifie si `player` a gagné sur le plateau `b`. */
function checkWinner(b, player) {
  return WIN_COMBOS.some(combo => combo.every(i => b[i] === player));
}

/** Vérifie si le plateau `b` est complet. */
function isBoardFull(b) {
  return b.every(cell => cell !== EMPTY);
}

// ============================================================
//  ALGORITHME MINIMAX
// ============================================================

/**
 * Évalue récursivement le plateau.
 *
 * @param {number[]} b             - État du plateau
 * @param {number}   depth         - Profondeur actuelle
 * @param {boolean}  isMaximizing  - true si c'est au tour de l'IA
 * @returns {number} Score de la position
 *
 * Scores :
 *   Victoire IA   → +10 - depth  (gagner vite = meilleur)
 *   Victoire Hum  → depth - 10   (perdre tard = moins pire)
 *   Égalité       → 0
 */
function minimax(b, depth, isMaximizing) {
  // États terminaux
  if (checkWinner(b, COMPUTER)) return 10 - depth;
  if (checkWinner(b, HUMAN))    return depth - 10;
  if (isBoardFull(b))           return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] === EMPTY) {
        b[i] = COMPUTER;
        best = Math.max(best, minimax(b, depth + 1, false));
        b[i] = EMPTY;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] === EMPTY) {
        b[i] = HUMAN;
        best = Math.min(best, minimax(b, depth + 1, true));
        b[i] = EMPTY;
      }
    }
    return best;
  }
}

/**
 * Trouve le meilleur coup pour l'IA.
 * En cas d'égalité de score, un coup est choisi aléatoirement
 * parmi les meilleurs pour varier le jeu.
 *
 * @returns {number} Indice de la case à jouer (0-8)
 */
function findBestMove() {
  let bestScore = -Infinity;
  let bestMoves = [];

  for (let i = 0; i < 9; i++) {
    if (board[i] === EMPTY) {
      board[i] = COMPUTER;
      const score = minimax(board, 0, false);
      board[i] = EMPTY;

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [i];
      } else if (score === bestScore) {
        bestMoves.push(i);
      }
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// ============================================================
//  LOGIQUE DU JEU
// ============================================================

/** Réinitialise le plateau pour une nouvelle partie. */
function init() {
  board = new Array(9).fill(EMPTY);
  gameOver = false;
  getCells().forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
  });
}

/** Place un pion sur le plateau et met à jour le DOM. */
function playMove(index, player) {
  board[index] = player;
  const cell = document.querySelector(`.cell[data-index="${index}"]`);
  cell.textContent = player === HUMAN ? 'O' : 'X';
  cell.classList.add(player === HUMAN ? 'human' : 'computer');
}

/** Vérifie si la partie est terminée et affiche le résultat. */
function checkEndGame() {
  if (checkWinner(board, HUMAN)) {
    gameOver = true;
    scores.human++;
    updateScoreDisplay();
    setTimeout(() => alert(t('humanWin')), 50);
    return true;
  }
  if (checkWinner(board, COMPUTER)) {
    gameOver = true;
    scores.computer++;
    updateScoreDisplay();
    setTimeout(() => alert(t('computerWin')), 50);
    return true;
  }
  if (isBoardFull(board)) {
    gameOver = true;
    scores.draw++;
    updateScoreDisplay();
    setTimeout(() => alert(t('draw')), 50);
    return true;
  }
  return false;
}

/** Gère le clic sur une cellule. */
function handleCellClick(index) {
  if (gameOver) {
    alert(t('gameOver'));
    return;
  }
  if (board[index] !== EMPTY) return;

  startTimer();

  // Tour de l'humain
  playMove(index, HUMAN);
  if (checkEndGame()) return;

  // Tour de l'ordinateur (Minimax)
  const bestMove = findBestMove();
  if (bestMove !== undefined) {
    playMove(bestMove, COMPUTER);
    checkEndGame();
  }
}

// ============================================================
//  CONTRÔLES UTILISATEUR
// ============================================================

/** L'humain commence : réinitialise simplement le plateau. */
function humanStart() {
  init();
  startTimer();
}

/** L'ordinateur commence : réinitialise et joue le 1er coup. */
function computerStart() {
  init();
  startTimer();
  const bestMove = findBestMove();
  playMove(bestMove, COMPUTER);
}

/** Change la langue de l'interface. */
function setLanguage(newLang) {
  lang = newLang;
  document.getElementById('btn-human-start').textContent    = t('humanStart');
  document.getElementById('btn-computer-start').textContent = t('computerStart');
  document.getElementById('btn-timer').textContent          = t('timer');
  document.getElementById('label-human').textContent        = t('yourScore');
  document.getElementById('label-computer').textContent     = t('computerScore');
  document.getElementById('label-draw').textContent         = t('drawLabel');
  updateTimerDisplay();
}

/** Affiche ou masque le tableau des scores. */
function toggleScore() {
  document.getElementById('score-board').classList.toggle('hidden');
}

/** Affiche ou masque le timer. */
function toggleTimer() {
  document.getElementById('timer-display').classList.toggle('hidden');
}

// ============================================================
//  AFFICHAGE DES SCORES
// ============================================================

function updateScoreDisplay() {
  document.getElementById('score-human').textContent    = scores.human;
  document.getElementById('score-computer').textContent = scores.computer;
  document.getElementById('score-draw').textContent     = scores.draw;
}

// ============================================================
//  TIMER
// ============================================================

function startTimer() {
  if (timerStarted) return;
  timerStarted = true;
  timerSeconds = 0;
  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-text');
  if (!timerStarted) {
    el.textContent = t('playTime');
    return;
  }

  const h = Math.floor(timerSeconds / 3600);
  const m = Math.floor((timerSeconds % 3600) / 60);
  const s = timerSeconds % 60;

  const hLabel = h < 2 ? t('hour')   : t('hours');
  const mLabel = m < 2 ? t('minute') : t('minutes');
  const sLabel = s < 2 ? t('second') : t('seconds');

  el.textContent = t('playingSince')(h, hLabel, m, mLabel, s, sLabel);
}

// ============================================================
//  INITIALISATION AU CHARGEMENT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  init();
  updateScoreDisplay();

  // Attacher les événements de clic sur chaque cellule
  getCells().forEach(cell => {
    cell.addEventListener('click', () => {
      handleCellClick(parseInt(cell.dataset.index, 10));
    });
  });
});
