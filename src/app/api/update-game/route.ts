import { NextResponse } from "next/server";
import { eq } from 'drizzle-orm';
import { gameTable, usersTable } from '../../../db/schema';
import { db } from "../../../db/index"


export async function PUT(request: Request) {

    try {

        const {roomId, winnerId} = await request.json()


        if (!roomId || !winnerId) {

            return NextResponse.json(
                { message: 'Missing required fields: roomId and winnerId' },
                { status: 400 }
            );
        }

        const [game] = await db.select().from(gameTable).where(eq(gameTable.id, roomId))

        if (!game) {
            return NextResponse.json(
                { message: 'Game not found' },
                { status: 404 }
            );
        }


        if (winnerId !== game.whitePlayerId && winnerId !== game.blackPlayerId) {
            return NextResponse.json(
                { message: 'Invalid winnerId: winner must be one of the players in the game' },
                { status: 400 }
            );
        }

        // update the table with winners ID
        const [updatedGame] = await db
        .update(gameTable)
        .set({
            winnerId: winnerId,
            updatedAt: new Date()
        })
        .where(eq(gameTable.id, roomId))
        .returning();


        return NextResponse.json({
            message: 'Game winner updated successfully',
            game: updatedGame
        }, { status: 200 });



    }
    catch (error){

        console.error('Error updating game winner:', error);
        
        return NextResponse.json(
            { message: 'Failed to update game winner', error: String(error) },
            { status: 500 } );

    }
}
