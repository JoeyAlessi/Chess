import { NextResponse } from "next/server";
import { eq } from 'drizzle-orm';
import { usersTable } from '../../../db/schema';
import { db } from "../../../db/index"
import  * as Util from "@/lib/utils";


export async function POST(request: Request) {

  try {
    const {email, password} = await request.json()

    if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required." },
          { status: 400 }
        );
      }

    const user = await db.select().from(usersTable).where(eq(usersTable.email, email))

      // hash password later (TODO)
    if (user.length === 0 || user[0].password !== password) {
        return NextResponse.json(
            {error: "Incorrect email or password"},
            {status: 401}
        )

    }

    // create token
    
    const payload = {
      email: email,
      role: "user",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 1440, // expires in one day
    };

    const token = Util.JWTUtil.encode(payload, process.env.SECRET_TOKEN!)

    const response = NextResponse.json(
      { message: "Logged in successfully." ,
      },
      { status: 202 }
    );

    response.cookies.set("sessionid", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, 
      // sameSite: "none"
    });

    return response;

  } catch (error) {
    console.error("Error loggin in:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
