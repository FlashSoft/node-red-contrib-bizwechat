module.exports = (RED) => {
    function bizWechatConfiguratorNode(n) {
        RED.nodes.createNode(this, n);

        this.name = n.name;
        this.port = n.port;
        this.cropid = n.cropid;
        this.agentid = n.agentid;
        this.token = n.token;
        this.corpsecret = n.corpsecret
        this.aeskey = n.aeskey;

        var node = this;
    }

    RED.nodes.registerType("bizwechat-configurator", bizWechatConfiguratorNode);
}