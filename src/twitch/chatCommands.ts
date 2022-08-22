import { db } from "../db";
import { chatClient, api } from "../index";
import { validateMCAccount } from "../mcSide";

// Message listeners for linking Minecraft accounts
export function chatCommands() {

    chatClient.onMessage(async(channel, user, message) => {
        if (message.startsWith("!link")) {
            const messageArr = message.split(" ");
            if (messageArr.length !== 2) return chatClient.say(channel, `@${user}, remember to inclde your minecraft username.`)
            if (!validateMCAccount(messageArr[1], channel)) return;
            const id : string = await api.users.getUserByName(user).then((user) => {return user?.id as string});
            const username : string = messageArr[1];

            if (await db.mcUser.findFirst({where: {id: id}}) == undefined) {
                try {
                    await db.mcUser.create({data: {
                        id: id,
                        mc_username: username,
                    }});

                    chatClient.say(channel, `✅ Successfully linked your minecraft account, @${user}`)
                } catch (error) {
                    chatClient.say(channel, `Database error. Try again later, ${user}.`)
                }
            } else {
                try {
                    await db.mcUser.update({where: {id: id}, data: {mc_username: username}})
                    chatClient.say(channel, `✅ @${user} updated minecraft username successfully`)
                } catch (error) {
                    chatClient.say(channel, `Database error. Try again later, ${user}.`)
                }
            }
        }

        if (message.startsWith("!unlink")) {
            const id : string = await api.users.getUserByName(user).then((user) => {return user?.id as string});

            try {
                await db.mcUser.delete({where: {id: id}});
                chatClient.say(channel, `Successfully unlinked your account, @${user}`)
            } catch (error) {
                chatClient.say(channel, `Database error. Try again later, @${user}.`)
            }
        }

        if (message.startsWith("!docs")) return chatClient.say(channel, "CommandMC Documentation: https://docs.commandmc.hayhay.link")
    })
}