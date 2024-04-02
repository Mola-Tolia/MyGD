const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('pre_api',{
    startToRecord(name,id){
        ipcRenderer.send('startToRecord',name,id)
    },
    hide(){
        ipcRenderer.send('hide')
    },
    end(id){
        return ipcRenderer.invoke('end',id)
    },
    press_enter(callback){
        ipcRenderer.on('press_enter',() => {
            callback()
        })
    },
    press_esc(callback){
        ipcRenderer.on('press_esc',() => {
            callback()
        })
    },
    press_left(callback){
        ipcRenderer.on('press_left',() => {
            callback()
        })
    },
    press_right(callback){
        ipcRenderer.on('press_right',() => {
            callback()
        })
    },
    setCurrentPhase(phase){
        ipcRenderer.send('setCurrentPhase',phase)
    },
    reset(callback){
        ipcRenderer.on('reset',() => {
            callback()
        })
    }
})