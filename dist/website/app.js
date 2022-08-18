"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const axios_1 = __importDefault(require("axios"));
const users_1 = require("./users");
const node_path_1 = __importDefault(require("node:path"));
exports.app = (0, express_1.default)();
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.set("view engine", "ejs");
exports.app.set('views', node_path_1.default.join(".." + "/views"));
exports.app.get("/", async (req, res) => {
    if (req.url.includes("code")) {
        const code = req.url.split("=")[1].replace("&scope", "");
        //console.log(code)
        try {
            await axios_1.default.post(`https://id.twitch.tv/oauth2/token`, {
                client_id: process.env["CLIENT_ID"],
                client_secret: process.env["CLIENT_SECRET"],
                code: code,
                redirect_uri: "http://localhost:3050",
                grant_type: "authorization_code"
            }).then(async (response) => {
                const token = response.data["access_token"];
                await axios_1.default.get("https://api.twitch.tv/helix/users", {
                    headers: {
                        "Client-Id": process.env["CLIENT_ID"],
                        "Authorization": `Bearer ${token}`
                    }
                }).then(async (response) => {
                    const data = response.data["data"][0];
                    const id = parseInt(data["id"]);
                    const user = await db_1.db.user.findFirst({ where: {
                            id: { equals: id }
                        } });
                    if (user == null) {
                        await db_1.db.user.create({
                            data: {
                                id: parseInt(data["id"]),
                                username: data["login"],
                            }
                        });
                    }
                    return res.redirect(`/users/${id}`);
                });
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    return res.render("pages/index");
});
exports.app.use("/users", users_1.router);
//app.use("/users/:userId/rewards/", rewardRoutes);
