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
const fs = require("fs");
const glob = require("glob");
const path = require("path");

const LICENSE_TS = `/*
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
 */`;

const LICENSE_HTML = `<!--
CommandMC - Execute command on a Minecraft server with Twitch channel redemptions.
Copyright (C) 2022  HayHay404 <hayhayisaloser01@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->`;

glob(`**/*.{ts,tsx,ejs,html}`, {}, (error, files) => {
  if (error) {
    throw error;
  }

  if (files.length <= 0) {
    console.log(
      `No files found. ${path.join(__dirname, "..", "**/*.{ts,tsx,ejs,html}")}`
    );
    return;
  }

  files.forEach((filePath) => {
    if (filePath.startsWith("node_modules")) return;

    const fileContent = fs.readFileSync(filePath, "utf8");
    let LICENSE = "";
    switch (filePath.split(".").pop()) {
      case "ts":
      case "tsx":
      case "js":
      case "jsx":
        LICENSE = LICENSE_TS;
        break;

      case "html":
      case "ejs":
        LICENSE = LICENSE_HTML;
        break;

      default:
        console.log(
          `Unknown file type: ${filePath.split(".").pop()}. ${filePath}`
        );
        break;
    }

    if (LICENSE !== "" && !fileContent.includes(LICENSE)) {
      fs.writeFileSync(filePath, LICENSE + "\n\n" + fileContent, "utf-8");
      console.log(`Updating ${filePath}`);
    }
  });
});
