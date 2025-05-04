import { NextResponse } from "next/server";
import { eq } from 'drizzle-orm';
import { usersTable } from '../../../db/schema';
import { db } from "../../../db/index"
import  * as Util from "@/lib/utils";
import { use } from "react";



export async function POST(request: Request) {

  const passwordRequirements = {
    minLength: 8,
    maxLength: 24,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /\d/,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
  };

  const usernameRequirements = {
    minLength: 4,
    maxLength: 12,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
  };

  try {

    const { email, password, username } = await request.json();

    if (!email || !password || !email) {
      return NextResponse.json(
        { error: "All fields must be filled out." },
        { status: 400 }
      );
    }

    // testing password validity

    if (password.length < passwordRequirements.minLength) {

      return NextResponse.json(
       { error: "Password must be at least 8 characters long." },
       { status: 400 }
      )
    }
    
    if (password.length > passwordRequirements.maxLength) {

      return NextResponse.json(
        { error: "Password must be 24 or less characters long." },
        { status: 400 }
      )
    }

    if (!passwordRequirements.hasUppercase.test(password)) {

      return NextResponse.json(
        { error: "Password must contain an uppercase letter."},
        { status: 400 }
      )
    }

    if (!passwordRequirements.hasLowercase.test(password)) {

      return NextResponse.json(
        { error: "Password must contain a lowercase letter."} ,
        { status: 400 }
      )
    }

    if (!passwordRequirements.hasNumber.test(password)) {

      return NextResponse.json(
        { error: "Password must contain a number."},
        { status: 400}
      )
    }

    if (!passwordRequirements.hasSpecialChar.test(password)) {

      return NextResponse.json(
        { error: "Password must contain a special character"},
        { status: 400}
      )
    }

    // testing email 
    const potential_email = await db.select().from(usersTable).where(eq(usersTable.email, email))

    if (potential_email.length !== 0) {
      return NextResponse.json(
        {
          error: "An account with this email already exists."
        },
        {
          status: 409
        }
      )
    }

    // testing username
    const potential_username = await db.select().from(usersTable).where(eq(usersTable.username, username))

    if (potential_username.length !== 0) {
      return NextResponse.json(
        {
          error: "An account with this username already exists."
        },
        {
          status: 409
        }
      )
    }

    if (usernameRequirements.hasSpecialChar.test(username)) {

      return NextResponse.json(
        { error: "Username must not contain a special character."},
        { status: 400}
      )
    }

    if (username.length < usernameRequirements.minLength) {

      return NextResponse.json(
        { error: "Username must be at least 5 characters long."},
        { status: 400}
      )
    }

    if (username.length > usernameRequirements.maxLength) {

      return NextResponse.json(
        { error: "Username must be 12 or less characters long."},
        { status: 400}
      )
    }

    await db.insert(usersTable).values({email, password, username})

    // create token

    const payload = {
      email: email,
      role: "user",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 1440, // expires in one day
    };

    const token = Util.JWTUtil.encode(payload, process.env.SECRET_TOKEN!)

    const response = NextResponse.json(
      { message: "Account created successfully!" },
      { status: 201 }
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

    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
