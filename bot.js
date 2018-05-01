const Jimp = require("jimp")
const Twit = require("twit")
const fs = require('fs')
const config = require("./config.json")
let tweetsNbr = 0

const T = new Twit({
    consumer_key:         config.tw_consumer_key,
    consumer_secret:      config.tw_consumer_secret,
    access_token:         config.tw_token,
    access_token_secret:  config.tw_token_secret, 
})

let stream = T.stream('statuses/filter', {track: '@' + config.tw_user})

stream.on("tweet", tweet => {
    if (tweet.entities.media != null) {
        if (tweetsNbr < 16) {
            let frame = Jimp.read("pictures/frame.png"),
            background = Jimp.read(tweet.entities.media[0].media_url)

            Promise.all([frame, background]).then(images => {
                images[0].resize(images[1].bitmap.width, images[1].bitmap.height)
                images[1].resize(images[1].bitmap.width - ((images[1].bitmap.width * 8.356 / 100) + (images[1].bitmap.width * 8.561 / 100)), images[1].bitmap.height - ((images[1].bitmap.height * 10.955 / 100) + (images[1].bitmap.height * 11.506 / 100)))
                images[0].composite(images[1],images[0].bitmap.width * 8.350 / 100, images[0].bitmap.height * 10.966 / 100)
                .write("framed.png", (err, imgB64) => {
                    var b64content = fs.readFileSync('framed.png', { encoding: 'base64' })
                    T.post("media/upload", {media_data: b64content}, (err, data, res) => {
                        let mediaIdStr = data.media_id_string
                        let altText = "Awesome framed picture"
                        let meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

                        T.post('media/metadata/create', meta_params, (err, data, response) => {
                            let params = {in_reply_to_status_id: tweet.id_str, status: "@" + tweet.user.screen_name + " Voilà l'image encadrée !", media_ids: [mediaIdStr]}

                            T.post("statuses/update", params, (err, data, res) => {
                                console.log("Reponse envoyée à @" + tweet.user.screen_name + " !")
                            })
                        })
                    })
                })
            })
        } else {
            console.log("Rate limit atteinte !")
        }
    }
})

setInterval(() => {
    tweetsNbr = 0
}, 900000)



