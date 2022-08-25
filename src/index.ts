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

import {
  ClientCredentialsAuthProvider,
  RefreshingAuthProvider,
} from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import { EnvPortAdapter, EventSubListener } from "@twurple/eventsub";
import dotenv from "dotenv";
import { promises as fs } from "fs";
import { db } from "./db";
import { app } from "./website/app";
import Cryptr from "cryptr";
import { createChanelPointReward } from "./twitch/createRewards";
import { chatCommands } from "./twitch/chatCommands";
import { createListener } from "./twitch/listeners";

export let listener: EventSubListener;
export let chatClient: ChatClient;
export let apiClient : ApiClient;

// .env should contain: CLIENT_ID, CLIENT_SECRET, PORT, SECRET, DATABASE_URL, HOSTNAME
dotenv.config({ path: "../.env" });

const clientId = process.env["CLIENT_ID"] as string;
const clientSecret = process.env["CLIENT_SECRET"] as string;

// Cryptr used to encrypt/decrypt passwords for servers.
export const cryptr = new Cryptr(process.env["SECRET"] as string);

// Create an auto refreshing token
// File tokens.json should hold {accessToken, refreshToken, expiresIn, obtainmentTimestamp}
// See: https://twurple.js.org/docs/auth/providers/refreshing.html
async function getAuthProvider() {
  const tokenData = JSON.parse(await fs.readFile("../tokens.json", "utf-8"));
  const authProvider = new RefreshingAuthProvider(
    {
      clientId,
      clientSecret,
      onRefresh: async (newTokenData) =>
        await fs.writeFile(
          "./tokens.json",
          JSON.stringify(newTokenData, null, 4),
          "utf-8"
        ),
    },
    tokenData
  );

  return authProvider;
}

async function main() {
  // Create an App Access Token necessary for Event Sub
  const appTokenAuthProvider = new ClientCredentialsAuthProvider(
    clientId,
    clientSecret,
    ["channel:manage:redemptions", "channel:read:redemptions", "user:read:email", "chat:read", "chat:edit", "bits:read", "channel:read:subscriptions"]
  );
  apiClient = new ApiClient({ authProvider: appTokenAuthProvider });

  /* Create adapter and web server for bot to listen on
   * adapter provides the webserver domain and SSL, however SSL is obtained with a reverse proxy
   */
  const adapter = new EnvPortAdapter({
    hostName: process.env["HOSTNAME"] as string,
  });
  const secret = process.env["SECRET"] as string;
  listener = new EventSubListener({
    apiClient,
    adapter,
    secret,
    strictHostCheck: false,
  });
  await apiClient.eventSub.deleteAllSubscriptions();
  await listener.listen();

  const authProvider = await getAuthProvider();

  // Creates chatClient to respond to users.
  chatClient = new ChatClient({
    authProvider: authProvider,
    channels: ["HayHayIsLive"],
  });
  await chatClient.connect();

  // Gets all users and for each users loops through commands to create the listener listener.
  await db.user.findMany({ include: { commands: true } }).then((userList) => {
    userList.forEach(async (user) => {
      user.commands.forEach(async (command) => {
        await createListener(user, command)
      });
    });
  });
}

// Execute main, then listen for chat commands. Ensures the chatClient has been properly initalized.
main().then(() => chatCommands());

// Web server port.
app.listen(3050);
