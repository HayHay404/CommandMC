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

import { Commands, User } from "@prisma/client";
import axios from "axios";
import { db } from "./db";
import { chatClient, cryptr } from "./index";
import { RCON, status } from "minecraft-server-util";

// Minecraft Client
const mcClient = new RCON();

// Validates for a real Minecraft account, does nothing else for now lol
export async function validateMCAccount(username : string, channel : string) : Promise<Boolean> {
    try {
        const data = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`)
        if (!data.data["id"]) throw Error;
    } catch (error) {
        chatClient.say(channel, "Invalid minecraft account. Check the username.")
        return false;
    }

    return true;
}

export async function executeCommand(user : User, reward : Commands, userRedeemId : string, isSubEnd = false) : Promise<Boolean> {
    const ip = user.server_ip;
    const port = user.port;
    const password = user.password;
    const rconPort = user.rcon_port;

    if (port == null || ip == null || password == null || rconPort == null) {
        chatClient.say(user.username, "❌ Server needs to be configured first.");
        return false;
    }

    const command = isSubEnd ? reward?.subscription_end as string : reward?.command as string;

    status(ip, port, {timeout: 5000, enableSRV: true})
    .then(async () => {
        await mcClient.connect(ip, rconPort);
        await mcClient.login(cryptr.decrypt(user.password as string));
        command.replace("/", "")
        if (command.includes("$user")) {
            try {
                const mcUsername = await db.mcUser.findFirstOrThrow({where: {id: userRedeemId}})
                await mcClient.run(command
                    .replace("$user", `${mcUsername.mc_username}`) as string)
            } catch (error) {
                chatClient.say(user.username, "Link your minecraft account first with !link <username>")
            }
        } else {
            await mcClient.run(command)
        }
        
        chatClient.say(user.username, "✅ Executed Successfully");
        mcClient.close();

        return true;
    })
    .catch((err) => {return chatClient.say(user.username, "❌ Server likely offline.")});

    return false;
}