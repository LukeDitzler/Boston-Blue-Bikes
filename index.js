const Koop = require('koop')

const config = {
  app: {
    name: 'blue-bikes-koop'
  },
  port: 8080
}

const koop = new Koop(config)

// Register BlueBikes provider
const BlueBikesProvider = require('./providers/bluebikes')
koop.register(BlueBikesProvider)

koop.server.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`)
})