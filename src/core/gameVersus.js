import Grid, {drawGrid} from "./grid"
function drawBomb(ctx, x, y, radius, offset) {
    // Draw a black circle for bombs
    ctx.fillStyle = "black"; // Set the fill color to red
    ctx.beginPath();
    //ctx.arc(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, cellSize / 2.5, 0, 2 * Math.PI);
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    ctx.lineWidth = 4;
    // Draw the vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - radius - offset);
    ctx.lineTo(x, y + radius + offset);
    ctx.stroke();
    ctx.closePath();

    // Draw the horizontal line
    ctx.beginPath();
    ctx.moveTo(x - radius - offset, y);
    ctx.lineTo(x + radius + offset, y);
    ctx.stroke();
    ctx.closePath();

    // Draw diagonal lines
    ctx.beginPath();
    ctx.moveTo(x - radius / 1.5 - offset, y - radius / 1.5 - offset);
    ctx.lineTo(x + radius / 1.5 + offset, y + radius / 1.5 + offset);
    ctx.stroke();
    ctx.closePath();

    //Draw diagonal lines
    ctx.beginPath();
    ctx.moveTo(x + radius / 1.5 + offset, y - radius / 1.5 - offset);
    ctx.lineTo(x - radius / 1.5 - offset, y + radius / 1.5 + offset);
    ctx.stroke();
    ctx.closePath();

    ctx.lineWidth = 1;

    // Draw a grey gradient circle for bombs
    const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius/2, y + radius/2);
    gradient.addColorStop(0, "grey"); // Starting color at the top left
    gradient.addColorStop(1, "black"); // Ending color at the middle bottom right
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius - 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    // Draw a black little circle
    ctx.fillStyle = "black"; // Set the fill color to red
    ctx.beginPath();
    //ctx.arc(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, cellSize / 2.5, 0, 2 * Math.PI);
    ctx.arc(x, y, radius / 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
}

document.addEventListener('startVersusGameEvent', async function (event)  {
    const {numBombs, bombCoordinates ,rows, cols} = event.detail;
    //console.log(`Received startVersusGameEvent with numBombs: ${numBombs}, bombCoordinates: ${bombCoordinates}, rows: ${rows}, cols: ${cols}`)
    const grid = new Grid(rows, cols, numBombs, bombCoordinates);
    //console.log(`Starting a new game with grid ${grid}`);
    const canvas = document.getElementById('minesweeperCanvas');
    const ctx = canvas.getContext('2d');
    let zoomFactor = 1;
    let isGameWin = false;

    //Timer
    const timer = document.getElementById('timer');
    let timerInterval = null;
    let timeElapsed = 0;
    let isGameStarted = false;

    //Bombs
    const bombCanvas = document.getElementById('bombsCanvas');
    const bombCtx = bombCanvas.getContext('2d');

    const numRows = rows; // Define the number of rows
    const numCols = cols; // Define the number of columns
    //console.log(`Rows: ${numRows}, cols: ${numCols}`)
    const cellSize = 40; // Calculate the cell size dynamically
    let canvasWidth = cellSize * numCols; // Calculate the canvas width
    let canvasHeight = cellSize * numRows; // Calculate the canvas height

    canvas.width = canvasWidth; // Set the canvas width
    canvas.height = canvasHeight; // Set the canvas height

    function startTimer() {
        if (!isGameStarted) {
            timerInterval = setInterval(() => {
                timeElapsed++;
                timer.innerHTML = timeElapsed.toString();
                //console.log(`Time elapsed: ${timeElapsed} seconds`);
            }, 1000); // Update every 1000 ms (1 second)
            isGameStarted = true;
        }
    }

    function stopTimer() {
        isGameStarted = false;
        clearInterval(timerInterval);
    }

    function handleGameEnd(result) {
        // Dispatch the 'endGame' event with the result as the detail
        //console.log(`Game ended with result: ${result}`);
        document.dispatchEvent(new CustomEvent('endVersusGame', { detail: { result } }));
    }

    function checkIfClickedCellIsBomb(row, col) {
        if (grid.matrix[row][col].isFlagged()) {
            return;
        }
        return grid.matrix[row][col].hasBomb();
    }

    function checkIfGameEnded() {
        let bombNumber = 0;
        let flagNumber = 0;
        let visibleNonBombCells = 0;

        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                const cell = grid.matrix[row][col];

                if (cell.hasBomb()) {
                    bombNumber++;
                }

                if (cell.isFlagged()) {
                    flagNumber++;
                }

                if (cell.isVisible() && !cell.hasBomb()) {
                    visibleNonBombCells++;
                }
            }
        }

        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                const cell = grid.matrix[row][col];

                if (cell.hasBomb() && !cell.isVisible() && !cell.isFlagged()) {
                    return false; // The game hasn't ended yet
                }
            }
        }

        return bombNumber === flagNumber && visibleNonBombCells === (numRows * numCols - bombNumber);

    }

    function removeClickListeners() {
        canvas.removeEventListener('click', clickHandler);
        canvas.removeEventListener('contextmenu', contextMenuHandler);
    }

    function addClickListeners() {
        canvas.addEventListener('click', clickHandler);
        canvas.addEventListener('contextmenu', contextMenuHandler);
    }

    function explodeBomb(row, col) {
        addMalus(5);
        timeElapsed += 5;
        grid.matrix[row][col].setExploded()
        if (!grid.matrix[row][col].isFlagged()) {
            grid.matrix[row][col].toggleFlag();
        }
        grid.matrix[row][col].isVisible();
        grid.matrix[row][col].drawCellContent(ctx, row, col, cellSize);
        // Update the bombs counter
        bombsDiv.innerHTML = (parseInt(bombsDiv.innerHTML) - 1).toString();
    }

    //Left click
    function clickHandler(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const row = Math.floor(y / cellSize * zoomFactor);
        const col = Math.floor(x / cellSize * zoomFactor);
        //console.log(`Left-clicked on cell (${row}, ${col}), Visible: ${grid.matrix[row][col].isVisible()}, Flagged: ${grid.matrix[row][col].isFlagged()}`);
        startTimer();

        // Handle left clicks
        if (grid.matrix[row][col].isVisible()) {
            if (grid.matrix[row][col].getNumber() > 0 && !grid.matrix[row][col].hasBomb()) {
                const {isBomb, bombsList} = grid.revealNeighbours(row, col);
                //console.log(`isBomb: ${isBomb}, bombList: ${bombsList}`)
                if (isBomb) {
                    for (const obj of bombsList) {
                        const bombRow = obj.bombRow;
                        const bombCol = obj.bombCol;
                        if (!grid.matrix[bombRow][bombCol].getExploded()) {
                            explodeBomb(bombRow, bombCol);
                        }
                    }
                }
            }
        } else {
            grid.revealCell(row, col, false);
        }

        // Clear the canvas and redraw the grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(grid, ctx, numRows, numCols, cellSize);

        if (checkIfClickedCellIsBomb(row, col)) {
            //lose();
            if (!grid.matrix[row][col].getExploded()) {
                explodeBomb(row, col);
            }
        } else if (checkIfGameEnded()) {
            isGameWin = true;
            stopTimer();
            gameEnded = true;
            removeClickListeners();
            //isGameWon();
            handleGameEnd(timeElapsed);
        }
    }

    //Right Click
    function contextMenuHandler(event) {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const row = Math.floor(y / cellSize);
        const col = Math.floor(x / cellSize);
        //console.log(`Right-clicked on cell (${row}, ${col}, ${grid.matrix[row][col].getExploded()})`);
        startTimer();

        // Handle right clicks
        grid.revealCell(row, col, true);

        // Clear the canvas and redraw the grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(grid, ctx, numRows, numCols, cellSize);

        // Update the bombs counter
        if (!grid.matrix[row][col].isVisible() && grid.matrix[row][col].isFlagged() && !grid.matrix[row][col].getExploded() ) {
            bombsDiv.innerHTML = (parseInt(bombsDiv.innerHTML) - 1).toString();
        }
        if (!grid.matrix[row][col].isVisible() && !grid.matrix[row][col].isFlagged()) {
            bombsDiv.innerHTML = (parseInt(bombsDiv.innerHTML) + 1).toString();
        }

        if (checkIfGameEnded()) {
            isGameWin = true;
            stopTimer();
            //console.log("Game Over! You win!");
            gameEnded = true;
            removeClickListeners();
            //isGameWon();
            handleGameEnd(timeElapsed);
        }
    }

    // USAGE

    let gameEnded = false;
    addClickListeners();

    //const grid = new Grid(numRows, numCols); // Creating a new Grid
    //const gridTest = new Grid(15, 10, 10);
    //console.log(gridTest.matrix)

    // Bomb canvas
    bombCanvas.width = cellSize;
    bombCanvas.height = cellSize;
    drawBomb(bombCtx, cellSize / 2, cellSize / 2, cellSize / 4, 4);

    // Bombs counter
    let bombsDiv = document.getElementById('bombs');
    bombsDiv.innerHTML = grid.numbombs.toString();

    // Draw the rest of the grid
    drawGrid(grid, ctx, numRows, numCols, cellSize);

});