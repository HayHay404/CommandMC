"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@prisma/client");
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
exports.db = new client_1.PrismaClient();
exports.db.user.create({ data: { id: 1, username: "TestName" } });
