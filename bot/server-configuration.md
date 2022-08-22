---
description: This guide will help you configure your Minecraft server for the bot.
---

# Server Configuration

In the following guide, we will achieve the following:

* Enabling RCON on your server.
* Configuring RCON.
* Securing the connection with a password.

### What's RCON?

[RCON](https://wiki.vg/RCON) is a service that is built into all Minecraft servers by default. It allows server administrators to remotely connect to the server and execute commands through the console. It was originally introduced into Minecraft in Beta 1.9-pre4.



### Getting Started

Let's get started with the configuration. First, you will want to access your server files. Your host should give you access to a panel where you can access an FTP or File Access section. This should  show all of your files.



#### Pre-requisites

Here's a list of prerequisites that you can tick-off as you go.

* [ ] Generating an RCON password.
* [ ] Creating a port through your server host.

Open up your Minecraft panel. You should hopefully have a section where you can create additional ports for your server.  You will need to create one. Feel free to name it `RCON`, and make sure to write this port down in a notepad for later use.



You will now need to generate a password for RCON. You can use a generator such as [1Password](https://1password.com/password-generator/), or [LastPass](https://www.lastpass.com/features/password-generator-a). You can also create your own, but make sure that it is unique and not a common password. See [Kaspersky's Password Checker](https://password.kaspersky.com/) to check the security of the password, or check if it's a known password in a previous security breach at [haveibeenpwned](https://haveibeenpwned.com/Passwords).



#### Editing files

Let's start by editing `server.properties`. Open the file and find `enabled-rcon=false`. Change the `false` to `true`. This will enable RCON.

Find `rcon.port=` and change it to the port that you created earlier in the guide.

<details>

<summary>Opening a port</summary>

If you're using a server host for your Minecraft server, be sure to check their documentation and panel on how to open a new port. While changing the default `25575` is not necessary, it's recommended to change it.



Here are some popular server hosts' guide on opening a port:

* [PebbleHost](https://help.pebblehost.com/en/minecraft/how-to-add-an-additional-port)
* [DedicatedMC](https://docs.dedicatedmc.io/advanced-server-setup/how-to-add-additional-ports/)
* [Sparked Host](https://www.youtube.com/watch?v=Edb9DKM0lqI)

</details>

Next, find `rcon.password=` and change it to the password that you created earlier.

{% hint style="danger" %}
Please **do not** share your `rcon.password`with anyone. This will allow them to execute any command on your server. See the [FAQ](server-configuration.md#faq) for more info.
{% endhint %}



### Submitting the credentials to CommandMC

See below to submit the credentials to CommandMC.

{% content-ref url="bot-configuration.md" %}
[bot-configuration.md](bot-configuration.md)
{% endcontent-ref %}

### FAQ

#### Am I putting my server security at risk by using CommandMC?

Unfortunately, due to the permission levels and the abilities that you gain from using RCON, there is a security risk. RCON allows anyone that has the correct credentials to execute commands with console-level privileges. This, in turn, can be an issue if the credentials are ever leaked to the public.



CommandMC securely stores the credentials to connect to RCON on your server. The only commands that will be ran are what have been setup in the dashboard for CommandMC. No one in the CommandMC team will ever distribute, use, or abuse the powers that are given by giving us your RCON information.



If you ever have an issue with providing your credentials, or would like to remove them from our system, please visit the CommandMC dashboard and unlink the RCON credentials. Once this has been done, there will be no copies stored or cached on our servers, or other programs.
