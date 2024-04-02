const { ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const { url, headers, immersive_path } = require('../globalVar')

let current_phase = 1,incomplete_id

function immersiveBackrecept(mainWindow,unRegisterGS,user){
    ipcMain.on('startToRecord',(event,mode_name,id) => {
        incomplete_id = id
        mainWindow.hide()
        unRegisterGS()
        let data = JSON.parse(fs.readFileSync(immersive_path, 'utf8') || '[]')
        data.push({mode:mode_name,start_time:id})
        fs.writeFileSync(immersive_path,JSON.stringify(data,null,4),'utf8')
    })
    ipcMain.on('hide',() => {
        mainWindow.hide()
        unRegisterGS(mainWindow)
    })
    ipcMain.handle('end',(event,id) => {
        incomplete_id = undefined
        let data = JSON.parse(fs.readFileSync(immersive_path, 'utf8'))
        let target = data.find(im => im.start_time == id)
        target.end_time = new Date().getTime()
        fs.writeFileSync(immersive_path,JSON.stringify(data,null,4),'utf8')
        uploadImmersiveData(user)
        return target.end_time - target.start_time
    })
    ipcMain.on('setCurrentPhase',(event,phase) => {
        current_phase = phase
    })
    mainWindow.on('blur',() => {
        if(getCurrentPhase() != 6) return
        mainWindow.hide()
        unRegisterGS(mainWindow)
    })
}

function getCurrentPhase(){
    return current_phase
}

const controlIncompleteId = {
    getIncompleteId(){
        return incomplete_id
    },
    clearIncompleteId(){
        incomplete_id = undefined
    }
}

async function uploadImmersiveData(user = 'Mola'){
    const data = JSON.parse(fs.readFileSync(immersive_path, 'utf8'))
    fetch(`${url}uploadImmersiveData?user=${user}`,{
        method: 'POST',
        body: JSON.stringify(data),
        headers
    }).then(res => {
        // console.log('success to upload ImmersiveData')
    }).catch(err => {
        console.log('fail to upload ImmersiveData')
    })
}

function downloadImmersiveData(user = 'Mola'){
    const data = JSON.parse(fs.readFileSync(immersive_path, 'utf8'))
    fetch(`${url}downloadImmersiveData?user=${user}`,{
        method: 'POST',
        headers
    }).then(res => res.json()).then(res => {
        res.forEach(d => {
            if(data.find(hd => hd.start_time == d.start_time && hd.end_time == d.end_time)) return
            data.push(d)
        })
        fs.writeFileSync(immersive_path,JSON.stringify(data,null,4),'utf8')
    }).catch(err => {
        console.log('fail to upload ImmersiveData')
    })
}

module.exports = {
    immersiveBackrecept,
    getCurrentPhase,
    controlIncompleteId,
    uploadImmersiveData,
    downloadImmersiveData
}