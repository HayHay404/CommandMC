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

import { User, Commands } from "@prisma/client";
import axios from "axios";
import { db } from "../db";
import { createListener } from "./listeners";

export async function createChanelPointReward(user : User, command: Commands) {
    const headers = { 
        "Client-Id": process.env["CLIENT_ID"] as string,
        "Authorization": user.authorization as string,
        'Content-Type': 'application/json'
    };

    try {
        try {
            // if returned with a 404, it automatically creates the new channel point reward
            if (command.reward_id == null) {
                throw new Error("No reward id found. Creating...");
            }
            await axios.get("https://api.twitch.tv/helix/channel_points/custom_rewards", {
                headers: headers,
                params: {
                    "broadcaster_id": user.id,
                    "id": command.reward_id
                },
            })

        } catch (error) {
            const data = {
                "title": command.name,
                "cost": command.cost,
            }

            const rewardData = await axios.post("https://api.twitch.tv/helix/channel_points/custom_rewards", data, {
                headers: headers,
                params: {
                    "broadcaster_id": user.id
                },
            })

            const reward = await rewardData.data["data"][0];
        
            command = await db.commands.update({
                where: { id: command.id },
                data: {
                    reward_id: reward["id"],
                }
            })
        } finally {
            createListener(user, command)
            return;
        }
    } catch(error) {
        throw new Error("Database error: " + error);
    }
}