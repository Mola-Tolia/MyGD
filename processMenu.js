const {  Menu } = require('electron')

const processMenu =  Menu.buildFromTemplate([
    { label: '退出登录', click: () => { app.relaunch();app.quit() } },
    { label: '结束程序', click: () => { app.quit() } }
])

module.exports = {
    processMenu
}