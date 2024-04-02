const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('pre_api',{
    login(obj){
        ipcRenderer.send('login',obj)
    },
    register(obj){
        ipcRenderer.send('register',obj)
    },
    quit(){
        ipcRenderer.send('quit')
    }
})