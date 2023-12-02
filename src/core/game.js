import Grid, {drawGrid} from "./grid"

const BOMB_DENSITY_NORMAL = 0.15;

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

// Function to get the value of a cookie by name
function getCookie(cookieName) {
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return null;
}

function setCookie(name, value, days) {
    let expires = "";

    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }

    document.cookie = name + "=" + value + expires + "; path=/";
}

document.addEventListener('DOMContentLoaded', async function () {
    const canvas = document.getElementById('minesweeperCanvas');
    const ctx = canvas.getContext('2d');
    let isGameWin = false;

    //Timer
    const timer = document.getElementById('timer');
    let timerInterval = null;
    let timeElapsed = 0;
    let isGameStarted = false;

    //Bombs
    const bombCanvas = document.getElementById('bombsCanvas');
    const bombCtx = bombCanvas.getContext('2d');

    const rows = getCookie('rows');
    const cols = getCookie('cols');

    const numRows = rows; // Define the number of rows
    const numCols = cols; // Define the number of columns
    const cellSize = 40; // Calculate the cell size dynamically
    let canvasWidth = cellSize * numCols; // Calculate the canvas width
    let canvasHeight = cellSize * numRows; // Calculate the canvas height

    // Constants for long press (right-click) handling
    const longPressDuration = 500; // milliseconds
    let touchStartX = 0;
    let touchStartY = 0;
    let touchTimeout;

    canvas.width = canvasWidth; // Set the canvas width
    canvas.height = canvasHeight; // Set the canvas height

    const initialZoomFactor = 1;
    const zoomStep = 0.1;

    let zoomFactor = initialZoomFactor;

    const getGridCoordinates = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Convert clicked coordinates to grid coordinates
        const row = Math.floor(y / (cellSize * zoomFactor));
        const col = Math.floor(x / (cellSize * zoomFactor));

        return { row, col };
    };

    function updateCanvasSize() {
        // Update the canvas width and height based on the zoom factor
        const newWidth = canvasWidth * zoomFactor;
        const newHeight = canvasHeight * zoomFactor;

        // Set the new canvas size
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Translate the canvas to keep the top fixed
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Adjust the content to the new zoom factor
        ctx.scale(zoomFactor, zoomFactor);

        // Redraw your Minesweeper grid with the updated size
        drawGrid(grid, ctx, numRows, numCols, cellSize)
    }

    document.getElementById('zoomInButton').addEventListener('click', function () {
        zoomFactor += zoomStep;
        updateCanvasSize();
    });

    document.getElementById('zoomOutButton').addEventListener('click', function () {
        zoomFactor -= zoomStep;
        updateCanvasSize();
    });

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

    function removeTouchListeners() {
        canvas.removeEventListener('touchstart', touchStartHandler);
        canvas.removeEventListener('touchend', touchEndHandler);
    }

    function addTouchListeners() {
        canvas.addEventListener('touchstart', touchStartHandler);
        canvas.addEventListener('touchend', touchEndHandler);
    }

    function removeClickListeners() {
        canvas.removeEventListener('click', clickHandler);
        canvas.removeEventListener('contextmenu', contextMenuHandler);
    }

    function addClickListeners() {
        canvas.addEventListener('click', clickHandler);
        canvas.addEventListener('contextmenu', contextMenuHandler);
    }

    function isGameWon() {
        if (isGameWin) {
            const myDiv = document.getElementById('gameWin');
            myDiv.style.display = 'flex';
        } else {
            const myDiv = document.getElementById('gameOver');
            myDiv.style.display = 'flex';
        }
    }

    function lose(){
        //console.log("Game Over! You clicked on a bomb.");
        stopTimer()
        gameEnded = true;
        removeClickListeners();

        isGameWon();

        // Revealing all bomb cells
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                if (grid.matrix[r][c].hasBomb()) {
                    grid.matrix[r][c].setVisible();
                }
            }
        }
        // Clear the canvas and redraw the grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(grid, ctx, numRows, numCols, cellSize)
    }

    // Touch start for long press (right-click)
    function touchStartHandler(event) {
        event.preventDefault();
        const {row, col} = getGridCoordinates(event.changedTouches[0].clientX, event.changedTouches[0].clientY)
        startTimer();

        // Store the coordinates and start a timeout
        touchStartX = row;
        touchStartY = col;
        touchTimeout = setTimeout(() => {
            // Handle long press (right-click) logic here
            grid.revealCell(row, col, true);

            // Clear the canvas and redraw the grid
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid(grid, ctx, numRows, numCols, cellSize)

            // Update the bombs counter
            if (!grid.matrix[row][col].isVisible() && grid.matrix[row][col].isFlagged() ) {
                bombsDiv.innerHTML = (parseInt(bombsDiv.innerHTML) - 1).toString();
            }
            if (!grid.matrix[row][col].isVisible() && !grid.matrix[row][col].isFlagged()) {
                bombsDiv.innerHTML = (parseInt(bombsDiv.innerHTML) + 1).toString();
            }

            if (checkIfGameEnded()) {
                isGameWin = true;
                stopTimer();
                gameEnded = true;
                removeClickListeners();
                removeTouchListeners();
                isGameWon();
            }
        }, longPressDuration);
    }

    // Touch end
    function touchEndHandler(event) {
        event.preventDefault();

        // Clear the timeout to prevent it from triggering after a short press
        clearTimeout(touchTimeout);

        // Handle touchend (left-click) logic here
        const {row, col} = getGridCoordinates(event.changedTouches[0].clientX, event.changedTouches[0].clientY)

        startTimer();

        // Handle left clicks
        if (grid.matrix[row][col].isVisible()) {
            if (grid.matrix[row][col].isVisible()) {
                if (grid.matrix[row][col].getNumber() > 0 && !grid.matrix[row][col].hasBomb()) {
                    const {isBomb, bombsList} = grid.revealNeighbours(row, col);
                    //console.log(`isBomb: ${isBomb}, bombList: ${bombsList}`)
                    if (isBomb) {
                        for (const obj of bombsList) {
                            const bombRow = obj.bombRow;
                            const bombCol = obj.bombCol;
                            if (!grid.matrix[bombRow][bombCol].getExploded()) {
                                lose();
                                return;
                            }
                        }
                    }
                }
            }
        } else {
            grid.revealCell(row, col, false);
        }

        // Clear the canvas and redraw the grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(grid, ctx, numRows, numCols, cellSize)

        if (checkIfClickedCellIsBomb(row, col)) {
            lose();
        } else if (checkIfGameEnded()) {
            isGameWin = true;
            stopTimer();
            gameEnded = true;
            removeClickListeners();
            removeTouchListeners();
            isGameWon();
        }
    }

    //Left click
    function clickHandler(event) {
        const { row, col } = getGridCoordinates(event.clientX, event.clientY);
        //console.log(`Left-clicked on cell (${row}, ${col})`);
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
                            lose();
                            return;
                        }
                    }
                }
            }
        } else {
            grid.revealCell(row, col, false);
        }

        // Clear the canvas and redraw the grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(grid, ctx, numRows, numCols, cellSize)

        if (checkIfClickedCellIsBomb(row, col)) {
            lose();
        } else if (checkIfGameEnded()) {
            isGameWin = true;
            stopTimer();
            gameEnded = true;
            removeClickListeners();
            removeTouchListeners();
            isGameWon();
        }
    }

    //Right Click
    function contextMenuHandler(event) {
        event.preventDefault();
        const { row, col } = getGridCoordinates(event.clientX, event.clientY);
        //console.log(`Right-clicked on cell (${row}, ${col})`);
        startTimer();

        // Handle right clicks
        grid.revealCell(row, col, true);

        // Clear the canvas and redraw the grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(grid, ctx, numRows, numCols, cellSize)

        // Update the bombs counter
        if (!grid.matrix[row][col].isVisible() && grid.matrix[row][col].isFlagged() ) {
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
            removeTouchListeners();
            isGameWon();
        }
    }

    function generateBombCoordinates(length, width, numBombs) {
        const bombCoordinates = [];

        while (bombCoordinates.length < numBombs) {
            const newRow = Math.floor(Math.random() * length);
            const newCol = Math.floor(Math.random() * width);

            // Ensure the generated coordinate is unique
            if (!bombCoordinates.some(coord => coord.row === newRow && coord.col === newCol)) {
                bombCoordinates.push({ row: newRow, col: newCol });
            }
        }

        return bombCoordinates;
    }

    const numBombs = Math.floor(numRows * numCols * BOMB_DENSITY_NORMAL);
    const bombCoordinates = generateBombCoordinates(numRows, numCols, numBombs);
    //console.log(bombCoordinates, numBombs)

    // USAGE

    let gameEnded = false;
    addClickListeners();
    addTouchListeners();

    const grid = new Grid(numRows, numCols, numBombs, bombCoordinates); // Creating a new Grid
    //const gridTest = new Grid(15, 10, 10);
    //console.log(gridTest.matrix)

    // Bomb canvas
    bombCanvas.width = cellSize;
    bombCanvas.height = cellSize;
    drawBomb(bombCtx, cellSize/2, cellSize/2, cellSize/4, 4);

    // Bombs counter
    let bombsDiv = document.getElementById('bombs');
    bombsDiv.innerHTML = grid.numbombs.toString();

    // Draw the rest of the grid
    drawGrid(grid, ctx, numRows, numCols, cellSize);


});