// --- Game Element Characters ---
const WALL = '#';
const FLOOR = ' ';
const PLAYER = '@';
const PLAYER_ON_TARGET = '+';
const BOX = '$';
const BOX_ON_TARGET = '*';
const TARGET = '.';

// --- Game State ---
let currentLevelIndex = 0;
let currentBoard = [];
let playerPos = { r: 0, c: 0 };
let numBoxesToWin = 0;
let moveHistory = [];
let moveCount = 0;

// --- DOM Elements ---
const gameBoardElement = document.getElementById('gameBoard');
const levelSelectElement = document.getElementById('levelSelect');
const resetButton = document.getElementById('resetButton');
const undoButton = document.getElementById('undoButton');
const messageElement = document.getElementById('message');
const moveCounterElement = document.getElementById('moveCounter');
// D-Pad Buttons
const dpadUpButton = document.getElementById('dpadUp');
const dpadDownButton = document.getElementById('dpadDown');
const dpadLeftButton = document.getElementById('dpadLeft');
const dpadRightButton = document.getElementById('dpadRight');


// --- Helper Functions ---
function deepCopyBoard(board) {
    return board.map(row => row.slice());
}

function getCellChar(r, c) {
    if (r < 0 || r >= currentBoard.length || !currentBoard[r] || c < 0 || c >= currentBoard[r].length) {
        return WALL;
    }
    return currentBoard[r][c];
}

function setCellChar(r, c, char) {
    if (r >= 0 && r < currentBoard.length && currentBoard[r] && c >= 0 && c < currentBoard[r].length) {
        currentBoard[r][c] = char;
    }
}

function updateMoveCounterDisplay() {
    if (moveCounterElement) {
        moveCounterElement.textContent = `Moves: ${moveCount}`;
    }
}

// --- Game Logic ---
function populateLevelSelector() {
    levelSelectElement.innerHTML = '';
    levels.forEach((level, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = level.name;
        levelSelectElement.appendChild(option);
    });
    levelSelectElement.value = currentLevelIndex;
}

function loadLevel(levelIndex) {
    currentLevelIndex = parseInt(levelIndex);
    const levelData = levels[currentLevelIndex].layout;

    let maxWidth = 0;
    levelData.forEach(row => {
        if (row.length > maxWidth) maxWidth = row.length;
    });

    currentBoard = levelData.map(rowStr => rowStr.padEnd(maxWidth, ' ').split(''));

    moveHistory = [];
    numBoxesToWin = 0;
    moveCount = 0;
    messageElement.textContent = "Use arrow keys, W/A/S/D, or on-screen D-pad to move.";

    for (let r = 0; r < currentBoard.length; r++) {
        for (let c = 0; c < currentBoard[r].length; c++) {
            const charFromLayout = currentBoard[r][c];

            if (charFromLayout === PLAYER || charFromLayout === PLAYER_ON_TARGET) {
                playerPos = { r, c };
            }
            if (charFromLayout === BOX || charFromLayout === BOX_ON_TARGET) {
                numBoxesToWin++;
            }

            if (charFromLayout === PLAYER) currentBoard[r][c] = FLOOR;
            else if (charFromLayout === PLAYER_ON_TARGET) currentBoard[r][c] = TARGET;
        }
    }
    renderBoard();
}

function renderBoard() {
    gameBoardElement.innerHTML = '';
    if (!currentBoard.length || !currentBoard[0].length) return;

    gameBoardElement.style.gridTemplateRows = `repeat(${currentBoard.length}, 30px)`;
    gameBoardElement.style.gridTemplateColumns = `repeat(${currentBoard[0].length}, 30px)`;

    let currentBoxesOnTarget = 0;

    for (let r = 0; r < currentBoard.length; r++) {
        for (let c = 0; c < currentBoard[r].length; c++) {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');
            const boardChar = currentBoard[r][c];
            let displayCharSymbol = '';

            if (playerPos.r === r && playerPos.c === c) {
                displayCharSymbol = '☺';
                if (boardChar === TARGET) {
                    cellDiv.classList.add('player-on-target');
                } else {
                    cellDiv.classList.add('player');
                }
            } else {
                switch (boardChar) {
                    case WALL: cellDiv.classList.add('wall'); displayCharSymbol = '█'; break;
                    case FLOOR: cellDiv.classList.add('floor'); displayCharSymbol = ' '; break;
                    case BOX: cellDiv.classList.add('box'); displayCharSymbol = '■'; break;
                    case BOX_ON_TARGET:
                        cellDiv.classList.add('box-on-target');
                        displayCharSymbol = '■';
                        currentBoxesOnTarget++;
                        break;
                    case TARGET: cellDiv.classList.add('target'); displayCharSymbol = '·'; break;
                    default: cellDiv.classList.add('floor'); displayCharSymbol = ' ';
                }
            }
            cellDiv.textContent = displayCharSymbol;
            gameBoardElement.appendChild(cellDiv);
        }
    }
    updateMoveCounterDisplay();
    checkWinCondition(currentBoxesOnTarget);
}

function movePlayer(dr, dc) {
    if (isGameWon()) return;

    const newPlayerR = playerPos.r + dr;
    const newPlayerC = playerPos.c + dc;
    const targetCellBoardChar = getCellChar(newPlayerR, newPlayerC);

    if (targetCellBoardChar === WALL) return;

    moveHistory.push({
        board: deepCopyBoard(currentBoard),
        playerPos: { ...playerPos }
    });
    if (moveHistory.length > 50) moveHistory.shift();

    let actualMoveMade = false;

    if (targetCellBoardChar === BOX || targetCellBoardChar === BOX_ON_TARGET) {
        const newBoxR = newPlayerR + dr;
        const newBoxC = newPlayerC + dc;
        const cellBeyondBoxBoardChar = getCellChar(newBoxR, newBoxC);

        if (cellBeyondBoxBoardChar === FLOOR || cellBeyondBoxBoardChar === TARGET) {
            setCellChar(newBoxR, newBoxC, cellBeyondBoxBoardChar === TARGET ? BOX_ON_TARGET : BOX);
            setCellChar(newPlayerR, newPlayerC, targetCellBoardChar === BOX_ON_TARGET ? TARGET : FLOOR);
            playerPos = { r: newPlayerR, c: newPlayerC };
            actualMoveMade = true;
        } else {
            moveHistory.pop();
            return;
        }
    } else {
        playerPos = { r: newPlayerR, c: newPlayerC };
        actualMoveMade = true;
    }

    if (actualMoveMade) {
        moveCount++;
    }
    renderBoard();
}

function checkWinCondition(currentBoxesOnTarget) {
    if (numBoxesToWin > 0 && currentBoxesOnTarget === numBoxesToWin) {
        messageElement.textContent = `Level ${currentLevelIndex + 1} Complete! Moves: ${moveCount}. Congratulations!`;
    } else if (messageElement.textContent.startsWith("Level")) {
        messageElement.textContent = "Use arrow keys, W/A/S/D, or on-screen D-pad to move.";
    }
}

function isGameWon() {
    let count = 0;
    if (!currentBoard.length) return false;
    for (let r = 0; r < currentBoard.length; r++) {
        for (let c = 0; c < currentBoard[r].length; c++) {
            if (currentBoard[r][c] === BOX_ON_TARGET) {
                count++;
            }
        }
    }
    return numBoxesToWin > 0 && count === numBoxesToWin;
}

function undoMove() {
    if (isGameWon() && moveHistory.length > 0) {
        messageElement.textContent = "Move undone.";
    }
    if (moveHistory.length > 0) {
        const prevState = moveHistory.pop();
        currentBoard = prevState.board;
        playerPos = prevState.playerPos;

        if (moveCount > 0) {
            moveCount--;
        }

        if (!isGameWon() && !messageElement.textContent.startsWith("Level reset")) {
              messageElement.textContent = "Move undone.";
        }
        renderBoard();
    } else {
        if (!messageElement.textContent.startsWith("Level")) {
            messageElement.textContent = "No moves to undo.";
        }
    }
}

// --- Event Listeners ---
levelSelectElement.addEventListener('change', (e) => {
    loadLevel(e.target.value);
});

resetButton.addEventListener('click', () => {
    messageElement.textContent = "Level reset.";
    loadLevel(currentLevelIndex);
});

undoButton.addEventListener('click', undoMove);

document.addEventListener('keydown', (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
        e.preventDefault(); // Prevent page scroll for these keys
    }
    switch (e.key.toLowerCase()) {
        case 'arrowup': case 'w': movePlayer(-1, 0); break;
        case 'arrowdown': case 's': movePlayer(1, 0); break;
        case 'arrowleft': case 'a': movePlayer(0, -1); break;
        case 'arrowright': case 'd': movePlayer(0, 1); break;
    }
});

// D-Pad Event Listeners
if(dpadUpButton) dpadUpButton.addEventListener('click', () => movePlayer(-1, 0));
if(dpadDownButton) dpadDownButton.addEventListener('click', () => movePlayer(1, 0));
if(dpadLeftButton) dpadLeftButton.addEventListener('click', () => movePlayer(0, -1));
if(dpadRightButton) dpadRightButton.addEventListener('click', () => movePlayer(0, 1));


// --- Initialization ---
populateLevelSelector();
loadLevel(currentLevelIndex);
