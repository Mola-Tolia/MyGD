const fs = require('fs')
const path = require('path')
const FormData = require('form-data')

let watchers = []
const { url, headers, order_basic_path, sync_basic_path } = require('./globalVar')

function watchFiles(getHashId){
    watchers.forEach(({watcher}) => {
        if(watcher.close){
            watcher.close()
            watcher.removeListener('change', watcher)
        }
    })
    watchers = []
    const orders = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'), 'utf8'))
    orders.forEach(order => {
        const order_id = order.order_id
        order.files.forEach(file => {
            let timer
            const hash_name = file.hash_name
            const file_id = file.file_id
            const watcher = fs.watchFile(file.file_path,(cur,pre) => {
                if(timer) clearTimeout(timer)
                if(!fs.existsSync(file.file_path)){
                    if(watcher.close){
                        watcher.close()
                        watcher.removeListener('change', watcher)
                    }
                    // if(watchers.includes(watcher)) watchers.splice(watchers.indexOf(watcher),1)
                    return
                }
                timer = setTimeout(() => {
                    const cur_orders = JSON.parse(fs.readFileSync(path.resolve(order_basic_path,'orders.json'), 'utf8'))
                    const cur_file = cur_orders.find(order => order.order_id == order_id).files.find(file => file.file_id == file_id)
                    const old_hash = cur_file.hash_name
                    cur_file.hash_name = getHashId(cur_file.file_path) + '.' + cur_file.file_path.split('.')[cur_file.file_path.split('.').length - 1]
                    fs.writeFileSync(path.resolve(order_basic_path,'orders.json'),JSON.stringify(cur_orders,null,4),'utf8')
                    fetch(`${url}updateFileHashName`,{
                        method: 'POST',
                        body: JSON.stringify({
                            old_hash
                        }),
                        headers
                    }).then(res => res.text()).then(result => {
                        if(result){
                            const readStream = fs.createReadStream(path.resolve(cur_file.file_path))
                            readStream.pipe(fs.createWriteStream(path.resolve(order_basic_path,'order_files',cur_file.hash_name)))
                            readStream.on('end', async () => {
                                const formData = new FormData()
                                formData.append('file', fs.createReadStream(path.resolve(order_basic_path,'order_files',cur_file.hash_name)))
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
                        }else{
                            console.log('fail to delete remote file')
                        }
                    }).catch(err => {
                        console.log('fail to deal order file')
                    })
                },5000)
            })
            watchers.push({watcher,watch_path:file.file_path})
        })
    })
}

const SyncWatchers = []
function watchSyncFiles(uploadSyncFile){
    SyncWatchers.forEach((watcher) => {
        if(watcher.close){
            watcher.close()
            watcher.removeListener('change', watcher)
        }
    })
    SyncWatchers.splice(0,SyncWatchers.length)
    JSON.parse(fs.readFileSync(path.resolve(sync_basic_path,'sync.json'), 'utf8')).forEach(({file_path}) => {
        let timer
        const watcher = fs.watchFile(file_path,(cur,pre) => {
            if(timer) clearTimeout(timer)
            if(!fs.existsSync(file_path)){
                if(watcher.close){
                    watcher.close()
                    watcher.removeListener('change', watcher)
                }
                return
            }
            timer = setTimeout(() => {
                uploadSyncFile()
            },5000)
        })
        SyncWatchers.push(watcher)
    })
}

module.exports = {
    watchFiles,
    watchSyncFiles
}