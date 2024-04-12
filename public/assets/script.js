document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 1;

    // Game settings
    const gridSize = 10;
    const cellSize = canvas.width / (gridSize * 2); // Two grids side by side

    let playerBoard;
    let player2Board;

    let playerShips;
    let player2Ships;

    let currentplayerid;

    let myplayerid;

    //getting the buttons and adding event listeners to them
    const p1ready = document.getElementById('p1Bttn');
    const p2ready = document.getElementById('p2Bttn');


    // TODO
    // Init sever connection
    //create a new instance of the web socket 
    const socket = new WebSocket('ws://localhost:3000'); //pass the url for our websocket server


    //event listener to listen to open event (fires whenever you are connected to server side)
    /*socket.addEventListener("open", () => {
        console.log("You are connected to the server!");
    })*/
    socket.onopen = () => {
        console.log("Connected to the server!");


    }
    socket.onmessage = handleServerMessage;

    //event listeners for the buttons
    function showP1Button() {
        p1ready.style.backgroundColor = '#AFE1AF';

        p1ready.addEventListener('click', handlep1readyClick);

        function handlep1readyClick() {
            console.log('Player 1 Ready');
            p1ready.style.backgroundColor = '#eaceb4';
            //socket.send(JSON.stringify({ type: 'player-status', player: '1' }));
            p1ready.removeEventListener('click', handlep1readyClick);
            sendMessageToServer(JSON.stringify({ type: 'player-status', player: '1' }));
            //p1ready.style.backgroundColor = '#';
            //add code to remove the click

        }
    }

    function showP2Button() {
        p2ready.style.backgroundColor = '#50C878';

        p2ready.addEventListener('click', handlep2readyClick);

        function handlep2readyClick() {
            p2ready.style.backgroundColor = '#9bf4d5';
            console.log('Player 2 Ready');
            //socket.send({type: 'player-status', player: '2'});

            p2ready.removeEventListener('click', handlep2readyClick);

            sendMessageToServer(JSON.stringify({ type: 'player-status', player: '2' }));

            //add code to remove the click
        }
    }



    const startbtn = document.getElementById('StartButton');



    /*function allowStartButton() {
        startbtn.addEventListener('click', handleStartClick);
        startbtn.style.backgroundColor = '#ffc0d0';
    }*/

    function handleStartClick() {
        console.log('Start Button clicked');
        //startbtn.style.backgroundColor = '#ff9de2';
        //first check if both players are connected by checking the colour of both boxes
        //if one box is not green, then display a message saying another person must be connected

        //send a message back to the server to initialize the gamestate in the server-side.. gameinprogress = true
        //startbtn.removeEventListener('click', handleStartClick);
        sendMessageToServer(JSON.stringify({ type: 'start-button-clicked' }));
        
    }

    //this is moved to occur when the game has started only
    //canvas.addEventListener('click', handleCanvasClick);

    function createBoard(size) {
        return Array.from({ length: size }, () => Array(size).fill(0));
    }

    function createShipsArray() {
        return [5, 4, 3, 3, 2].map(size => ({ size }));
    }

    function placeShips(board, ships) {
        ships.forEach(ship => {
            let placed = false;
            while (!placed) {
                const x = Math.floor(Math.random() * gridSize);
                const y = Math.floor(Math.random() * gridSize);
                const direction = Math.random() > 0.5 ? 'H' : 'V';
                placed = canPlaceShip(board, x, y, ship.size, direction);
                if (placed) {
                    for (let i = 0; i < ship.size; i++) {
                        board[y + (direction === 'V' ? i : 0)][x + (direction === 'H' ? i : 0)] = 1;
                    }
                }
            }
        });
    }

    function canPlaceShip(board, x, y, size, direction) {
        for (let i = 0; i < size; i++) {
            if (direction === 'H' && (x + i >= gridSize || board[y][x + i] === 1)) {
                return false;
            }
            if (direction === 'V' && (y + i >= gridSize || board[y + i][x] === 1)) {
                return false;
            }
        }
        return true;
    }

    function drawBoards(playerboardtodraw) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(0); // Player's grid
        drawGrid(gridSize * cellSize); // Computer's grid --> Player 2's grid

        if (playerboardtodraw === 1) {
            drawShips(playerBoard, 0); // Draw player's ships
            updatePlayerGrid();
        }
        else if (playerboardtodraw === 2) {
            drawShips(player2Board, gridSize * cellSize);
            updatePlayer2Grid();
        }
        
        //updateComputerGrid();
    }

    function drawGrid(offsetX) {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                ctx.strokeRect(i * cellSize + offsetX, j * cellSize, cellSize, cellSize);
            }
        }
    }

    function drawShips(board, offsetX) {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (board[y][x] === 1) {
                    ctx.fillStyle = 'gray';
                    ctx.fillRect(x * cellSize + offsetX + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                }
            }
        }
    }

    //function updatePlayer2Grid()
    function updatePlayer2Grid() {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (player2Board[y][x] === 2) {
                    ctx.fillStyle = 'red'; // Hit
                    ctx.fillRect((x + gridSize) * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                } else if (player2Board[y][x] === 3) {
                    ctx.fillStyle = 'blue'; // Miss
                    ctx.fillRect((x + gridSize) * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                }
            }
        }
    }

    function updatePlayerGrid() {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (playerBoard[y][x] === 2) {
                    ctx.fillStyle = 'red'; // Hit
                    ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                } else if (playerBoard[y][x] === 3) {
                    ctx.fillStyle = 'orange'; // Miss
                    ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                }
            }
        }
    }

    function handleCanvasClick(event) {

        if (currentplayerid !== myplayerid) {
            return;
        }

        console.log(`Handling click for Player # ${currentplayerid}...`);

        //two cases here: it's player 1's turn or it's player 2's turn

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / cellSize);
        const y = Math.floor((event.clientY - rect.top) / cellSize);

        //depending on which player's turn it is...
        if (currentplayerid === 1) {
            if (x >= gridSize) { // Ensure the click is on the computer's (player 2's) grid
                
                playerMove(x - gridSize, y);
                
            }
            else {
                console.log('please select a cell on the other board ', currentplayerid);
            }
            canvas.removeEventListener('click', handleCanvasClick);
        }
        else if (currentplayerid === 2) {
            if (x < gridSize) { //Ensure the click is on player 1's grid
                
                player2Move(x, y);
                
            }
            else {
                console.log('please select a cell on the other board ', currentplayerid);

            }
            canvas.removeEventListener('click', handleCanvasClick);
        }

        //canvas.removeEventListener('click', handleCanvasClick);


    }


    function playerMove(x, y) {
        //send a message to the server side which should handle this message
        //we are sending back the coordinates that the player clicked on!
        sendMessageToServer(JSON.stringify({ type: 'player-1-move', coordinates: [x, y] })); // TODO
    }


    //this function should be removed
    function player2Move(x, y) {
        //console
        sendMessageToServer(JSON.stringify({ type: 'player-2-move', coordinates: [x,y]}));
    }


    // TODO
    function handleServerMessage(event) {
        console.log('Message from server:', event.data);
        let p1connected = false;


        if (event.data === null) {
            console.log('Recieved data that is null or undefined');
            return;
        }

        if (checkisServerJSON(event.data)) {
            const serverdata = JSON.parse(event.data);

            if (serverdata.type === 'draw-p1-board') {
                playerBoard = createBoard(gridSize);
                playerShips = createShipsArray();
                placeShips(playerBoard, playerShips);
                drawBoards(1);
                showP1Button();
                sendMessageToServer(JSON.stringify({ type: 'p1board-set', p1board: playerBoard}));

            }
            else if (serverdata.type === 'draw-p2-board') {
                player2Board = createBoard(gridSize);
                player2Ships = createShipsArray();
                placeShips(player2Board, player2Ships);
                drawBoards(2);
                showP2Button();
                sendMessageToServer(JSON.stringify({ type: 'p2board-set', p2board: player2Board}));
            }
            else if (serverdata.type === 'player-connected') {
                const playerID = parseInt(serverdata.playerId, 10);

                console.log(`Player ${playerID} joined!`);

                //console.log('is p1 connected? ', p1connected);

                //document.querySelector(`.p${playerID} .connected span`).classList.toggle('green');

                if (playerID === 1) {
                    document.querySelector('.p1 .connected span').classList.toggle('green');
                    p1connected = true;
                }
                else if (playerID === 2) {
                    document.querySelector('.p2 .connected span').classList.toggle('green');
                    
                    if (p1connected) {
                        console.log('Player 1 was already connected...');
                        document.querySelector(`.p1 .connected span`).classList.add('green');
                    }
                }

            }
            else if (serverdata.type === 'setplayerid') {
                myplayerid = serverdata.setthisid;
            }
            else if (serverdata.type === 'player-disconnected') {
                let disconnectedid = 1;

                if (myplayerid === 1) {
                    disconnectedid = 2;
                }
                else if (myplayerid === 2){
                    disconnectedid = 1;
                }
                //const disconnectedID = parseInt(serverdata.playerId, 10);

                document.querySelector(`.p${disconnectedid} .connected span`).classList.toggle('green');

                console.log(`Player ${disconnectedid} disconnected :(`);

                $('#currentturn').text(`Player ${disconnectedid} disconnected :(`);

            }
            else if (serverdata.type === 'game-start') {
                console.log(serverdata.text);
                //allowStartButton();
                startbtn.addEventListener('click', handleStartClick);
                startbtn.style.backgroundColor = '#ffc0d0';
                console.log('Click the Start Button...');
            }
            else if (serverdata.type === 'starting-game') {
                startbtn.style.backgroundColor = '#ff9de2';
                startbtn.removeEventListener('click', handleStartClick);
                console.log('GAME STARTED-----');
                sendMessageToServer('1 1 1');
                sendMessageToServer(JSON.stringify({ type: 'game-fixed', text: '2 2 2'}));
            }
            else if (serverdata.type === 'first-move-player') {
                console.log('Game In Progress..');
                console.log(`it is ${serverdata.currentplayer} 's turn`);
            }
            else if (serverdata.type === 'currentplayer-turn') { //this one is only displayed for the player indicated in the server-side
                currentplayerid = serverdata.currplayer
                console.log('The current player is: #', currentplayerid);
                //const p1wsid = serverdata.isp1ws;
                //const p2wsid = serverdata.isp2ws;
                //console.log('do we still have p1ws: ', p1wsid);
                //console.log('do we still have p2ws: ', p2wsid);
                //console.log('recieved by just this client');
                //canvas.addEventListener('click', (event) => {handleCanvasClick(event)});
                if (currentplayerid === myplayerid) {
                    console.log('You are the current player! ');
                    $('#gameCanvas').off().on('click', (event) => {handleCanvasClick(event)});

                }
                $('#currentturn').text(currentplayerid === myplayerid ? 'Your Turn...' : 'Opponents Turn...');

            }
            else if (serverdata.type === 'game-state-update-p1') {
                console.log('Player 1 sent Game Status Update');
                //console.log(serverdata.updatedgame.player2Board)
                player2Board = serverdata.updatedgame.player2Board;
                updatePlayer2Grid();

                currentplayerid = serverdata.updatedgame.currentplayer;
                
                
            }
            else if (serverdata.type === 'game-state-update-p2') {
                console.log('Player 2 sent Game Status Update')
                console.log(serverdata.updatedgame.player1Board);
                playerBoard = serverdata.updatedgame.player1Board;
                updatePlayerGrid();

                currentplayerid = serverdata.updatedgame.currentplayer;

            }
            else if (serverdata.type === 'playerwins') {
                /*if (serverdata.playerwon === myplayerid) {
                    alert('You Won!');
                }
                else {
                    alert('You Lost!');
                }*/
                $('#gameCanvas').off();

                $('#currentturn').text(serverdata.playerwon === myplayerid ? 'YOU WON!.' : 'YOU LOST!');
            }

        }


    }

    //helper function for handling server messages
    function checkisServerJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (error) {
            return false;
        }
    }

    // TODO
    function sendMessageToServer(message) {
        socket.send(message);
    }



});
