import { User } from "@prisma/client";
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

export async function executeCommand(user : User, rewardID : string, userId : string) : Promise<Boolean> {
    const ip = user.server_ip;
    const port = user.port;
    const password = user.password;
    const rconPort = user.rcon_port;

    const reward = await db.commands.findFirst({
        where: {
            reward_id: {equals: rewardID}
        }
    })
    
    if (port == null || ip == null || password == null || rconPort == null) {
        chatClient.say(user.username, "❌ Server needs to be configured first.");
        return false;
    }

    status(ip, port, {timeout: 5000, enableSRV: true})
    .then(async () => {
        await mcClient.connect(ip, rconPort);
        await mcClient.login(cryptr.decrypt(user.password as string));
        reward?.command.replace("/", "")
        if (reward?.command.includes("$user")) {
            try {
                const mcUsername = await db.mcUser.findFirstOrThrow({where: {id: userId}})
                await mcClient.run(reward?.command
                    .replace("$user", `${mcUsername}`) as string)
            } catch (error) {
                chatClient.say(user.username, "Link your minecraft account first with !link <username>")
            }
        }
        
        chatClient.say(user.username, "✅ Executed Successfully");
        mcClient.close();

        return true;
    })
    .catch((err) => {return chatClient.say(user.username, "❌ Server likely offline.")});

    return false;
}