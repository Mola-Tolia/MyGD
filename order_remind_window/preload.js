const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('pre_api',{
    closeTip(){
        ipcRenderer.send('closeTip')
    },
    getTip(callback){
        ipcRenderer.on('tip',(event,target,type,order_id) => {
            callback(target,type,order_id)
        })
    },
    reSetHeight(h){
        ipcRenderer.send('reSetHeight',h)
    },
    changeFileStatus(id,value){
        ipcRenderer.send('changeFileStatus',id,value)
    },
    completeOrder(id){
        ipcRenderer.send('completeOrder',id)
    }
})