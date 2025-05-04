"use client";
import React from "react";

import whitePawn from "@/assets/White_Pawn.png";
import blackPawn from "@/assets/Black_Pawn.png";
import whiteRook from "@/assets/White_Rook.png";
import blackRook from "@/assets/Black_Rook.png";
import whiteKnight from "@/assets/White_Knight.png";
import blackKnight from "@/assets/Black_Knight.png";
import whiteBishop from "@/assets/White_Bishop.png";
import blackBishop from "@/assets/Black_Bishop.png";
import whiteQueen from "@/assets/White_Queen.png";
import blackQueen from "@/assets/Black_Queen.png";
import whiteKing from "@/assets/White_King.png";
import blackKing from "@/assets/Black_King.png";

const pieceImages: { [key: string]: string } = {
  whitePawn: whitePawn.src,
  whiteRook: whiteRook.src,
  whiteKnight: whiteKnight.src,
  whiteBishop: whiteBishop.src,
  whiteQueen: whiteQueen.src,
  whiteKing: whiteKing.src,
  blackPawn: blackPawn.src,
  blackRook: blackRook.src,
  blackKnight: blackKnight.src,
  blackBishop: blackBishop.src,
  blackQueen: blackQueen.src,
  blackKing: blackKing.src,
};

interface ChessBoardProps {
  boardState?: (string | null)[][];
  isWhitePlayer?: boolean;
  onSquareClick?: (row: number, col: number) => void;
  selectedSquare?: {
    row: number;
    col: number;
  } | null;
  validMoves?: { row: number; col: number }[];
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  boardState,
  isWhitePlayer,
  onSquareClick,
  selectedSquare,
  validMoves = [],
}) => {
  if (!boardState) {
    return (
      <div className="w-full max-w-[80vh] mx-auto grid grid-cols-8 aspect-square border-8 border-gray-800">
        {Array.from({ length: 64 }, (_, i) => (
          <div
            key={i}
            className={`aspect-square flex items-center justify-center ${
              (Math.floor(i / 8) + (i % 8)) % 2 === 0
                ? "bg-gray-300 dark:bg-gray-600"
                : "bg-gray-800 dark:bg-gray-400"
            }`}
          />
        ))}
      </div>
    );
  }

  // check if a location is valid for a given piece
  const isValidMove = (row: number, col: number) => {
    return validMoves.some((move) => move.row === row && move.col === col);
  };

  const renderBoard = () => {
    const rows = [...Array(8)].map((_, i) => i);
    const cols = [...Array(8)].map((_, i) => i);

    const displayRows = isWhitePlayer ? rows : [...rows].reverse();
    const displayCols = isWhitePlayer ? cols : [...cols].reverse();

    return (
      <>
        {displayRows.map((displayRow) => (
          <React.Fragment key={`row-${displayRow}`}>
            {displayCols.map((displayCol) => {
              const actualRow = isWhitePlayer ? displayRow : 7 - displayRow;
              const actualCol = isWhitePlayer ? displayCol : 7 - displayCol;

              const piece = boardState[actualRow][actualCol];
              const isSelected =
                selectedSquare &&
                selectedSquare.row === actualRow &&
                selectedSquare.col === actualCol;

              const isValidMovePosition = isValidMove(actualRow, actualCol);
              const isLightSquare = (actualRow + actualCol) % 2 === 0;

              return (
                <div
                  key={`${displayRow}-${displayCol}`}
                  onClick={() => onSquareClick!(actualRow, actualCol)}
                  className={`aspect-square flex items-center justify-center cursor-pointer relative
                    ${isSelected ? "ring-4 ring-yellow-400" : ""}
                    ${
                      isLightSquare
                        ? "bg-gray-300 dark:bg-gray-600"
                        : "bg-gray-800 dark:bg-gray-400"
                    }
                  `}
                >
                  {/* indiciate whether a location is valid */}
                  {isValidMovePosition && (
                    <div
                      className={`absolute ${
                        piece
                          ? "w-full h-full ring-4 ring-green-500 ring-opacity-70 z-10"
                          : "w-1/3 h-1/3 rounded-full bg-green-500 opacity-70 z-10"
                      }`}
                    ></div>
                  )}

                  {piece && (
                    <img
                      src={pieceImages[piece]}
                      alt={piece}
                      className="w-full h-full object-contain p-1 pointer-events-none z-20"
                    />
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div className="w-full max-w-[80vh] mx-auto grid grid-cols-8 aspect-square border-8 border-gray-800">
      {renderBoard()}
    </div>
  );
};
