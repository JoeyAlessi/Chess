import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export async function POST() {

    try {
      
        const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    
        response.cookies.set("sessionid", "", {
          path: "/",
          httpOnly: true,
          maxAge: 0, 
          expires: -1,
          // sameSite: "none",
        });
    
        return response;

      } catch (error) {
        console.error("Error logging out:", error);

        return NextResponse.json({ error: "Error logging out" }, { status: 500 });


      }
    }
