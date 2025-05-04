import { twMerge } from "tailwind-merge"
import clsx, { ClassValue } from "clsx";
import jwt from "jsonwebtoken"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export enum HttpStatusCode {

  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  
  
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
}

interface JWTHeader {
  alg: string;
  typ: string;
}

interface JWTPayload {

  // Common JWT claims
  iss?: string;  // Issuer
  sub?: string;  // Subject
  aud?: string;  // Audience
  exp?: number;  // Expiration Time
  nbf?: number;  // Not Before
  iat?: number;  // Issued At
  jti?: string;  // JWT ID
  [key: string]: any;  // Allow additional custom claims
}

export const JWTUtil = {
  
  encode: (payload: JWTPayload, secret: string): string => {
    return jwt.sign(payload, secret);
  },

  decode: <T extends JWTPayload>(token: string): T => {
    try {
      return jwt.decode(token) as T;
    } catch (error) {
      throw new Error('Failed to decode JWT: ' + (error as Error).message);
    }
  },

  verify: (token: string, secret: string): boolean => {
    try {
      jwt.verify(token, secret);
      return true;
    } catch {
      return false;
    }
  },

  isExpired: (token: string): boolean => {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded.exp) return false;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }
};

// custom types

import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export interface GamePlayer {
  id: string;
  username: string;
  socketId?: string;
}

export interface GameState {
  gameId: string;
  players: GamePlayer[];
  currentTurn: string;
  board: any; 
  moves: any[]; 
}

export interface ChessMovePayload {
  from: string;
  to: string;
  piece: string;
  promotion?: string;
}