/*
 * CommandMC - Execute command on a Minecraft server with Twitch channel redemptions.
 * Copyright (C) 2022  HayHay404 <hayhayisaloser01@gmail.com>

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import express from "express";
import { db } from "../db";
import axios from "axios";
import { router as userRoutes } from "./users";
import crypto from "crypto";
import path from "node:path";

export const app = express();
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.set("view engine", "ejs")
app.set('views', path.join(".." + "/views"));

app.get("/", async(req, res) => {
    if (req.url.includes("code")) {
        const code = req.url.split("=")[1].replace("&scope", "")
        let token : string;
        //console.log(code)
        try {
            await axios.post(`https://id.twitch.tv/oauth2/token`, {
                client_id: process.env["CLIENT_ID"],
                client_secret: process.env["CLIENT_SECRET"],
                code: code,
                redirect_uri: "http://localhost:3050",
                grant_type: "authorization_code"
            }).then(async (response) => {
                token = await response.data["access_token"];

                await axios.get("https://api.twitch.tv/helix/users", {
                    headers: {
                        "Client-Id": process.env["CLIENT_ID"] as string,
                        "Authorization": `Bearer ${token}`
                    }
                }).then(async (response) => {

                    const data = response.data["data"][0];
                    const id = parseInt(data["id"]);
                    const user = await db.user.findFirst({where: {
                        id: {equals: id}
                    }})

                    if (user == null) {
                        await db.user.create({
                            data: {
                                id: parseInt(data["id"]),
                                username: data["login"],
                                email: data["email"],
                                authorization: `Bearer ${token}`
                            }
                        });    
                    } else {
                        await db.user.update({
                            data: {
                                authorization: `Bearer ${token}`
                            },
                            where: {
                                id: id
                            }
                        })
                    }
                    
                    return res.redirect(`/users/${id}`)
                });
            })
        } catch (error) {
            console.log(error)
        }
    }
    return res.render("pages/index")
})


app.use("/users", userRoutes);
