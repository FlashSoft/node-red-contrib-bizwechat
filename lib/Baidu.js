const axios = require('axios')
const BaiduCode = require('./BaiduCode')

const EXPIRE_TIME = 1000 * 3600 * 2

class BaiduClass {
  constructor (node, config) {
    this.node = node
    this.config = config
  }
  getToken () {
    const { set: setCache, get: getCache } = this.node.context().global
    const { client_id, client_secret } = this.config
    return new Promise(async (resolve, reject) => {
      try {
        const cache = getCache('baidu')
        if (cache && cache.time && ((new Date().valueOf() - cache.time) < EXPIRE_TIME)) {
          // console.log('has cache', cache)
          resolve(cache.token)
          return
        }
        const { data } = await axios.get('https://aip.baidubce.com/oauth/2.0/token', {
          params: { grant_type: 'client_credentials', client_id, client_secret }
        }).catch(err => {
          throw new Error(`[百度Token]${err}`)
        })
        if (!data.access_token) {
          reject(new Error('[百度Token]token获取失败'))
        }
        setCache('baidu', {
          token: data.access_token,
          time: new Date().valueOf()
        })
        resolve(data.access_token)
      } catch (err) { reject(err) }
    })
  }
  getAsr (amr) {
    return new Promise(async (resolve, reject) => {
      try {
        const token = await this.getToken()
        const { data } = await axios.post('https://vop.baidu.com/server_api', amr, {
          params: { dev_pid: 1537, token, cuid: 12345 },
          headers: { 'Content-Type': 'audio/amr;rate=8000' }
        }).catch(err => {
          throw new Error(`[百度Asr]${err}`)
        })
        if (data.err_no > 0) {
          const msg = BaiduCode[data.err_no] || data.err_msg
          throw new Error(`[百度Asr]${msg}`)
        }
        resolve(data.result)
      } catch (err) { reject(err) }
    })
  }
}
module.exports = BaiduClass
