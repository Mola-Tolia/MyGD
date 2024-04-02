const { ipcMain, nativeImage, app, shell, dialog, screen } = require('electron')
const fs = require('fs')
const path = require('path')
const os = require('os')
const fs_extra = require('fs-extra')
const crypto = require('crypto')
const { exec } = require('child_process')
const winWallpaper = require('win-wallpaper')
const FormData = require('form-data')
const { url, headers, order_basic_path, sync_basic_path, file_basic_path, wallpaper_basic_path } = require('./globalVar')

const { watchFiles } = require('./watchfiles')

const { startToListenOrderRemindTime } = require('./order_remind_window/backrecept')
const { downloadFiles } = require('./syncRemoteFile')

const move_type_1 = 'IN'
const move_type_2 = 'OUT'

let show = false

function backrecept(mainWindow,WSW,WSH,uploadImages,uploadOrdersRecord,getOrders,syncWallpaper,uploadSyncFile,USERNAME){
    ipcMain.on('show',() => {
        mainWindow.resizable = true
        mainWindow.setPosition(show ? cal4(WSW - 3) : cal4(WSW / 2),0)
        mainWindow.resizable = false
        show = !show
    })
    ipcMain.handle('init_cards',(event,cards_mark) => {
        return cardAssociationFile(cards_mark)
    })
    ipcMain.handle('uploadFile',async (event,file) => {
        try {
            if(file.type !== 'dir'){
                let { fileTypeFromBuffer } = await import('file-type')
                let mime = ''
                const typeInfor = await fileTypeFromBuffer(fs.readFileSync(file.path))
                if(typeInfor){
                    mime = typeInfor.mime
                }

                let isShortcut = false,shortcuts_targetUrl = ''

                if(mime === 'application/x.ms.shortcut'){

                    let {target} = shell.readShortcutLink(file.path)

                    isShortcut = true
                    shortcuts_targetUrl = target
                }

                let file_info = await app.getFileIcon(isShortcut ? shortcuts_targetUrl : path.resolve(__dirname,file.path)).then(icon =>{
                    return {icon:icon.toDataURL(),file_id:new Date().getTime() + Math.floor(Math.random() * 10000),name:file.name,isDir:fs.statSync(file.path).isDirectory()}
                })
                recordFileInfoIntoJson(file_info,file.mark)
                moveFile(file_info,move_type_1)
                return file_info
            }else{
                const file_info = {
                    file_id:new Date().getTime() + Math.floor(Math.random() * 10000),
                    name:file.name,
                    isDir:fs.statSync(file.path).isDirectory()
                }
                recordFileInfoIntoJson(file_info,file.mark)
                moveFile(file_info,move_type_1)
                return file_info
            }
            
        } catch (error) {console.error(error)}
    })
    ipcMain.handle('judgeDorF',(event,path) => {
        return fs.statSync(path).isDirectory()
    })
    ipcMain.on('releaseFile',(event,file_id,mark) => {
        clearFileInfoFromJson(file_id,mark)
    })
    ipcMain.on('moveFromJson',(event,...args) => {
        moveFileInfo(...args)
    })
    ipcMain.handle('divideRough',() => {
        is_divide_roughly = true
        return new Promise((resolve,reject) => {
            fs.readdir(file_basic_path,(err, files) => {
                if(err) return
                const jsons = files.filter(str => str.split('.')[str.split('.').length - 1] === 'json')
                jsons.sort((a,b) => {
                    const select_cards_1_count = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,a), 'utf8')).length
                    const select_cards_2_count = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,b), 'utf8')).length
                    return select_cards_1_count - select_cards_2_count
                })
                r_jsons = jsons.slice(0,2)
                divideFileRoughly(r_jsons).then(res => {
                    if(res.filter(item => item.length != 0).length == 0){
                        has_adjust_roughly = false
                        resolve([])
                        return
                    }
                    const files_info = []
                    jsons.slice(0,2).forEach(json => {
                        files_info.push(...JSON.parse(fs.readFileSync(path.resolve(file_basic_path,json), 'utf8')).map(f => [json.split('.')[0].split('_')[1],f]))
                    })
                    has_adjust_roughly = false
                    //防止一张卡片中无文件
                    r_jsons.forEach(str => files_info.push([str.split('.')[0].split('_')[1]]))
                    resolve(files_info)
                })
            })
        })
    })
    ipcMain.handle('isRetract',() => {
        return !show
    })
    ipcMain.handle('divideDetailed',async () => {
        is_divide_roughly = false
        return divideFileInDetail()
    })
    ipcMain.handle('releaseAll',() => {
        return releaseAll()
    })
    ipcMain.on('shellOpen',(event,file_id,mark) => {
        let { name } = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,`card_${mark}.json`),'utf8')).find(f => f.file_id == file_id)
        shell.openPath(path.resolve(file_basic_path,'card_files',name))
    })
    ipcMain.handle('getWindowAspectRatio',() => {
        return new Promise(res => res(WSW / WSH))
    })
    ipcMain.handle('uploadImage',(event,image_path) => {
        const file_hash_id = getHashId(image_path)
        const image_name = file_hash_id + '.' + image_path.split('.')[image_path.split('.').length - 1]
        const wallpaper = fs.readdirSync(wallpaper_basic_path)
        return new Promise(resolve => {
            if(wallpaper.includes(image_name)) resolve(false)
            const readStream = fs.createReadStream(path.resolve(image_path))
            readStream.pipe(fs.createWriteStream(path.resolve(wallpaper_basic_path,image_name)))
            readStream.on('end', () => resolve(true))
        }).then(result => {
            if(result){
                uploadImages()
                return path.resolve(wallpaper_basic_path,image_name)
            }
        })
    })
    ipcMain.handle('init_display_images',() => {
        return syncWallpaper().then(() => {
            return fs.readdirSync(wallpaper_basic_path).filter(name => !name.includes('.json')).map(image => path.resolve(wallpaper_basic_path,image))
        })
    })
    ipcMain.handle('getWindowCurrentWallpaper',() => {
        return new Promise(resolve => {
            try{
                let [image,mode] = JSON.parse(fs.readFileSync(path.resolve(wallpaper_basic_path,'current_image.json'), 'utf8'))
                if(image) resolve({p:path.resolve(wallpaper_basic_path,image),m:mode})
            }catch(e){
                console.log(e)
            }finally{
                resolve('')
            }
        })
    })
    ipcMain.on('setWallpaper',(event,image_path,mode) => {
        const _image_path = image_path.split('/')[image_path.split('/').length - 1]
        image_path = path.resolve(wallpaper_basic_path,_image_path)
        let scale
        switch(mode){
            case 1://适应
                scale = 'fit'
                break
            case 2://填充
                scale = 'fill'
                break
            case 3://拉伸
                scale = 'stretch'
                break
            case 4://居中
                scale = 'center'
                break
            case 5://平铺
                scale = 'tile'
        }
        import('wallpaper').then(wallpaper => {
            try {
                wallpaper.setWallpaper(image_path).then(res => {
                    fs.writeFileSync(path.resolve(wallpaper_basic_path,'current_image.json'),JSON.stringify([_image_path,mode],null,4),'utf8')
                },(err) => {
                    // 使用 wallpaper-cli
                    // exec(`wallpaper ${image_path.replace(/\\/g,'/').split(':')[1]}`, (error, stdout, stderr) => {
                    //     if (error) {
                    //       console.error(`执行错误`,error)
                    //       return
                    //     }
                    //     // console.log(`标准输出`)
                    //     if (stderr) console.error(`标准错误`)
                    // })
                    winWallpaper.set(image_path, function (err) {
                        if(err) {
                            console.error(err)
                            return
                        }
                        // console.log('done')
                    })
                    fs.writeFileSync(path.resolve(wallpaper_basic_path,'current_image.json'),JSON.stringify([_image_path,mode],null,1),'utf8')
                })
                
            } catch (error) {
                console.log('error')
            }
           
        })
    })
    ipcMain.handle('getAllFiles',() => {
        return getAllFiles()
    })
    ipcMain.on('windowFocusable',() => {
        mainWindow.setFocusable(true)
        mainWindow.focus()
    })
    ipcMain.on('windowUnfocusable',() => {
        mainWindow.setFocusable(false)
    })
    ipcMain.handle('createOrder',(event,order_info,updateOrderId) => {
        let orders = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'), 'utf8') || '[]')
        if(updateOrderId){
            orders = orders.filter(order => order.order_id != updateOrderId)
        }
        order_info.order_id = new Date().getTime() + Math.floor(Math.random() * 10000)

        //复制任务文件，生成hash_id，保存到项目目录中
        order_info.files.forEach(file => {
            const file_path = file.file_path
            const file_hash_id = getHashId(file_path)
            const file_name = file_hash_id + '.' + file_path.split('.')[file_path.split('.').length - 1]
            file.hash_name = file_name
            const order_files = fs.readdirSync(path.resolve(order_basic_path,'order_files'))
            if(order_files.includes(file_name)) return
            const readStream = fs.createReadStream(path.resolve(file_path))
            readStream.pipe(fs.createWriteStream(path.resolve(order_basic_path,'order_files',file_name)))
            readStream.on('end',async () => {
                // console.log('success')
                const formData = new FormData()
                formData.append('file', fs.createReadStream(path.resolve(order_basic_path,'order_files',file.hash_name)))
                const myfetch = await import('node-fetch').then((module) => module.default)
                myfetch(`${url}uploadFile?path=order_files`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                    ...formData.getHeaders(),
                    },
                }).then(res => res.text()).then(() => {
                    // console.log('success to upload file')
                }).catch(err => {
                    console.log('fail to upload order file')
                })
            })
        })

        orders.push(order_info)
        fs.writeFileSync(path.resolve(order_basic_path,'orders.json'),JSON.stringify(orders,null,4),'utf8')

        startToListenOrderRemindTime()
        watchFiles(getHashId)
        return Promise.resolve(orders)
    })
    ipcMain.handle('getOrders',() => {
        return getOrders().then(() => {
            return JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'), 'utf8') || '[]')
        })
    })
    ipcMain.handle('removeOrder',(event,order_id) => {
        try{
            let orders = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'), 'utf8'))
            orders = orders.filter(order => order.order_id != order_id)
            fs.writeFileSync(path.resolve(order_basic_path,'orders.json'),JSON.stringify(orders,null,4),'utf8')
            return true
        }catch(e){
            console.log(e)
            return false
        }finally{
            startToListenOrderRemindTime()
            watchFiles(getHashId)
        }
    })
    ipcMain.on('completeOrder',(event,order_id) => {
        const orders = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'), 'utf8'))
        const order = orders.find(order => order.order_id == order_id)
        order.done = true
        order.files.forEach(file => file.done = true)
        fs.writeFileSync(path.resolve(order_basic_path,'orders.json'),JSON.stringify(orders,null,4),'utf8')
    })
    ipcMain.on('restartOrder',(event,order_id) => {
        const orders = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'), 'utf8'))
        const order = orders.find(order => order.order_id == order_id)
        order.done = false
        order.files.forEach(file => file.done = false)
        fs.writeFileSync(path.resolve(order_basic_path,'orders.json'),JSON.stringify(orders,null,4),'utf8')
    })
    ipcMain.on('updateOrderFileStatus',(event,order_id,file_id,done) => {
        const orders = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'), 'utf8'))
        const order = orders.find(order => order.order_id == order_id)
        order.files.find(file => file.file_id == file_id).done = done
        fs.writeFileSync(path.resolve(order_basic_path,'orders.json'),JSON.stringify(orders,null,4),'utf8')
    })
    fs.watchFile(path.resolve(order_basic_path,'orders.json'), (curr, prev) => {
        console.log('uploadOrdersRecord')
        uploadOrdersRecord()
        console.log('---------------------------------')
    })
    ipcMain.on('addSyncFiles',(event,files) => {
        const sync = []
        files.forEach(file => {
            const name = changeSyncFileName(sync,file.name)
            sync.push({...file,name})
        })
        fs.writeFileSync(path.resolve(sync_basic_path,'sync.json'),JSON.stringify(sync,null,4),'utf8')
        uploadSyncFile()
    })
    ipcMain.handle('getSyncFiles',() => {
        return JSON.parse(fs.readFileSync(path.resolve(sync_basic_path,'sync.json'), 'utf8') || '[]')
    })
    ipcMain.handle('getRemoteSyncFiles',async () => {
        const fetch = await import('node-fetch').then((module) => module.default)
        return await fetch(`${url}getRemoteSyncFiles?user=${USERNAME}`,{method:'POST',headers}).then(res => res.json())
    })
    ipcMain.on('downLoadRemoteSyncFiles',async (event,files) => {
        downloadFiles(files,USERNAME)
    })
}

function cal4(v){
    return v + (v % 4 > 2 ? (4 - v % 4) : -(v % 4))
}

function cardAssociationFile(cards){
    return cards.map(mark => {
        if(fs.existsSync(path.resolve(file_basic_path,`card_${mark}.json`))){
            if(fs.existsSync(path.resolve(file_basic_path,`card_files`))){
                //获取每个卡片区域中的文件及文件夹id、名称、图片
                try {
                    return JSON.parse(fs.readFileSync(path.resolve(file_basic_path,`card_${mark}.json`), 'utf8'))
                } catch (error) {
                    fs.writeFileSync(path.resolve(file_basic_path,`card_${mark}.json`),JSON.stringify([],null,4),'utf8')
                    return []
                }
            }else{
                fs.mkdirSync(path.resolve(file_basic_path,`card_files`),{recursive: true})
            }
        }else{
            fs.writeFileSync(path.resolve(file_basic_path,`card_${mark}.json`),JSON.stringify([],null,4),'utf8')
        }
        return []
    })
}

function recordFileInfoIntoJson(file_info,mark){
    const save_path = path.resolve(file_basic_path,`./card_${mark}.json`)
    const json = JSON.parse(fs.readFileSync(save_path,'utf8'))
    if(!Array.isArray(json)) json = []
    json.push(file_info)
    fs.writeFileSync(save_path,JSON.stringify(json,null,4),'utf8')
}

function moveFile(data,move_type){
    switch(move_type){
        case 'IN':
            if(data.isDir){
                fs_extra.moveSync(path.resolve(os.homedir(),'Desktop',data.name),path.resolve(file_basic_path,`card_files`,data.name))
            }else{
                fs.renameSync(path.resolve(os.homedir(),'Desktop',data.name),path.resolve(file_basic_path,`card_files`,data.name))
            }
            break
        case 'OUT':
            if(data.isDir){
                fs_extra.moveSync(path.resolve(file_basic_path,`card_files`,data.name),path.resolve(os.homedir(),'Desktop',data.name))
            }else{
                fs.renameSync(path.resolve(file_basic_path,`card_files`,data.name),path.resolve(os.homedir(),'Desktop',data.name))
            }
    }
}

function clearFileInfoFromJson(file_id,mark){
    let file_info = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,`card_${mark}.json`), 'utf8')).find(file => file.file_id == file_id)
    moveFile(file_info,move_type_2)
    const delete_path = path.resolve(file_basic_path,`./card_${mark}.json`)
    let json = JSON.parse(fs.readFileSync(delete_path,'utf8'))
    json = json.filter(file => file.file_id != file_id)
    fs.writeFileSync(delete_path,JSON.stringify(json,null,4),'utf8')
}

function moveFileInfo(origin_mark,target_mark,file_id){
    let target_file_info = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,`card_${origin_mark}.json`), 'utf8')).find(file => file.file_id == file_id)
    let origin_json = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,`card_${origin_mark}.json`), 'utf8')).filter(file => file.file_id != file_id)
    let target_json = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,`card_${target_mark}.json`), 'utf8'))
    target_json.push(target_file_info)
    fs.writeFileSync(path.resolve(file_basic_path,`card_${origin_mark}.json`),JSON.stringify(origin_json,null,4),'utf8')
    fs.writeFileSync(path.resolve(file_basic_path,`card_${target_mark}.json`),JSON.stringify(target_json,null,4),'utf8')
}

function divideFileRoughly(jsons){
    return new Promise((resolve,reject) => {
        fs.readdir(path.resolve(os.homedir(),'Desktop'),(err,files) => {
            let files_info = []
            files.filter(file => !/^~\$/.test(file) && file !== 'desktop.ini' && !path.resolve(__dirname).includes(path.resolve(os.homedir(),'Desktop',file))).map(async (fileName,index,arr) => {
                let file_info = await transferFile(path.resolve(path.resolve(os.homedir(),'Desktop'),fileName),fileName,jsons.map(str => str.split('.')[0].split('_')[1]))
                files_info.push(file_info)
                if(arr.length == files_info.length){
                    resolve(files_info)
                }
            })
        })
    })
}

let is_divide_roughly = true
async function transferFile(file_path,fileName,marks){
    try {
        let file_info
        if(fs.statSync(file_path).isFile()){
            let { fileTypeFromBuffer } = await import('file-type')
            let mime = ''
            const typeInfor = await fileTypeFromBuffer(fs.readFileSync(file_path))
            if(typeInfor){
                mime = typeInfor.mime
            }
            let isShortcut = false,shortcuts_targetUrl = ''
            if(mime === 'application/x.ms.shortcut'){
                let {target} = shell.readShortcutLink(file_path)
                isShortcut = true
                shortcuts_targetUrl = target
            }
            file_info = await app.getFileIcon(isShortcut ? shortcuts_targetUrl : file_path).then(icon =>{
                return {icon:icon.toDataURL(),file_id:new Date().getTime() + Math.floor(Math.random() * 10000),name:fileName,isDir:fs.statSync(file_path).isDirectory()}
            })
            moveFile(file_info,move_type_1)
            if(is_divide_roughly) adjustRoughly(r_jsons)
            recordFileInfoIntoJson(file_info,marks[0])
            return [marks[0],file_info]
        }else{
            file_info = {
                file_id:new Date().getTime() + Math.floor(Math.random() * 10000),
                name:fileName,
                isDir:fs.statSync(file_path).isDirectory()
            }
            moveFile(file_info,move_type_1)
            if(is_divide_roughly) adjustRoughly(r_jsons)
            recordFileInfoIntoJson(file_info,marks[1])
            return [marks[1],file_info]
        }
    } catch (error) {
        dialog.showMessageBox({title:'提示',type:'info',message:`${fileName}${fs.statSync(file_path).isFile() ? '程序' : '文件夹中程序'}正在运行中!!!无法操作`})
        return []
    }
}

let r_jsons,has_adjust_roughly = false
function adjustRoughly(jsons){
    if(has_adjust_roughly) return
    let json1 = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,jsons[0]), 'utf8'))
    let json2 = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,jsons[1]), 'utf8'))
    let dirs = json1.filter(file => file.isDir)
    let files = json2.filter(file => !file.isDir)
    json1 = json1.filter(file => !file.isDir)
    json2 = json2.filter(file => file.isDir)
    json1.push(...files)
    json2.push(...dirs)
    fs.writeFileSync(path.resolve(file_basic_path,jsons[0]),JSON.stringify(json1,null,4),'utf8')
    fs.writeFileSync(path.resolve(file_basic_path,jsons[1]),JSON.stringify(json2,null,4),'utf8')
    has_adjust_roughly = true
}

function divideFileInDetail(){
    return new Promise((resolve,reject) => {
        fs.readdir(path.resolve(os.homedir(),'Desktop'),(err,files) => {
            let files_info = []
            files = files.filter(file => !/^~\$/.test(file) && file !== 'desktop.ini' && !path.resolve(__dirname).includes(path.resolve(os.homedir(),'Desktop',file)))
            if(files.length === 0) resolve()
            files.map(async (fileName,index,arr) => {
                let file_info = await transferFile(path.resolve(path.resolve(os.homedir(),'Desktop'),fileName),fileName,[0,0])
                files_info.push(file_info)
                if(arr.length == files_info.length){
                    resolve()
                }
            })
        })
    }).then(() => {
        fs.writeFileSync(path.resolve(file_basic_path,'card_0.json'),JSON.stringify([],null,4),'utf8')
        return new Promise((resolve,reject) => {
            fs.readdir(path.resolve(file_basic_path,'card_files'),(err,files) => {
                if(err) return
                let files_info = []
                files = files.filter(file => !/^~\$/.test(file) && file !== 'desktop.ini' && !path.resolve(__dirname).includes(path.resolve(os.homedir(),'Desktop',file)))
                files.forEach(async (file,index) => {
                    files_info.push(await adjustFileToCard(file))
                    if(files.length == files_info.length){
                        resolve(files_info)
                    }
                })
            })
        })
    }).then(files_info => {
        let cards = new Array(fs.readdirSync(file_basic_path).filter(f => f.includes('json')).length).fill([])
        new Array(cards.length).fill(0).forEach((ignore,index) => {
            fs.writeFileSync(path.resolve(file_basic_path,`card_${index}.json`),JSON.stringify([],null,4),'utf8')
        })
        // cards = cards.slice(0,5)
        const DIR = {name:'DIR',mark:-1,REDIS:null,level:8,files:[]}
        const IMG = {name:'IMG',mark:-1,REDIS:DIR,level:7,files:[]}
        const AUDIO = {name:'AUDIO',mark:-1,REDIS:IMG,level:3,files:[]}
        const VIDEO = {name:'VIDEO',mark:-1,REDIS:AUDIO,level:2,files:[]}
        const EDITABLE = {name:'EDITABLE',mark:-1,REDIS:IMG,level:4,files:[]}
        const UNEDITABLE = {name:'UNEDITABLE',mark:-1,REDIS:EDITABLE,level:1,files:[]}
        const EXE = {name:'EXE',mark:-1,REDIS:IMG,level:6,files:[]}
        const OTHER = {name:'OTHER',mark:-1,REDIS:EXE,level:5,files:[]}
        const types = new Array(DIR,IMG,AUDIO,VIDEO,EDITABLE,UNEDITABLE,EXE,OTHER).sort((a,b) => a - b)
        types.filter(type => (8 - cards.length) < type.level).forEach((type,mark) => type.mark = mark)
        files_info.forEach(file_info => {
            if(file_info.isDir){
                DIR.files.push(file_info)
            }else{
                switch(file_info.suffix){
                    case 'jpg':
                    case 'jpeg':
                    case 'jpe':
                    case 'png':
                    case 'gif':
                    case 'bmp':
                    case 'tiff':
                    case 'tif':
                    case 'raw':
                    case 'webp':
                    case 'svg':
                        IMG.files.push(file_info)
                        break
                    case 'mp3':
                    case 'wav':
                    case 'ogg':
                    case 'aac':
                    case 'flac':
                    case 'wma':
                    case 'm4a':
                    case 'amr':
                    case 'ape':
                    case 'aiff':
                    case 'au':
                    case 'mid':
                    case 'midi':
                    case 'ra':
                    case 'ram':
                        AUDIO.files.push(file_info)
                        break
                    case 'mp4':
                    case 'mov':
                    case 'avi':
                    case 'mkv':
                    case 'wmv':
                    case 'flv':
                    case 'webm':
                    case 'm4v':
                    case 'rmvb':
                    case '3gp':
                    case 'mpeg':
                    case 'mpg':
                    case 'ogv':
                        VIDEO.files.push(file_info)
                        break
                    case 'doc':
                    case 'docx':
                    case 'rtf':
                    case 'txt':
                    case 'xls':
                    case 'xlsx':
                    case 'csv':
                    case 'ppt':
                    case 'pptx':
                        EDITABLE.files.push(file_info)
                        break
                    case 'pdf':
                        UNEDITABLE.files.push(file_info)
                        break
                    case 'exe':
                    case 'lnk':
                        EXE.files.push(file_info)
                        break
                    default:
                        OTHER.files.push(file_info)
                }
            }
        })
        types.filter(type => (8 - cards.length) >= type.level).forEach(type => {
            type.REDIS.files.push(...type.files)
            type.files = []
        })
        const all_files_info = []
        types.filter(type => type.mark !== -1 && type.files.length !== 0).map((type,index) => {
            type.mark = index
            return type
        }).forEach(type => {
            let files_info = type.files.map(({suffix,...file_info}) => file_info)
            all_files_info.push(...files_info.map(file_info => [type.mark,file_info]))
            fs.writeFileSync(path.resolve(file_basic_path,`card_${type.mark}.json`),JSON.stringify(files_info,null,4),'utf8')
        })
        return all_files_info
    })
}

async function adjustFileToCard(fileName,file_path = path.resolve(file_basic_path,'card_files',fileName)){
    try {
        let file_info
        if(fs.statSync(file_path).isFile()){
            let { fileTypeFromBuffer } = await import('file-type')
            let mime = ''
            const typeInfor = await fileTypeFromBuffer(fs.readFileSync(file_path))
            if(typeInfor){
                mime = typeInfor.mime
            }
            let isShortcut = false,shortcuts_targetUrl = ''
            if(mime === 'application/x.ms.shortcut'){
                let {target} = shell.readShortcutLink(file_path)
                isShortcut = true
                shortcuts_targetUrl = target
            }
            file_info = await app.getFileIcon(isShortcut ? shortcuts_targetUrl : file_path).then(icon =>{
                return {
                    icon:icon.toDataURL(),
                    file_id:new Date().getTime() + Math.floor(Math.random() * 10000),
                    name:fileName,
                    isDir:fs.statSync(file_path).isDirectory(),
                    suffix:fileName.split('.')[fileName.split('.').length - 1]
                }
            })
            return file_info
        }else{
            file_info = {
                file_id:new Date().getTime() + Math.floor(Math.random() * 10000),
                name:fileName,
                isDir:fs.statSync(file_path).isDirectory()
            }
            return file_info
        }
    } catch (error) {
        dialog.showMessageBox({title:'提示',type:'info',message:`${fileName}${fs.statSync(file_path).isFile() ? '程序' : '文件夹中程序'}正在运行中!!!无法操作`})
        return []
    }
}

function releaseAll(){
    return new Promise((resolve) => {
        fs.readdir(file_basic_path,(err,files) => {
            if(err) return
            let ids = []
            files.filter(str => str.includes('json')).forEach((file,index) => {
                let files_info = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,file), 'utf8'))
                files_info.forEach(file_info => {
                    try {
                        moveFile(file_info,move_type_2)
                        files_info.splice(files_info.indexOf(file_info),1,null)
                    } catch (error) {
                        dialog.showMessageBox({
                            title:'提示',
                            type:'info',
                            message:`${file_info.name}${!file_info.isDir ? '程序' : '文件夹中程序'}正在运行中!!!无法操作`
                        })
                        ids.push(file_info.file_id)
                    }
                })
                fs.writeFileSync(path.resolve(file_basic_path,file),JSON.stringify(files_info.filter(i => i),null,4),'utf8')
                if(index === files.length - 2) resolve(ids)
            })
        })
    })
    
}

function getHashId(file_path){
    const data = fs.readFileSync(file_path)
    const hash = crypto.createHash('sha256')
    hash.update(data)
    return hash.digest('hex')
}

function getAllFiles(){
    let desk_files = fs.readdirSync(path.resolve(os.homedir(),'Desktop')).filter(file => fs.statSync(path.resolve(os.homedir(),'Desktop',file)).isFile())
    desk_files = desk_files.filter(file => !/^~\$/.test(file) && file !== 'desktop.ini')
    let area_files = []
    fs.readdirSync(file_basic_path).filter(fileName => /.json$/.test(fileName)).forEach(json => {
        const files = JSON.parse(fs.readFileSync(path.resolve(file_basic_path,json))).filter(file => {
            return fs.statSync(path.resolve(file_basic_path,'card_files',file.name)).isFile()
        }).map(file => ({
            icon_path:file.icon,
            file_id:file.file_id,
            name:file.name,
            file_path:path.resolve(file_basic_path,'card_files',file.name)
        }))
        area_files.push(files)
    })
    return new Promise(resolve => {
        let files = []
        if(desk_files.length == 0){
            resolve(area_files.filter(area => area.length))
            return
        }
        desk_files.forEach(async file => {
            const file_path = path.resolve(os.homedir(),'Desktop',file)
            let { fileTypeFromBuffer } = await import('file-type')
            let mime = ''
            const typeInfor = await fileTypeFromBuffer(fs.readFileSync(file_path))
            if(typeInfor){
                mime = typeInfor.mime
            }
            let isShortcut = false,shortcuts_targetUrl = ''
            if(mime === 'application/x.ms.shortcut'){
                let {target} = shell.readShortcutLink(file_path)
                isShortcut = true
                shortcuts_targetUrl = target
            }
            const file_info = await app.getFileIcon(isShortcut ? shortcuts_targetUrl : file_path).then(icon =>{
                return {icon_path:icon.toDataURL(),file_id:new Date().getTime() + Math.floor(Math.random() * 10000),name:file,file_path}
            })
            files.push(file_info)
            if(files.length === desk_files.length){
                area_files.push(files)
                resolve(area_files.filter(area => area.length))
            }
        })
    })
    
}

function changeSyncFileName(sync,name){
    if(sync.find(file => file.name == name)){
        return changeSyncFileName(sync,`${name.split('.').slice(0,name.split('.').length - 1)} - 副本.${name.split('.')[name.split('.').length - 1]}`)
    }
    return name
}

module.exports = {
    backrecept,
    getHashId
}