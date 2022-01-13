//Require node packages
const steamCommunity = require('steamcommunity');
const Request = require('request');
const steamTotp = require('steam-totp');
const colors = require('colors');
const path = require("path");
var async = require('async');
var fs = require("fs");

//Create null config
let config = null;

//Require other files (Also loading the config and bots)
var text = fs.readFileSync("./data/bots.txt").toString('utf-8');
config = require(path.resolve("config.json"));

//This is basically useless
//let configRaw = fs.readFileSync("./config.json").toString();

//Splitting the whole bots list into an array
var bot = text.split("\n")

//SteamID to report
const id = process.argv[2]
//How many reports per chunk
const perChunk = config.perChunk;
//The time we wait between each chunks (default is 8000ms = 8seconds)
const betweenChunks = config.betweenChunks;
//Accounts are limited or not
const limited = config.limited;

//Printing the targeted it to console
console.log('Target: %s'.gray, id);


//Define the two counter variables for reports and failed reports
var allSuccess = 0;
var allFailed = 0;

//Array where we define the reasons that get's send with a report
var reportReasonArray = ["R1", "R2"];

//Proxy stuff
var proxyArray = fs.readFileSync("./data/proxies.txt").toString().split("\n");
function getProxy()
{
	return proxyArray[Math.floor(Math.random() * proxyArray.length)];
}

(async () => {

	// Getting chunks:
	let subbot = [];
	if (process.argv[3] != 0) bot.length = process.argv[3];
	for (let i = 0; i < Math.ceil(bot.length / perChunk); i++) {
		subbot[i] = bot.slice((i * perChunk), (i * perChunk) + perChunk);
	}

	console.log('Total %s accounts and %s chunks'.cyan, bot.length, subbot.length);
	for (let ii = 0; ii < subbot.length; ii++) {

		var success = 0;
		var failed = 0;

		console.log(`===============================================================================================`.black);
		console.log(`Using Chunk #${ii+1}`.cyan);

		async.each(subbot[ii], function (item, callback) {

			let proxy = getProxy();
			console.log(`Using proxy: ${proxy}`);

			let proxyHost = proxy.split(":")[0];
			let proxyPort = proxy.split(":")[1];
			let proxyUser = proxy.split(":")[2];
			let proxyPass = proxy.split(":")[3];
			
			let newProxy = "http://" + proxyUser + ":" + proxyPass + "@" + proxyHost + ":" + proxyPort;
			var community = new steamCommunity({"request": Request.defaults({"proxy": newProxy})});

			if (!limited) {
				const logOnOptions = {
					accountName: item.split(":")[0],
					password: item.split(":")[1],
					twoFactorCode: steamTotp.generateAuthCode(item.split(":")[2]),
				};

				community.login({
					"accountName": logOnOptions.accountName,
					"password": logOnOptions.password,
					"twoFactorCode": logOnOptions.twoFactorCode
				},
					function (err, sessionID, cookies, steamguard, oAuthToken) {
						if (err) { console.log('Can\'t login with [%s] (Error: %s)'.red, logOnOptions.accountName, err.message); failed++; allFailed++; callback(); }
						if (!err) {
							(async () => {
								var reportReason = reportReasonArray[Math.floor(Math.random() * reportReasonArray.length)];
								console.log('Logged in with account [%s] (Session: %s)'.yellow, logOnOptions.accountName, sessionID);
								//console.log(`Reporting with reason: ${reportReason}`);
								var options = {
									timeout: 8000,
									formData: { sessionid: sessionID, json: 1, abuseID: id, eAbuseType: 14, abuseDescription: reportReason, ingameAppID: config.appid },
									headers: { Cookie: cookies, Host: 'steamcommunity.com', Origin: 'https://steamcommunity.com' },
									json: true
								};

								community.httpRequestPost(
									'https://steamcommunity.com/actions/ReportAbuse/', options,
									function (err, res, data) {
										if (err) {
											console.log('err', err); failed++; allFailed++;
										}
										if (!err) {
											if (data == 1) { console.log(`[${process.argv[2]}] a fost raportat de catre [%s] cu sucess am primit codul: %s`.green, logOnOptions.accountName, data); success++; allSuccess++; }
											else if (data == 25) { console.log('[%s] A fost deja raportat am primit codul: %s'.red, logOnOptions.accountName, data); failed++; allFailed++; }
											else { console.log('[%s] Something went wrong! (Error Code: %s)'.red, logOnOptions.accountName, data); failed++; allFailed++; }
											callback();
										}
									},
									"steamcommunity"
								);

							})();
						}
					});
			};
			if (limited) {
				const logOnOptions = {
					accountName: item.split(":")[0],
					password: item.split(":")[1]
				};

				community.login({
					"accountName": logOnOptions.accountName,
					"password": logOnOptions.password
				},
					function (err, sessionID, cookies, steamguard, oAuthToken) {
						if (err) { console.log('Can\'t login with [%s] (Error: %s)'.red, logOnOptions.accountName, err.message); failed++; allFailed++; callback(); }
						if (!err) {
							(async () => {
								var reportReason = reportReasonArray[Math.floor(Math.random() * reportReasonArray.length)];
								console.log('Logged in with account [%s] (Session: %s)'.yellow, logOnOptions.accountName, sessionID);
								//console.log(`Reporting with reason: ${reportReason}`);
								var options = {
									timeout: 8000,
									formData: { sessionid: sessionID, json: 1, abuseID: id, eAbuseType: 14, abuseDescription: reportReason, ingameAppID: config.appid },
									headers: { Cookie: cookies, Host: 'steamcommunity.com', Origin: 'https://steamcommunity.com' },
									json: true
								};

								community.httpRequestPost(
									'https://steamcommunity.com/actions/ReportAbuse/', options,
									function (err, res, data) {
										if (err) {
											console.log('err', err); failed++; allFailed++;
										}
										if (!err) {
											if (data == 1) { console.log(`[${process.argv[2]}] a fost raportat de catre [%s] cu sucess am primit codul: %s`.green, logOnOptions.accountName, data); success++; allSuccess++; }
											else if (data == 25) { console.log(`[${process.argv[2]}] A fost deja raportat am primit codul: %s`.red, data); failed++; allFailed++; }
											else { console.log('[%s] Something went wrong! (Error Code: %s)'.red, logOnOptions.accountName, data); failed++; allFailed++; }
											callback();
										}
									},
									"steamcommunity"
								);


							})();
						}
					});

			};
		}, function (err) {
			console.log('Chunk #%s terminated: Successfull reports: %s || Failed reports: %s'.white, ii + 1, success, failed);
			if (ii < subbot.length - 1) console.log('Waiting %sms for the next chunk to begin reporting!'.cyan, betweenChunks);
		});
		if (ii < subbot.length) await new Promise(r => setTimeout(r, betweenChunks));
	};
	console.log('Reporting finished! || All Successfull reports: %s || All failed reports: %s'.black.bgWhite, allSuccess, allFailed)


})();