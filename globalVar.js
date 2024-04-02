const path = require('path')

const url = 'http://localhost:2024/'
const headers = {'Content-Type': 'application/json'}
const order_basic_path = path.resolve(__dirname,'./save_files/order')
const sync_basic_path = path.resolve(__dirname,'./save_files/sync')
const immersive_path = path.resolve(__dirname,'./save_files/immersive/index.json')
const process_icon = path.resolve(__dirname, './resources/images/ico.png')
const file_basic_path = path.resolve(__dirname,'./save_files/card_json')
const wallpaper_basic_path = path.resolve(__dirname,'./save_files/wallpaper')


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