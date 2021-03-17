# Glimesh-Chat-Lib

This was modified to work with [AnyGameCounter](https://www.anygamecounter.com)'s Chat bot, original can be found made by [CactusDev](https://github.com/CactusDev/glimesh-chat).

## Usage

```node

const ClientId = ""; // Your App's ClientId
const Token = ""; // Your App's Token
const Channel = ""; // Your channel's username

const Glimesh = require("glimesh-chat-lib")
const chat = new Glimesh.GlimeshChat({
	token: Token,
	clientId: ClientId,
	debug: false // Outputs heartbeat logs if true.
})

function Connect(){
	chat.connect(Channel).then(meta => {
		chat.on("message", msg => {
			console.log(msg)
			// msg displays the following when a message is said in chat.
			//{
  			//	id: '992089',
  			//	message: 'test',
  			//	tokens: [ { text: 'test', type: 'text' } ],
  			//	user: { id: '23821', username: 'GG2015' }
			//}
			
			if(msg.message == "!close"){
				chat.close() // This !close command will turn the bot off
			}
    	})
		chat.on("close", event => {
			console.log(event)
			//if(event == 1005){ // Uncomment these lines if you want to test out the reconnect function with !close command.
			//	chat.connect(Channel) 
			//}
			if(event == 1006){
				chat.connect(Channel) // If Abnormal disconnect (1006), Glimesh Bot reconnects.
			}
		})
	})
}
Connect() // Initiates connection to Glimesh's WS Server.

```

## Credits

[Glimesh](https://github.com/Glimesh)<br>
[aMythos](https://glimesh.github.io/api-docs/)<br>
[CactusDev](https://github.com/CactusDev)
