var marked = require('marked');
var a = `我们为记录思想和分享知识提供更专业的工具。 您可以使用 Cmd Markdown：

> * 整理知识，学习笔记
> * 发布日记，杂文，所见所想
> * 撰写发布技术文稿（代码支持）
> * 撰写发布学术论文（LaTeX 公式支持）

![cmd-markdown-logo](https://www.zybuluo.com/static/img/logo.png)`
var b = marked(a)
var msg = b.replace(/<\/?[^>]*>/g, '')

msg=msg.replace(/\n/g, "。")
console.log(msg)
console.log('=========================')
console.log(b)
console.log('=========================')
console.log(msg.substr(0, 100))