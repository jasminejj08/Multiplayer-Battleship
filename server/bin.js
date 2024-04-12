const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const bin = http.createServer(app);


const wss = new WebSocket.Server({ server: bin });

//maximum number of players is two
//let players = [null, null];

//let players = [{ wsid: null, ready: false }, { wsid: null, ready: false }];
let players = [];
let player1ws;
let player2ws;
let connectedClients = 0;
let connectedPlayers = 0;

let p1ships = 0;
let p2ships = 0;

let doneDrawp1 = false;

//create an object to hold the gameState, this is initially null
let gameState = {
    currentPlayer: 1,
    player1Board: null,
    player2Board: null,
    gameInProgress: false,
    p1coordinates: [],
    p2coordinates: [],
    hit: null,
    miss: null,
    gameOver: false,
    isp1ws: null,
    isp2ws: null
};

//using the gridsize from the client-side code to create grids for the backend as well
//const gridSize = 10;

//creating a function to initialize the gameState object 
/*function initializeGameState() {
    gameState = {
        currentPlayer: 1,
        player1Board: null,
        player2Board: null,
        gameInProgress: true,
        coordinates: [],
        hit: null,
        miss: null,
        gameOver: false,
        isp1ws: null,
        isp2ws: null
    }
}
*/

//call this when the game actually starts
//initializeGameState();


//when a client connects
wss.on('connection', function connection(ws) {
    //server side will show that a new client connected
    console.log('A new client connected');

    connectedClients++;
    if (connectedPlayers < 2) {
        connectedPlayers++;
        players.push({ wsid: ws, ready: false });

        if (connectedPlayers === 1) {
            player1ws = players[0].wsid;

            player1ws.send('You are Player 1! Waiting for Player 2...');

            if (player1ws) {
                //console.log('player 1 ws EXISTS!');
                player1ws.send(JSON.stringify({ type: 'setplayerid', setthisid: 1}));
                if (doneDrawp1 === false) {
                    player1ws.send(JSON.stringify({ type: 'draw-p1-board' }));
                    doneDrawp1 = true;
                }
                gameState.isp1ws = true;

            }
            else {
                console.log('player 1 ws undefined...');
            }

            console.log('Waiting for one more player...');


            broadcast(JSON.stringify({ type: 'player-connected', playerId: 1 }));

        }
        else if (connectedPlayers === 2) {
            player2ws = players[1].wsid;

            player2ws.send('You are Player 2!')

            if (player2ws !== null) {
                //console.log('player 2 ws EXISTS!!!!!!');
                //console.log("DoneDrawP1: ", doneDrawp1);
                player2ws.send(JSON.stringify({ type: 'setplayerid', setthisid: 2}));
                if (doneDrawp1 === true) {
                    player2ws.send(JSON.stringify({ type: 'draw-p2-board' }));
                    console.log('Send message to draw BOARD TWO');
                }
                gameState.isp2ws = true;
            }
            else {
                console.log('player 2 ws undefined...');
            }

            console.log('Two Players on Board!')
            /*players.forEach(play => {
                if (play && play.wsid) {
                    play.wsid.send('Game can Start');
                }
            });*/
            sendtoSinglePlayer(2, { type: 'player-connected', playerId: 1 });
            broadcast(JSON.stringify({ type: 'player-connected', playerId: 2 }));


            broadcast('Press Ready!');

        }

    }
    else {

        console.log('No more Players allowed, server full');
        ws.send('Sorry, the server is full.');

        //ws.close();
        return;
    }


    //this function sends data to both clients
    function broadcast(data) {
        players.forEach(client => {
            if (client && client.wsid) {
                client.wsid.send(data);
            }
        });
    }

    function sendtoSinglePlayer(playerid, data) {
        if (player2ws === null) {
            console.log("WSID 2 NULL...2");
        }
        else {
            console.log('sending to a single player: ', playerid);
            //console.log('sent to the single player: ', data);
        }


        if (playerid === 1) {
            player1ws.send(JSON.stringify(data));
        }
        else if (playerid === 2) {
            player2ws.send(JSON.stringify(data));
            //console.log(player2ws);
        }
        if (player2ws === null) {
            console.log("WSID 2 NULL");
        }
    }


    ws.on('message', message => {
        //console.log('Received message:', message);
        ws.send('You sent -> ' + message);
        if (player2ws) {
            console.log('player 2 ws still available');
        }
        if (player2ws === null) {
            console.log("WSID 2 NULL...3");
        }

        if (checkisClientJSON(message)) {
            clientdata = JSON.parse(message);
            //console.log(clientdata);
            console.log('client data type: ', clientdata.type);

            if (clientdata.type === 'p1board-set') {
                gameState.player1Board = clientdata.p1board;

                const checkp1boardships = gameState.player1Board

                for (let k = 0; k < checkp1boardships.length; k++) {
                    for (let n = 0; n < checkp1boardships.length; n++) {
                        if (checkp1boardships[n][k] === 1) {
                            p1ships++;
                        }
                    }
                }


            }
            else if (clientdata.type === 'p2board-set') {
                gameState.player2Board = clientdata.p2board;

                const checkp2boardships = gameState.player2Board

                for (let k = 0; k < checkp2boardships.length; k++) {
                    for (let n = 0; n < checkp2boardships.length; n++) {
                        if (checkp2boardships[n][k] === 1) {
                            p2ships++;
                        }
                    }
                }

            }
            else if (clientdata.type === 'player-status') {
                if (clientdata.player === '1') {
                    players[0].ready = true;
                    console.log(players[0].ready);

                }
                else if (clientdata.player === '2') {
                    players[1].ready = true;
                    console.log(players[1].ready);


                }

                if (players[0].ready === true && players[1].ready === true) {
                    console.log('Both Players Ready...');
                    broadcast(JSON.stringify({ type: 'game-start', text: 'Both players are ready.' }));
                }
                else {
                    console.log('A player is not ready');
                }

            }
            else if (clientdata.type === 'start-button-clicked') {
                console.log('Game started...');

                broadcast(JSON.stringify({ type: 'starting-game' }));
                //player1ws.send(JSON.stringify({ type: 'starting-game' }));

            }
            else if (clientdata.type === 'game-begins') {
                //initialize the game state on the server side to maintain the state
                console.log('Game started...');
                console.log('Player 1 starts...: ', gameState.currentPlayer);


                //let playeratm = parseInt(gameState.currentPlayer, 10);

                //tell each client who's turn it is
                //broadcast(JSON.stringify({ type: 'first-move-player', currentplayer: gameState.currentPlayer, isp2ws: gameState.isp2ws }));


                //let only the current player make a move
                broadcast(JSON.stringify({ type: 'currentplayer-turn', currplayer: gameState.currentPlayer, checkws1: gameState.isp1ws, checkws2: gameState.isp2ws }));

            }
            else if (clientdata.type === 'game-fixed') {
                if (player1ws === ws) {

                    let getcurrentplayer = gameState.currentPlayer;

                    if (getcurrentplayer === 1) {
                        broadcast(JSON.stringify({ type: 'currentplayer-turn', currplayer: 1 }));
                    }
                }

            }
            else if (clientdata.type === 'player-1-move') {
                //handling the player's moves logic here
                //creating a function updateGameState which accepts the player id and coordinates clicked to update the game logic on the server-side
                //we return whether it was a hit or a miss and then re-draw the board accordingly 
                console.log('Player 1 made a move!');
                let p1move = clientdata.coordinates;
                console.log('player 1 move: ', p1move);
                gameState.p1coordinates.push(p1move);

                if (checkplayerWin(1, gameState.player1Board)) {
                    console.log('Player 1 won');

                    broadcast(JSON.stringify({ type: 'playerwins', playerwon: 1}));
                    return true;
                }
                else {
                    let p1moveupdate = updateGameState(1, p1move);

                    console.log('Checking p1ws status: ', gameState.isp1ws);
                    console.log('Checking p2ws status: ', gameState.isp2ws);

                    broadcast(JSON.stringify({ type: 'game-state-update-p1', updatedgame: p1moveupdate }));

                    broadcast(JSON.stringify({ type: 'currentplayer-turn', currplayer: gameState.currentPlayer }));
                }

                if (player2ws === null) {
                    console.log("WSID 2 NULL...11");
                }
                /*gameState.player1Board = clientdata.p1board;
                gameState.player2Board = clientdata.p2board;
                console.log('Player 1 Board: ', gameState.player1Board);
                console.log('Player 2 Board: ', gameState.player2Board);*/


            }
            else if (clientdata.type === 'player-2-move') {
                let p2move = clientdata.coordinates
                console.log('Player 2 made a move!');
                console.log('Player 2 move: ', p2move);
                gameState.p2coordinates.push(p2move);

                if (checkplayerWin(2, gameState.player2Board)) {
                    console.log('Player 2 won');

                    broadcast(JSON.stringify({ type: 'playerwins', playerwon: 2}));
                    return true;
                }
                else {
                    let p2moveupdate = updateGameState(2, p2move);

                    console.log('Checking p1ws status: ', gameState.isp1ws);
                    console.log('Checking p2ws status: ', gameState.isp2ws);

                    broadcast(JSON.stringify({ type: 'game-state-update-p2', updatedgame: p2moveupdate }));

                   broadcast(JSON.stringify({ type: 'currentplayer-turn', currplayer: gameState.currentPlayer }));

                }
            }
        }

    });

    function checkisClientJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (error) {
            return false;
        }
    }

    function updateGameState(playernum, coordinatesClicked) {
        if (player2ws === null) {
            console.log("WSID 2 NULL....13");
        }
        console.log('Updating the game state..');
        console.log('For Player Number: ', playernum);
        console.log('For coordinates: ', coordinatesClicked);

        let x = parseInt(coordinatesClicked[0]);
        let y = parseInt(coordinatesClicked[1]);

        console.log('x: ', x);
        console.log('y: ', y);

        //console.log('Board: ', gameState.player1Board);
        //console.log('Board 2: ', gameState.player2Board);

        console.log('CURRENT PLAYER: ', gameState.currentPlayer);

        //updating game state after player 1's move
        if (playernum === 1) {


            if (gameState.player2Board[y][x] === 0) {
                gameState.player2Board[y][x] = 3; // Mark as miss
                gameState.hit = false;
                gameState.miss = true;
            }
            else if (gameState.player2Board[y][x] === 1) {
                gameState.player2Board[y][x] = 2; // Mark as hit
                gameState.hit = true;
                gameState.miss = false;
            }

            //change the current player to be the other player
            gameState.currentPlayer = 2;


        }
        //updating game state after player 2's move
        else if (playernum === 2) {

            if (gameState.player1Board[y][x] === 0) {
                gameState.player1Board[y][x] = 3; // Mark as miss
                gameState.hit = false;
                gameState.miss = true;
            }
            else if (gameState.player1Board[y][x] === 1) {
                gameState.player1Board[y][x] = 2; // Mark as hit
                gameState.hit = false;
                gameState.miss = true;
            }

            gameState.currentPlayer = 1;
        }

        console.log('CURRENT PLAYER AFTER: ', gameState.currentPlayer);

        //return the entire gamestate object
        return gameState;

    }

    function checkplayerWin(playernum, board) {
        console.log('checking if player won');

        let count = 0;
        //let ships = 0;
        let win = false;

        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board.length; j++) {
                if (board[j][i] === 2) {
                    count++;
                }
            }
        }

        if (playernum === 1) {
            win = count === p1ships;
        }
        else if (playernum === 2) {
            win = count === p2ships;
        }

        return win;

    }

    ws.on('close', function close() {
        console.log('A Client Disconnected');

        let temparray = [];

        let disconnectedclient = ws;

        for (let i = 0; i < players.length; i++) {
            if (players[i] !== disconnectedclient) {
                temparray.push(players[i]);
            }
        }

        players = temparray;

        broadcast(JSON.stringify({ type: 'player-disconnected'}));
    
        //reset the Game State
        gameState.gameInProgress = false;

  

    });

});



app.use(express.static('public'));

const port = 3000;
bin.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
