const Jimp = require("jimp")
const Twit = require("twit")
const fs = require('fs')
const config = require("./config.json")

const T = new Twit({
    consumer_key:         config.tw_consumer_key,
    consumer_secret:      config.tw_consumer_secret,
    access_token:         config.tw_token,
    access_token_secret:  config.tw_token_secret, 
})

let stream = T.stream('statuses/filter', {track: '@' + config.tw_user})

stream.on("tweet", tweet => {
    if (tweet.entities.media != null) {
        let frame = Jimp.read("pictures/frame.png"),
        background = Jimp.read(tweet.entities.media[0].media_url)

        Promise.all([frame, background]).then(images => {
            images[0].resize(images[1].bitmap.width, images[1].bitmap.height)
            images[1].composite(images[0], 0, 0,)
            .write("framed.png", (err, imgB64) => {
                var b64content = fs.readFileSync('framed.png', { encoding: 'base64' })
                T.post("media/upload", {media_data: b64content}, (err, data, res) => {
                    console.log(data)
                    let mediaIdStr = data.media_id_string
                    let altText = "Awesome framed picture"
                    let meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

                    T.post('media/metadata/create', meta_params, (err, data, response) => {
                        let params = {in_reply_to_status_id: tweet.id_str, status: "@" + tweet.user.screen_name + " Voilà l'image encadrée !", media_ids: [mediaIdStr]}

                        T.post("statuses/update", params, (err, data, res) => {
                            console.log("Reponse envoyée !")
                        })
                    })
                })
            })
        })
    }
})



