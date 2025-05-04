import { NextRequest, NextResponse } from "next/server";
import { eq, desc, or, isNotNull, and } from 'drizzle-orm';
import { gameTable, usersTable } from '../../../db/schema';
import { db } from "../../../db/index"
import  * as Util from "@/lib/utils";

export async function GET(request: NextRequest) {

    try {

        const token = request.cookies.get("sessionid")?.value
        
        if (!token) {
            return NextResponse.json({error: "No token found" }, { status: 401 });
        }
    
        const payload  = Util.JWTUtil.decode(token);
    
        // fetch user data
        const [userData] = await db.select({
            email: usersTable.email,
            username: usersTable.username,
            id: usersTable.id
        }).from(usersTable).where(eq(usersTable.email, payload.email));


        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }


        // get 10 most recent games
        const recentGames = await db.select().from(gameTable)
            .where(
                and(
                    or(
                        eq(gameTable.whitePlayerId, userData.id),
                        eq(gameTable.blackPlayerId, userData.id)
                    ),
                    isNotNull(gameTable.winnerId)
                )
            )
            .orderBy(desc(gameTable.createdAt))
            .limit(10);


            const gamesWithOpponents = await Promise.all(recentGames.map(async (game) => {
             
                const isWhitePlayer = game.whitePlayerId === userData.id;
                
           
                const opponentId = isWhitePlayer ? game.blackPlayerId : game.whitePlayerId;
                
                // find opponents username
                const [opponent] = await db
                    .select({ username: usersTable.username })
                    .from(usersTable)
                    .where(eq(usersTable.id, opponentId));
                    
          
                const result = game.winnerId === userData.id ? "Win" : "Loss";
                
                return {
                    ...game,
                    opponent: opponent?.username || "Unknown",
                    result: result
                };
            }));

        return NextResponse.json({ message: "Successfully found most recent games." , games: gamesWithOpponents },  { status: 200 });


    }

    catch {


    }
}