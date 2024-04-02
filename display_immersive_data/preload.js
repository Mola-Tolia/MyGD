const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('pre_api',{
    getAllData(callback){
        return ipcRenderer.on('getAllData',(event,results) => {
            callback(results)
        })
    },
    display_mode_list(callback){
        ipcRenderer.on('display_mode_list',() => {
            callback()
        })
    }
})