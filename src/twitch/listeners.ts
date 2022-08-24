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
import { listener } from "../index";
import { executeCommand } from "../mcSide";

export async function createListener(user : User, reward : Commands) {
    const rewardId = reward.reward_id as string;

    if (reward.is_reward) {
        try {
            await listener.subscribeToChannelRedemptionAddEventsForReward(user.id, rewardId, async (data) => {

                await executeCommand(user, rewardId, data.userId).then(async (value) => {
                    // TODO: Causing issues for now. Fix later. Low priority.
                    /*
                    if (value == true) {
                        //await data.updateStatus("FULFILLED"); 
                        console.log(data.status)
                    } else {
                        //await data.updateStatus("CANCELED");
                        console.log(data.status)
                    }
                    */
                })
                
            }) 
        } catch (error) {
            console.log(error)
        }
    }

    if (reward.is_subscription) {
        try {
            await listener.subscribeToChannelSubscriptionEvents(user.id, async (data) => {
                    await executeCommand(user, rewardId, data.userId).then(async (value) => {
                })
            })
        } catch (error) {
            console.log(error)
        }

        try {
            await listener.subscribeToChannelSubscriptionEndEvents(user.id, async (data) => {
                    await executeCommand(user, rewardId, data.userId, true).then(async (value) => {
                })
            })
        } catch (error) {
            console.log(error)
        }
    }

    /*
    if (reward.is_bits) {
        try {
            await listener.subscribeToExtensionBitsTransactionCreateEvents(user.id, async (data) => {
                await executeCommand(user, rewardId, data.userId).then(async (value) => {
                })
            })
        } catch (error) {
            console.log(error)
        }
    }
    */

}