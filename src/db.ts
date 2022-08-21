import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();

db.user.create({data: {id: 1, username: "TestName"}})


