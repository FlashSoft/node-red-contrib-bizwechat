const fs = require('fs')
const express = require('express')
const router = express.Router();
const WXBizMsgCrypt = require('wechat-crypto')
const Xml2js = require('xml2js')
const pushbearRouter = require('./pushbear');
const axios = require('axios')
const wechatCode = require('./lib/code/bizwechat')
const baiduvopCode = require('./lib/code/baiduvop')

// 获取企业微信token
const getWechatToken = async ({ corpid, corpsecret }) => new Promise(async (resolve, reject) => {
  try {
    const { data } = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: { corpid, corpsecret }
    }).catch(err => {
      throw new Error(`[微信Token]:${err}`)
    })
    if (data.errcode != 0) {
      const msg = wechatCode[data.errcode] || data.errmsg
      throw (new Error(`[微信Token]${msg}`))
    }
    resolve(data.access_token)
  } catch (err) { reject(err) }
})
// 获取企业微信媒体内容
const getWechatMedia = async (config, media_id) => new Promise(async (resolve, reject) => {
  try {
    const access_token = await getWechatToken(config)
    const result = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/media/get', {
      params: { access_token, media_id },
      responseType: 'arraybuffer'
    }).catch(err => {
      throw new Error(`[微信媒体]${err}`)
    })
    if (result.data.errcode != null && result.data.errcode != 0) {
      const msg = wechatCode[result.data.errcode] || result.data.errmsg
      throw (new Error(`[微信媒体]${msg}`))
    }
    if (result.headers['error-msg']) {
      const msg = wechatCode[result.headers['error-code']] || result.headers['error-msg']
      throw (new Error(`[微信媒体]${msg}`))
    }
    resolve(result.data)
  } catch (err) { reject(err) }
})
// 获取百度token
const getBaiduToken = async ({ client_id, client_secret }) => new Promise(async (resolve, reject) => {
  try {
    const { data } = await axios.get('https://aip.baidubce.com/oauth/2.0/token', {
      params: { grant_type: 'client_credentials', client_id, client_secret }
    }).catch(err => {
      throw new Error(`[百度Token]${err}`)
    })
    if (!data.access_token) {
      reject(new Error('[百度Token]token获取失败'))
    }
    resolve(data.access_token)
  } catch (err) { reject(err) }
})
// 获取百度Asr结果
const getBaiduAsr = async (config, amr) => new Promise(async (resolve, reject) => {
  try {
    const token = await getBaiduToken(config)
    const { data } = await axios.post('https://vop.baidu.com/server_api', amr, {
      params: { dev_pid: 1537, token, cuid: 12345 },
      headers: { 'Content-Type': 'audio/amr;rate=8000' }
    }).catch(err => {
      throw new Error(`[百度Asr]${err}`)
    })
    if (data.err_no > 0) {
      const msg = baiduvopCode[data.err_no] || data.err_msg
      throw new Error(`[百度Asr]${msg}`)
    }
    resolve(data.result)
  } catch (err) { reject(err) }
})

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
  }, (err, result) => resolve(result.xml, err))
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
  const cryptor = new WXBizMsgCrypt(config.token, config.aeskey, config.corpid)
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
  
  router.all('/', async (req, res, next) => {
    const method = req.method
    const sVerifyMsgSig = req.query.msg_signature
    const sVerifyTimeStamp = req.query.timestamp
    const sVerifyNonce = req.query.nonce
    const sVerifyEchoStr = decodeURIComponent(req.query.echostr)
    const cryptor = new WXBizMsgCrypt(config.token, config.aeskey, config.corpid)
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
  app.use('/', router)
  app.use('/pushbear', pushbearRouter)


  app.use(function(req, res, next) {
    next(createError(404));
  });
  
  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });
  return app.listen(config.port, () => {
    node.status({ text: `port: ${config.port}`, fill: 'green', shape: 'dot' })
    node.log(`listening on port ${config.port}`)
  })
}
module.exports = RED => {
  // 输入节点
  RED.nodes.registerType('bizwechat-input', class {
    constructor (config) {
      const node = this
      RED.nodes.createNode(node, config)

      // 从配置服务里获取信息
      const bizwechat_config = RED.nodes.getNode(config.bizwechat)

      console.log('in config', bizwechat_config)

      // 建立server
      const server = createServer(bizwechat_config, node, async (res, req, message) => {
        try {
          console.log(`receive message: ${JSON.stringify(message)}`)
          if (message.MsgType == 'voice') {
            const amr = await getWechatMedia(bizwechat_config, message.MediaId)
            const asr = await getBaiduAsr(bizwechat_config, amr)
            console.log('ASR内容', asr)
            message.asr = asr && asr[0]
          }
          node.status({ text: `${message.MsgType}(${message.MsgId})` })
          node.send({ res, req, config: bizwechat_config, message })
        } catch (err) {
          node.status({ text: err.message, fill: 'red', shape: 'ring' })
          node.warn(err)
          res.end('')
        }
      })

      server.on('error', ({ message }) => {
        node.status({ text: message, fill: 'red', shape: 'ring' })
      })
      // 节点关闭时关闭server
      node.on('close', () => server.close())
    }
  })
  // 输出节点
  RED.nodes.registerType('bizwechat-output', class {
    constructor (config) {
      const node = this
      RED.nodes.createNode(node, config)
      // console.log('out config', config)
      node.on('input', ({ res, req, payload, config: input_config, message }) => {
        // console.log('out input_config', input_config)
        const { FromUserName, ToUserName } = message
        // 发送反馈信息
        if (payload) {
          console.log(`revert message: ${payload}`)
          res.end(getSendXML(input_config, FromUserName, ToUserName, `${payload}`))
        } else {
          console.log('no revert')
          res.end('')
        }
      })
    }
  })
}
