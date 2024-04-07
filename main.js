const { BrowserWindow, app, screen, ipcMain, shell, BrowserView, Tray, dialog, globalShortcut, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

const FormData = require('form-data')
const fsextra = require('fs-extra')

const { backrecept, getHashId } = require('./backrecept')
const { remindBackrecept } = require('./order_remind_window/backrecept')
const { immersiveBackrecept, getCurrentPhase, controlIncompleteId, uploadImmersiveData, downloadImmersiveData } = require('./immersive_mode_window/backrecept')
const { displayDataBackrecept } = require('./display_immersive_data/backrecept')
const { syncWallpaper, getOrders, getOrderFiles } = require('./syncRemoteFile')
const { watchFiles,watchSyncFiles } = require('./watchfiles')
const { processMenu } = require('./processMenu')
const { url, headers, order_basic_path, sync_basic_path, immersive_path, process_icon, wallpaper_basic_path } = require('./globalVar')

let WSW,WSH,USERNAME,ISUPLOADINGORDERSRECORD = false

app.whenReady().then(() => {
    // return
    loginWindow().then(async (username) => {
        USERNAME = username
        const primaryDisplay = screen.getPrimaryDisplay()
        const { width, height } = primaryDisplay.workAreaSize
        WSW = width
        WSH = height
        const win = createWindow()
        const appTray = new Tray(process_icon)
        appTray.setToolTip('桌面助手')
        appTray.on('click',() => win.show())
        appTray.setContextMenu(processMenu)
        await uploadImages()
        syncWallpaper(USERNAME)
        await getOrders(USERNAME,ISUPLOADINGORDERSRECORD)
        watchFiles(getHashId)
        await getOrderFiles()
        remindWindow()
        uploadSyncFile()
        uploadImmersiveData(USERNAME)
        downloadImmersiveData(USERNAME)
        immersiveWindow()
        displayDataWindow()
    })
})

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        frame:false,
        transparent:true,
        focusable:false,//设置窗口不可聚焦，使其不会出现在其他窗口的上一层
        webPreferences:{
            preload:path.resolve(app.getAppPath(),`./preload.js`)
        },
        resizable:false,
        width:WSW / 2,
        height:WSH,
        x:WSW - 3,
        y:0,
        skipTaskbar: true
    })

    // mainWindow.webContents.toggleDevTools()//自动打开开发者工具
    mainWindow.loadFile(path.resolve(app.getAppPath(),`./index.html`))

    backrecept(
        mainWindow,
        WSW,WSH,
        uploadImages,
        () => uploadOrdersRecord(USERNAME),
        () => getOrders(USERNAME,ISUPLOADINGORDERSRECORD),
        () => syncWallpaper(USERNAME),
        () => uploadSyncFile(),
        USERNAME
    )

    return mainWindow
}

const remindWindow = () => {
    const width = 300
    const height = 160
    const mainWindow = new BrowserWindow({
        frame:false,
        transparent:true,
        webPreferences:{
            preload:path.resolve(app.getAppPath(),`./order_remind_window/preload.js`)
        },
        resizable:false,
        width:width,
        height:height,
        x:WSW - width - 10,
        y:WSH - height - 10,
        skipTaskbar: true
    })
    // mainWindow.webContents.toggleDevTools()//自动打开开发者工具
    mainWindow.loadFile(path.resolve(app.getAppPath(),`./order_remind_window/index.html`))

    remindBackrecept(mainWindow,WSW,WSH)

    return mainWindow
}

function loginWindow(){
    return new Promise(async resolve => {
        const width = 400
        const height = 250
        const mainWindow = new BrowserWindow({
            frame:false,
            transparent:true,
            webPreferences:{
                preload:path.resolve(app.getAppPath(),`./login_window/preload.js`)
            },
            resizable:false,
            width:width,
            height:height,
            center:true,
            skipTaskbar: true
        })
        mainWindow.loadFile(path.resolve(app.getAppPath(),`./login_window/index.html`))
        const fetch = await import('node-fetch').then((module) => module.default)
        ipcMain.on('login',(event,{username,password}) => {
            // dialog.showMessageBox({title:'提示',type:'none',message:'点击了登录'})
            fetch(`${url}login`,{method:'POST',body:JSON.stringify({username,password}),headers})
            .then(res => res.json())
            .then(({status,message}) => {
                if(status){
                    dialog.showMessageBox({title:'提示',type:'none',message})
                    mainWindow.close()
                    resolve(username)
                } else dialog.showMessageBox({title:'提示',type:'warning',message})
            }).catch(err => {
                dialog.showMessageBox({title:'提示',type:'error',message:err})
            })
        })
        ipcMain.on('register',(event,{username,password}) => {
            // dialog.showMessageBox({title:'提示',type:'none',message:'点击了注册'})
            fetch(`${url}register`,{method:'POST',body:JSON.stringify({username,password}),headers})
            .then(res => res.json())
            .then(({status,message}) => {
                if(status){
                    dialog.showMessageBox({title:'提示',type:'none',message})
                } else dialog.showMessageBox({title:'提示',type:'warning',message})
            }).catch(err => {
                dialog.showMessageBox({title:'提示',type:'error',message:err})
            })
        })
        ipcMain.on('quit',() => {
            app.quit()
        })
    })
}

function uploadImages(){
    let images_name = fs.readdirSync(wallpaper_basic_path).filter(image => image != 'current_image.json')
    let images_path = images_name.map(image => path.resolve(wallpaper_basic_path,image))
    const formData = new FormData()
    images_path.forEach((image_path,index) => {
        formData.append('file', fs.createReadStream(image_path))
    })
    return new Promise(async resolve => {
        if(images_path.length == 0){
            resolve()
            return
        }
        const fetch = await import('node-fetch').then((module) => module.default)
        fetch(`${url}uploadImages`, {
            method: 'POST',
            body: formData,
            headers: {
            ...formData.getHeaders(),
            }
        }).then(res => res.text()).then(res => {
            res = JSON.stringify({
                username:USERNAME,
                images:JSON.parse(res)
            })
            return fetch(`${url}recordImages`,{
                method: 'POST',
                body: res,
                headers
            }).then(res => res.text())
            .then(res => resolve(res))
        })
    })
    
}

async function uploadOrdersRecord(username){
    ISUPLOADINGORDERSRECORD = true
    return new Promise(async resolve => {
        const obj = {
            json:JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8')),
            user:username
        }
        fetch(`${url}recordOrders`,{
            method: 'POST',
            body: JSON.stringify(obj),
            headers
        }).then(res => {
            ISUPLOADINGORDERSRECORD = false
            resolve()
        }).catch(err => {
            console.log('fail to upload order record')
        })
    })
}

async function uploadSyncFile(){
    watchSyncFiles(uploadSyncFile)
    const fetch = await import('node-fetch').then((module) => module.default)
    JSON.parse(fs.readFileSync(path.resolve(sync_basic_path,'sync.json'), 'utf8') || '[]').forEach(file => {
        const { file_path,...basic } = file
        fetch(`${url}uploadSyncRecord?user=${USERNAME}`,{method:'POST',body:JSON.stringify(basic),headers})
            .then(res => res.json())
            .then((result) => {
                if(result){
                    // return
                    const formData = new FormData()
                    formData.append('file',fs.createReadStream(file_path),encodeURIComponent(basic.name))
                    fetch(`${url}uploadSyncFile?path=uploads_files_${USERNAME}&encode=true`,{
                        method:'POST',
                        body:formData,
                        headers: {
                            // ...formData.getHeaders(),
                            'Content-Type': `multipart/form-data; boundary=${formData._boundary}; charset=UTF-8`
                        }
                    }).then(res => res.json).then(res => {
                        // console.log('success to upload sync file')
                    }).catch(err => {
                        console.log('fail to upload sync file')
                    })
                    return
                }
                console.log('fail to upload sync file record')
            }).catch(err => {
                console.log('fail to upload sync file record 2')
            })
    })
}

let imm_1
function immersiveWindow(){
    const width = 600
    const height = 150
    const mainWindow = new BrowserWindow({
        frame:false,
        transparent:true,
        webPreferences:{
            preload:path.resolve(app.getAppPath(),`./immersive_mode_window/preload.js`)
        },
        resizable:false,
        width:width,
        height:height,
        center:true,
        skipTaskbar: true,
        alwaysOnTop:true
    })
    // mainWindow.webContents.toggleDevTools()
    mainWindow.loadFile(path.resolve(app.getAppPath(),`./immersive_mode_window/index.html`))

    globalShortcut.register("CTRL+m",() => {
        if(mainWindow.isVisible()){
            mainWindow.hide()
            unRegisterGS(mainWindow)
        }else{
            downloadImmersiveData(USERNAME)
            mainWindow.show()
            registerGS(mainWindow)
            imm_2.hide()
            unregisterGS_2()
        }
    })

    mainWindow.hide()
    imm_1 = mainWindow

    immersiveBackrecept(mainWindow,unRegisterGS,USERNAME)
}

function registerGS(mainWindow){
    globalShortcut.register('Enter',() => {
        mainWindow.webContents.send('press_enter')
    })
    globalShortcut.register('Esc',() => {
        mainWindow.webContents.send('press_esc')
    })
    globalShortcut.register('Left',() => {
        mainWindow.webContents.send('press_left')
    })
    globalShortcut.register('Right',() => {
        mainWindow.webContents.send('press_right')
    })
}

function unRegisterGS(mainWindow){
    globalShortcut.unregister('Enter')
    globalShortcut.unregister('Esc')
    globalShortcut.unregister('Left')
    globalShortcut.unregister('Right')
    if(getCurrentPhase() == 6){
        mainWindow.webContents.send('reset')
    }
}

app.on('will-quit',() => {
    unRegisterGS()
    let data = JSON.parse(fs.readFileSync(immersive_path, 'utf8') || '[]')
    if(controlIncompleteId.getIncompleteId()){
        const target = data.find(d => d.start_time == controlIncompleteId.getIncompleteId())
        target.end_time = new Date().getTime()
        fs.writeFileSync(immersive_path,JSON.stringify(data,null,4),'utf8')
        uploadImmersiveData(USERNAME)
        controlIncompleteId.clearIncompleteId()
    }
})

let imm_2
function displayDataWindow(){
    const width = 500
    const height = 300
    const mainWindow = new BrowserWindow({
        frame:false,
        transparent:true,
        webPreferences:{
            preload:path.resolve(app.getAppPath(),`./display_immersive_data/preload.js`)
        },
        resizable:false,
        width:width,
        height:height,
        center:true,
        skipTaskbar: true,
        alwaysOnTop:true
    })
    // mainWindow.webContents.toggleDevTools()
    mainWindow.loadFile(path.resolve(app.getAppPath(),`./display_immersive_data/index.html`))

    globalShortcut.register("CTRL+l",() => {
        if(mainWindow.isVisible()){
            mainWindow.hide()
            unregisterGS_2()
        }else{
            downloadImmersiveData(USERNAME)
            mainWindow.webContents.send('getAllData',JSON.parse(fs.readFileSync(immersive_path, 'utf8') || '[]'))
            mainWindow.show()
            registerGS_2(mainWindow)
            imm_1.hide()
            unRegisterGS()
        }
    })

    mainWindow.hide()

    imm_2 = mainWindow

    displayDataBackrecept(mainWindow)
}

function registerGS_2(mainWindow){
    globalShortcut.register('CTRL+p',() => {
        mainWindow.webContents.send('display_mode_list')
    })
}

function unregisterGS_2(){
    globalShortcut.unregister('CTRL+p')
}