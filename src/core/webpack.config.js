const path = require('path');

module.exports = [
    {
        mode: 'production',
        entry: {
            main: './src/core/game.js',
        },
        output: {
            filename: 'main.bundle.js',
            path: path.resolve(__dirname, '../../public/js'),
        },
    },
    {
        mode: 'production',
        entry: {
            other: './src/core/gameVersus.js',
        },
        output: {
            filename: 'versus.bundle.js',
            path: path.resolve(__dirname, '../../public/js'),
        },
    }
];
