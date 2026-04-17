/* global $, md5 */

let removeSelector, addition, customNickColor, channelName, provider;

let totalMessages = 0;
let messagesLimit = 0;
let nickColor = "user";
let hideAfter = 60;
let ignoredUsers = [];
let previousSender = "";
let longMessageLength = 300;
let longMessageAction = "truncate";
let crosshatchBG = true;
let sparklez = false;

let testColor = "#BA74FC";
let selectedTestBadge = [];
let selectedTestBadgeID = "";

const animationIn = 'slideInUp';
const animationOut = 'slideOutDown';

const defaultImages = {
	normal: {
		left: "https://cdn.streamelements.com/uploads/01kn444zyjkh43y6h6r7dstvfe.png",
		center: "https://cdn.streamelements.com/uploads/01kn44509sh7vvgrsxa9vbwahr.png",
		right: "https://cdn.streamelements.com/uploads/01kn44503j1aj7s1pf5hp2j1sk.png"
	}
};


const testBadges = {
	broadcaster: {
		"type": "broadcaster",
		"version": "1",
		"url": "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3",
		"description": "Broadcaster"
	},
	moderator: {
		"type": "moderator",
		"version": "1",
		"url": "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1",
		"description": "Moderator"
	},
	vip: {
		"type": "vip",
		"version": "1",
		"url": "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/1",
		"description": "VIP"
	},

	"artist-badge": {
		"type": "artist-badge",
		"version": "1",
		"url": "https://static-cdn.jtvnw.net/badges/v1/4300a897-03dc-4e83-8c0e-c332fee7057f/1",
		"description": "Artist"
	},

	subscriber: {
		"type": "subscriber",
		"version": "0",
		"url": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/1",
		"description": "Subscriber"
	}
};


function doTestMessage(){
	const emulated = new CustomEvent("onEventReceived", {
		detail: {
			listener: "message", event: {
				service: "twitch",
				data: {
					time: Date.now(),
					tags: {
						"badge-info": "",
						"badges": selectedTestBadgeID,
						"client-nonce": "a2f1cefaeb1d48faa55dc94ab9ff4fb2",
						"color": testColor,
						"display-name": "Multarix",
						"emotes": "",
						"first-msg": "0",
						"flags": "",
						"id": "38281a1c-f094-4c72-9642-a78f4d2d7a65",
						"mod": "0",
						"returning-chatter": "0",
						"room-id": "38639565",
						"subscriber": "0",
						"tmi-sent-ts": "1775127276981",
						"turbo": "0",
						"user-id": "38639565",
						"user-type": ""
					},
					nick: channelName,
					userId: "100135110",
					displayName: channelName,
					displayColor: testColor,
					badges: [
						selectedTestBadge
					],
					channel: channelName,
					text: "Howdy! My name is Bill and I am here to serve Kappa",
					isAction: false,
					emotes: [{
						type: "twitch",
						name: "Kappa",
						id: "25",
						gif: false,
						urls: {
							1: "https://static-cdn.jtvnw.net/emoticons/v1/25/1.0",
							2: "https://static-cdn.jtvnw.net/emoticons/v1/25/1.0",
							4: "https://static-cdn.jtvnw.net/emoticons/v1/25/3.0"
						},
						start: 46,
						end: 50
					}],
					msgId: "43285909-412c-4eee-b80d-89f72ba53142"
				},
				renderedText: 'Howdy! My name is Bill and I am here to serve <img src="https://static-cdn.jtvnw.net/emoticons/v1/25/1.0" srcset="https://static-cdn.jtvnw.net/emoticons/v1/25/1.0 1x, https://static-cdn.jtvnw.net/emoticons/v1/25/1.0 2x, https://static-cdn.jtvnw.net/emoticons/v1/25/3.0 4x" title="Kappa" class="emote">'
			}
		}
	});
	window.dispatchEvent(emulated);
}


window.addEventListener('onEventReceived', function(obj){
	if(obj.detail.event.listener === 'widget-button'){
		if(obj.detail.event.field === 'testMessage') return doTestMessage();
	}


	if(obj.detail.listener === "delete-message"){
		const msgId = obj.detail.event.msgId;
		$(`[data-msgid=${msgId}]`).remove();
		return;
	} else if(obj.detail.listener === "delete-messages"){
		const sender = obj.detail.event.userId;
		$(`.message-row[data-sender=${sender}]`).remove();
		return;
	}


	if(obj.detail.listener !== "message") return;
	const data = obj.detail.event.data;
	console.log(data);

	if(data.text.startsWith("!")) return;
	if(data.text.length > longMessageLength && longMessageAction === "hide") return;

	if(ignoredUsers.indexOf(data.nick) !== -1) return;

	const message = attachEmotes(data);

	// Badges
	let badges = "", badge;
	if(provider === 'mixer') data.badges.push({ url: data.avatar });

	for(let i = 0; i < data.badges.length; i++){
		badge = data.badges[i];
		badges += `<img alt="" src="${badge.url}" class="badge ${badge.type}-icon"> `;
	}


	// Nickname Color
	let username = data.displayName;
	if(nickColor === "user"){
		const color = data.displayColor !== "" ? data.displayColor : "#" + (md5(username).slice(26));
		username = `<span style="color:${color}">${username}</span>`;
	}
	if(nickColor === "custom"){
		const color = customNickColor;
		username = `<span style="color:${color}">${username}</span>`;
	}
	if(nickColor === "remove") username = '';

	let imageSet = getPrimaryBadge(data.badges);
	if(!defaultImages[imageSet]) imageSet = "normal"; // Extra Fallback

	addMessage(username, badges, message, data.isAction, data.userId, data.msgId, imageSet);
	previousSender = data.userId;
});

// Widget load, apply settings.
window.addEventListener('onWidgetLoad', function(obj){
	const fieldData = obj.detail.fieldData;
	hideAfter = fieldData.hideAfter;
	messagesLimit = fieldData.messagesLimit;
	nickColor = fieldData.nickColor;
	customNickColor = fieldData.customNickColor;
	channelName = obj.detail.channel.username;
	longMessageLength = fieldData.maxMessageLength;
	longMessageAction = fieldData.longMessageAction;
	crosshatchBG = fieldData.chatBubbleCrossHatch;
	sparklez = fieldData.chatBubbleSparkles;

	if(fieldData.testBadge !== "none"){
		selectedTestBadge = testBadges[fieldData.testBadge];
		selectedTestBadgeID = `${fieldData.testBadge}/1`;
	}
	testColor = fieldData.testColor;

	setupImages(fieldData);


	fetch('https://api.streamelements.com/kappa/v2/channels/' + obj.detail.channel.id + '/').then(response => response.json()).then((profile) => {
		provider = profile.provider;
	});

	if(fieldData.alignMessages === "block"){
		addition = "prepend";
		removeSelector = ".message-row:nth-child(n+" + (messagesLimit + 1) + ")";
	} else {
		addition = "append";
		removeSelector = ".message-row:nth-last-child(n+" + (messagesLimit + 1) + ")";
	}

	ignoredUsers = fieldData.ignoredUsers.toLowerCase().replace(" ", "").split(",");
});


// Extracting the default images
function setupImages(fieldData){
	if(fieldData["regularLeft"]) defaultImages.normal.left = fieldData["regularLeft"];
	if(fieldData["regularCenter"]) defaultImages.normal.center = fieldData["regularCenter"];
	if(fieldData["regularRight"]) defaultImages.normal.right = fieldData["regularRight"];

	defaultImages.subscriber = {};
	defaultImages.subscriber.left = (fieldData["subscriberLeft"]) ? fieldData["subscriberLeft"] : defaultImages.normal.left;
	defaultImages.subscriber.center = (fieldData["subscriberCenter"]) ? fieldData["subscriberCenter"] : defaultImages.normal.center;
	defaultImages.subscriber.right = (fieldData["subscriberRight"]) ? fieldData["subscriberRight"] : defaultImages.normal.right;

	defaultImages.artist = {};
	defaultImages.artist.left = (fieldData["vipLeft"]) ? fieldData["vipLeft"] : defaultImages.normal.left;
	defaultImages.artist.center = (fieldData["vipCenter"]) ? fieldData["vipCenter"] : defaultImages.normal.center;
	defaultImages.artist.right = (fieldData["vipRight"]) ? fieldData["vipRight"] : defaultImages.normal.right;

	defaultImages.vip = {};
	defaultImages.vip.left = (fieldData["artistLeft"]) ? fieldData["artistLeft"] : defaultImages.normal.left;
	defaultImages.vip.center = (fieldData["artistCenter"]) ? fieldData["artistCenter"] : defaultImages.normal.center;
	defaultImages.vip.right = (fieldData["artistRight"]) ? fieldData["artistRight"] : defaultImages.normal.right;

	defaultImages.moderator = {};
	defaultImages.moderator.left = (fieldData["modLeft"]) ? fieldData["modLeft"] : defaultImages.normal.left;
	defaultImages.moderator.center = (fieldData["modCenter"]) ? fieldData["modCenter"] : defaultImages.normal.center;
	defaultImages.moderator.right = (fieldData["modRight"]) ? fieldData["modRight"] : defaultImages.normal.right;

	defaultImages.broadcaster = {};
	defaultImages.broadcaster.left = (fieldData["broadcasterLeft"]) ? fieldData["broadcasterLeft"] : defaultImages.normal.left;
	defaultImages.broadcaster.center = (fieldData["broadcasterCenter"]) ? fieldData["broadcasterCenter"] : defaultImages.normal.center;
	defaultImages.broadcaster.right = (fieldData["broadcasterRight"]) ? fieldData["broadcasterRight"] : defaultImages.normal.right;
}

// ChatGPT generated, for simple badge identification
function getPrimaryBadge(badges){
	const PRIORITY = [
		"broadcaster",
		"lead_moderator",
		"moderator",
		"artist-badge",
		"vip",
		"subscriber"
	];

	for(const type of PRIORITY){
		if(badges.some(b => b.type === type)){
			return type;
		}
	}

	return null; // or "default"
}


// Handling Emoji's
function attachEmotes(message){
	let messageText = message.text;
	if(message.text.length > longMessageLength && longMessageAction === "truncate") messageText = messageText.slice(0, longMessageLength).trim() + "...";

	let text = html_encode(messageText);
	const data = message.emotes;
	if(typeof message.attachment !== "undefined"){
		if(typeof message.attachment.media !== "undefined"){
			if(typeof message.attachment.media.image !== "undefined"){
				text = `${message.text}<img src="${message.attachment.media.image.src}">`;
			}
		}
	}

	return text
		.replace(
			/([^\s]*)/gi,
			function(m, key){
				const result = data.filter(emote => {
					return html_encode(emote.name) === key;
				});
				if(typeof result[0] !== "undefined"){
					const url = result[0]['urls'][1];
					if(provider === "twitch"){
						return `<img class="emote" " src="${url}"/>`;
					} else {
						if(typeof result[0].coords === "undefined"){
							result[0].coords = { x: 0, y: 0 };
						}
						const x = parseInt(result[0].coords.x);
						const y = parseInt(result[0].coords.y);

						let width = "{emoteSize}px";
						let height = "auto";

						if(provider === "mixer"){
							console.log(result[0]);
							if(result[0].coords.width){
								width = `${result[0].coords.width}px`;
							}
							if(result[0].coords.height){
								height = `${result[0].coords.height}px`;
							}
						}
						return `<div class="emote" style="width: ${width}; height:${height}; display: inline-block; background-image: url(${url}); background-position: -${x}px -${y}px;"></div>`;
					}
				} else {
					return key;
				}

			}
		);
}


function html_encode(e){
	return e.replace(/[<>"^]/g, function(e){
		return "&#" + e.charCodeAt(0) + ";";
	});
}


function determinePosition(xPosition, sizeAvail){
	const third = sizeAvail / 3;
	if(xPosition + 150 < third) return "left";
	if(xPosition + 150 > third && xPosition + 150 < third * 2) return "center";
	return "right";
}


function addMessage(username, badges, message, isAction, uid, msgId, imageSet){
	totalMessages += 1;
	let actionClass = "";
	if(isAction) actionClass = "action";


	// const sizeAvail = document.getElementById("main").clientWidth;
	const sizeAvail = 1920;
	const maxX = sizeAvail - 300;

	const xPosition = Math.floor(Math.random() * (maxX + 1));
	const position = determinePosition(xPosition, sizeAvail);
	const bearIcon = defaultImages[imageSet][position];

	const extraClasses = [];
	if(crosshatchBG) extraClasses.push("crosshatch");
	if(sparklez) extraClasses.push("sparklez");

	const element = $.parseHTML(`
	<div data-sender="${uid}" data-msgid="${msgId}" class="message-row ${animationIn} animated ${position}" id="msg-${totalMessages}" style="left: ${xPosition}px; z-index: ${msgId}">
		<div class="message-box ${extraClasses.join(" ")}">
			<div class="user-box ${actionClass}">${badges}${username}</div>
			<div class="user-message ${actionClass}">${message}</div>
		</div>
		<img class="popup-image" src="${bearIcon}">
	</div>`);

	if(addition === "append"){
		if(hideAfter !== 999){
			$(element).appendTo('.main-container').delay(hideAfter * 1000).queue(function(){
				$(this).removeClass(animationIn).addClass(animationOut).delay(1000).queue(function(){
					$(this).remove();
				}).dequeue();
			});
		} else {
			$(element).appendTo('.main-container');
		}
	} else if(hideAfter !== 999){
		$(element).prependTo('.main-container').delay(hideAfter * 1000).queue(function(){
			$(this).removeClass(animationIn).addClass(animationOut).delay(1000).queue(function(){
				$(this).remove();
			}).dequeue();
		});
	} else {
		$(element).prependTo('.main-container');
	}

	if(totalMessages > messagesLimit){
		removeRow();
	}
}


function removeRow(){
	if(!$(removeSelector).length){
		return;
	}
	if(animationOut !== "none" || !$(removeSelector).hasClass(animationOut)){
		if(hideAfter !== 999){
			$(removeSelector).dequeue();
		} else {
			$(removeSelector).addClass(animationOut).delay(1000).queue(function(){
				$(this).remove().dequeue();
			});

		}
		return;
	}

	$(removeSelector).animate({
		height: 0,
		opacity: 0
	}, 'slow', function(){
		$(removeSelector).remove();
	});
}
