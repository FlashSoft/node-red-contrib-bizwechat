const Xml2js = require('xml2js')
const WXBizMsgCrypt = require('wechat-crypto')
const axios = require('axios')

const WeChatCode = require('./WeChatCode')

const EXPIRE_TIME = 1000 * 3600 * 2

class WechatClass {
  constructor (node, config, cryptor) {
    this.node = node
    this.config = config
    this.cryptor = cryptor
  }
  receiveData (req) {
    return new Promise(resolve => {
      const buffer = []
      req.on('data', trunk => buffer.push(trunk))
      req.on('end', trunk => resolve(Buffer.concat(buffer).toString('utf-8')))
    })
  }
  parseXML (xml) {
    return new Promise(resolve => {
      Xml2js.parseString(xml, {
        trim: true,
        explicitArray: false,
        ignoreAttrs: true
      }, (err, result) => resolve(result.xml, err))
    })
  }
  getReplyXML (from, to, msg) {
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
  getSendXML (fromUsername, toUsername, msg) {
    const { token, aeskey, corpid } = this.config
    const xml = this.getReplyXML(fromUsername, toUsername, msg)
    const cryptor = new WXBizMsgCrypt(token, aeskey, corpid)
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
  getToken () {
    const { set: setCache, get: getCache } = this.node.context().global
    const { corpid, corpsecret } = this.config
    return new Promise(async (resolve, reject) => {
      try {
        const cache = getCache('wechat')
        if (cache && cache.time && ((new Date().valueOf() - cache.time) < EXPIRE_TIME)) {
          // console.log('has cache', cache)
          resolve(cache.token)
          return
        }
        const { data } = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
          params: { corpid, corpsecret }
        }).catch(err => {
          throw new Error(`[微信Token]:${err}`)
        })
        if (data.errcode != 0) {
          const msg = WeChatCode[data.errcode] || data.errmsg
          throw (new Error(`[微信Token]${msg}`))
        }
        setCache('wechat', {
          token: data.access_token,
          time: new Date().valueOf()
        })
        resolve(data.access_token)
      } catch (err) { reject(err) }
    })
  }
  getMedia (media_id) {
    return new Promise(async (resolve, reject) => {
      try {
        const access_token = await this.getToken()
        const result = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/media/get', {
          params: { access_token, media_id },
          responseType: 'arraybuffer'
        }).catch(err => {
          throw new Error(`[微信媒体]${err}`)
        })
        if (result.data.errcode != null && result.data.errcode != 0) {
          const msg = WeChatCode[result.data.errcode] || result.data.errmsg
          throw (new Error(`[微信媒体]${msg}`))
        }
        if (result.headers['error-msg']) {
          const msg = WeChatCode[result.headers['error-code']] || result.headers['error-msg']
          throw (new Error(`[微信媒体]${msg}`))
        }
        resolve(result.data)
      } catch (err) { reject(err) }
    })
  }
  async getMessage (req) {
    // 接收消息
    const message = await this.receiveData(req)
    // 解析xml数据
    const result = await this.parseXML(message)
    // 解密消息
    const decrypt_message = this.cryptor.decrypt(result.Encrypt)
    // 解析消息xml数据
    const json_message = await this.parseXML(decrypt_message.message)
    return json_message
  }
}

module.exports = WechatClass
