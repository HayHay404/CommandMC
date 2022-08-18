import { PrismaClient } from "@prisma/client";
/* 
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config({path: "../.env"})

let connectionString = "postgresql:///commandmcdb";
if (process.env.NODE_ENV !== "dev") {
    connectionString = process.env["POSTGRES_URI"] as string;
}

export const db = new Client({connectionString});

db.connect() 
*/

export const db = new PrismaClient();

db.user.create({data: {id: 1, username: "TestName"}})


