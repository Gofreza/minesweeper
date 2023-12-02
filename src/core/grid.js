const Cell = require("./cell");

class Grid {

    DIFFICULTY_NORMAL = 0.15;

    /**
     * Constructor to create a grid with specified bomb coordinates or not. If not, generated bombs will be placed randomly.
     * @param {number} length - Number of rows
     * @param {number} width - Number of columns
     * @param {number} numBombs - Number of bombs
     * @param {Array} bombCoordinates - Array of {row, col} representing bomb coordinates
     */
    constructor(length, width, numBombs, bombCoordinates = []) {
        this.length = length;
        this.width = width;
        this.matrix = [];
        this.numbombs = numBombs;

        // Initialize matrix with cells
        for (let i = 0; i < length; i++) {
            let row = [];
            for (let j = 0; j < width; j++) {
                let cell = new Cell();
                row.push(cell);
            }
            this.matrix.push(row);
        }

        if (bombCoordinates.length > 0) {
            // Place bombs based on specified coordinates

            this.placeBombsFromCoordinates(bombCoordinates);
        } else {
            this.placeBombs(this.numbombs);
        }

    }

    get numBomb() {
        return this.numbombs;
    }

    placeBombs(numBombs) {
        const rowDistribution = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const colDistribution = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        let bombsToPlace = numBombs;
        while (bombsToPlace > 0) {
            let row = rowDistribution(0, this.length - 1);
            let col = colDistribution(0, this.width - 1);
            if (!this.matrix[row][col].hasBomb()) {
                this.matrix[row][col].setBomb();
                this.calculateCellWeight(row, col);
                bombsToPlace--;
            }
        }
    }

    /**
     * Place bombs on the grid based on specified coordinates
     * @param {Array} bombCoordinates - Array of {row, col} representing bomb coordinates
     */
    placeBombsFromCoordinates(bombCoordinates) {
        bombCoordinates.forEach(({ row, col }) => {
            if (row >= 0 && row < this.length && col >= 0 && col < this.width) {
                this.matrix[row][col].setBomb();
                this.calculateCellWeight(row, col);
            }
        });
    }

    calculateCellWeight(row, col) {
        if (row - 1 >= 0 && row - 1 < this.length) {
            if (col - 1 >= 0 && col - 1 < this.width && !this.matrix[row - 1][col - 1].hasBomb()) {
                this.matrix[row - 1][col - 1].setNumber(this.matrix[row - 1][col - 1].getNumber() + 1);
            }
            if (col >= 0 && col < this.width && !this.matrix[row - 1][col].hasBomb()) {
                this.matrix[row - 1][col].setNumber(this.matrix[row - 1][col].getNumber() + 1);
            }
            if (col + 1 >= 0 && col + 1 < this.width && !this.matrix[row - 1][col + 1].hasBomb()) {
                this.matrix[row - 1][col + 1].setNumber(this.matrix[row - 1][col + 1].getNumber() + 1);
            }
        }

        if (row >= 0 && row < this.length) {
            if (col - 1 >= 0 && col - 1 < this.width && !this.matrix[row][col - 1].hasBomb()) {
                this.matrix[row][col - 1].setNumber(this.matrix[row][col - 1].getNumber() + 1);
            }
            if (col + 1 >= 0 && col + 1 < this.width && !this.matrix[row][col + 1].hasBomb()) {
                this.matrix[row][col + 1].setNumber(this.matrix[row][col + 1].getNumber() + 1);
            }
        }

        if (row + 1 >= 0 && row + 1 < this.length) {
            if (col - 1 >= 0 && col - 1 < this.width && !this.matrix[row + 1][col - 1].hasBomb()) {
                this.matrix[row + 1][col - 1].setNumber(this.matrix[row + 1][col - 1].getNumber() + 1);
            }
            if (col >= 0 && col < this.width && !this.matrix[row + 1][col].hasBomb()) {
                this.matrix[row + 1][col].setNumber(this.matrix[row + 1][col].getNumber() + 1);
            }
            if (col + 1 >= 0 && col + 1 < this.width && !this.matrix[row + 1][col + 1].hasBomb()) {
                this.matrix[row + 1][col + 1].setNumber(this.matrix[row + 1][col + 1].getNumber() + 1);
            }
        }
    }

    toString() {
        let output = "";
        for (let i = 0; i < this.length; i++) {
            for (let j = 0; j < this.width; j++) {
                output += "| " + this.matrix[i][j].toString() + " |";
            }
            output += "\n";
            for (let j = 0; j < this.width; j++) {
                output += "-----";
            }
            output += "\n";
        }
        return output;
    }

    revealCell(row, col, isRightClick) {
        if (isRightClick) {
            // Toggle flag on right-click
            if (!this.matrix[row][col].isVisible() && !this.matrix[row][col].getExploded()) {
                this.matrix[row][col].toggleFlag();
            }
            return;
        }

        //If cell is flagged don't reveal
        if (this.matrix[row][col].isFlagged()){
            return;
        }

        if (this.matrix[row][col].isVisible()) {
            // Cell already visible, do nothing
            return;
        }
        this.matrix[row][col].setVisible(); // Set the cell as visible

        if (this.matrix[row][col].getNumber() === 0 && !this.matrix[row][col].hasBomb()) {
            // Implement flood fill to reveal neighboring cells if the clicked cell is a 0
            const directions = [
                [-1, 0], [1, 0], [0, -1], [0, 1], // Up, Down, Left, Right
                [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
            ];

            for (let [dx, dy] of directions) {
                let newRow = row + dx;
                let newCol = col + dy;

                if (
                    newRow >= 0 && newRow < this.length &&
                    newCol >= 0 && newCol < this.width
                ) {
                    if (!this.matrix[newRow][newCol].isVisible()) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
    }

    revealNeighbours(row, col) {
        let isBomb = false;
        let bombs = []
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1], // Up, Down, Left, Right
            [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
        ];
        const number = this.matrix[row][col].getNumber();
        let flagNumber = 0;
        for (let [dx, dy] of directions) {
            let newRow = row + dx;
            let newCol = col + dy;

            if (
                newRow >= 0 && newRow < this.length &&
                newCol >= 0 && newCol < this.width
            ) {
                if (this.matrix[newRow][newCol].isFlagged()){
                    flagNumber++;
                }
            }
        }
        //console.log("revealNeighbours:", number, ": ", flagNumber);
        if (flagNumber >= number) {

            for (let [dx, dy] of directions) {
                let newRow = row + dx;
                let newCol = col + dy;

                if (
                    newRow >= 0 && newRow < this.length &&
                    newCol >= 0 && newCol < this.width
                ) {
                    if (!this.matrix[newRow][newCol].isVisible()) {
                        this.revealCell(newRow, newCol);
                        if (this.matrix[newRow][newCol].hasBomb() && !this.matrix[newRow][newCol].isFlagged()){
                            isBomb = true;
                            const bombRow = newRow;
                            const bombCol = newCol;
                            bombs.push({bombRow, bombCol});
                        }
                    }
                }
            }
        }

        //console.log("bombs: ", bombs);
        return {isBomb: isBomb, bombsList: bombs};
    }

}

function drawGrid(grid, ctx, numRows, numCols, cellSize) {
    // Draw the rest of the grid
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            grid.matrix[row][col].drawCellContent(ctx, row, col, cellSize);
            ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }
}

module.exports = {
    Grid,
    drawGrid
};