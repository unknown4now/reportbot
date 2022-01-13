//Code fixed by darby#0001
//Date  13.06.2021

//Require packages
const Discord = require("discord.js");
const SteamAPI = require('steamapi');
const fs = require('fs');

//Create objects
const client = new Discord.Client();
const steam = new SteamAPI('D856B578ADEE11FCD49857E4ADD78AAF');

//Client prefix
const prefix = "!";
const botToken = "";

//Role ID for whitelist access
const whitelistID = '';

//This event get's triggered when bot is ready to be used
client.on('ready', () => {
    console.log(`The bot is ready to be used!`);
})

//Event which get's triggered when a message is sent in a text channel
client.on("message", function(message) {

    //Checking if the message starts with the prefix -> if not do nothing
    if (!message.content.startsWith(prefix)) return;

    //Getting the whole command
    const commandBody = message.content.slice(prefix.length);
    //Getting the command parameters (after whitespace --> is argument, however only the first one if there is another whitespace it get's cut off)
    const args = commandBody.split(' ');

    //Build the command
    const command = args.shift().toLowerCase(); // <-- this is our final command (example: !report <id>)

    //WHITELIST COMMAND
    if (command == 'whitelist')
    {
        //Getting the id to whitelist from the parameter
        var idToWhitelist = args[0];

        //Checking if the user has the access role to use the command
        if (!message.member.roles.cache.has(whitelistID))
        {
            message.reply(`Sorry! You don't have enough permissions to use this command!`);
        }
        else
        {
            if (!(args instanceof Array && args.length))
            {
                message.reply(`Please provide a id you would like to whitelist!`);
            }
            else
            {
                //Whitelit id
                steam.resolve(idToWhitelist).then(id => {

                    //Reading the whitelist.txt file
                    fs.readFile('./data/whitelist.txt', function(error, data)
                    {
                        if (error)
                        {
                            //If we encounter an error during the reading show it
                            console.log(`Error: ${error.message}`);
                        }
                        else if (data.includes(id))
                        {
                            //If the id is already whitelisted
                            console.log(`${idToWhitelist} is already whitelisted!`);
                        }
                        else
                        {
                            fs.appendFile('./data/whitelist.txt', `${id}\n`, function (err) {
                                if (err)
                                {
                                    console.error(err);
                                }
                                else
                                {
                                    console.log(`${id} successfully whitelisted!`);
                                    const whitelistEmbed = new Discord.MessageEmbed()
                                    .setColor('#3d62a6')
                                    .setTitle('User Whitelisted')
                                    .setDescription(`Successfully whitelisted ${id}`)
                                    message.reply(whitelistEmbed);
                                }
                            });
                        }
                    });
                }).catch(error => console.log(`${idToWhitelist} does not exist! (Error: ${error.message})`));
            }
        }
    }
    //REPORT COMMAND
    else if (command == 'report') {

        //Checking if the command was executed in the report channel
        if (message.channel.name != 'report')
        {
            //Message not coming from report channel
            //We do nothing
        }
        else
        {
            //Get id to report from parameters
            let idToReport = args[0];

            if (idToReport == '')
            {
                message.reply(`Please provide a id you would like to report!`);
            }
            else
            {
                steam.resolve(idToReport).then(id => {
                
                    //Delete the authors original message (you can delete this if you want .. it just deletes your old message so noone sees who reported the id)
                    message.delete({timeout: 10});
        
                    //Checking if the id is whitelisted
                    fs.readFile('./data/whitelist.txt', function(error, data)
                    {
                        if (error)
                        {
                            console.log(`Error while reading whitelist.txt (Error: ${error.message})`);
                        }
                        else if (data.includes(id)) //If the id is whitelisted
                        {
                            message.reply(`Sorry! This ID is whitelisted!`);
                        }
                        else
                        {
                            //Creating a sub process for the index.js script
                            var childProcess = require('child_process');
                            function runScript(scriptPath, callback) {
                            var invoked = false;
                            var process = childProcess.fork(scriptPath, [id, [20]]);
                                process.on('error', function (err) {
                                    if (invoked) return;
                                    invoked = true;
                                });
                                process.on('exit', function (code) {
                                    if (invoked) return;
                                    invoked = true;
                                    var err = code === 0 ? null : new Error('exit code ' + code);
                                });
        
                            }
        
                            //Starting the index.js script with the id to report || This 3 lines are actually reporting the id
                            runScript('./index.js', function (err) {
                                console.log(`Successfully executed index.js`);
                            });
        
        
                            //Getting the user id
                            let userID = message.author.id;
                            
                            //The stuff now is only if you have the banchecker
                            message.channel.send(`.add ${id} ${userID}`).then(msg => msg.delete({timeout: 10}));
        
                            //Printing the embed
                            steam.getUserSummary(id).then(summary => {
                                const SuccessReportEmbed = new Discord.MessageEmbed()
                                .setColor('#3d62a6')
                                .setTitle('Success')	
                                .setTimestamp()
                                .setFooter('assault', 'https://cdn.discordapp.com/attachments/775123417702727680/853423843221962752/cb612643929aa723a9116943656c2ae3.gif');
                                message.reply(SuccessReportEmbed);
                            });
                        }
                    });
                }).catch(error => console.log(`${idToWhitelist} does not exist! (Error: ${error.message})`));
            }
        }
    }
    else
    {
        //The command does not exist so we do nothing
        //Comment the line under this one out of you want to reply to the user
        //message.reply(`This command does not exist!`);
    }
});

//Logging in with the bot token
client.login(botToken);