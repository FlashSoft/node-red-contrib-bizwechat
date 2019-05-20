const crypto = require('crypto')
const fs = require('fs')
const UrlResolve = require('url').resolve
const Xml2js = require('xml2js')
const WXBizMsgCrypt = require('wechat-crypto')
const axios = require('axios')
const mkdirp = require('mkdirp')
const marked = require('marked')
const os = require('os')
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
    const { corpid, corpsecret, agentid} = this.config
    return new Promise(async (resolve, reject) => {
      try {
        const cache_key = `wechat-${agentid}`
        //修改缓存token逻辑,用于可以使用多个应用进行推送
        const cache = getCache(cache_key)
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
        setCache(cache_key, {
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
  // 发送主动消息
  pushMessage (data) {
    return new Promise(async (resolve, reject) => {
      try {
        const { agentid } = this.config
        const { title, description, touser, url } = data
        const access_token = await this.getToken()
        const sendData = {
          msgtype: 'textcard',
          agentid,
          touser,
          textcard: { title, description, url }
        }
        const result = await axios.post(`https://qyapi.weixin.qq.com/cgi-bin/message/send`, sendData, {
          params: { access_token }
        }).catch(err => {
          throw new Error(`[微信推送]${err}`)
        })
        if (result.data.errcode != null && result.data.errcode != 0) {
          const msg = WeChatCode[result.data.errcode] || result.data.errmsg
          throw (new Error(`[微信推送]${msg}`))
        }
        resolve(data)
      } catch (err) { reject(err) }
    })
  }
  pushbearMessage (data) {
    return new Promise(async (resolve, reject) => {
      try {
        const { url } = this.config

        // 处理pushbear数据

        data.markdown = data.description
        data.html = data.description = marked(data.description)

        const { title, description } = data

        const date = new Date()
        const datePath = `${date.getFullYear()}-${date.getMonth() + 1}`
        const parentDir = `${os.homedir()}/.node-red/pushbear/${datePath}`
        // 创建存储目录
        mkdirp.sync(parentDir)
        // 计算文件名并存储
        const content = JSON.stringify({ title, description, time: new Date().valueOf() })
        const fileName = crypto.createHash('md5').update(JSON.stringify(content)).digest('hex')
        fs.writeFileSync(`${parentDir}/${fileName}.txt`, content)
        // 生成网络URL
        data.url = `${UrlResolve(url, `/pushbear/${datePath}`)}/${fileName}`

        // 发送主动消息
        const noHtml = description.replace(/<\/?[^>]*>/g, '').replace(/\n/g, '。').substr(0, 100)
        data.description = noHtml
        await this.pushMessage(data)
        data.description = data.markdown
        resolve(data)
      } catch (err) { reject(err) }
    })
  }
}

module.exports = WechatClass
