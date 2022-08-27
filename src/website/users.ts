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

import { User } from "@prisma/client";
import { Router, Express } from "express";
import { db } from "../db";
import { createChanelPointReward } from "../twitch/createRewards";
import { cryptr } from "../index";
import axios from "axios";

export const router: Express = Router() as Express;

let headers : {};
let user : User;


router.use(async (req, res, next) => {
  try {
    const reqUrl = req.url.split("/");
    user = await db.user.findFirstOrThrow({
      where: {
        id: parseInt(reqUrl[1])
      },
      include: {commands: true}
    });

    headers = { 
      "Client-Id": process.env["CLIENT_ID"] as string,
      "Authorization": user?.authorization as string,
      'Content-Type': 'application/json'
    }
    return next();
  } catch (error) {
    return res
    .status(404)
    .send(
      "User not found." +
        "<script>setTimeout(function() {window.location = '/';}, 5000)</script>"
    );
  }
});

router
  .route("/:id")
  .get(async (req, res) => {
      return res.render("pages/user", { user });
  })
  .patch(async (req, res) => {
    // Get the data sent from patch request
    const data = req.body;
    const { serverIp, port, rconPort, serverPassword } = data;

    if (!serverIp || !port || !rconPort || (!serverPassword && !user.password)) {
      return res.status(400).send("Missing data.");
    }
    if (serverPassword === "password") {
      return res.status(400).send("Password cannot be 'password' or empty.");
    }

    try {
      const encryptedPassword = cryptr.encrypt(serverPassword);

      await db.user.update({
        where: { id: user.id },
        data: {
          server_ip: serverIp,
          port: parseInt(port),
          rcon_port: parseInt(rconPort),
          password: encryptedPassword,
        }
      });
      return res.status(200).send("Updated successfully.");
    } catch (error) {
      return res
        .status(500)
        .send(
          "Could not update user." +
            "<script>setTimeout(function() {window.location = '/';}, 5000)</script>"
        );
    }    
  });

router
  .route("/:userId/rewards/")
  .get((req, res) => {
    return res.render("pages/newCommand");
  })
  .post(async (req, res) => {

    const data = await req.body;

    if (data.isBits === "false" && data.isSubscription === "false" && data.isChannelPoint === "false") {
      throw new Error("You must select at least one reward type.");
    }

    if (data.isChannelPoint === "true" && parseInt(data.cost) < 1) {
      throw new Error("Cost must be greater than 0.");
    }

    if (data.isBits === "true" && parseInt(data.bits) < 1) {
      throw new Error("Bits must be greater than 0.");
    }

    const user : User | null = await db.user.findFirst({
      where: { id: { equals: parseInt(req.params.userId) } },
    });
    const userId = user?.id;
    if (user?.role === "DEFAULT") {
      if (
        (await db.commands.findMany({ where: { userId: userId } })).length === 5
      ) {
        return res.redirect(`/users/${userId}`);
      }
    }

    try {

      let rewards = await axios.get("https://api.twitch.tv/helix/channel_points/custom_rewards", {
          headers: headers,
          params: {
              "broadcaster_id": userId
          }
      })

      const rewardsArr = await rewards.data["data"]
      

      rewardsArr.forEach((value: { title: string; }) => {
        //console.log(value)
        if (data.name === value["title"]) {
          throw new Error("Reward Title already exists.");
        }
      });

      try {
        await db.commands
        .create({
          data: {
            name: data.name,
            cost: data.isChannelPoint === "on" ? parseInt(data.cost) : 0,
            command: data.command,
            userId: userId as number,
            is_bits: data.isBits === "on" ? true : false,
            is_subscription: data.isSubscription === "on" ? true : false,
            bits: data.isBits === "on" ? parseInt(data.bits) : undefined,
            is_reward: data.isChannelPoint === "on" ? true : false,
            subscription_end: data.isSubscription === "on" ? data.subscriptionEnd : undefined,
          },
        })
        .then(
            async (reward) => await createChanelPointReward(user as User, reward)
        );
      } catch (error) {
        console.log("database error")
      }
      
    } catch (error) {
      console.log(error)
    }

    return res.redirect(`/users/${user?.id}`);
  });

router
  .route("/:userId/rewards/:rewardId")
  .get(async (req, res) => {
    try {
      const reward = await db.commands.findFirstOrThrow({
        where: {
          reward_id: {
            equals: req.params.rewardId,
          },
          userId: {
            equals: parseInt(req.params.userId),
          },
        },
      });
    } catch (error) {
      return res.redirect("/");
    }
  })
  .patch(async (req, res) => {})
  .delete(async (req, res) => {
  
    const reward = await db.commands.findFirst({where: {reward_id: {equals: req.params.rewardId}}})
    try {
      if (reward?.is_reward) {
        await axios.delete("https://api.twitch.tv/helix/channel_points/custom_rewards", {
          headers: headers,
          params: {
            "broadcaster_id": parseInt(req.params.userId),
            "id": reward?.reward_id
          }
        })
      }

      await db.commands.delete({
        where: {
          id: reward?.id,
        },
      });
    } catch (error) {
      return res.status(500).send("Could not delete reward.");
    }
    return res.status(200).send("Deleted successfully.");
  });
