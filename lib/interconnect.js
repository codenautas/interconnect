"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Requester = exports.conclude = void 0;
const http = require("https");
// import * as http from "http";
const fs_1 = require("fs");
const querystring = require("querystring");
function conclude(resolve, reject, message) {
    return function (err) {
        if (err) {
            reject(err);
        }
        else {
            if (message) {
                console.log(message);
            }
            resolve();
        }
    };
}
exports.conclude = conclude;
class Requester {
    constructor(URL, BASE_PATH) {
        this.URL = URL;
        this.BASE_PATH = BASE_PATH;
    }
    async requerimiento(path, data2send, headers, tipo, method) {
        const postData = tipo == 'text' && method != 'GET' ? JSON.stringify(data2send) : querystring.stringify(data2send);
        var data = [];
        if (this.logFileName) {
            await fs_1.promises.appendFile(this.logFileName, (method || 'POST') + ' ' + this.BASE_PATH + path + '\n', 'utf8');
            await fs_1.promises.appendFile(this.logFileName, JSON.stringify(data2send) + '\n', 'utf8');
            await fs_1.promises.appendFile(this.logFileName, '   equivale a:\n', 'utf8');
        }
        var reqParams = {
            method: method || 'POST',
            headers: {
                'Content-Type': tipo == 'text' ? 'text' : 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                ...headers
            },
            path: this.BASE_PATH + path + (method == 'GET' ? '?' + postData : ''),
        };
        if (this.logFileName) {
            await fs_1.promises.appendFile(this.logFileName, JSON.stringify(reqParams, null, '  ') + '\n', 'utf8');
        }
        var result = await new Promise((resolve, reject) => {
            var req = http.request(this.URL, reqParams, (res) => {
                res.on('data', (chunk) => {
                    data.push(chunk);
                });
                res.on('end', () => {
                    resolve(data.join(''));
                });
                res.on('error', (err) => {
                    reject(err);
                });
            });
            if (method != 'GET') {
                req.write(postData);
            }
            req.end();
        });
        var text = result;
        if (this.logFileName) {
            await fs_1.promises.appendFile(this.logFileName, text + '\n\n', 'utf8');
        }
        try {
            return JSON.parse(text);
        }
        catch (err) {
            throw new Error(text);
        }
    }
}
exports.Requester = Requester;
//# sourceMappingURL=interconnect.js.map