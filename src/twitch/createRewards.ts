import { User, Commands } from "@prisma/client";
import { db } from "../db";
import { api } from "../index";
import { createListener } from "./listeners";

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