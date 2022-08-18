import { Router, Express } from "express";
import { db } from "../db";
import { createChanelPointReward } from "../index";

export const router : Express = Router() as Express;

router.route("/:id")
.get(async (req, res) => {
    try {
        const user = await db.user.findFirstOrThrow({where: {
            id: {
                equals: parseInt(req.params.id),
            }},
            include: {commands: true}
        })

        return res.render("pages/user", {user});
        
    } catch (error) {
        return res.status(404).send("User not found." +
        "<script>setTimeout(function() {window.location = '/';}, 5000)</script>")
    }
})
.patch(async (req, res) => {
    try {
        const usr = await db.user.update({
            where: {
                id: parseInt(req.params.id),
            },
            data: {
                server_ip: req.body.server_ip,
                port: parseInt(req.body.port),
                password: req.body.password, 
            }
        })

        return res.redirect(`/users/${parseInt(req.params.id)}`);
    } catch (error) {
        return res.status(404).send("Could not update user." +
        "<script>setTimeout(function() {window.location = '/';}, 5000)</script>")
    }
});

router.route("/:userId/rewards/")
.get((req, res) => {
    return res.render("pages/newCommand")
})
.post(async (req, res) => {
    const data = await req.body;
    const userId = parseInt(req.params.userId);
    await db.commands.create({data: {
        name: data.name,
        cost: parseInt(data.cost),
        command: data.command,
        userId: userId
    }}).then(async(reward) => await createChanelPointReward(userId, reward));

    return res.redirect(`/users/${userId}`)
})

router.route("/:userId/rewards/:rewardId")
.get(async (req, res) => {

    try {
        const reward = await db.commands.findFirstOrThrow({where: {
            reward_id: {
                equals: req.params.rewardId
            },
            userId: {
                equals: parseInt(req.params.userId)
            }
        }})
    } catch (error) {
        return res.redirect("/")
    }
})
.patch(async (req, res) => {})
.delete(async (req, res) => {})
