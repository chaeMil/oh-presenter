const electron = require('electron');
const {app, ipcMain} = electron;
const config = require('../shared/config');
const Server = require('./service/server.js');
const CacheService = require('../shared/service/cache_service.js');
const CacheWebServer = require('../shared/service/cache_web_server');
const WindowManager = require('./service/window_manager');
let server = new Server(config.serverPort, serverStatusCallback);
let cacheWebServer = new CacheWebServer();
let cacheService = new CacheService();
let windowManager = new WindowManager(ipcMain);
const {is} = require('electron-util');
const unhandled = require('electron-unhandled');

app.on('ready', function () {
    init();
});

function init() {

    let onMainWindowClosed = () => {
        app.quit();
    };

    unhandled({
        showDialog: is.development,
        logger: error => {
            console.error(error);
            if (!is.development) app.quit();
        }
    });

    server.run();
    cacheService.init();
    cacheWebServer.init();
    windowManager.createMainWindow(onMainWindowClosed);
}

function serverStatusCallback(type, action, data) {
    sendMessageToWindow(type, action, data);
}

ipcMain.on('force_quit', (event, arg) => {
    app.quit();
});

ipcMain.on('broadcast', (event, arg) => {
    if (arg.hasOwnProperty('clientHashIdFilter')) {
        server.broadcast(arg, arg.clientHashIdFilter)
    } else {
        server.broadcast(arg);
    }
});

ipcMain.on('open_window', (event, arg) => {
    windowManager.openWindow(arg);
});

ipcMain.on('window_interaction', (event, arg) => {
    sendMessageToWindow(arg.windowId, 'window_interaction', arg.action, arg.data);
});

ipcMain.on('window_operation', (event, arg) => {
    windowManager.windowOperation(arg.action, arg.data);
});

function sendMessageToWindow(window, type, action, data) {
    windowManager.getWindow(window).browserWindow.webContents.send(type, {
        action: action,
        data: data
    });
}

ipcMain.on('server_status', (event, arg) => {
        if (arg == 'get_clients_list') {
            sendMessageToWindow('mainWindow', 'server_status', 'get_clients_list', server.getClientsList());
        }
    }
);

app.on('window-all-closed', function () {
    //if (process.platform !== 'darwin') {
    app.quit();
    //}
});