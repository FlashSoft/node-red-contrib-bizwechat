const express = require('express')
const WXBizMsgCrypt = require('wechat-crypto')
const Xml2js = require('xml2js')

// 接收数据
const receiveData = async (req) => new Promise(resolve => {
  const buffer = []
  req.on('data', trunk => buffer.push(trunk))
  req.on('end', trunk => resolve(Buffer.concat(buffer).toString('utf-8')))
})
// 解析XML成Json
const parseXML = async (xml) => new Promise(resolve => {
  Xml2js.parseString(xml, {
    trim: true,
    explicitArray: false,
    ignoreAttrs: true
  }, (err, result) => resolve(result.xml))
})
// 生成回复消息
const getReplyXML = (from, to, msg) => {
  return `
  <xml>
    <ToUserName><![CDATA[${from}]]></ToUserName>
    <FromUserName><![CDATA[${to}]]></FromUserName>
    <CreateTime>${new Date().getTime()}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${msg}]]></Content>
  </xml>
  `
}
// 生成加密回复消息
const getSendXML = (config, fromUsername, toUsername, msg) => {
  const xml = getReplyXML(fromUsername, toUsername, msg)
  const cryptor = new WXBizMsgCrypt(config.token, config.aeskey, config.cropid)
  const encrypt = cryptor.encrypt(xml)
  const nonce = parseInt((Math.random() * 100000000000), 10)
  const timestamp = new Date().getTime()
  const signature = cryptor.getSignature(timestamp, nonce, encrypt)
  return `
  <xml>
    <Encrypt><![CDATA[${encrypt}]]></Encrypt>
    <MsgSignature><![CDATA[${signature}]]></MsgSignature>
    <TimeStamp>${timestamp}</TimeStamp>
    <Nonce><![CDATA[${nonce}]]></Nonce>
  </xml>
  `
}
// 创建服务
const createServer = (config, node, callback = () => {}) => {
  const app = express()
  app.use('/', async (req, res) => {
    const method = req.method
    const sVerifyMsgSig = req.query.msg_signature
    const sVerifyTimeStamp = req.query.timestamp
    const sVerifyNonce = req.query.nonce
    const sVerifyEchoStr = decodeURIComponent(req.query.echostr)
    const cryptor = new WXBizMsgCrypt(config.token, config.aeskey, config.cropid)
    if (method == 'GET') {
      // === 回调校验用 ==========
      const MsgSig = cryptor.getSignature(sVerifyTimeStamp, sVerifyNonce, sVerifyEchoStr)
      if (sVerifyMsgSig == MsgSig) {
        const sEchoStr = cryptor.decrypt(sVerifyEchoStr).message
        res.send(sEchoStr)
      } else {
        res.send('服务正常')
      }
    } else {
      // === 正常通讯消息 ==========
      // 接收消息
      const message = await receiveData(req)
      // 解析xml数据
      const result = await parseXML(message)
      // 解密消息
      const decrypt_message = cryptor.decrypt(result.Encrypt)
      // 解析消息xml数据
      const json_message = await parseXML(decrypt_message.message)
      // 回调解析的消息
      callback(res, req, json_message)
    }
  })
  return app.listen(config.port, () => {
    node.status({
      text: `port: ${config.port}`,
      fill: 'green',
      shape: 'dot'
    })
    node.log(`listening on port ${config.port}`)
  })
}
module.exports = RED => {
  // 输入节点
  RED.nodes.registerType('bizwechat-input', class {
    constructor(config) {
      const node = this
      RED.nodes.createNode(node, config)
      console.log('in config', config)
      // 建立server
      const server = createServer(config, node, (res, req, message) => node.send({
        res,
        req,
        config,
        message
      }))
      server.on('error', ({
        message
      }) => {
        node.status({
          text: message,
          fill: 'red',
          shape: 'ring'
        })
      })
      // 节点关闭时关闭server
      node.on('close', () => server.close())
    }
  })
  // 输出节点
  RED.nodes.registerType("bizwechat-output", class {
    constructor(config) {
      const node = this
      RED.nodes.createNode(node, config)
      // console.log('out config', config)
      node.on('input', ({
        res,
        req,
        payload,
        config: input_config,
        message
      }) => {
        // console.log('out input_config', input_config)
        const {
          FromUserName,
          ToUserName
        } = message
        // 发送反馈信息
        res.status(200).end(getSendXML(input_config, FromUserName, ToUserName, `${payload}`))
        node.log(JSON.stringify(message))
      })
    }
  })
}