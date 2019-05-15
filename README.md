# 这个是一个简易版本的企业微信转发用的NR节点

没教程,谁帮写个手摸手教程吧



## 测试的NR流
```
[
    {
        "id": "7277f4f3.dbc25c",
        "type": "bizwechat-output",
        "z": "4a24f524.02204c",
        "x": 490,
        "y": 280,
        "wires": []
    },
    {
        "id": "71582f07.cdaac",
        "type": "function",
        "z": "4a24f524.02204c",
        "name": "",
        "func": "msg.payload = '我是NR的的消息'\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 320,
        "y": 280,
        "wires": [
            [
                "7277f4f3.dbc25c"
            ]
        ]
    },
    {
        "id": "17ba7964.819c67",
        "type": "debug",
        "z": "4a24f524.02204c",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "x": 320,
        "y": 220,
        "wires": []
    },
    {
        "id": "5c971a6e.d36634",
        "type": "bizwechat-input",
        "z": "4a24f524.02204c",
        "name": "",
        "cropid": "",
        "token": "",
        "aeskey": "",
        "port": "",
        "x": 140,
        "y": 280,
        "wires": [
            [
                "71582f07.cdaac",
                "17ba7964.819c67"
            ]
        ]
    }
]
```