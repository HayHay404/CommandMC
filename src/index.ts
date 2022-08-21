import { ClientCredentialsAuthProvider, RefreshingAuthProvider } from "@twurple/auth";
import { ApiClient, HelixCustomReward } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import { EnvPortAdapter, EventSubListener } from '@twurple/eventsub';
import dotenv from "dotenv";
import {promises as fs} from "fs";
import { RCON, status } from "minecraft-server-util";
import { db } from "./db";
import { app } from "./website/app";
import { Commands, User } from "@prisma/client";

let api: ApiClient;
let listener: EventSubListener;
let chatClient : ChatClient;

// .env should contain: CLIENT_ID, CLIENT_SECRET, PORT, SECRET
dotenv.config({path: "../.env"});

const clientId = process.env["CLIENT_ID"] as string;
const clientSecret = process.env["CLIENT_SECRET"] as string;

// Minecraft Client
const mcClient = new RCON();

// Create an auto refreshing token 
// File tokens.json should hold {accessToken, refreshToken, expiresIn, obtainmentTimestamp}
async function getAuthProvider() {
    const tokenData = JSON.parse(await fs.readFile("../tokens.json", "utf-8"));
    const authProvider = new RefreshingAuthProvider({
            clientId,
            clientSecret,
            onRefresh: async newTokenData => await fs.writeFile('./tokens.json', JSON.stringify(newTokenData, null, 4), "utf-8")
        },
        tokenData
    );

    return authProvider;
}

async function main() {
    // Create an App Access Token necessary for Event Sub
    const appTokenAuthProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
    const apiClient = new ApiClient({authProvider: appTokenAuthProvider});

    /* Create adapter and web server for bot to listen on
    * adapter provides the webserver domain and SSL, however SSL is obtained with a reverse proxy
    */
    const adapter = new EnvPortAdapter({hostName: process.env["HOSTNAME"] as string});
    const secret = process.env["SECRET"] as string;
    listener = new EventSubListener({ apiClient, adapter, secret, strictHostCheck: false });
    await listener.listen().then(() => listener.removeListener());

    const authProvider = await getAuthProvider()

    // Creates chatClient to respond to users.
    chatClient = new ChatClient({ authProvider: authProvider, channels: ['HayHayIsLive'] });
    await chatClient.connect();

    // Creates new ApiClient to create channel point redemptions.
    // Required scopes: channel:manage:redemptions
    api = new ApiClient({authProvider})

    // Gets all users and for each users loops through commands to create custom rewards + add listener.
    await db.user.findMany({include: {commands: true}}).then((userList) => {
        userList.forEach(async (usr) => {

            usr.commands.forEach(async (command) => {
                await createChanelPointReward(usr, command)
            })
        });
    })
}

// Message listeners
() => {

    chatClient.onMessage(async(channel, user, message) => {
        if (message === "!link") {
            const messageArr = message.split(" ");
            const id : string = await api.users.getUserByName(user).then((user) => {return user?.id as string});

            if (await db.mcUser.findFirst({where: {id: id}}) == undefined) {
                try {
                    db.mcUser.create({data: {
                        id: user,
                        mc_username: messageArr[1],
                    }});
                } catch (error) {
                    chatClient.say(channel, `Database error. Try again later, ${user}.`)
                }
            } else {
                try {
                    db.mcUser.update({where: {id: id}, data: {mc_username: messageArr[1]}})
                } catch (error) {
                    chatClient.say(channel, `Database error. Try again later, ${user}.`)
                }
            }
        }

        if (message === "!unlink") {
            const id : string = await api.users.getUserByName(user).then((user) => {return user?.id as string});

            try {
                db.mcUser.delete({where: {id: id}})
            } catch (error) {
                chatClient.say(channel, `Database error. Try again later, ${user}.`)
            }
        }
    })
}

export async function createChanelPointReward(user : User, command: Commands) {
    try {
        try {
            // if returned with a 404, it automatically creates the new channel point reward
            await api.channelPoints.getCustomRewardById(user.id, command.reward_id as string)
        } catch (error) {
            const reward = await api.channelPoints.createCustomReward(user.id, 
                {title: command.name, cost: command.cost | 1000});
        
            const update = await db.commands.update({
                where: { id: command.id },
                data: {
                    reward_id: reward.id,
                }
            })
        }
        
        return createListener(user, command.reward_id as string)
    } catch(error) {
        console.log(error)
    }
}

async function createListener(user : User, rewardId : string) {
    try {
        await listener.subscribeToChannelRedemptionAddEventsForReward(user.id, rewardId, (data) => {
            console.log(data.input)
            executeCommand(user, rewardId, data.input);
        }) 
    } catch (error) {
        console.log(error)
    }
}

async function executeCommand(user : User, rewardID : string, input : string) {
    const ip = user.server_ip;
    const port = user.port;
    const password = user.password;

    const reward = await db.commands.findFirst({
        where: {
            reward_id: {equals: rewardID}
        }
    })
    
    if (port == null || ip == null || password == null) {
        return chatClient.say(user.username, "❌ Server needs to be configured first.", {});
    }

    status(ip, port, {timeout: 5000, enableSRV: true})
    .then(async () => {
        await mcClient.connect(ip, 25575);
        await mcClient.login(user.password as string); // TODO: Use Bcrypt to store and decrypt passwords instead
        await mcClient.run(reward?.command
            .replace("/", "")
            .replace("$user", `${input}`) as string)
        .then(() => {
            return chatClient.say(user.username, "✅ Executed Successfully");
        });
        mcClient.close();
    })
    .catch((err) => {return chatClient.say(user.username, "❌ Server likely offline.")});
}

main();

app.listen(3050)