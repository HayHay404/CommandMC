import { User } from "@prisma/client";
import { api, listener } from "../index";
import { executeCommand } from "../mcSide";

export async function createListener(user : User, rewardId : string) {
    try {
        await listener.subscribeToChannelRedemptionAddEventsForReward(user.id, rewardId, async (data) => {
            
            await executeCommand(user, rewardId, data.userId).then(async (value) => {
                if (value == true) {
                    // await data.updateStatus("FULFILLED"); TODO: Causing issues for now. Fix later. Low priority.
                } else {
                    // await data.updateStatus("CANCELED");
                }
            })
            
        }) 
    } catch (error) {
        console.log(error)
    }
}