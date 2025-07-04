  // --- Global Constants & Configuration ---
  const CELL_SIZE = 40;
  const GRID_WIDTH = 10;
  const GRID_HEIGHT = 10;
  const WALL = 1, EMPTY = 0, START = 2, GOAL = 3, WATER = 4;
  const STEP_DELAY_MS = 250;

  const DIR_NORTH = 0, DIR_EAST = 1, DIR_SOUTH = 2, DIR_WEST = 3;

  const initialGrid = [];
  let currentGrid = [];

  let robot = {
    x: 0, y: 0, dir: DIR_EAST,
    initialX: 0, initialY: 0, initialDir: DIR_EAST,
    goalX: 0, goalY: 0
  };

  const canvas = document.getElementById('gridCanvas');
  const ctx = canvas.getContext('2d');
  const playButton = document.getElementById('playButton');
  const pauseButton = document.getElementById('pauseButton');
  const resetButton = document.getElementById('resetButton');
  const newBoardButton = document.getElementById('newBoardButton');
  const messageArea = document.getElementById('messageArea');

  let workspace;
  let javascriptGenerator;

  let isRunning = false;
  let isPaused = false;
  let stopExecutionFlag = false;
  let pauseResolver = null;

  function createFallbackBoard() {
    const board = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(EMPTY));
    board[0][0] = START; robot.initialX = 0; robot.initialY = 0;
    board[0][GRID_WIDTH - 1] = GOAL; robot.goalX = GRID_WIDTH - 1; robot.goalY = 0;
    for (let r = 0; r < GRID_HEIGHT; r++) {
        for (let c = 0; c < GRID_WIDTH; c++) {
            if (board[r][c] === EMPTY) {
                const rand = Math.random();
                if (rand < 0.15) board[r][c] = WALL;
                else if (rand < 0.30) board[r][c] = WATER;
            }
        }
    }
    for (let c = 1; c < GRID_WIDTH -1; c++) { if (board[0][c] === WALL) board[0][c] = EMPTY; }
    return board;
  }
  function isSolvable(startX, startY, goalX, goalY, grid) {
    const q = [[startX, startY]];
    const visited = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(false));
    if (startY < 0 || startY >= GRID_HEIGHT || startX < 0 || startX >= GRID_WIDTH || grid[startY][startX] === WALL) return false;
    visited[startY][startX] = true;
    const dr = [-1, 1, 0, 0]; const dc = [0, 0, 1, -1];
    while (q.length > 0) {
        const [currX, currY] = q.shift();
        if (currX === goalX && currY === goalY) return true;
        for (let i = 0; i < 4; i++) {
            const nextX = currX + dc[i]; const nextY = currY + dr[i];
            if (nextX >= 0 && nextX < GRID_WIDTH && nextY >= 0 && nextY < GRID_HEIGHT &&
                !visited[nextY][nextX] && grid[nextY][nextX] !== WALL) {
                visited[nextY][nextX] = true; q.push([nextX, nextY]);
            }
        }
    }
    return false;
   }
  function generateRandomBoard() {
    const MAX_ATTEMPTS = 50; let board;
    let tempStartX, tempStartY, tempGoalX, tempGoalY; let solvable = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        board = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(EMPTY));
        const WALL_PROBABILITY = 0.20; const WATER_PROBABILITY = 0.15;
        for (let r = 0; r < GRID_HEIGHT; r++) {
            for (let c = 0; c < GRID_WIDTH; c++) {
                const rand = Math.random();
                if (rand < WALL_PROBABILITY) board[r][c] = WALL;
                else if (rand < WALL_PROBABILITY + WATER_PROBABILITY) board[r][c] = WATER;
            }
        }
        do { tempStartX = Math.floor(Math.random() * GRID_WIDTH); tempStartY = Math.floor(Math.random() * GRID_HEIGHT);
        } while(board[tempStartY][tempStartX] === WALL);
        board[tempStartY][tempStartX] = START;
        do { tempGoalX = Math.floor(Math.random() * GRID_WIDTH); tempGoalY = Math.floor(Math.random() * GRID_HEIGHT);
        } while(board[tempGoalY][tempGoalX] === WALL || (tempStartX === tempGoalX && tempStartY === tempGoalY));
        board[tempGoalY][tempGoalX] = GOAL;
        if (isSolvable(tempStartX, tempStartY, tempGoalX, tempGoalY, board)) { solvable = true; break; }
    }
    if (!solvable) {
        console.warn(`Fallback board.`); board = createFallbackBoard();
        for (let r = 0; r < GRID_HEIGHT; r++) {
            for (let c = 0; c < GRID_WIDTH; c++) {
                if (board[r][c] === START) { tempStartX = c; tempStartY = r; }
                if (board[r][c] === GOAL) { tempGoalX = c; tempGoalY = r; }
            }
        }
    }
    initialGrid.length = 0; board.forEach(row => initialGrid.push([...row]));
    robot.initialX = tempStartX; robot.initialY = tempStartY;
    robot.goalX = tempGoalX; robot.goalY = tempGoalY; robot.dir = robot.initialDir;
  }

  const robotAPI = {
    async _waitForStep() {
      if (stopExecutionFlag) throw new Error("Execution reset by user.");
      while (isPaused) {
        await new Promise(resolve => { pauseResolver = resolve; });
        pauseResolver = null; if (stopExecutionFlag) throw new Error("Execution reset while paused.");
      }
      drawSimulation(); await new Promise(resolve => setTimeout(resolve, STEP_DELAY_MS));
    },
    _getFrontCell() {
        let frontX = robot.x, frontY = robot.y;
        if (robot.dir === DIR_NORTH) frontY--; else if (robot.dir === DIR_EAST) frontX++;
        else if (robot.dir === DIR_SOUTH) frontY++; else if (robot.dir === DIR_WEST) frontX--;
        if (frontX < 0 || frontX >= GRID_WIDTH || frontY < 0 || frontY >= GRID_HEIGHT) return { x: frontX, y: frontY, type: WALL };
        return { x: frontX, y: frontY, type: currentGrid[frontY][frontX] };
    },
    async moveForward() {
      const frontCell = this._getFrontCell();
      if (frontCell.type === WALL) { await this._waitForStep(); throw new Error("Cannot move: Hit wall."); }
      if (frontCell.type === WATER) { await this._waitForStep(); throw new Error("Cannot move into water. Use 'swim'."); }
      robot.x = frontCell.x; robot.y = frontCell.y; await this._waitForStep();
    },
    async swimForward() {
      const frontCell = this._getFrontCell();
      if (frontCell.type !== WATER) { await this._waitForStep(); throw new Error("Cannot swim: Cell ahead not water."); }
      robot.x = frontCell.x; robot.y = frontCell.y; await this._waitForStep();
    },
    async turnRight() { robot.dir = (robot.dir + 1) % 4; await this._waitForStep(); },
    async turnLeft() { robot.dir = (robot.dir + 3) % 4; await this._waitForStep(); },
    isWallAhead() { return this._getFrontCell().type === WALL; },
    isWaterAhead() { return this._getFrontCell().type === WATER; },
    isOnGoal() { return robot.x === robot.goalX && robot.y === robot.goalY; }
   };

  function drawGrid() {
    for (let r = 0; r < GRID_HEIGHT; r++) {
      for (let c = 0; c < GRID_WIDTH; c++) {
        ctx.beginPath(); ctx.rect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        switch (currentGrid[r][c]) {
          case EMPTY: ctx.fillStyle = "#fff"; break; case WALL: ctx.fillStyle = "#555"; break;
          case START: ctx.fillStyle = "#9f9"; break; case GOAL: ctx.fillStyle = "#f99"; break;
          case WATER: ctx.fillStyle = "#9bf"; break;
        }
        ctx.fill(); ctx.stroke();
      }
    }
  }
  function drawRobot() {
    const centerX = robot.x * CELL_SIZE + CELL_SIZE / 2; const centerY = robot.y * CELL_SIZE + CELL_SIZE / 2;
    const robotSize = CELL_SIZE * 0.6; const currentCellType = currentGrid[robot.y][robot.x];
    ctx.fillStyle = (currentCellType === WATER) ? "darkblue" : "blue";
    ctx.beginPath(); ctx.arc(centerX, centerY, robotSize / 2, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.fillStyle = "yellow"; let angle;
    if (robot.dir === DIR_NORTH) angle = -Math.PI / 2; else if (robot.dir === DIR_EAST) angle = 0;
    else if (robot.dir === DIR_SOUTH) angle = Math.PI / 2; else angle = Math.PI;
    ctx.moveTo(centerX + (robotSize / 2) * Math.cos(angle), centerY + (robotSize / 2) * Math.sin(angle));
    ctx.lineTo(centerX + (robotSize / 3) * Math.cos(angle - Math.PI * 2/3), centerY + (robotSize / 3) * Math.sin(angle - Math.PI * 2/3));
    ctx.lineTo(centerX + (robotSize / 3) * Math.cos(angle + Math.PI * 2/3), centerY + (robotSize / 3) * Math.sin(angle + Math.PI * 2/3));
    ctx.closePath(); ctx.fill();
  }
  function drawSimulation() { ctx.clearRect(0, 0, canvas.width, canvas.height); drawGrid(); drawRobot(); }
  function displayMessage(msg, isError = false) { messageArea.textContent = msg; messageArea.style.color = isError ? "red" : "black"; }
  function updateButtonStates() {
    if (isRunning) {
      playButton.disabled = true; pauseButton.disabled = false; resetButton.disabled = false; newBoardButton.disabled = true;
      if (workspace) workspace.options.readOnly = true;
      pauseButton.textContent = isPaused ? "Resume" : "Pause";
    } else {
      playButton.disabled = false; playButton.textContent = "Play";
      pauseButton.disabled = true; pauseButton.textContent = "Pause";
      resetButton.disabled = false; newBoardButton.disabled = false;
      if (workspace) workspace.options.readOnly = false;
    }
  }

  async function runProgram() {
    if (isRunning && !isPaused) return;
    if (isPaused) {
      isPaused = false; if (pauseResolver) pauseResolver();
      displayMessage("Resuming program..."); updateButtonStates(); return;
    }
    resetRobotState(); drawSimulation();

    const code = javascriptGenerator.workspaceToCode(workspace);
    if (!code.trim()) { displayMessage("Program is empty!", true); return; }

    isRunning = true; isPaused = false; stopExecutionFlag = false;
    updateButtonStates(); displayMessage("Executing program...");
    try {
      const asyncProgram = new Function('robotAPI', 'displayMessage', 'finishExecution', 'robot', `
        return (async () => {
          try {
            ${code}
            await robotAPI._waitForStep();
            if (robotAPI.isOnGoal()) {
              displayMessage("Congratulations! You reached the goal!", false);
            } else {
              displayMessage("Goal not reached. Robot at (" + robot.x + ", " + robot.y + "). Press Reset.", true);
            }
          } catch (e) {
            if (e.message.startsWith("Execution reset")) displayMessage("Program reset by user.", false);
            else displayMessage("Error: " + e.message + " Robot at (" + robot.x + ", " + robot.y + "). Press Reset.", true);
          } finally {
            finishExecution();
          }
        })();
      `);
      await asyncProgram(robotAPI, displayMessage, finishExecution, robot);
    } catch (e) { displayMessage("Execution error: " + e.message, true); finishExecution(); }
   }

  function pauseProgram() {
    if (!isRunning || isPaused) return;
    isPaused = true;
    displayMessage("Program paused.");
    updateButtonStates();
  }

  function resetProgram(calledByNewBoard = false) {
    if (isRunning) {
        stopExecutionFlag = true; if (isPaused && pauseResolver) pauseResolver();
        setTimeout(() => {
            finishExecution(); resetRobotState();
            if (!calledByNewBoard) displayMessage("Program reset.");
        }, STEP_DELAY_MS + 100);
    } else {
        resetRobotState();
        if (!calledByNewBoard) displayMessage("Program reset.");
        updateButtonStates();
    }
  }
  function resetRobotState() {
    robot.x = robot.initialX; robot.y = robot.initialY; robot.dir = robot.initialDir;
    currentGrid = JSON.parse(JSON.stringify(initialGrid));
    stopExecutionFlag = false; isPaused = false; drawSimulation();
  }
  function finishExecution() {
    isRunning = false;
    isPaused = false;
    stopExecutionFlag = false;
    updateButtonStates();
  }
  function handleNewBoardButtonClick() {
    if (isRunning) {
        resetProgram(true); setTimeout(() => { generateNewBoardAndReset(); }, STEP_DELAY_MS + 150);
    } else { generateNewBoardAndReset(); }
  }
  function generateNewBoardAndReset() {
    generateRandomBoard(); resetRobotState();
    displayMessage("New board generated!");
    if (workspace) Blockly.getMainWorkspace().clear();
    updateButtonStates();
  }

  document.addEventListener('DOMContentLoaded', () => {
    javascriptGenerator = Blockly.JavaScript;

    // --- CUSTOM PROCEDURE GENERATOR OVERRIDES (These are still crucial) ---
    javascriptGenerator.forBlock['procedures_defnoreturn'] = function(block) {
      const funcName = javascriptGenerator.getProcedureName(block.getFieldValue('NAME'));
      let branch = javascriptGenerator.statementToCode(block, 'STACK');
      if (javascriptGenerator.STATEMENT_PREFIX) { branch = javascriptGenerator.prefixLines(javascriptGenerator.STATEMENT_PREFIX.replace(/%1/g,'\'' + block.id + '\''), javascriptGenerator.INDENT) + branch;}
      if (javascriptGenerator.INFINITE_LOOP_TRAP) { branch = javascriptGenerator.INFINITE_LOOP_TRAP.replace(/%1/g,'\'' + block.id + '\'') + branch; }
      const args = []; const variables = block.getVars();
      for (let i = 0; i < variables.length; i++) { args[i] = javascriptGenerator.getVariableName(variables[i]); }
      let code = 'async function ' + funcName + '(' + args.join(', ') + ') {\n' + branch + '}'; // Ensure async
      code = javascriptGenerator.scrub_(block, code);
      javascriptGenerator.definitions_['%' + funcName] = code; return null;
    };
    javascriptGenerator.forBlock['procedures_defreturn'] = function(block) {
      const funcName = javascriptGenerator.getProcedureName(block.getFieldValue('NAME'));
      let branch = javascriptGenerator.statementToCode(block, 'STACK');
      if (javascriptGenerator.STATEMENT_PREFIX) { branch = javascriptGenerator.prefixLines(javascriptGenerator.STATEMENT_PREFIX.replace(/%1/g,'\'' + block.id + '\''), javascriptGenerator.INDENT) + branch; }
      if (javascriptGenerator.INFINITE_LOOP_TRAP) { branch = javascriptGenerator.INFINITE_LOOP_TRAP.replace(/%1/g,'\'' + block.id + '\'') + branch; }
      let returnValue = javascriptGenerator.valueToCode(block, 'RETURN', javascriptGenerator.ORDER_NONE) || '';
      if (returnValue) { returnValue = javascriptGenerator.INDENT + 'return ' + returnValue + ';\n';}
      const args = []; const variables = block.getVars();
      for (let i = 0; i < variables.length; i++) { args[i] = javascriptGenerator.getVariableName(variables[i]); }
      let code = 'async function ' + funcName + '(' + args.join(', ') + ') {\n' + branch + returnValue + '}'; // Ensure async
      code = javascriptGenerator.scrub_(block, code);
      javascriptGenerator.definitions_['%' + funcName] = code; return null;
    };
    javascriptGenerator.forBlock['procedures_callnoreturn'] = function(block) {
      const funcName = javascriptGenerator.getProcedureName(block.getFieldValue('NAME'));
      const args = []; const variables = block.getVars();
      for (let i = 0; i < variables.length; i++) { args[i] = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_COMMA) || 'null';}
      return 'await ' + funcName + '(' + args.join(', ') + ');\n'; // Ensure await
    };
    javascriptGenerator.forBlock['procedures_callreturn'] = function(block) {
      const funcName = javascriptGenerator.getProcedureName(block.getFieldValue('NAME'));
      const args = []; const variables = block.getVars();
      for (let i = 0; i < variables.length; i++) { args[i] = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_COMMA) || 'null';}
      return ['await ' + funcName + '(' + args.join(', ') + ')', javascriptGenerator.ORDER_AWAIT]; // Ensure await and correct precedence
    };
    // --- END CUSTOM PROCEDURE GENERATOR OVERRIDES ---


    Blockly.Blocks['robot_move_forward'] = { init: function() { this.appendDummyInput().appendField("move forward"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(230); this.setTooltip("Moves forward (land)."); } };
    javascriptGenerator.forBlock['robot_move_forward'] = function(b) { return 'await robotAPI.moveForward();\n'; };
    Blockly.Blocks['robot_swim_forward'] = { init: function() { this.appendDummyInput().appendField("swim forward"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(230); this.setTooltip("Swims forward (water)."); } };
    javascriptGenerator.forBlock['robot_swim_forward'] = function(b) { return 'await robotAPI.swimForward();\n'; };
    Blockly.Blocks['robot_turn_right'] = { init: function() { this.appendDummyInput().appendField("turn right"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(230); this.setTooltip("Turns right."); } };
    javascriptGenerator.forBlock['robot_turn_right'] = function(b) { return 'await robotAPI.turnRight();\n'; };
    Blockly.Blocks['robot_turn_left'] = { init: function() { this.appendDummyInput().appendField("turn left"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(230); this.setTooltip("Turns left."); } };
    javascriptGenerator.forBlock['robot_turn_left'] = function(b) { return 'await robotAPI.turnLeft();\n'; };
    Blockly.Blocks['robot_is_wall_ahead'] = { init: function() { this.appendDummyInput().appendField("is wall ahead?"); this.setOutput(true, "Boolean"); this.setColour(160); this.setTooltip("Wall ahead?"); } };
    javascriptGenerator.forBlock['robot_is_wall_ahead'] = function(b) { return ['robotAPI.isWallAhead()', javascriptGenerator.ORDER_ATOMIC]; };
    Blockly.Blocks['robot_is_water_ahead'] = { init: function() { this.appendDummyInput().appendField("is water ahead?"); this.setOutput(true, "Boolean"); this.setColour(160); this.setTooltip("Water ahead?"); } };
    javascriptGenerator.forBlock['robot_is_water_ahead'] = function(b) { return ['robotAPI.isWaterAhead()', javascriptGenerator.ORDER_ATOMIC]; };
    Blockly.Blocks['robot_is_on_goal'] = { init: function() { this.appendDummyInput().appendField("is on goal?"); this.setOutput(true, "Boolean"); this.setColour(160); this.setTooltip("On goal?"); } };
    javascriptGenerator.forBlock['robot_is_on_goal'] = function(b) { return ['robotAPI.isOnGoal()', javascriptGenerator.ORDER_ATOMIC]; };

    generateRandomBoard();
    const blocklyDiv = document.getElementById('blocklyDiv');
    const toolbox = document.getElementById('toolbox');
    workspace = Blockly.inject(blocklyDiv, {
      toolbox: toolbox,
      grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
      trashcan: true,
      zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 }
    });
    resetRobotState(); drawSimulation();
    playButton.addEventListener('click', runProgram);
    pauseButton.addEventListener('click', () => { if(isPaused) runProgram(); else pauseProgram(); });
    resetButton.addEventListener('click', () => resetProgram(false));
    newBoardButton.addEventListener('click', handleNewBoardButtonClick);
    updateButtonStates();
  });
