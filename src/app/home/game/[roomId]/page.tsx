"use client";

import { ChessBoard } from "@/components/Board";
import { ModeToggle } from "@/components/ModeToggle";
import { useAuthCheck } from "@/lib/hooks";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import loadingGif from "@/assets/loading.gif";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getSocket } from "@/lib/socket";

export default function GameRoom() {
  const router = useRouter();
  const { roomId } = useParams(); // get room ID
  const [isVerifiedPlayer, setIsVerifiedPlayer] = useState<boolean>(false);
  const [isWhitePlayer, setIsWhitePlayer] = useState<boolean>(false);
  const [turn, setTurn] = useState<"white" | "black">("white");
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>(
    []
  );
  const [selectedSquare, setSelectedSquare] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [isInCheck, setIsInCheck] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);

  const initialBoard: (string | null)[][] = [
    [
      "blackRook",
      "blackKnight",
      "blackBishop",
      "blackQueen",
      "blackKing",
      "blackBishop",
      "blackKnight",
      "blackRook",
    ],
    [
      "blackPawn",
      "blackPawn",
      "blackPawn",
      "blackPawn",
      "blackPawn",
      "blackPawn",
      "blackPawn",
      "blackPawn",
    ],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [
      "whitePawn",
      "whitePawn",
      "whitePawn",
      "whitePawn",
      "whitePawn",
      "whitePawn",
      "whitePawn",
      "whitePawn",
    ],
    [
      "whiteRook",
      "whiteKnight",
      "whiteBishop",
      "whiteQueen",
      "whiteKing",
      "whiteBishop",
      "whiteKnight",
      "whiteRook",
    ],
  ];

  const [boardState, setBoardState] =
    useState<(string | null)[][]>(initialBoard);

  const { isLoading } = useAuthCheck();
  const user = useSelector((state: RootState) => state.user);

  const socket = getSocket(); // get user's socket

  // funciton to check if it's the players turn
  const isMyTurn = () => {
    return (
      (turn === "white" && isWhitePlayer) ||
      (turn === "black" && !isWhitePlayer)
    );
  };

  const fetchValidMoves = (row: number, col: number) => {
    const piece = boardState[row][col];
    if (!piece) {
      setValidMoves([]);
      return;
    }

    // Basic piece movement rules
    const possibleMoves: { row: number; col: number }[] = [];
    const isPieceWhite = piece.startsWith("white");

    // For Pawns
    if (piece.includes("Pawn")) {
      const direction = isPieceWhite ? -1 : 1;
      const startRow = isPieceWhite ? 6 : 1;

      // Forward one square
      if (row + direction >= 0 && row + direction < 8) {
        if (!boardState[row + direction][col]) {
          possibleMoves.push({ row: row + direction, col });

          // Initial double move
          if (row === startRow && !boardState[row + 2 * direction][col]) {
            possibleMoves.push({ row: row + 2 * direction, col });
          }
        }

        // Captures diagonally
        if (col - 1 >= 0) {
          const targetPiece = boardState[row + direction][col - 1];
          if (
            targetPiece &&
            targetPiece.startsWith(isPieceWhite ? "black" : "white")
          ) {
            possibleMoves.push({ row: row + direction, col: col - 1 });
          }
        }

        if (col + 1 < 8) {
          const targetPiece = boardState[row + direction][col + 1];
          if (
            targetPiece &&
            targetPiece.startsWith(isPieceWhite ? "black" : "white")
          ) {
            possibleMoves.push({ row: row + direction, col: col + 1 });
          }
        }
      }
    }

    // For Rooks (and Queen's rook-like moves)
    if (piece.includes("Rook") || piece.includes("Queen")) {
      // Horizontal and vertical moves
      const directions = [
        { dr: -1, dc: 0 }, // up
        { dr: 1, dc: 0 }, // down
        { dr: 0, dc: -1 }, // left
        { dr: 0, dc: 1 }, // right
      ];

      for (const dir of directions) {
        let r = row + dir.dr;
        let c = col + dir.dc;

        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const targetPiece = boardState[r][c];
          if (!targetPiece) {
            possibleMoves.push({ row: r, col: c });
          } else {
            if (targetPiece.startsWith(isPieceWhite ? "black" : "white")) {
              possibleMoves.push({ row: r, col: c });
            }
            break; // Can't move through pieces
          }
          r += dir.dr;
          c += dir.dc;
        }
      }
    }

    // For Bishops (and Queen's bishop-like moves)
    if (piece.includes("Bishop") || piece.includes("Queen")) {
      // Diagonal moves
      const directions = [
        { dr: -1, dc: -1 }, // up-left
        { dr: -1, dc: 1 }, // up-right
        { dr: 1, dc: -1 }, // down-left
        { dr: 1, dc: 1 }, // down-right
      ];

      for (const dir of directions) {
        let r = row + dir.dr;
        let c = col + dir.dc;

        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const targetPiece = boardState[r][c];
          if (!targetPiece) {
            possibleMoves.push({ row: r, col: c });
          } else {
            if (targetPiece.startsWith(isPieceWhite ? "black" : "white")) {
              possibleMoves.push({ row: r, col: c });
            }
            break; // Can't move through pieces
          }
          r += dir.dr;
          c += dir.dc;
        }
      }
    }

    // For Knights
    if (piece.includes("Knight")) {
      const knightMoves = [
        { dr: -2, dc: -1 },
        { dr: -2, dc: 1 },
        { dr: -1, dc: -2 },
        { dr: -1, dc: 2 },
        { dr: 1, dc: -2 },
        { dr: 1, dc: 2 },
        { dr: 2, dc: -1 },
        { dr: 2, dc: 1 },
      ];

      for (const move of knightMoves) {
        const r = row + move.dr;
        const c = col + move.dc;

        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const targetPiece = boardState[r][c];
          if (
            !targetPiece ||
            targetPiece.startsWith(isPieceWhite ? "black" : "white")
          ) {
            possibleMoves.push({ row: r, col: c });
          }
        }
      }
    }

    // For King
    if (piece.includes("King")) {
      const kingMoves = [
        { dr: -1, dc: -1 },
        { dr: -1, dc: 0 },
        { dr: -1, dc: 1 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
        { dr: 1, dc: -1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 },
      ];

      for (const move of kingMoves) {
        const r = row + move.dr;
        const c = col + move.dc;

        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const targetPiece = boardState[r][c];
          if (
            !targetPiece ||
            targetPiece.startsWith(isPieceWhite ? "black" : "white")
          ) {
            possibleMoves.push({ row: r, col: c });
          }
        }
      }
    }

    setValidMoves(possibleMoves);
  };

  const isMyPiece = (piece: string | null) => {
    if (!piece) return false;
    return (
      (isWhitePlayer && piece.startsWith("white")) ||
      (!isWhitePlayer && piece.startsWith("black"))
    );
  };

  const handleSquareClick = (row: number, col: number) => {
    const clickedPiece = boardState[row][col];

    // Case 1: No piece selected yet
    if (!selectedSquare) {
      if (isMyTurn() && isMyPiece(clickedPiece)) {
        setSelectedSquare({ row, col });
        fetchValidMoves(row, col);
      }
      return;
    }

    const from = selectedSquare;
    const to = { row, col };

    // Case 2: Click on same square to deselect
    if (from.row === to.row && from.col === to.col) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // Case 3: Click on another one of your pieces to select it instead
    if (isMyPiece(clickedPiece)) {
      setSelectedSquare({ row, col });
      fetchValidMoves(row, col);
      return;
    }

    // Case 4: Click on a valid destination square
    if (isMyTurn()) {
      // Check if the clicked square is in validMoves
      const isValidMove = validMoves.some(
        (move) => move.row === to.row && move.col === to.col
      );

      if (!isValidMove) {
        return;
      }

      const move = { from, to };

      // send move to server
      if (socket && roomId) {
        socket.emit("makeMove", { roomId, move });
      }
    }

    setSelectedSquare(null);
    setValidMoves([]);
  };

  // verify player
  useEffect(() => {
    const verifyPlayer = async () => {
      setIsVerifiedPlayer(false);
      try {
        const response = await fetch(`/api/verify-player?roomId=${roomId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          // send to main page
          router.push("/home");
        } else {
          const data = await response.json();
          setIsWhitePlayer(data.whitePlayer);
          setIsVerifiedPlayer(true);

          const userId = data.userId;

          // connect to the room
          if (socket && roomId) {
            isMyTurn();
            socket.emit("joinRoom", { roomId, userId });
          }
        }
      } catch (error) {
        console.error("Error verifying player:", error);
        router.push("/home");
      }
    };

    verifyPlayer();

    // socket listeners
    if (socket) {
      socket.on("roomJoined", (data) => {
        if (data.success) {
          const gameState = data.gameData; // game information

          if (gameState) {
            // update local game info based on server
            setBoardState(gameState.boardState);
            setTurn(gameState.turn);
          }
        } else {
          // if no game, redirct to main page
          router.push("/home");
        }
      });

      socket.on("gameOver", ({ winner, reason }) => {
        setGameOver(true);
        setWinner(winner);
      });

      // listen for check
      socket.on("check", ({ player, inCheck }) => {
        const myColor = isWhitePlayer ? "white" : "black";

        if (player === myColor) {
          setIsInCheck(inCheck);
        } else {
          setIsInCheck(false);
        }
      });

      // listen for turn updates
      socket.on("turnUpdate", ({ turn }: { turn: "white" | "black" }) => {
        setTurn(turn);
      });

      socket.on("boardUpdate", ({ boardState }) => {
        setBoardState(boardState);
      });

      // listen for opponents move
      socket.on("opponentMove", (move) => {
        const { from, to } = move;

        // update board based on opponents move made
        setBoardState((prevBoard) => {
          const newBoard = prevBoard.map((row) => [...row]);
          newBoard[to.row][to.col] = newBoard[from.row][from.col];
          newBoard[from.row][from.col] = null;
          return newBoard;
        });
      });

      // listen for possible invalid moves made
      socket.on("invalidMove", ({ reason }) => {
        console.error("Invalid move:", reason);
      });
    }

    // clean up
    return () => {
      if (socket) {
        socket.off("check");
        socket.off("gameOver");
        socket.off("boardUpdate");
        socket.off("turnUpdate");
        socket.off("opponentMove");
        socket.off("invalidMove");
        socket.off("roomJoined");
        socket.off("connect");
      }
    };
  }, [roomId, router, socket, isWhitePlayer]);

  if (isLoading || !isVerifiedPlayer) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <img src={loadingGif.src} alt="Loading..." className="w-20 h-20" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-row justify-between px-4 pt-4">
        <div className="text-lg font-bold">
          {gameOver
            ? `Game Over - ${winner === "white" ? "White" : "Black"} wins!`
            : `${isMyTurn() ? "Your turn" : "Opponent's turn"} (${
                turn === "white" ? "White" : "Black"
              })`}
          {isInCheck && !gameOver && (
            <span className="ml-2 text-red-500">You are in Check!</span>
          )}
        </div>
        <ModeToggle />
      </div>

      <div className="flex flex-grow items-center justify-center">
        <ChessBoard
          boardState={boardState}
          isWhitePlayer={isWhitePlayer}
          onSquareClick={handleSquareClick}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
        />
      </div>
      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {winner === (isWhitePlayer ? "white" : "black")
                ? "You Won!"
                : "You Lost!"}
            </h2>
            <p>Game over by checkmate</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => router.push("/home")}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
