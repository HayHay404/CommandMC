"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const index_1 = require("../index");
exports.router = (0, express_1.Router)();
exports.router.route("/")
    .get((req, res) => {
    return res.render("/pages/newCommand");
})
    .post(async (req, res) => {
    const data = await req.body;
    const userId = req.params.userId; // TODO: Fix this.
    const reward = await db_1.db.commands.create({ data: {
            name: data.name,
            cost: parseInt(data.cost),
            command: data.command,
            userId: userId
        } });
    (0, index_1.createChanelPointReward)(userId, reward);
});
exports.router.route("/:id")
    .get(async (req, res) => {
    try {
        const reward = await db_1.db.commands.findFirstOrThrow({ where: {
                reward_id: {
                    equals: parseInt(req.params.id)
                }
            } });
    }
    catch (error) {
        return res.redirect("/");
    }
})
    .post(async (req, res) => {
});
