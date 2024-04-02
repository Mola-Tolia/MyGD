const { ipcMain, globalShortcut } = require('electron')
const fs = require('fs')
const path = require('path')
const { immersive_path } = require('../globalVar')

function displayDataBackrecept(mainWindow){
    setTimeout(() => {
        mainWindow.webContents.send('getAllData',JSON.parse(fs.readFileSync(immersive_path, 'utf8') || '[]'))
    },500)
}

module.exports = {
    displayDataBackrecept
}