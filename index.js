//DONT HAVE THE BOT POST IN THE GROUP IT WILL BREAK THINGS

var config = require('./config.js')

var API = require('groupme').Stateless

var messageCount = 4000;
var topLikeCount = 3;//top n people that like your messages

var memberIDMap = {
	//id: name
	"system": "GroupMe",
	"361735": "DataBot"//remove this line
}

var likeMap = {
	/*id: {
		
		likers: {
			likerId: likes
			
			...
		},
		likeCount
		messageCount: # messages
		messagesLiked: # messages
	}*/
}

API.Users.me(config.ACCESS_TOKEN, function(err,ret) {
	if (!err) {
		console.log("Your user id is", ret.id, "and your name is", ret.name);
	}
});

var messageArray = []//0 is newest

API.Messages.index(config.ACCESS_TOKEN, config.GROUP_ID, {}, function(e, r){
	

	console.log(r)
})

function getMessages(opts, callback){
	if(messageArray.length >= messageCount)
		return callback()

	API.Messages.index(config.ACCESS_TOKEN, config.GROUP_ID, opts, function(e, r){
		messageArray = messageArray.concat(r.messages)

		var newOpts = {before_id: r.messages[r.messages.length - 1].id}

		getMessages(newOpts, callback)
	})
}


function startMessageScraping() {


	for(member in memberIDMap)
		likeMap[member] = {
			name: memberIDMap[member],
			likers: {},
			messageCount: 0,
			likeCount: 0,
			messagesLiked: 0
		}

	getMessages({}, function(e, r){
		// console.log("All done")
		// console.log(messageArray)
		// console.log(messageArray.length)

		for(var i = 0; i < messageArray.length; i++){
			var posterId = messageArray[i].sender_id

			if(messageArray[i].favorited_by.length != 0){
				likeMap[posterId].likeCount += messageArray[i].favorited_by.length
				// console.log(posterId in Object.keys(likeMap))
				// console.log(posterId in Object.keys(memberIDMap))
				try{
					for(var j = 0; j < messageArray[i].favorited_by.length; j++){
						likeMap[posterId].likers[messageArray[i].favorited_by[j]] = (likeMap[posterId].likers[messageArray[i].favorited_by[j]] || 0) + 1
						likeMap[messageArray[i].favorited_by[j]].messagesLiked++
					}	
				} catch (ex) {
					// console.log("ERROR",posterId, messageArray[i])
				}
			}

			likeMap[posterId].messageCount++
		}
			
		formatLikeMap()
	})
}

API.Groups.show(config.ACCESS_TOKEN, config.GROUP_ID, function(e, r){
	// console.log(r)
	var members = r.members

	for(var i = 0; i < members.length; i++){
		memberIDMap[members[i].user_id] = members[i].nickname
	}

	startMessageScraping()
})

var statMap = {
	likeCount: function(memberID){
		return {
			name: "Total Likes Received",
			val: likeMap[memberID].likeCount
		}
	},
	totalLiked: function(memberID){
		return {
			name: "Total Likes Given",
			val: likeMap[memberID].messagesLiked
		}
	},
	totalMessages: function(memberID){
		return {
			name: "Total Messages Sent",
			val: likeMap[memberID].messageCount
		}
	},
	likeCountPerMessage: function(memberID){
		var ratio = likeMap[memberID].likeCount / likeMap[memberID].messageCount

		return {
			name: "Likes Received per Messages Sent",
			val: parseInt(ratio * 100) / 100
		}
	},
	topLikers: function(memberID){
		var likers = likeMap[memberID].likers

		var rankedList = Object.keys(likers).sort(function(a, b){
			return likers[b] - likers[a]
		})

		var val = ""

		for(var i = 0; i < topLikeCount; i++){
			var percentage = likers[rankedList[i]] / likeMap[memberID].likeCount
			percentage = (parseInt(percentage * 100)) + "%"
			val += memberIDMap[rankedList[i]] + " (" + likers[rankedList[i]] + "; " + percentage + "), "
		}

		return {
			name: "Top " + topLikeCount + " Fans",
			val: val.substring(0, val.length - 2)
		}
	}
}

function formatLikeMap(){
	//stats to output
	/*
	total likes
	total messages
	total likes/messages
	total likes given out
	top 3 people that like your stuff
	
	*/
	console.log("Stats from the last " + messageCount + " messages")
	for(memberID in likeMap){
		console.log("User: " + memberIDMap[memberID])
		
		for(var f in statMap){
			var results = statMap[f](memberID)
			console.log("\t" + results.name + ": " + results.val)
		}
	}
}






// API.Members.results(config.ACCESS_TOKEN, config.GROUP_ID, {}, function(e, r){
// 	console.log("Member res")
// 	console.log(r)
// })