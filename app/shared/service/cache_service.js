const fs = require('fs-extra');
const FileUtils = require('../util/file_utils');
const ip = require('ip');
const os = require('os');
const Config = require('../config.js');
const mkdirp = require('mkdirp');

class CacheService {

    constructor() {

    }

    init() {
        if (!fs.existsSync(CacheService.getCacheLocation())) {
            mkdirp(CacheService.getCacheLocation(), (err) => {
                if (err) console.error(err);
            });
        }
        if (!fs.existsSync(CacheService.getTempLocation())) {
            mkdirp(CacheService.getTempLocation(), (err) => {
                if (err) console.error(err);
            });
        }
        fs.emptyDirSync(CacheService.getTempLocation());
    }

    addFileToCache(sourceFile, callback) {
        let safeFileName = this._generateSafeFileName(sourceFile);
        if (this._shouldCacheFile(sourceFile)) {
            fs.copySync(sourceFile, CacheService.getCacheLocation() + safeFileName);
        }
        callback(CacheService.getWebServerCacheLocation() + safeFileName);
    }

    _shouldCacheFile(sourceFile) {
        let safeFileName = this._generateSafeFileName(sourceFile);
        if (fs.existsSync(CacheService.getCacheLocation() + safeFileName)) {
            let sourceFileStats = fs.statSync(sourceFile);
            let cachedFileStats = fs.statSync(CacheService.getCacheLocation() + safeFileName);
            return (sourceFileStats.mtimeMs != cachedFileStats.mtimeMs);
        } else {
            return true;
        }
    }

    static returnCachedFileContent(cachedFilename, callback) {
        fs.readFile(this.getCacheLocation() + cachedFilename, (err, contents) => {
            callback(contents);
        });
    }

    static getCacheLocation() {
        return this._getUserHome() + "/.oh-presenter/cache/files/";
    }

    static getTempLocation() {
        return this._getUserHome() + "/.oh-presenter/temp/";
    }

    static getWebServerCacheLocation() {
        return "http://" + ip.address() + ":" + Config.cacheServerPort + "/files/";
    }

    static _getUserHome() {
        /*switch (os.platform()) {
            case 'linux':
            case 'darwin':
                return process.env.HOME;
            case 'win32':
                return app.getPath('appData');
            default:
                return process.env.HOME;
        }*/
        return process.env.HOME;
    }

    _generateSafeFileName(input) {
        return input.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    static getLocalFilePath(remotePath) {
        return remotePath.replace("http://" + ip.address() + ":" + Config.cacheServerPort + "/files/", this.getCacheLocation());
    }

}

module.exports = CacheService;