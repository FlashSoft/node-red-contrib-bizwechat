const WXBizMsgCrypt = require('wechat-crypto')
const express = require('express')

const WeChat = require('./lib/WeChat')
const Baidu = require('./lib/Baidu')
const Stt = require('./lib/Stt')
const { pushBearRouter, indexHtml } = require('./pushbear')

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
      const stt = new Stt(node, biz_config)

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
            }else if (message.MsgType == 'voice' && biz_config.stt) {
              const startTime = new Date().getTime()
              const amr = await wx.getMedia(message.MediaId)
              const asr = await stt.getAsr(amr)
              message.AsrContent = asr
              message.AsrTime = new Date().getTime() - startTime
              console.log(`asr result: ${asr} times: ${message.AsrTime}`)
            }
            node.status({ text: `${message.MsgType}(${message.MsgId})` })
            node.send({ res, req, config: biz_config, message })

            setTimeout(() => {
              node.status({ text: `3.9秒超时自动应答`, fill: 'red', shape: 'ring' })
              res.end('')
            }, 3900)
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
          for (const key in config) { if (config[key] != '' && config[key] != null) { data[key] = config[key] } }
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

  // 网页内容
  RED.nodes.registerType('bizwechat-template', class {
    constructor (config) {
      const node = this
      RED.nodes.createNode(node, config)
      const biz_config = RED.nodes.getNode(config.bizwechat)
      node.on('input', data => {
        try {
          const cryptor = new WXBizMsgCrypt(biz_config.token, biz_config.aeskey, biz_config.corpid)
          const wx = new WeChat(node, biz_config, cryptor)

          // 合并值,未细想
          for (const key in config) { if (config[key] != '' && config[key] != null) { data[key] = config[key] } }
          data.description = data.description || data.payload

          // 网页内容 存储

          wx.pushbearTemplate(data)

          node.status({ text: `发送成功:${data._msgid}` })
          node.send(data)
        } catch (err) {
          node.status({ text: err.message, fill: 'red', shape: 'ring' })
          node.warn(err)
        }
      })
    }
  })

  // push
  RED.nodes.registerType('bizwechat-push', class {
    constructor (config) {
      const node = this
      RED.nodes.createNode(node, config)

      const biz_config = RED.nodes.getNode(config.bizwechat)
      // console.log('out biz_config', biz_config)

      node.on('input', async data => {
        const { payload, image, type, filename } = data
        const cryptor = new WXBizMsgCrypt(biz_config.token, biz_config.aeskey, biz_config.corpid)
        const wx = new WeChat(node, biz_config, cryptor)

        try {
          // 如果存在 image 属性，证明可能需要临时素材上传
          // filename 如果不存在，随机生成
          // type 默认为图片
          
          let mediaInfo
          if (image && payload && (payload.msgtype === 'video' || payload.msgtype === 'mpnews')) {
            const t = type || 'image'
            const f = filename || `${new Date().toLocaleString()}-${(Math.random() * 100).toFixed()}.jpg`
            mediaInfo = await wx.uploadMedia({ file: image, type: t, filename: f })
            // console.log(mediaInfo)
            if (payload.msgtype === 'video') {
              if (payload && payload.video ) {
                payload.video.media_id = mediaInfo.media_id
              }
            }else if(payload.msgtype === 'mpnews') {
              if (payload && payload.mpnews && payload.mpnews.articles) {
                payload.mpnews.articles.thumb_media_id = mediaInfo.media_id
              }
            }
          }
          // 发送用户自定义数据类型消息
          await wx.pushMessage(payload)
          node.status({ text: `发送成功:${data._msgid}` })
          node.send(data)
        } catch (err) {
          node.status({ text: err.message, fill: 'red', shape: 'ring' })
          node.warn(err)
        }
      })
    }
  })

  // upload
  RED.nodes.registerType('bizwechat-upload', class {
    constructor (config) {
      const node = this
      RED.nodes.createNode(node, config)

      const biz_config = RED.nodes.getNode(config.bizwechat)
      // console.log('out biz_config', biz_config)

      node.on('input', async data => {
        const { payload, type, filename } = data
        const cryptor = new WXBizMsgCrypt(biz_config.token, biz_config.aeskey, biz_config.corpid)
        const wx = new WeChat(node, biz_config, cryptor)

        try {
          // 上传临时素材
          const result = await wx.uploadMedia({ file: payload, type, filename })
          node.status({ text: `上传成功:${data._msgid}` })
          data.payload = result
          node.send(data)
        } catch (err) {
          node.status({ text: err.message, fill: 'red', shape: 'ring' })
          node.warn(err)
        }
      })
    }
  })
}
