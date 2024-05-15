const axios = require('axios')
const FormData = require('form-data')

class SttClass {
  constructor (node, config) {
    this.node = node
    this.config = config
  }
  
  getAsr (amr) {
    return new Promise(async (resolve, reject) => {
      try {
        const  param = new FormData()
        param.append('file', amr, {'filename': `${new Date().getTime()}.speex`, contentType: 'voice/speex'})
        param.append('model', 'small')
        param.append('language', 'zh')
        param.append('response_format', 'json')

        const headers = param.getHeaders()
        const { data } = await axios.post(this.config.stt,param, {
          headers
        }).catch(err => {
          console.log(err)
          throw new Error(`[Stt Asr]${err}`)
        })
        if (data.code > 0) {
          throw new Error(`[Stt Asr] error`)
        }

        resolve(data.data[0].text)
      } catch (err) {
        console.log(err)
         reject(err) }
    })
  }
}
module.exports = SttClass
