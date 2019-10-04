const log = console.log, ls = localStorage
    , host = 'http://127.0.0.1:14080'

async function json(api, data = {}) {
    if (!ls.token&&api!='/my') return { msg: 'token invalid' }
    try {
        iview.Spin.show()
        let body = 'token=' + ls.token
        for (let k in data) body += '&' + k + '=' + data[k]
        const res = await fetch(host + api, {
            method: 'post', body
        })
        iview.Spin.hide()
        return await res.json()
    } catch (ex) {
        iview.Spin.hide()
        log(ex.message)
        return { msg: '请先启动服务' }
    }
}
async function getToken(wxid) {
    if(ls.token)return {}
    try {
        iview.Spin.show()
        if (!wxid) return { msg: 'wxid invalid' };
        const res = await fetch('https://jp.wmde.net?wxid=' + wxid)
            , data = await res.json()
        if (data.token) {
            ls.token = data.token
            let check = await json('/group')
            if(check.msg)return ls.token = '',{ msg: '请重新获取' }            
        }
        iview.Spin.hide()
        return data
    } catch (ex) {
        iview.Spin.hide()
        log(ex.message)
        return { msg: '请先启动服务' }
    }
}

new Vue({
    el: '#app',
    data: {
        wxid: 'tab-container1', introduction: 1, group: []
        , formItem: {
            wxid: 'filehelper'
            , atid: ''
            , groupid: ''
            , msg: 'Hello World'
            , pwd: 'pcwx'
            , mywxid: ''
        }
        , columns1: [
            {
                title: 'wxid',
                key: 'wxid'
            },
            {
                title: '昵称',
                key: 'nickName'
            },
            {
                title: '备注',
                key: 'reMark'
            }
        ],
        data1: [{ wxid: "filehelper", nickName: "文件传输助手", reMark: "" }]
    },
    mounted: function () { this.$Spin.show(); this.init() },
    methods: {
        init: async function () {
            let data, _this = this
            data = await json('/my')
            if (data.msg) return this.$Modal.error({
                title: '提示', content: data.msg, onOk: function () {
                    iview.Spin.show()
                    setTimeout(function () {
                        iview.Spin.hide()
                        _this.init()
                    }, 1000)
                }
            })
            this.formItem.mywxid=data.wxid
            data = await getToken(data.wxid)
            if (data.msg) return this.$Modal.error({
                title: '提示', content: data.msg, onOk: function () {
                    iview.Spin.show()
                    setTimeout(function () {
                        iview.Spin.hide()
                        _this.init()
                    }, 1000)
                }
            })
            this.$Spin.hide()
        },
        sendText: async function () {
            if (!this.formItem.wxid || !this.formItem.wxid) return this.$Message.info('请填写 wxid和消息')
            let data
            if (this.formItem.atid) {
                data = await json('/send', { wxid: this.formItem.wxid, msg: this.formItem.msg, atid: this.formItem.atid })
            } else {
                data = await json('/send', { wxid: this.formItem.wxid, msg: this.formItem.msg })
            }
            if (!data.wxid) return this.$Message.info('发送失败:' + data.msg);
            this.$Message.info('发送成功');
        }
        , getMsg: async function () {
            let data
            data = await json('/msg')
            if (data.msg) return this.$Message.info(data.msg)
            let text = JSON.stringify(data, null, 4)
            this.$Modal.success({ title: '接收消息', content: '<pre>' + text + '</pre>' })
        }
        , getUser: async function () {
            let data
            data = await json('/user')
            if (data.msg) return this.$Message.info(data.msg)
            this.data1 = data;
        }
        , getGroup: async function () {
            let data
            if (!this.formItem.groupid) return this.$Message.info('请填写 群WXID');
            data = await json('/group', { groupid: this.formItem.groupid })
            if (data.msg) return this.$Message.info(data.msg)
            let text = JSON.stringify(data, null, 4)
            this.$Modal.success({ title: '接收消息', content: '<pre>' + text + '</pre>' })
        }
    }
})
render()