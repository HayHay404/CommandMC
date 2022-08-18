"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const index_1 = require("../index");
exports.router = (0, express_1.Router)();
exports.router.route("/:id")
    .get(async (req, res) => {
    try {
        const user = await db_1.db.user.findFirstOrThrow({ where: {
                id: {
                    equals: parseInt(req.params.id),
                }
            },
            include: { commands: true }
        });
        return res.render("pages/user", { user });
    }
    catch (error) {
        return res.status(404).send("User not found." +
            "<script>setTimeout(function() {window.location = '/';}, 5000)</script>");
    }
})
    .patch(async (req, res) => {
    try {
        const usr = await db_1.db.user.update({
            where: {
                id: parseInt(req.params.id),
            },
            data: {
                server_ip: req.body.server_ip,
                port: parseInt(req.body.port),
                password: req.body.password,
            }
        });
        return res.redirect(`/users/${parseInt(req.params.id)}`);
    }
    catch (error) {
        return res.status(404).send("Could not update user." +
            "<script>setTimeout(function() {window.location = '/';}, 5000)</script>");
    }
});
exports.router.route("/:userId/rewards/")
    .get((req, res) => {
    return res.render("pages/newCommand");
})
    .post(async (req, res) => {
    const data = await req.body;
    const userId = parseInt(req.params.userId);
    await db_1.db.commands.create({ data: {
            name: data.name,
            cost: parseInt(data.cost),
            command: data.command,
            userId: userId
        } }).then(async (reward) => await (0, index_1.createChanelPointReward)(userId, reward));
    return res.redirect(`/users/${userId}`);
});
exports.router.route("/:userId/rewards/:rewardId")
    .get(async (req, res) => {
    try {
        const reward = await db_1.db.commands.findFirstOrThrow({ where: {
                reward_id: {
                    equals: req.params.rewardId
                },
                userId: {
                    equals: parseInt(req.params.userId)
                }
            } });
    }
    catch (error) {
        return res.redirect("/");
    }
})
    .patch(async (req, res) => { })
    .delete(async (req, res) => { });
