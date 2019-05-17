module.exports = (RED) => {
  RED.nodes.registerType('bizwechat-configurator', class {
    constructor (config) {
      RED.nodes.createNode(this, config)
      Object.assign(this, config)
      // console.log('configurator config', config)
    }
  })
}
