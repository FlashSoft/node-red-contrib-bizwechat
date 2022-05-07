const express = require('express')
const pushBearRouter = express.Router()

const os = require('os')
const fs = require('fs')
const util = require('util')
const readAsync = util.promisify(fs.readFile)

pushBearRouter.get('/:date/:id', async (req, res, next) => {
  const content = await getSendTemplate(req)
  res.status(200).end(content)
})

const getSendTemplate = async (req) => {
  let title = 'hello'
  let content = 'test'
  let time = '刚刚'
  const rootDir = os.homedir()
  const path = `${rootDir}/.node-red/pushbear/${req.params.date}/${req.params.id}.txt`
  try {
    const data = await readAsync(path)
    const fileContent = JSON.parse(data)
    title = fileContent.title
    content = fileContent.description
    const _date = new Date(fileContent.time)
    time = _date.toLocaleString()
  } catch (err) {
    title = '文件不存在'
    content = '请确认文件是否删除'
    time = ''
  }

  return `
<!DOCTYPE html>
<html lang="zh-cn">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <!-- Required meta tags always come first -->

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <link rel="icon" type="image/png" href="https://pushbear.ftqq.com/assets/img/pbicon.small.png">
  <title>消息阅读 | PushBear</title>
  <!-- Bootstrap CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.2.0/dist/css/bootstrap.min.css">


  <link rel="stylesheet" type="text/css" href="https://pushbear.ftqq.com/assets/css/app.css">

  <link rel="stylesheet" type="text/css" href="https://pushbear.ftqq.com/assets/css/yue.css">

  <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
  <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
  <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
        <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->
  <style>
    /* Sticky footer styles
-------------------------------------------------- */
    html {
      position: relative;
      min-height: 100%;
    }

    body {
      /* Margin bottom by footer height */
      margin-bottom: 60px;
    }
    
    table td, table th {
      border: 1px solid #dfe2e5;
      padding: 6px 13px;
    }

    .footer {
      position: absolute;
      bottom: 0;
      width: 100%;
      /* Set the fixed height of the footer here */
      height: 60px;
      background-color: #f5f5f5;
    }

    img {
      max-width: 100%;
    }


    /* Custom page CSS
-------------------------------------------------- */
    /* Not required for template or sticky footer method. */

    .container {
      width: auto;
      max-width: 680px;
      padding: 0 15px;
    }

    .container .text-muted {
      margin: 20px 0;
    }
  </style>
</head>

<body>
  <!-- Begin page content -->
  <div class="container">
    <div class="page-header">
      <h1>${title}</h1>
    </div>
    <div>时间:${time}</div>
    <div class="yue">
      <p>${content}</p>
    </div>
  </div>
  <footer class="footer">
    <div class="container">
      <p class="text-muted">本消息由 <a href="https://github.com/FlashSoft/node-red-contrib-bizwechat">bizwechat</a> <img
          src="https://pushbear.ftqq.com/assets/img/pbicon.png" width="16"> 为您投递，<a
          href="https://bbs.iobroker.cn/">私人定制智能家居</a></p>
    </div>
  </footer>


</body>
</html>`
}

const indexHtml = `<!DOCTYPE html>
<html>
<head>
    <title>bizwechat</title>
    <style>
        body {padding: 50px;font: 14px "Lucida Grande", Helvetica, Arial, sans-serif;}
        a {color: #00B7FF;}
    </style>
</head>
<body>
    <h2>bizwechat(企业微信版本的pushbear)</h2>
    <p>欢迎使用由 <a href="https://github.com/FlashSoft/">flashsoft 大佬 </a> ,<a href="https://github.com/Lumy88">F 大佬 </a> ,
        <a href="https://github.com/smarthomefans">smarthomefans</a>
        提供的企业微信版本的<strong>pushbear</strong>。如果你看到这个界面证明你已经安装成功了
    </p>
    <p>如需发现更多好玩的智能家居玩法<a href="https://bbs.iobroker.cn">请访问这里</a></p>
</body>
</html>`

module.exports = { pushBearRouter, indexHtml }

