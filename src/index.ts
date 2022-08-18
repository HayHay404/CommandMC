import { ClientCredentialsAuthProvider, RefreshingAuthProvider } from "@twurple/auth";
import { ApiClient, HelixCustomReward } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import { EnvPortAdapter, EventSubListener } from '@twurple/eventsub';
import dotenv from "dotenv";
import {promises as fs} from "fs";
import { RCON } from "minecraft-server-util";
import { db } from "./db";
import { app } from "./website/app";
import { Commands } from "@prisma/client";

let api: ApiClient;
let listener: EventSubListener;

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
    const adapter = new EnvPortAdapter({hostName: 'express.hayhay.cc'});
    const secret = process.env["SECRET"] as string;
    listener = new EventSubListener({ apiClient, adapter, secret, strictHostCheck: false });
    await listener.listen().then(() => listener.removeListener());

    const authProvider = await getAuthProvider()

    // Creates chatClient to respond to users.
    const chatClient = new ChatClient({ authProvider: authProvider, channels: ['HayHayIsLive'] });
    await chatClient.connect();

    // Creates new ApiClient to create channel point redemptions.
    // Required scopes: channel:manage:redemptions
    api = new ApiClient({authProvider})

    // Gets all users and for each users loops through commands to create custom rewards + add listener.
    await db.user.findMany({include: {commands: true}}).then((userList) => {
        userList.forEach(async (usr) => {

            usr.commands.forEach(async (command) => {
                await createChanelPointReward(usr.id, command)
            })
        });
    })
}

export async function createChanelPointReward(userId : number, command: Commands) {

    try {
        if (command.reward_id == null) {
            const reward = await api.channelPoints.createCustomReward(userId, 
                {title: command.name, cost: command.cost | 1000, userInputRequired: true});
        
            const update = await db.commands.update({
                where: { id: command.id },
                data: {
                    reward_id: reward.id,
                }
            })
        }

        return createListener(userId, command.reward_id as string)
    } catch(error) {}
}

async function createListener(userId : number, rewardId : string) {
    try {
        await listener.subscribeToChannelRedemptionAddEvents(userId, (data) => {
            console.log(data.input)
        }) 
    } catch (error) {
        console.log(error)
    }
}

async function doCommand() {}

main();
app.listen(3050)