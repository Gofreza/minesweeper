export default class Cell {
    constructor() {
        this.bomb = false;
        this.number = 0;
        this.visible = false;
        this.flagged = false;
        this.hasExploded = false;
    }

    isFlagged() {
        return this.flagged;
    }

    toggleFlag() {
        this.flagged = !this.flagged; // Toggle the flagged status
    }

    isVisible() {
        return this.visible;
    }

    setVisible() {
        this.visible = true;
    }

    hasBomb() {
        return this.bomb;
    }

    setBomb() {
        this.bomb = true;
    }

    setExploded() {
        this.hasExploded = true;
    }

    getExploded() {
        return this.hasExploded;
    }

    getNumber() {
        return this.number;
    }

    setNumber(s) {
        this.number = s;
    }

    toString() {
        if (this.bomb) {
            return "B";
        } else {
            return this.number.toString();
        }
    }

    drawBomb(ctx, x, y, radius, offset, exploded) {
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

        if (exploded) {
            // Draw a black little circle
            ctx.fillStyle = "red"; // Set the fill color to red
            ctx.beginPath();
            //ctx.arc(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, cellSize / 2.5, 0, 2 * Math.PI);
            ctx.arc(x, y, radius / 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
        } else {
            // Draw a black little circle
            ctx.fillStyle = "black"; // Set the fill color to red
            ctx.beginPath();
            //ctx.arc(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, cellSize / 2.5, 0, 2 * Math.PI);
            ctx.arc(x, y, radius / 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
        }

    }

    drawCellContent(ctx, row, col, cellSize) {
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        const radius = cellSize / 4;
        const offset = 4;

        // Draw the cell content based on visibility
        if (this.visible) {
            if (this.hasBomb()) {
                if (this.getExploded()){
                    this.drawBomb(ctx, x, y, radius, offset, true);
                }
                else {
                    this.drawBomb(ctx, x, y, radius, offset);
                }
            } else {
                let textColor = "#000000"; // Set the default text color to black
                if (this.getNumber() === 1) {
                    textColor = "blue"; // Change the text color to blue if the number is 1
                } else if (this.getNumber() === 2) {
                    textColor = "green"; // Change the text color to green if the number is 2
                } else if (this.getNumber() === 3) {
                    textColor = "red"; // Change the text color to red if the number is 3
                } else if (this.getNumber() === 4) {
                    textColor = "#00008B";
                } else if (this.getNumber() === 5) {
                    textColor = "#8B0000";
                } else if (this.getNumber() === 6) {
                    textColor = "#00FFFF";
                } else if (this.getNumber() === 7) {
                    textColor = "black";
                } else if (this.getNumber() === 8) {
                    textColor = "grey";
                } else if (this.getNumber() === 0) {
                    return; // Do nothing for 0
                }
                ctx.fillStyle = "#f9f8f5"; // Set the fill color to white
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize); // Fill the cell with white color
                ctx.fillStyle = textColor; // Set the fill color to the determined text color
                ctx.font = "20px Arial"; // Set the font size and type
                ctx.textAlign = "center"; // Set the text alignment to center
                ctx.textBaseline = "middle"; // Set the text baseline to middle
                ctx.fillText(this.toString(), col * cellSize + cellSize / 2, row * cellSize + cellSize / 2); // Show the content
            }
        }
        // Not visible
        else {
            ctx.fillStyle = "#999999"; // Set the fill color to a lighter shade
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize); // Fill the cell with the lighter shade
            if (this.flagged) {
                // Draw a flag
                ctx.fillStyle = "#ff0000"; // Set the fill color to red
                ctx.beginPath();
                ctx.moveTo(x - 2, y + radius);
                ctx.lineTo(x - 3.5, y - 1);
                ctx.stroke();
                ctx.closePath();
                ctx.beginPath();
                ctx.moveTo(x - 3, y - 1)
                ctx.lineTo(x - radius/2, y - radius - offset);
                ctx.stroke();
                ctx.lineTo(x + radius + offset, y - radius/2 - offset);
                ctx.stroke();
                ctx.lineTo(x - 3, y - 1);
                ctx.stroke();
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x - 8, y + radius);
                ctx.lineTo(x + 4, y + radius);
                ctx.stroke();
                ctx.closePath();

                //ctx.fillRect(col * cellSize + cellSize / 4, row * cellSize + cellSize / 4, cellSize / 2, cellSize / 2); // Draw a flag
            }
        }
    }
}