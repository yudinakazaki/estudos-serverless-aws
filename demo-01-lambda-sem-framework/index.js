const handler = (event, context) => {
  // @ts-ignore
  console.log('Ambiente...', JSON.stringify(process.env, null, 2))
  console.log('Event', JSON.stringify(event, null, 2))

  return {
    Hey: "Jude!"
  }
}

module.exports = {
  handler
}