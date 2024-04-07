const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('pre_api',{
    show(){
        ipcRenderer.send('show')
    },
    init_cards(cards_mark){
        return ipcRenderer.invoke('init_cards',cards_mark)
    },
    async uploadFile(file){
        let iconBuffer = await ipcRenderer.invoke('uploadFile',file)
        return iconBuffer
    },
    async judgeDorF(path){
        return await ipcRenderer.invoke('judgeDorF',path)
    },
    releaseFile(file_id,mark){
        ipcRenderer.send('releaseFile',file_id,mark)
    },
    moveFromJson(...args){
        ipcRenderer.send('moveFromJson',...args)
    },
    divideRough(){
        return ipcRenderer.invoke('divideRough')
    },
    isRetract(){
        return ipcRenderer.invoke('isRetract')
    },
    divideDetailed(){
        return ipcRenderer.invoke('divideDetailed')
    },
    releaseAll(){
        return ipcRenderer.invoke('releaseAll')
    },
    shellOpen(file_id,mark){
        ipcRenderer.send('shellOpen',file_id,mark)
    },
    getWindowAspectRatio(){
        return ipcRenderer.invoke('getWindowAspectRatio')
    },
    uploadImage(path){
        return ipcRenderer.invoke('uploadImage',path)
    },
    init_display_images(){
        return ipcRenderer.invoke('init_display_images')
    },
    getCurrentWallpaper(){
        return ipcRenderer.invoke('getWindowCurrentWallpaper')
    },
    settingWallpaper(path,mode){
        ipcRenderer.send('setWallpaper',path,mode)
    },
    getAllFiles(){
        return ipcRenderer.invoke('getAllFiles')
    },
    windowFocusable(){
        ipcRenderer.send('windowFocusable')
    },
    windowUnfocusable(){
        ipcRenderer.send('windowUnfocusable')
    },
    createOrder(order_info,updateOrderId){
        return ipcRenderer.invoke('createOrder',order_info,updateOrderId)
    },
    getOrders(){
        return ipcRenderer.invoke('getOrders')
    },
    removeOrder(order_id){
        return ipcRenderer.invoke('removeOrder',order_id)
    },
    completeOrder(order_id){
        ipcRenderer.send('completeOrder',order_id)
    },
    restartOrder(order_id){
        ipcRenderer.send('restartOrder',order_id)
    },
    updateOrderFileStatus(order_id,file_id,done){
        ipcRenderer.send('updateOrderFileStatus',order_id,file_id,done)
    },
    addSyncFiles(files){
        ipcRenderer.send('addSyncFiles',files)
    },
    getSyncFiles(){
        return ipcRenderer.invoke('getSyncFiles')
    },
    getRemoteSyncFiles(){
        return ipcRenderer.invoke('getRemoteSyncFiles')
    },
    downLoadRemoteSyncFiles(files){
        ipcRenderer.send('downLoadRemoteSyncFiles',files)
    },
    test(){
        return ipcRenderer.invoke('test')
    }
})