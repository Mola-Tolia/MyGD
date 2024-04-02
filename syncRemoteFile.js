const fs = require('fs')
const path = require('path')
const os = require('os')
const axios = require('axios')
const { error } = require('console')
const { url, headers, order_basic_path } = require('./globalVar')


async function syncWallpaper(user){
    const images = await fetch(`${url}getImages`,{method:'POST',body:JSON.stringify({user}),headers}).then(async res => JSON.parse(await res.text()))
    const promises = []
    images.forEach(image => {
        promises.push(download(image))
    })
    return Promise.all(promises)
}

function download(image){
    return new Promise(resolve => {
        axios({
            method: 'get',
            url: `${url}downloadImage?image=${image}`,
            responseType: 'stream', // 指示axios返回流
        }).then(response => {
            // 创建一个可写流来写入文件
            const writer = fs.createWriteStream(path.resolve(__dirname,`./save_files/wallpaper/${image}`))
            // 将响应流管道到文件可写流中
            response.data.pipe(writer)
            // 处理写入完成
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve)
                writer.on('error', reject)
            })
        }).then(() => {
            // console.log('File has been saved successfully.')
            resolve()
        },error => {
            console.error('Error saving file:', error)
            resolve()
        })
    })
}

function getOrders(user,ISUPLOADINGORDERSRECORD){
    if(ISUPLOADINGORDERSRECORD) return
    return new Promise(resolve => {
        fetch(`${url}getOrders?username=${user}`, { method: 'POST',headers}).then(res => res.text()).then(json => {
            console.log('getOrders')
            fs.writeFileSync(path.resolve(__dirname,'./save_files/order/orders.json'),json,'utf8')
            console.log('read over')
            resolve()
        }).catch(err => {
            console.log('fail to get order record')
            resolve()
        })
    })
}

function getOrderFiles(){
    let files_num = 0
    let complete_num = 0
    return new Promise(res => {
        const orders = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'),'utf8'))
        if(orders.length == 0){
            res()
            return
        }
        orders.forEach(order => {
            order.files.forEach(file => {
                files_num++
                const hash_name = file.hash_name
                const file_path = file.file_path
                axios({
                    method: 'get',
                    url: `${url}downloadOrderFile?file=${hash_name}`,
                    responseType: 'stream', // 指示axios返回流
                }).then(response => {
                    // 创建一个可写流来写入文件
                    const writer = fs.createWriteStream(file_path)
                    // 将响应流管道到文件可写流中
                    response.data.pipe(writer)
                    // 处理写入完成
                    return new Promise((resolve, reject) => {
                        writer.on('finish', resolve)
                        writer.on('error', reject)
                    }).then(() => {
                        complete_num++
                        if(complete_num == files_num) res()
                        console.log('success to download file')
                    }).catch(err => {
                        complete_num++
                        if(complete_num == files_num) res()
                        console.log('fail to download file')
                    })
                })
            })
        })
    })
}

function downloadFiles(files,user){
    files.forEach(file => {
        axios({
            method: 'get',
            url: `${url}downloadSyncFile?file=${file}&user=${user}`,
            responseType: 'stream', // 指示axios返回流
        }).then(response => {
            // 创建一个可写流来写入文件
            const writer = fs.createWriteStream(path.resolve(os.homedir(),'Desktop',file))
            // 将响应流管道到文件可写流中
            response.data.pipe(writer)
            // 处理写入完成
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve)
                writer.on('error', reject)
            })
        }).then(() => {
            console.log('File has been downloaded')
        },error => {
            console.error('Error download file')
        })
    })
}

module.exports = {
    syncWallpaper,
    getOrders,
    getOrderFiles,
    downloadFiles
}