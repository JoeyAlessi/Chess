import { NextRequest, NextResponse } from "next/server";
import { eq } from 'drizzle-orm';
import { gameTable, usersTable } from '../../../db/schema';
import { db } from "../../../db/index"
import  * as Util from "@/lib/utils";

export async function GET(request: NextRequest) {

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
        return NextResponse.json({error: "No roomId found" }, { status: 401 });
    }

    // this was just verified from /api/verify-status
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


    // confirm user exists
    if (!userData) {

        return NextResponse.json({ 
            authenticated: false, 
            error: "User not found in database" }, { status: 404 });
    }

    // confirm userData.id == whitePlayerID or blackPlayerID

    const [game] = await db.select({
        blackPlayerId: gameTable.blackPlayerId,
        whitePlayerId: gameTable.whitePlayerId

    }).from(gameTable).where(eq(gameTable.id, roomId));


    if (userData.id === game.blackPlayerId || userData.id === game.whitePlayerId) {

        return NextResponse.json({
            authenticated: true,
            message: "User is a valid player in this game",
            playerId: userData.id,
            whitePlayer: userData.id === game.whitePlayerId,
            blackPlayer: userData.id === game.blackPlayerId,
            roomId,
            userId: userData.id
            }, { status: 200 });
    } else {
            
        return NextResponse.json({
            authenticated: false,
            error: "User is not a player in this game"
            }, { status: 403 });
    }



}