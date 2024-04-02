const { ipcMain, nativeImage, app, shell, dialog, screen } = require('electron')
const fs = require('fs')
const path = require('path')
const { order_basic_path } = require('../globalVar')

let win

function remindBackrecept(mainWindow,WSW,WSH){
    win = mainWindow
    win.hide()
    ipcMain.on('closeTip',() => {
        mainWindow.hide()
    })
    ipcMain.on('reSetHeight',(event,h) => {
        if(h > 250){
            reSetHeight(300,WSW,WSH)
        }else if(h > 200){
            reSetHeight(250,WSW,WSH)
        }else if(h > 150){
            reSetHeight(200,WSW,WSH)
        }else{
            reSetHeight(150,WSW,WSH)
        }
    })
    ipcMain.on('changeFileStatus',(event,id,value) => {
        const json = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8'))
        let file
        json.forEach(order => {
            file = order.files.find(file => file.file_id == id) || file
        })
        file.done = value
        fs.writeFileSync(path.resolve(order_basic_path,'orders.json'),JSON.stringify(json,null,4),'utf8')
    })
    ipcMain.on('completeOrder',(event,id) => {
        const json = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8'))
        json.find(order => order.order_id == id).done = true
    })
    startToListenOrderRemindTime()
}

function sendTip(type,id,order_id){
    const json = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8'))
    let target
    if(type === 'order') target = json.find(order => order.order_id == id)
    else{
        json.forEach(order => {
            const file = order.files.find(file => file.file_id == id)
            if(file) target = file
        })
    }
    if(!win.isVisible()) win.show()
    win.send('tip',target,type,order_id)
}

function reSetHeight(h,WSW,WSH){
    win.setResizable(true)
    win.setSize(300,h)
    win.setPosition(WSW - 310,WSH - h - 10)
    win.setResizable(false)
}

const timer = []
function startToListenOrderRemindTime(){
    timer.forEach(timer => {
        clearInterval(timer)
        clearTimeout(timer)
    })
    const json = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8'))
    json.forEach(listenOrderRemindTime)
}

function listenOrderRemindTime({deadline,frequency:{type,times},done,files,order_id}){
    if(done) return
    let time_remind
    switch(type){
        case 'year':
            time_remind = setInterval(() => {
                const done = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).find(order => order.order_id == order_id).done
                if(done) {
                    clearInterval(time_remind)
                    return
                }
                const date = new Date()
                if(date.getMonth() + 1 == times[0] && date.getDate() == times[1] && date.getHours() == times[2] && date.getMinutes() == times[3]){
                    sendTip('order',order_id)
                }
            },60000)
            break
        case 'month':
            time_remind = setInterval(() => {
                const done = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).find(order => order.order_id == order_id).done
                if(done) {
                    clearInterval(time_remind)
                    return
                }
                const date = new Date()
                if(date.getDate() == times[0] && date.getHours() == times[1] && date.getMinutes() == times[2]){
                    sendTip('order',order_id)
                }
            },60000)
            break
        case 'week':
            time_remind = setInterval(() => {
                const done = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).find(order => order.order_id == order_id).done
                if(done) {
                    clearInterval(time_remind)
                    return
                }
                const date = new Date()
                let day = date.getDay()
                day = day == 0 ? 7 : day
                if(day == times[0] && date.getHours() == times[1] && date.getMinutes() == times[2]){
                    sendTip('order',order_id)
                }
            },60000)
            break
        case 'day':
            time_remind = setInterval(() => {
                const done = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).find(order => order.order_id == order_id).done
                if(done) {
                    clearInterval(time_remind)
                    return
                }
                const date = new Date()
                if(date.getHours() == times[0] && date.getMinutes() == times[1]){
                    sendTip('order',order_id)
                }
            },60000)
            break
        case 'hour':
            everyHours()
            function everyHours(){
                time_remind = setTimeout(() => {
                    const done = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).find(order => order.order_id == order_id).done
                    if(done) {
                        clearTimeout(time_remind)
                        return
                    }
                    sendTip('order',order_id)
                    everyHours()
                },Number(times) * 1000 * 60 * 60)
            }
            break
        case 'minute':
            everyMinutes()
            function everyMinutes(){
                time_remind = setTimeout(() => {
                    const done = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).find(order => order.order_id == order_id).done
                    if(done) {
                        clearTimeout(time_remind)
                        return
                    }
                    sendTip('order',order_id)
                    everyMinutes()
                },Number(times) * 1000 * 60)
            }
            break
        case 'custom':
            time_remind = times.map(([year,month,day,hour,minute,second]) => {
                let t = setInterval(() => {
                    const done = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).find(order => order.order_id == order_id).done
                    if(done) {
                        clearInterval(t)
                        return
                    }
                    const date = new Date()
                    if(date.getFullYear() == year && date.getMonth() + 1 == month && date.getDate() == day && date.getHours() == hour && date.getMinutes() == minute && date.getSeconds() == second){
                        sendTip('order',order_id)
                    }
                },1000)
                return t
            })
    }
    Array.isArray(time_remind) ? timer.push(...time_remind) : timer.push(time_remind)
    files.forEach(({deadline,frequency:{type,times},done,file_id}) => {
        if(done) return
        let time_remind
        switch(type){
            case 'year':
                time_remind = setInterval(() => {
                    let done
                    JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).forEach(order => {
                        let file = order.files.find(file => file.file_id == file_id)
                        if(file) done = file.done
                    })
                    if(done) return
                    const date = new Date()
                    if(date.getMonth() + 1 == times[0] && date.getDate() == times[1] && date.getHours() == times[2] && date.getMinutes() == times[3]){
                        sendTip('file',file_id,order_id)
                    }
                },60000)
                break
            case 'month':
                time_remind = setInterval(() => {
                    let done
                    JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).forEach(order => {
                        let file = order.files.find(file => file.file_id == file_id)
                        if(file) done = file.done
                    })
                    if(done) return
                    const date = new Date()
                    if(date.getDate() == times[0] && date.getHours() == times[1] && date.getMinutes() == times[2]){
                        sendTip('file',file_id,order_id)
                    }
                },60000)
                break
            case 'week':
                time_remind = setInterval(() => {
                    let done
                    JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).forEach(order => {
                        let file = order.files.find(file => file.file_id == file_id)
                        if(file) done = file.done
                    })
                    if(done) return
                    const date = new Date()
                    let day = date.getDay()
                    day = day == 0 ? 7 : day
                    if(day == times[0] && date.getHours() == times[1] && date.getMinutes() == times[2]){
                        sendTip('file',file_id,order_id)
                    }
                },60000)
                break
            case 'day':
                time_remind = setInterval(() => {
                    let done
                    JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).forEach(order => {
                        let file = order.files.find(file => file.file_id == file_id)
                        if(file) done = file.done
                    })
                    if(done) return
                    const date = new Date()
                    if(date.getHours() == times[0] && date.getMinutes() == times[1]){
                        sendTip('file',file_id,order_id)
                    }
                },60000)
                break
            case 'hour':
                everyHours()
                function everyHours(){
                    time_remind = setTimeout(() => {
                        let done
                        JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).forEach(order => {
                            let file = order.files.find(file => file.file_id == file_id)
                            if(file) done = file.done
                        })
                        if(!done) sendTip('file',file_id,order_id)
                        everyHours()
                    },Number(times) * 1000 * 60 * 60)
                }
                break
            case 'minute':
                everyMinutes()
                function everyMinutes(){
                    time_remind = setTimeout(() => {
                        let done
                        JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).forEach(order => {
                            let file = order.files.find(file => file.file_id == file_id)
                            if(file) done = file.done
                        })
                        if(!done) sendTip('file',file_id,order_id)
                        everyMinutes()
                    },Number(times) * 1000 * 60)
                }
                break
            case 'custom':
                time_remind = times.map(([year,month,day,hour,minute,second]) => {
                    const t = setInterval(() => {
                        let done
                        JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')).forEach(order => {
                            let file = order.files.find(file => file.file_id == file_id)
                            if(file) done = file.done
                        })
                        if(done) return
                        const date = new Date()
                        if(date.getFullYear() == year && date.getMonth() + 1 == month && date.getDate() == day && date.getHours() == hour && date.getMinutes() == minute && date.getSeconds() == second){
                            sendTip('file',file_id,order_id)
                        }
                    },1000)
                    return t
                })
        }
        Array.isArray(time_remind) ? timer.push(...time_remind) : timer.push(time_remind)
    })
}

module.exports = {
    remindBackrecept,
    startToListenOrderRemindTime
}