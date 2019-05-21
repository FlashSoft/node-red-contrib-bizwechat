const WXBizMsgCrypt = require('wechat-crypto')
const express = require('express')

const WeChat = require('./lib/WeChat')
const Baidu = require('./lib/Baidu')
const {pushBearRouter, indexHtml} = require('./pushbear')

module.exports = RED => {
  // 输入节点
  RED.nodes.registerType('bizwechat-input', class {
    constructor (config) {
      const node = this
      RED.nodes.createNode(node, config)

      const biz_config = RED.nodes.getNode(config.bizwechat)
      // console.log('in biz_config', biz_config)

      const cryptor = new WXBizMsgCrypt(biz_config.token, biz_config.aeskey, biz_config.corpid)
      const wx = new WeChat(node, biz_config, cryptor)
      const bd = new Baidu(node, biz_config)

      const app = express()

      // 接收消息主逻辑
      app.all('/', async (req, res) => {
        if (req.method == 'GET') {
          // === 回调校验用 ==========
          const sVerifyEchoStr = decodeURIComponent(req.query.echostr)
          if (req.query.msg_signature == cryptor.getSignature(req.query.timestamp, req.query.nonce, sVerifyEchoStr)) {
            res.send(cryptor.decrypt(sVerifyEchoStr).message)
          } else {
            res.status(200).send(indexHtml)
          }
        } else {
          // === 正常通讯消息 ==========
          try {
            const message = await wx.getMessage(req)
            console.log(`receive message: ${JSON.stringify(message)}`)
            if (message.MsgType == 'voice' && biz_config.client_id && biz_config.client_id) {
              const amr = await wx.getMedia(message.MediaId)
              const asr = await bd.getAsr(amr)
              message.AsrContent = asr
              console.log(`asr result: ${asr}`)
            }
            node.status({ text: `${message.MsgType}(${message.MsgId})` })
            node.send({ res, req, config: biz_config, message })
          } catch (err) {
            node.status({ text: err.message, fill: 'red', shape: 'ring' })
            node.warn(err)
            res.end('')
          }
        }
      })
      // pushbear逻辑
      app.use('/pushbear', pushBearRouter)

      // 404
      app.use((req, res, next) => {
        res.status(404).end('')
      })

      const server = app.listen(biz_config.port, () => {
        node.status({ text: `port: ${biz_config.port}`, fill: 'green', shape: 'dot' })
        node.log(`listening on port ${biz_config.port}`)
      })
      server.on('error', ({ message }) => { node.status({ text: message, fill: 'red', shape: 'ring' }) })
      node.on('close', () => server.close())
    }
  })
  // 输出节点
  RED.nodes.registerType('bizwechat-output', class {
    constructor (config) {
      const node = this
      RED.nodes.createNode(node, config)

      const biz_config = RED.nodes.getNode(config.bizwechat)
      // console.log('out biz_config', biz_config)

      node.on('input', data => {
        const { res, message, payload } = data
        const { FromUserName, ToUserName } = message
        const cryptor = new WXBizMsgCrypt(biz_config.token, biz_config.aeskey, biz_config.corpid)
        const wx = new WeChat(node, biz_config, cryptor)
        if (payload) {
          console.log(`revert message: ${payload}`)
          res.end(wx.getSendXML(FromUserName, ToUserName, `${payload}`))
        } else {
          console.log('no revert')
          res.end('')
        }
      })
    }
  })

  // 输出推送
  RED.nodes.registerType('bizwechat-pushbear', class {
    constructor (config) {
      const node = this
      RED.nodes.createNode(node, config)
      const biz_config = RED.nodes.getNode(config.bizwechat)
      node.on('input', async data => {
        try {
          const cryptor = new WXBizMsgCrypt(biz_config.token, biz_config.aeskey, biz_config.corpid)
          const wx = new WeChat(node, biz_config, cryptor)

          // 合并值,未细想
          for (const key in config) { if (config[key] != '' && config[key ] != null) { data[key] = config[key] } }
          data.description = data.description || data.payload
          data.touser = data.touser || '@all'
          data.url = data.url || 'https://bbs.iobroker.cn'

          // 发送pushbear类型消息
          await wx.pushbearMessage(data)

          node.status({ text: `发送成功:${data._msgid}` })
          node.send(data)
        } catch (err) {
          node.status({ text: err.message, fill: 'red', shape: 'ring' })
          node.warn(err)
        }
      })
    }
  })
}
