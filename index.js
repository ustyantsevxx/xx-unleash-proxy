const { createApp } = require('@unleash/proxy')
const express = require('express')
const mung = require('express-mung')
const morgan = require('morgan')

const PORT = 4243

const app = express()

app.use(morgan('combined'))

app.use((req, res, next) => {
  if (!req.query.remoteAddress && req.socket.remoteAddress) {
    // req.socket.remoteAddress has this format "::ffff:[ip]", so split
    req.query.remoteAddress = req.socket.remoteAddress.split(':').pop()
  }

  next()
})

app.use(
  mung.json((body, req) => {
    if (req.method === 'GET' && body.toggles && req.query.appName) {
      return {
        toggles: body.toggles
          .filter(toggle => {
            const prefix = toggle.name.split('.')[0]
            return prefix === req.query.appName
          })
          .map(toggle => ({
            ...toggle,
            name: toggle.name.replace(`${req.query.appName}.`, '')
          }))
      }
    }
  })
)

createApp(
  {
    unleashUrl: process.env.UNLEASH_API_URL,
    unleashApiToken: process.env.UNLEASH_API_TOKEN,
    proxySecrets: [process.env.UNLEASH_API_SECRET]
  },
  undefined,
  app
)

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Unleash Proxy listening on http://localhost:${PORT}/proxy`)
})
