const uuid = require('uuid')
const Joi = require('@hapi/joi')
const decoratorValidator = require('./utils/decoratorValidator')
const { enumParams } = require('./utils/globalEnum')

class Handler {
  constructor({ dynamoDbSvc }) {
    this.dynamoDbSvc = dynamoDbSvc
    this.dynamoTable = process.env.DYNAMODB_TABLE
  }

  static validator() {
    return Joi.object({
      nome: Joi.string().max(100).min(2).required(),
      poder: Joi.string().max(20).required()
    })
  }

  async insertItem(params) {
    return this.dynamoDbSvc.put(params).promise()
  }

  prepareData(data) {
    return {
      TableName: this.dynamoTable,
      Item: { 
        ...data,
        id: uuid.v1(),
        createAt: new Date().toISOString()
      }
    }
  }

  handlerSuccess(data) {
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    }
  }

  handlerError(data) {
    return {
      statusCode: data.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Couldn\'t create item!!'
    }
  }

  async main(event) {
    try {
      const data = event.body
      const dbParams = this.prepareData(data)
      await this.insertItem(dbParams)

      return this.handlerSuccess(dbParams.Item)
    } catch (error) {
      console.error('ERROR**', error.stack)
      return this.handlerError({ statusCode: 500 })
    }
  }
}

const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()
const handler = new Handler({
  dynamoDbSvc: dynamoDB
})



module.exports = decoratorValidator(
  handler.main.bind(handler),
  Handler.validator(),
  enumParams.ARG_TYPE.BODY
)