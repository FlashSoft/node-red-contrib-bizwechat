const express = require('express')
class Server {
  constructor (port, callback) {
    const app = express()
    const server = app.listen(port, callback)
    this.app = app
    this.server = server
  }
  use (...args) { this.app.use(...args) }
  on (...args) { this.server.on(...args) }
  close (...args) { this.server.close(...args) }
}
module.exports = Server
