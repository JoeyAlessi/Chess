import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { Server, Socket } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();


type Position = { row: number; col: number };
type PieceType = 'Pawn' | 'Rook' | 'Knight' | 'Bishop' | 'Queen' | 'King';
type ChessPiece = {
  type: PieceType;
  color: 'white' | 'black';
};

// Parse piece string to get type and color
const parsePiece = (piece: string | null): ChessPiece | null => {
  if (!piece) return null;
  
  const color = piece.startsWith('white') ? 'white' : 'black';
  let type: PieceType;
  
  if (piece.includes('Pawn')) type = 'Pawn';
  else if (piece.includes('Rook')) type = 'Rook';
  else if (piece.includes('Knight')) type = 'Knight';
  else if (piece.includes('Bishop')) type = 'Bishop';
  else if (piece.includes('Queen')) type = 'Queen';
  else type = 'King';
  
  return { type, color };
};

// Main move validation function
const isValidMove = (
  from: Position,
  to: Position,
  boardState: (string | null)[][],
  isWhiteTurn: boolean
): boolean => {
  const piece = boardState[from.row][from.col];
  
  // Basic validation
  if (!piece) return false;
  
  const isPieceWhite = piece.startsWith('white');
  if (isPieceWhite !== isWhiteTurn) return false;
  
  const targetPiece = boardState[to.row][to.col];
  if (targetPiece && targetPiece.startsWith(isPieceWhite ? 'white' : 'black')) {
    return false;
  }
  
  // Extract piece information
  const parsedPiece = parsePiece(piece);
  if (!parsedPiece) return false;
  
  // Check for valid movement based on piece type
  if (!isValidPieceMove(parsedPiece.type, from, to, boardState, isPieceWhite)) {
    return false;
  }
  
  // Make a copy of the board to test if the move would result in check
  const testBoard = boardState.map(row => [...row]);
  testBoard[to.row][to.col] = testBoard[from.row][from.col];
  testBoard[from.row][from.col] = null;
  
  // Don't allow moves that would put or leave the player in check
  if (isInCheck(testBoard, isPieceWhite)) {
    return false;
  }
  
  return true;
};

// Validate movement based on piece type
const isValidPieceMove = (
  pieceType: PieceType,
  from: Position,
  to: Position,
  boardState: (string | null)[][],
  isWhite: boolean
): boolean => {
  const dx = to.col - from.col;
  const dy = to.row - from.row;
  
  switch (pieceType) {
    case 'Pawn':
      return isValidPawnMove(from, to, dx, dy, boardState, isWhite);
    case 'Rook':
      return isValidRookMove(from, to, dx, dy, boardState);
    case 'Knight':
      return isValidKnightMove(dx, dy);
    case 'Bishop':
      return isValidBishopMove(from, to, dx, dy, boardState);
    case 'Queen':
      return isValidRookMove(from, to, dx, dy, boardState) || isValidBishopMove(from, to, dx, dy, boardState);
    case 'King':
      return isValidKingMove(dx, dy);
    default:
      return false;
  }
};

// Pawn movement validation
const isValidPawnMove = (
  from: Position,
  to: Position,
  dx: number,
  dy: number,
  boardState: (string | null)[][],
  isWhite: boolean
): boolean => {
  // Direction is different for white and black
  const direction = isWhite ? -1 : 1;
  const startRow = isWhite ? 6 : 1;
  
  // Regular move (1 square forward)
  if (dx === 0 && dy === direction && !boardState[to.row][to.col]) {
    return true;
  }
  
  // Initial double move
  if (dx === 0 && dy === 2 * direction && from.row === startRow &&
      !boardState[to.row][to.col] && !boardState[from.row + direction][from.col]) {
    return true;
  }
  
  // Capture diagonally
  if (Math.abs(dx) === 1 && dy === direction && boardState[to.row][to.col]) {
    return true;
  }
  
  
  return false;
};

// Rook movement validation
const isValidRookMove = (
  from: Position,
  to: Position,
  dx: number,
  dy: number,
  boardState: (string | null)[][]
): boolean => {
  // Rook moves horizontally or vertically
  if (dx !== 0 && dy !== 0) {
    return false;
  }
  
  // Check if path is clear
  return isPathClear(from, to, boardState);
};

// Knight movement validation
const isValidKnightMove = (dx: number, dy: number): boolean => {
  // Knight moves in L-shape: 2 squares in one direction and 1 in perpendicular
  return (Math.abs(dx) === 2 && Math.abs(dy) === 1) || 
         (Math.abs(dx) === 1 && Math.abs(dy) === 2);
};

// Bishop movement validation
const isValidBishopMove = (
  from: Position,
  to: Position,
  dx: number,
  dy: number,
  boardState: (string | null)[][]
): boolean => {
  // Bishop moves diagonally
  if (Math.abs(dx) !== Math.abs(dy)) {
    return false;
  }
  
  // Check if path is clear
  return isPathClear(from, to, boardState);
};

// King movement validation
const isValidKingMove = (dx: number, dy: number): boolean => {
  // King moves one square in any direction
  return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
  
  // TODO: Add castling logic
};

// Check if path between two positions is clear
const isPathClear = (
  from: Position,
  to: Position,
  boardState: (string | null)[][]
): boolean => {
  const dx = to.col - from.col;
  const dy = to.row - from.row;
  
  // Determine direction
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
  
  let currentRow = from.row + stepY;
  let currentCol = from.col + stepX;
  
  // Check each square in the path
  while (currentRow !== to.row || currentCol !== to.col) {
    if (boardState[currentRow][currentCol] !== null) {
      return false; // Path is blocked
    }
    currentRow += stepY;
    currentCol += stepX;
  }
  
  return true;
};

// Detect if a king is in check
const isInCheck = (
  boardState: (string | null)[][],
  isWhiteKing: boolean
): boolean => {
  // Find king position
  const kingPrefix = isWhiteKing ? 'white' : 'black';
  let kingPosition: Position | null = null;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (boardState[row][col] === `${kingPrefix}King`) {
        kingPosition = { row, col };
        break;
      }
    }
    if (kingPosition) break;
  }
  
  if (!kingPosition) return false;
  
  // Check if any opponent piece can capture the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      if (!piece) continue;
      
      const isPieceWhite = piece.startsWith('white');
      if (isPieceWhite === isWhiteKing) continue; // Skip own pieces
      
      const from = { row, col };
      const parsedPiece = parsePiece(piece);
      if (!parsedPiece) continue;
      
      // Check if this piece can move to the king's position (ignoring check rules)
      if (isValidPieceMove(parsedPiece.type, from, kingPosition, boardState, isPieceWhite)) {
        return true;
      }
    }
  }
  
  return false;
};

// Detect checkmate
const isCheckmate = (
  boardState: (string | null)[][],
  isWhiteTurn: boolean
): boolean => {
  // If not in check, can't be checkmate
  if (!isInCheck(boardState, isWhiteTurn)) {
    return false;
  }
  
  // Try every possible move for every piece
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = boardState[fromRow][fromCol];
      if (!piece) continue;
      
      const isPieceWhite = piece.startsWith('white');
      if (isPieceWhite !== isWhiteTurn) continue; // Skip opponent pieces
      
      // Try moving to every square
      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          const from = { row: fromRow, col: fromCol };
          const to = { row: toRow, col: toCol };
          
          // Check if move is valid (this includes check prevention)
          if (isValidMove(from, to, boardState, isWhiteTurn)) {
            return false; // Found a legal move, not checkmate
          }
        }
      }
    }
  }
  
  // No legal moves found and king is in check: checkmate
  return true;
};

// Type definitions
export type UserType = {
  id: number;
  email: string;
  username: string;
};

export type UserGameData = UserType & {
  socket: Socket;
};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url as string, true);
    handle(req, res, parsedUrl);
  });
  
  const io = new Server(server);


  // waiting queue
  let playerQueue: any[] = [];

  // active games
  const activeGames: {
    [roomId: string]: {
      whiteSocketId: string;
      blackSocketId: string;
      turn: "white" | "black";
      boardState: (string | null)[][];
      whitePlayerId: number,
      blackPlayerId: number
    };
  } = {};

  // connect to the websocket
  io.on('connection', (socket: Socket) => {
    console.log('A client connected:', socket.id);
    
    // listen for player that is searching for a game
    socket.on("searchForGame", async (userData: UserType) => {
      
      // add player to player Queue
      playerQueue.push({ socket, userData });

      if (playerQueue.length >= 2) {
        const player1 = playerQueue.shift();
        const player2 = playerQueue.shift();

        // create game in DB -> return uuid 
        const createGame = async () => {
          try {
            const response = await fetch("http://localhost:3000/api/create-game", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                player_one: player1.userData, 
                player_two: player2.userData 
              })
            });

            if (!response.ok) {
              
              throw new Error("Failed to create game");
            }
            
            const { gameData } = await response.json();
            return gameData;
          } catch (error) {
              console.error("Error creating game:", error);
              player1.socket.emit("gameError", { message: "Failed to create game" });
              player2.socket.emit("gameError", { message: "Failed to create game" });
              return null;
          }
        };

        const gameData = await createGame();
        
        if (!gameData) return;

        // notify both player of game 
        player1.socket.emit("gameFound", {
          opponent: player2.userData, 
          gameInfo: gameData,
          isWhitePlayer: gameData.whitePlayerId === player1.userData.id,
          currentTurn: "white"
        });
        
        player2.socket.emit("gameFound", {
          opponent: player1.userData, 
          gameInfo: gameData,
          isWhitePlayer: gameData.whitePlayerId === player2.userData.id,
          currentTurn: "white"
        });

        const roomId = gameData.id;

        // initial board state
        const initialBoard = [
          ["blackRook", "blackKnight", "blackBishop", "blackQueen", "blackKing", "blackBishop", "blackKnight", "blackRook"],
          ["blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn"],
          [null, null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null, null],
          ["whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn"],
          ["whiteRook", "whiteKnight", "whiteBishop", "whiteQueen", "whiteKing", "whiteBishop", "whiteKnight", "whiteRook"]
        ];

        // keep track of game state
        activeGames[roomId] = {
          whiteSocketId: gameData.whitePlayerId === player1.userData.id ? player1.socket.id : player2.socket.id,
          blackSocketId: gameData.blackPlayerId === player2.userData.id ? player2.socket.id: player1.socket.id,
          turn: "white",
          boardState: initialBoard,
          whitePlayerId: gameData.whitePlayerId,
          blackPlayerId: gameData.blackPlayerId
        };


        // notify players whose turn it is
        io.to(roomId).emit("turnUpdate", { turn: "white" });
      }
    });

    socket.on("joinRoom", ({ roomId, userId }) => {

      if (activeGames[roomId]) {
        socket.join(roomId);

        // update black and white socket every time you join ( can be rejoining )
        if (userId === activeGames[roomId].whitePlayerId && socket.id !== activeGames[roomId].whiteSocketId) {
          activeGames[roomId].whiteSocketId = socket.id

        }
        else if (userId === activeGames[roomId].blackPlayerId && socket.id !== activeGames[roomId].blackSocketId) {
          activeGames[roomId].blackSocketId = socket.id
        }

        // game may be in check
        const currentTurn = activeGames[roomId].turn;
        const isCurrentTurnWhite = currentTurn === "white";

        if (isInCheck(activeGames[roomId].boardState, isCurrentTurnWhite)) {
      
          io.to(roomId).emit("check", { 
            player: currentTurn,
            inCheck: true
          });
        
        } else {
        
          io.to(roomId).emit("check", { 
            player: currentTurn,
            inCheck: false
          });
        }

        socket.emit("roomJoined", { roomId, success: true, gameData: activeGames[roomId]}); 

      } else {

        socket.emit("roomJoined", { success: false, message: "Room not found" });
      }
    });
    
    // process player moves
    socket.on("makeMove", async ({ roomId, move }) => {
      const game = activeGames[roomId];

      if (!game) {
        socket.emit("invalidMove", { reason: "Game not found." });
        return;
      }
    
      const currentTurn = game.turn;
      const isWhite = socket.id === game.whiteSocketId;
      const isBlack = socket.id === game.blackSocketId;
      
    
      // check if its the players turn
      if ((currentTurn === "white" && !isWhite) || (currentTurn === "black" && !isBlack)) {

        socket.emit("invalidMove", { reason: "Not your turn." });
        return;
      }
      
      const { from, to } = move;
      
      // validate move using the full chess validation
      const isWhiteTurn = currentTurn === "white";

      if (!isValidMove(from, to, game.boardState, isWhiteTurn)) {
        socket.emit("invalidMove", { reason: "Invalid chess move."});
        return;
      }
      
      // update server board state
      const piece = game.boardState[from.row][from.col];
      game.boardState[to.row][to.col] = piece;
      game.boardState[from.row][from.col] = null;

      // broadcast the move to all players in the room
      io.to(roomId).emit("opponentMove", move);

      // update the board
      io.to(roomId).emit("boardUpdate", { boardState: game.boardState });

      // determine next turn information
      const nextTurn = currentTurn === "white" ? "black" : "white";
      const isNextTurnWhite = nextTurn === "white";

      if (isInCheck(game.boardState, isNextTurnWhite)) {
        // check for checkmate
        if (isCheckmate(game.boardState, isNextTurnWhite)) {
          io.to(roomId).emit("gameOver", { 
            winner: currentTurn, 
            reason: "checkmate"
          });


          // remove game + players
          playerQueue = playerQueue.filter(player => player.socket.id !== socket.id);
          for (const roomId in activeGames) {
            const game = activeGames[roomId];
    
            if (socket.id === game.whiteSocketId || socket.id === game.blackSocketId) {
              io.to(roomId).emit("playerDisconnected", { 
                message: "Your opponent has disconnected"
              });
              
              // remove game once over
              delete activeGames[roomId];
            }
          }

          // add result to the database
          const winnerId = currentTurn === "white" ? game.whitePlayerId : game.blackPlayerId

          const updateGameData = async () => {
            try {
              const response = await fetch("http://localhost:3000/api/update-game", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  roomId: roomId,
                  winnerId: winnerId, 
                })
              });
  
              if (!response.ok) {
                
                throw new Error("Failed to update game");
              }
              
            } catch (error) {
   
            }
          };

          updateGameData(); // update DB


          return;
        }
        

        io.to(roomId).emit("check", { 
          player: nextTurn,
          inCheck: true
        });
        
        // swap turns
        game.turn = nextTurn;
        io.to(roomId).emit("turnUpdate", { turn: game.turn });

        // add STALEMATE check (TODO)
      } else {
       
        io.to(roomId).emit("check", { 
          player: nextTurn,
          inCheck: false
        });
        
        // swap turns
        game.turn = nextTurn;
        io.to(roomId).emit("turnUpdate", { turn: game.turn });
      }
    })
    
    // handle disconnects (TODO) only delete game when someone wins/ draw happens/ or resign
    socket.on('disconnect', () => { 
    //   console.log('A client disconnected:', socket.id);
      
    //   playerQueue = playerQueue.filter(player => player.socket.id !== socket.id);
      
    //   // check if player was already in game
    //   for (const roomId in activeGames) {
    //     const game = activeGames[roomId];

    //     if (socket.id === game.whiteSocketId || socket.id === game.blackSocketId) {
    //       io.to(roomId).emit("playerDisconnected", { 
    //         message: "Your opponent has disconnected"
    //       });
          
    //       // remove game once over
    //       delete activeGames[roomId];
    //     }
    //   }
    });
  });

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});