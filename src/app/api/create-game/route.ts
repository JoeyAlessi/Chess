import { randomUUID } from "crypto";
import { db } from "../../../db/index"
import { gameTable } from "../../../db/schema"; 
import { NextResponse } from "next/server";

export async function POST(request: Request) {

try {

  const {player_one, player_two } = await request.json()

  // ensure both players exist
  if (!player_one || !player_two) {
    return NextResponse.json( {message:"Both players are required"}, { status: 400 });
  }

  // randomize white and black assignment
  const players = [player_one, player_two]
  const [whitePlayer, blackPlayer] = players.sort(() => Math.random() - 0.5)

  const [newGame] = await db.insert(gameTable).values({
    
    whitePlayerId: whitePlayer.id,
    blackPlayerId: blackPlayer.id,
    winnerId: null // will become integer once someone wins

  }).returning()

  return NextResponse.json(
    { message: "Game created successfully." ,
      gameData: newGame
    },
    
    { status: 201 }
  )

      } catch (error) {

        console.error("Error creating game:", error);
        return NextResponse.json( {message:"Internal server error."}, { status: 500 });
      }
    }
