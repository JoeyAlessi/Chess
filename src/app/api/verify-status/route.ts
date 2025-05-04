import { NextRequest, NextResponse } from "next/server";
import  {JWTUtil} from "@/lib/utils";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";


export async function GET(request: NextRequest) {

    try {

        const token = request.cookies.get("sessionid")?.value
        
        if (!token) {
            return NextResponse.json({ authenticated: false, error: "No token found" }, { status: 401 });
        }

        // check validity
        if (JWTUtil.isExpired(token)) {
            return NextResponse.json({ authenticated: false, error: "Token expired" }, { status: 401 });
        }

        const isValid = JWTUtil.verify(token, process.env.SECRET_TOKEN!)

        if (!isValid) {
            return NextResponse.json({ authenticated: false, error: "Invalid token" }, { status: 403 });
        }


        const payload  = JWTUtil.decode(token);

        // fetch user data
        const userData = await db.select({
            email: usersTable.email,
            username: usersTable.username,
            id: usersTable.id
          }).from(usersTable).where(eq(usersTable.email, payload.email));

        // // make sure user exists
        if (!userData || userData.length === 0) {

            return NextResponse.json({ 
                authenticated: false, 
                error: "User not found in database" }, { status: 404 });
        }

        return NextResponse.json({
        authenticated: true, 
        user: {
            email: userData[0].email,
            username: userData[0].username,
            id: userData[0].id
        }
        }, { status: 200 });

    }
    catch (error) {
        console.log("ERROR:", error)
        return NextResponse.json({ authenticated: false, error: "Authentication failed" }, { status: 403 });
    }
}