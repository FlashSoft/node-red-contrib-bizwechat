# 这个是一个简易版本的企业微信转发用的NR节点

没教程,谁帮写个手摸手教程吧



## 测试的NR流
```
[
    {
        "id": "85733239.9ac91",
        "type": "bizwechat-input",
        "z": "4cc2a712.3a16e8",
        "name": "",
        "bizwechat": "da7f61cb.d08a1",
        "x": 360,
        "y": 300,
        "wires": [
            [
                "de43bab0.798258",
                "4e227e06.53481"
            ]
        ]
    },
    {
        "id": "f32785a7.0aced8",
        "type": "bizwechat-output",
        "z": "4cc2a712.3a16e8",
        "name": "",
        "bizwechat": "da7f61cb.d08a1",
        "x": 690,
        "y": 300,
        "wires": []
    },
    {
        "id": "de43bab0.798258",
        "type": "debug",
        "z": "4cc2a712.3a16e8",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "x": 690,
        "y": 220,
        "wires": []
    },
    {
        "id": "4e227e06.53481",
        "type": "template",
        "z": "4cc2a712.3a16e8",
        "name": "",
        "field": "payload",
        "fieldType": "msg",
        "format": "handlebars",
        "syntax": "mustache",
        "template": "This is the payload",
        "output": "str",
        "x": 520,
        "y": 300,
        "wires": [
            [
                "f32785a7.0aced8"
            ]
        ]
    },
    {
        "id": "bbf629c6.f00a38",
        "type": "debug",
        "z": "4cc2a712.3a16e8",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "x": 750,
        "y": 480,
        "wires": []
    },
    {
        "id": "8b6dbb34.398a48",
        "type": "inject",
        "z": "4cc2a712.3a16e8",
        "name": "",
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "x": 280,
        "y": 480,
        "wires": [
            [
                "3c2aba00.edd6e6"
            ]
        ]
    },
    {
        "id": "fd46d142.8953f",
        "type": "bizwechat-pushbear",
        "z": "4cc2a712.3a16e8",
        "name": "",
        "bizwechat": "da7f61cb.d08a1",
        "touser": "",
        "toparty": "",
        "title": "22222",
        "description": "# Welcome\n\nThank you for choosing **Typora**. This document will help you to start Typora.\n\n[TOC]\n\n## Live Preview\n\n**Typora** use the feature: *Live Preview*, meaning that you could see these inline styles after you finish typing, and see block styles when you type or after you press `Enter` key or focus to another paragraph. Just try to type some markdown in typora, and you would see how it works.\n\n**Note**: Markdown tags for inline styles, such as `**` will be hidden or displayed smartly. Markdown tags for block level styles, such as `###` or `- [x]` will be hidden once the block is rendered.\n\n## Markdown For Typora\n\n**Typora** is using [GitHub Flavored Markdown](https://help.github.com/articles/github-flavored-markdown/), For more detail, please open [Markdown Reference](Markdown%20Reference.md).\n\nTo see full markdown Syntax references and extra usage, please check `Help`->`Markdown Reference` in menu bar.\n\n## Useful Shortcuts\n\n#### Writing Assist Key\n\n`Esc` key will trigger assistant behavior, like open inline preview for inline math, auto-complete for emoji, etc. More behavior will be supported in future.\n\n#### Actions\n\n- Select word: cmd+D\n- Delete word: shift+cmd+D\n- Select line/sentence: cmd+L\n- Select row in table: cmd+L\n- Add row in table: cmd+Enter\n- Select Styled Scope (or cell in a table) cmd+E\n- Jump to selection: cmd+J\n- Jump to Top: cmd+\n- Jump To Bottom: cmd+↓\n- Increase/decrease heading level from `<p>` to `<h1>`: cmd+-/+\n- New line: shift+Return\n- Move table row/column: ⌘ + ⌃ + arrow key.\n\n#### Styles\n\nPlease check the `Paragraph` and `Format` menu in menu bar.\n\n#### Custom Shortcut Keys\n\nMost shortcut keys are configurable, see [this document](Custom-Key-Binding/) for detail.\n\n## Outline\n\nMouse over the windows toolbar and click the outline icon on the right top of the window can open outline panel. This Panel can be pinned to left side.\n\n## Word Count\n\nMouse over the windows toolbar will make word count visible. \"Always show word count\" can be set from preference panel. Click it will popup detailed word count tooltip. If a range of text is selected word count for selection will also be displayed on word count tooltip.\n\n## Quick Open\n\nCurrently Typora only provides a simple \"Quick Open\" function. Recent opened files, files from same folder or context folder (like a git repository) will be include in quick open file list. This features replies on OS X Spotlight to work correctly.\n\n## Copy\n\nWe create typora and want to make it your default markdown editor, thus copy and paste means copy from another app or paste to another app, instead of *copy/paste from/to another markdown editor*. Therefore, by default, `Copy` means `Copy As HTML` ( and `Paste` means `Paste from HTML`). \n\nHowever, after click \"**Copy Markdown source by default**\", typora will copy selected text in HTML/markdown format (When pasting, rich editors will accept the HTML format, while plain text / code editor will accept the markdown source code format).\n\nTo **copy Markdown source code** explicitly, please use shortcut key `shift+cmd+c` or `Copy as Markdown` from menu. To **Copy as HTML Code**, please select `Copy as HTML Code` from menu.\n\n## Smart Paste\n\n**Typora** is able to analyze styles of the text content in your clipboard when pasting. For example, after pasting a `<h1>HEADING</h1>` from some website, typora will keep the 'first level heading’ format instead of paste ‘heading’ as plain text. \n\nTo **paste as markdown source** or plain text, you should use `paste as plain text` or press the shortcut key: `shift+cmd+v`.\n\n## Themes\n\nPlease refer to `Help` → `Custom Themes` from menu bar.\n\n## Publish\n\nCurrently Typora only support to export as **PDF** or **HTML**. More data format support as import/export will be integrated in future.\n\n## Command Line Tool\n\nTo lunch typora from Terminal, you could add\n\n```bash\nalias typora=\"open -a typora\"\n```\n\nin your `.bash\\_profile` or other configuration file, then you would be able to do `typora file.md` for opening files by typora from shell/terminal.\n\n## More Useful Tips & Documents\n\n<http://support.typora.io/>\n\n## And More ?\n\nFor more questions or feedbacks, please contact us by:\n\n- Home Page: http://typora.io\n- Email: <hi@typora.io>\n- Twitter [@typora](https://twitter.com/typora)\n\nWe opened a Github issue page in case you want to start a discussion or as an alternative way to report bugs/suggestions: https://github.com/typora/typora-issues/issues",
        "x": 600,
        "y": 480,
        "wires": [
            [
                "bbf629c6.f00a38"
            ]
        ]
    },
    {
        "id": "3c2aba00.edd6e6",
        "type": "function",
        "z": "4cc2a712.3a16e8",
        "name": "",
        "func": "msg.title='ttttttitle'\nmsg.payload ='pppayload'\nmsg.gooooooo=11111\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 430,
        "y": 480,
        "wires": [
            [
                "fd46d142.8953f"
            ]
        ]
    },
    {
        "id": "da7f61cb.d08a1",
        "type": "bizwechat-configurator",
        "z": "",
        "name": "小兔兔",
        "port": "9981",
        "corpid": "ww1557413ccf421c1c",
        "agentid": "1000002",
        "corpsecret": "TbDIwMP8jcB4AV2PYVo11T56gDpZ0dLaj409KV9ouyQ",
        "url": "http://wx3.flashsoft.cn:8080/",
        "token": "eb1jWwD2TOONTYDLNRSAVF",
        "aeskey": "86FmKAA5omnAB4o8d1ryMW1LDkaiAe4vS967FjR8158",
        "client_id": "fGs6Li4ZWGUdl79h7cLX8d75",
        "client_secret": "YdcyIlatFItl9lGhSZWr6EkA7gSkhGT4"
    }
]
```
