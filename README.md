基于企业微信的一对多消息送达服务-完美替代pushbear
----

因为`Pushbear`遭到的很多人的滥用及无聊人士的举报，造成该服务将在五月底下线，对比表示非常伤心。  
![图片](https://raw.githubusercontent.com/FlashSoft/node-red-contrib-bizwechat/master/images/1.png)

经过各位伙伴探索发现可以使用企业微信完美实现此想服务，经过[flashsoft 大佬](https://github.com/FlashSoft/)，[F 大佬](https://github.com/Lumy88)和[smarthomefans 组织](https://github.com/smarthomefans) 多日努力，发布`node-red-contrib-bizwechat 1.0.3` 版本，基本已经可以完美替代 `pushbear`  ，本教程由[iobroker首发](https://bbs.iobroker.cn/forum.php?mod=viewthread&tid=118&page=1&extra=#pid226)

![图片](https://raw.githubusercontent.com/FlashSoft/node-red-contrib-bizwechat/master/images/2.jpg)




node-red-contrib-bizwechat 
---
企业微信推送有以下优点：  
* 自建服务，除非企业微信停服
* 可以接收用户发送的`文字` `语音`(配置百度已经自动转换文字了) 等等
* 更好的私密性

但是同时具有最大的缺点就是：**需要你有公网服务**


手摸手从零开始教程
----
* 注册企业微信

注册地址如下[https://work.weixin.qq.com/wework_admin/register_wx](https://work.weixin.qq.com/wework_admin/register_wx), 没啥要求，随意注册即可使用

* 创建应用

![图片](https://raw.githubusercontent.com/FlashSoft/node-red-contrib-bizwechat/master/images/3.png)

![图片](https://raw.githubusercontent.com/FlashSoft/node-red-contrib-bizwechat/master/images/4.png)

* 获取配置信息  
直接进入应用里面可以获取到*AgentId* *Secret*  
![图片](https://raw.githubusercontent.com/FlashSoft/node-red-contrib-bizwechat/master/images/5.png)

*接收消息* 模块中有*设置API接收*，用来设置企业微信请求的*URL* *Token* *EncodingAESKey*  
![图片](https://raw.githubusercontent.com/FlashSoft/node-red-contrib-bizwechat/master/images/6.png)

*企业id* 在*我的企业*最下面可以找到  
![图片](https://raw.githubusercontent.com/FlashSoft/node-red-contrib-bizwechat/master/images/7.png)

* 安装 node-red节点

```js

node-red-contrib-bizwechat
```

* 配置节点信息

节点分为 *服务端*，*输出*， *推送*    
  1. 服务端： 用来接收企业微信发来的信息，你可以在后面获取企业微信发过来的信息，但是同时你`需要给它反馈`不然它认为你没有收到，重复发送三次，*只是确认收到消息，直接返回一个空，即msg.payload = ''*
  2. 输出： 用于返回`服务端`信息，一般跟在`服务端`后面，不可以单独使用
  3. 推送: 发送消息给指定的人或多个人，默认为*群发*，指定人是通过*通讯录里面的账号*， 可以自行查看

* bizwechat 配置信息
一下信息可以从上面说明如何获取， 填写百度语音配置时，会自动把企业微信发过来的语音消息转换为文字，可以输出信息看一下

![图片](https://raw.githubusercontent.com/FlashSoft/node-red-contrib-bizwechat/master/images/8.png)

* 测试服务状态   
1. 访问你的机器`ip:节点里面的端口`， 出现一下界面表示服务正常   
2. 访问你外网的地址，出现相同的界面表示外网访问也正常

![图片](https://raw.githubusercontent.com/FlashSoft/node-red-contrib-bizwechat/master/images/9.png)




范例流程
---

```json
[{"id":"8de36836.2ad578","type":"tab","label":"流程9","disabled":false,"info":""},{"id":"d2cfbe29.54fd9","type":"debug","z":"8de36836.2ad578","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":401,"y":246,"wires":[]},{"id":"f1a926c1.47a0c8","type":"bizwechat-input","z":"8de36836.2ad578","name":"1","bizwechat":"66803d6f.5417b4","x":209,"y":391,"wires":[["d2cfbe29.54fd9","5b134336.fa0bec"]]},{"id":"c022aade.b76af8","type":"bizwechat-output","z":"8de36836.2ad578","name":"","bizwechat":"66803d6f.5417b4","x":748,"y":314,"wires":[]},{"id":"5b134336.fa0bec","type":"function","z":"8de36836.2ad578","name":"","func":"\nmsg.payload = \"\"\nreturn msg;","outputs":1,"noerr":0,"x":486,"y":329,"wires":[["c022aade.b76af8"]]},{"id":"2976594b.99a2e6","type":"bizwechat-pushbear","z":"8de36836.2ad578","name":"","bizwechat":"66803d6f.5417b4","touser":"","toparty":"测试","title":"修改标题","description":"","x":510,"y":509,"wires":[["d2cfbe29.54fd9"]]},{"id":"e89a3e0a.48d71","type":"inject","z":"8de36836.2ad578","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":194,"y":507,"wires":[["d34c6f27.c06ed"]]},{"id":"d34c6f27.c06ed","type":"function","z":"8de36836.2ad578","name":"","func":"\nmsg.payload = `我们为记录思想和分享知识提供更专业的工具。 您可以使用 Cmd Markdown：\n\n> * 整理知识，学习笔记\n> * 发布日记，杂文，所见所想\n> * 撰写发布技术文稿（代码支持）\n> * 撰写发布学术论文（LaTeX 公式支持）\n\n![cmd-markdown-logo](https://www.zybuluo.com/static/img/logo.png)`\nreturn msg;","outputs":1,"noerr":0,"x":365,"y":509,"wires":[["2976594b.99a2e6"]]},{"id":"66803d6f.5417b4","type":"bizwechat-configurator","z":"","name":"","port":"3001","corpid":"wxc9daffb2cdab64b1","agentid":" ","corpsecret":" ","url":"","token":" ","aeskey":" ","client_id":"","client_secret":""}]
```

































