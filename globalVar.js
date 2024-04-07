const { app } = require('electron')
const path = require('path')
const fs = require('fs')

const url = 'http://localhost:2024/'
const headers = {'Content-Type': 'application/json'}
const process_icon = path.resolve(app.getAppPath(),'./resources/images/ico.png')

const deskAssistant = path.resolve(app.getPath('appData'),'deskAssistant')
const save_files = path.resolve(deskAssistant,'save_files')
const immersive = path.resolve(save_files,'immersive')

const order_basic_path = path.resolve(save_files,'order')
const sync_basic_path = path.resolve(save_files,'sync')
const file_basic_path = path.resolve(save_files,'card_json')
const wallpaper_basic_path = path.resolve(save_files,'wallpaper')

const card_files = path.resolve(file_basic_path,'card_files')
const order_files = path.resolve(order_basic_path,'order_files')

const immersive_path = path.resolve(immersive,'index.json')
const orders_json = path.resolve(order_basic_path,'orders.json')
const sync_json = path.resolve(sync_basic_path,'sync.json')
const current_image = path.resolve(wallpaper_basic_path,'current_image.json')

if(!fs.existsSync(deskAssistant)){
    fs.mkdirSync(deskAssistant)
}
if(!fs.existsSync(save_files)){
    fs.mkdirSync(save_files)
}
if(!fs.existsSync(immersive)){
    fs.mkdirSync(immersive)
}
if(!fs.existsSync(order_basic_path)){
    fs.mkdirSync(order_basic_path)
}
if(!fs.existsSync(sync_basic_path)){
    fs.mkdirSync(sync_basic_path)
}
if(!fs.existsSync(file_basic_path)){
    fs.mkdirSync(file_basic_path)
}
if(!fs.existsSync(wallpaper_basic_path)){
    fs.mkdirSync(wallpaper_basic_path)
}
if(!fs.existsSync(card_files)){
    fs.mkdirSync(card_files)
}
if(!fs.existsSync(order_files)){
    fs.mkdirSync(order_files)
}
fs.access(immersive_path, fs.constants.F_OK, (err) => {
    if(err){
        fs.writeFileSync(immersive_path,'[]','utf8')
    }
})
fs.access(orders_json, fs.constants.F_OK, (err) => {
    if(err){
        fs.writeFileSync(orders_json,'[]','utf8')
    }
})
fs.access(sync_json, fs.constants.F_OK, (err) => {
    if(err){
        fs.writeFileSync(sync_json,'[]','utf8')
    }
})
fs.access(current_image, fs.constants.F_OK, (err) => {
    if(err){
        fs.writeFileSync(current_image,'[]','utf8')
    }
})

module.exports = {
    url,
    headers,
    order_basic_path,
    sync_basic_path,
    immersive_path,
    process_icon,
    file_basic_path,
    wallpaper_basic_path
}