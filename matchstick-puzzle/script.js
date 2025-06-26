document.addEventListener('DOMContentLoaded', () => {
    const puzzleArea = document.getElementById('puzzle-area');
    const messageArea = document.getElementById('message-area');
    const difficultyControls = document.getElementById('difficulty-controls');
    const checkBtn = document.getElementById('check-btn');
    const newPuzzleBtn = document.getElementById('new-puzzle-btn');
    const showSolutionBtn = document.getElementById('show-solution-btn');

    let currentDifficulty = 'beginner';
    let solutionEquation = null;
    let puzzle, solution;
    let selectedMatchstick = null;
    let isPuzzleActive = true;

    const digitMap = [
        [1, 1, 1, 1, 1, 1, 0], // 0
        [0, 1, 1, 0, 0, 0, 0], // 1
        [1, 1, 0, 1, 1, 0, 1], // 2
        [1, 1, 1, 1, 0, 0, 1], // 3
        [0, 1, 1, 0, 0, 1, 1], // 4
        [1, 0, 1, 1, 0, 1, 1], // 5
        [1, 0, 1, 1, 1, 1, 1], // 6
        [1, 1, 1, 0, 0, 0, 0], // 7
        [1, 1, 1, 1, 1, 1, 1], // 8
        [1, 1, 1, 1, 0, 1, 1]  // 9
    ];
    const segmentPositions = ['top', 'top-right', 'bottom-right', 'bottom', 'bottom-left', 'top-left', 'middle'];

    const difficultySettings = {
        beginner: { max1: 9, max2: 9, maxRes: 99, shuffles: 2 },
        intermediate: { max1: 99, max2: 99, maxRes: 99, shuffles: 4 },
        advanced: { max1: 99, max2: 99, maxRes: 999, shuffles: 6 }
    };

    function generateNewPuzzle() {
        isPuzzleActive = true;
        checkBtn.disabled = false;
        showSolutionBtn.disabled = false;
        const settings = difficultySettings[currentDifficulty];
        const operators = ['+', '-', '*', '/'];
        let n1, n2, op, res;

        while (true) {
            op = operators[Math.floor(Math.random() * operators.length)];

            if (op === '+' || op === '-') {
                n1 = Math.floor(Math.random() * (settings.max1 + 1));
                n2 = Math.floor(Math.random() * (settings.max2 + 1));
                if (op === '-') {
                    if (n1 < n2) [n1, n2] = [n2, n1];
                    res = n1 - n2;
                } else {
                    res = n1 + n2;
                }
            } else if (op === '*') {
                // To keep result size manageable
                const maxFactor = Math.floor(Math.sqrt(settings.maxRes));
                n1 = Math.floor(Math.random() * (Math.min(settings.max1, maxFactor) + 1));
                n2 = Math.floor(Math.random() * (Math.min(settings.max2, maxFactor) + 1));
                res = n1 * n2;
            } else if (op === '/') {
                if (settings.max2 === 0) continue; // Avoid division by zero possibility
                n2 = Math.floor(Math.random() * settings.max2) + 1; // n2 is a non-zero divisor
                res = Math.floor(Math.random() * Math.floor(settings.maxRes / n2));
                n1 = n2 * res;
            }

            if (n1 <= settings.max1 && n2 <= settings.max2 && res <= settings.maxRes && res >= 0) {
                solutionEquation = { n1, n2, op, res };
                break;
            }
        }

        solution = equationToMatchsticks(solutionEquation);
        puzzle = shuffleMatchsticks(solution, settings.shuffles);

        if (puzzle === null) {
            // If shuffling failed to produce a valid, incorrect puzzle, try again.
            generateNewPuzzle();
            return;
        }

        renderPuzzle(puzzle);
        setMessage('Move the matchsticks to solve the puzzle.');
    }

    function equationToMatchsticks(eq) {
        const n1_str = eq.n1.toString();
        const n2_str = eq.n2.toString();
        const res_str = eq.res.toString();

        return {
            n1: n1_str.split('').map(d => digitMap[parseInt(d)]),
            op: eq.op,
            n2: n2_str.split('').map(d => digitMap[parseInt(d)]),
            res: res_str.split('').map(d => digitMap[parseInt(d)]),
        };
    }

    function shuffleMatchsticks(original, shuffles) {
        let attempts = 0;
        while (attempts < 500) { // Limit attempts to prevent infinite loops
            let puzzleCopy = JSON.parse(JSON.stringify(original));
            let flatSticks = [];
            ['n1', 'n2', 'res'].forEach(part => {
                puzzleCopy[part].forEach((digit, digitIdx) => {
                    digit.forEach((hasStick, segmentIdx) => {
                        flatSticks.push({ part, digitIdx, segmentIdx, hasStick });
                    });
                });
            });

            for (let i = 0; i < shuffles; i++) {
                const sticks = flatSticks.filter(s => s.hasStick);
                const slots = flatSticks.filter(s => !s.hasStick);
                if (sticks.length === 0 || slots.length === 0) break;

                const stickToMove = sticks[Math.floor(Math.random() * sticks.length)];
                const slotToFill = slots[Math.floor(Math.random() * slots.length)];

                // Perform the move in the puzzle copy
                puzzleCopy[stickToMove.part][stickToMove.digitIdx][stickToMove.segmentIdx] = 0;
                puzzleCopy[slotToFill.part][slotToFill.digitIdx][slotToFill.segmentIdx] = 1;

                // Update the flat list to reflect the change for the next shuffle iteration
                flatSticks.find(s => s.part === stickToMove.part && s.digitIdx === stickToMove.digitIdx && s.segmentIdx === stickToMove.segmentIdx).hasStick = false;
                flatSticks.find(s => s.part === slotToFill.part && s.digitIdx === slotToFill.digitIdx && s.segmentIdx === slotToFill.segmentIdx).hasStick = true;
            }

            const finalEquation = matchsticksToEquation(puzzleCopy);
            if (finalEquation !== null) {
                const [n1, op, n2, res] = finalEquation;

                let isEquationCorrect = false;
                if (op === '+') isEquationCorrect = (n1 + n2 === res);
                if (op === '-') isEquationCorrect = (n1 - n2 === res);
                if (op === '*') isEquationCorrect = (n1 * n2 === res);
                if (op === '/') isEquationCorrect = (n2 !== 0 && n1 / n2 === res);

                // A valid puzzle must have valid digits AND be mathematically incorrect.
                if (!isEquationCorrect) {
                    return puzzleCopy;
                }
            }

            attempts++;
        }

        console.warn("Failed to generate a valid shuffled puzzle after many attempts.");
        return null;
    }

    function isDigitConfigurationValid(digitSegments) {
        return digitMap.some(mapDigit => mapDigit.every((stick, i) => stick === digitSegments[i]));
    }

    function renderPuzzle(state) {
        puzzleArea.innerHTML = '';
        const renderGroup = (group, part) => {
            group.forEach((digitSegments, digitIdx) => {
                const digitContainer = document.createElement('div');
                digitContainer.className = 'digit-container';

                digitSegments.forEach((hasStick, segmentIdx) => {
                    const el = document.createElement('div');
                    const pos = segmentPositions[segmentIdx];
                    const isVertical = pos.includes('left') || pos.includes('right');
                    el.className = `${hasStick ? 'matchstick' : 'slot'} ${isVertical ? 'v' : 'h'}-${hasStick ? 'stick' : 'slot'} ${pos}`;
                    el.dataset.part = part;
                    el.dataset.digitIdx = digitIdx;
                    el.dataset.segmentIdx = segmentIdx;
                    digitContainer.appendChild(el);
                });
                puzzleArea.appendChild(digitContainer);
            });
        };

        renderGroup(state.n1, 'n1');
        puzzleArea.insertAdjacentHTML('beforeend', `<div class="operator-container">${state.op}</div>`);
        renderGroup(state.n2, 'n2');
        puzzleArea.insertAdjacentHTML('beforeend', `<div class="operator-container">=</div>`);
        renderGroup(state.res, 'res');

        addMatchstickHandlers();
    }

    function addMatchstickHandlers() {
        document.querySelectorAll('.matchstick, .slot').forEach(el => el.addEventListener('click', handleMatchstickClick));
    }

    function handleMatchstickClick(e) {
        if (!isPuzzleActive) return;
        const target = e.currentTarget;
        if (target.classList.contains('matchstick')) {
            if (selectedMatchstick) selectedMatchstick.classList.remove('selected');
            selectedMatchstick = target;
            target.classList.add('selected');
        } else if (target.classList.contains('slot') && selectedMatchstick) {
            const from = selectedMatchstick.dataset;
            const to = target.dataset;

            puzzle[from.part][from.digitIdx][from.segmentIdx] = 0;
            puzzle[to.part][to.digitIdx][to.segmentIdx] = 1;

            selectedMatchstick = null;
            renderPuzzle(puzzle);
        }
    }

    function checkSolution() {
        const currentEqArr = matchsticksToEquation(puzzle);
        if (currentEqArr === null) {
            setMessage('Invalid number detected! One or more digits are not recognizable.', 'error');
            return;
        }

        const [n1, op, n2, res] = currentEqArr;
        let correct = false;
        if (op === '+') correct = n1 + n2 === res;
        if (op === '-') correct = n1 - n2 === res;
        if (op === '*') correct = n1 * n2 === res;
        if (op === '/') {
            if (n2 === 0) {
                setMessage('Division by zero is not allowed.', 'error');
                return;
            }
            correct = n1 / n2 === res;
        }

        if (correct) {
            setMessage('Congratulations! You solved it!', 'success');
            isPuzzleActive = false;
            checkBtn.disabled = true;
            showSolutionBtn.disabled = true;
        } else {
            setMessage('The equation is valid, but not correct. Keep trying!', 'error');
        }
    }

    function matchsticksToEquation(state) {
        const readGroup = (group) => {
            let numStr = "";
            for (let digitSegments of group) {
                if (!isDigitConfigurationValid(digitSegments)) {
                    return null; // Invalid digit found
                }
                const digit = digitMap.findIndex(d => d.every((s, i) => s === digitSegments[i]));
                numStr += digit;
            }
            if (numStr === "") return 0; // Treat empty as zero if needed, or handle as error
            return parseInt(numStr);
        };

        const n1 = readGroup(state.n1);
        const n2 = readGroup(state.n2);
        const res = readGroup(state.res);

        if (n1 === null || n2 === null || res === null) return null;

        return [n1, state.op, n2, res];
    }

    function setMessage(msg, type = '') {
        messageArea.textContent = msg;
        messageArea.className = type;
    }

    checkBtn.addEventListener('click', checkSolution);
    newPuzzleBtn.addEventListener('click', generateNewPuzzle);
    showSolutionBtn.addEventListener('click', () => {
        puzzle = JSON.parse(JSON.stringify(solution));
        renderPuzzle(puzzle);
        setMessage('Solution is shown. Click "New Puzzle" to play again.');
        isPuzzleActive = false;
        checkBtn.disabled = true;
        showSolutionBtn.disabled = true;
    });
    difficultyControls.addEventListener('click', (e) => {
        if (e.target.classList.contains('difficulty-btn')) {
            difficultyControls.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            currentDifficulty = e.target.id.replace('difficulty-', '');
            generateNewPuzzle();
        }
    });

    generateNewPuzzle();
});
