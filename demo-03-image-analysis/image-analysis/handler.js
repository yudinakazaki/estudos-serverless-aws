'use strict';

const { get } = require('axios')

class Handler {
  constructor({ rekoSvc, translatorSvc }) {
    this.rekoSvc = rekoSvc
    this.translatorSvc = translatorSvc 
  }

  async detecImageLabels(buffer) {
    const result = await this.rekoSvc.detectLabels({
      Image: {
        Bytes: buffer
      }
    }).promise()

    const workingItems = result.Labels
      .filter(({ Confidence }) => Confidence > 80)

    const names = workingItems.map(({ Name }) => Name).join(' and ')
    
    return { workingItems, names }
  }

  async translateText (text) {
    const params = {
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'pt',
      Text: text
    }

    const { TranslatedText } = await this.translatorSvc
                            .translateText(params)
                            .promise()

    return TranslatedText.split(' e ')
  }

  formatTextResults (texts, workingItems) {
    const finalText = []
    for(const indexText in texts) {
      const nameInPortuguese = texts[indexText]
      const conficence = workingItems[indexText].Confidence

      finalText.push(
        `${conficence.toFixed(2)}% de ser do tipo ${nameInPortuguese}`
      )
    }

    return finalText
  }

  async getImageBuffer (imageUrl) {
    const response = await get(imageUrl, {
      responseType: 'arraybuffer'
    })

    return Buffer.from(response.data, 'base64')
  }

  async main (event) {
    try {
      const { imageUrl } = event.queryStringParameters

      console.log('Downloading image...')
      const imageBuffer = await this.getImageBuffer(imageUrl)

      console.log('Detecting labels...')
      const { workingItems, names } = await this.detecImageLabels(imageBuffer)
    
      console.log('Translating to portuguese...')
      const texts = await this.translateText(names)

      console.log('Handling final object..')
      const finalText = this.formatTextResults(texts, workingItems)
 
      console.log('Finishing...')

      return {
        statusCode: 200,
        body: `A imagem tem\n `.concat(finalText)
      }
    } catch (error) {
      console.log('Error**', error.stack)

      return {
        statusCode: 500,
        body: 'Internal server error!'
      }
    }
  }
}

const aws = require('aws-sdk')
const reko = new aws.Rekognition()
const traslator = new aws.Translate()
const handler = new Handler({
  rekoSvc: reko,
  translatorSvc: traslator
})

module.exports.main = handler.main.bind(handler)