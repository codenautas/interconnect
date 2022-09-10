"use strict";

import {promises as fs} from "fs"
import * as http from "https"
import * as querystring from "querystring"

export type TiposPaquete = 'text' | ''
export type Verbs = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export function conclude(resolve: () => void, reject: (err?: Error | undefined) => void, message?: string): (err?: Error | undefined) => void{
    return function (err) {
        if (err) {
            reject(err)
        }
        else {
            if (message) {
                console.log(message)
            }
            resolve()
        }
    }
}

export class Requester {
    logFileName?: string
    constructor(private URL:string, private BASE_PATH:string) {
    }
    async requerimiento<TRec, T2Send extends {}>(
        path: string, 
        data2send: T2Send, 
        headers: http.RequestOptions['headers'], 
        tipo: TiposPaquete, 
        method: Verbs | null
    ):Promise<TRec> {
        const postData = tipo == 'text' && method != 'GET' ? JSON.stringify(data2send) : querystring.stringify(data2send);
        var data = [] as string[];
        if (this.logFileName) {
            await fs.appendFile(this.logFileName, (method || 'POST') + ' ' + this.BASE_PATH + path + '\n', 'utf8');
            await fs.appendFile(this.logFileName, JSON.stringify(data2send) + '\n', 'utf8');
            await fs.appendFile(this.logFileName, '   equivale a:\n', 'utf8');
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
            await fs.appendFile(this.logFileName, JSON.stringify(reqParams, null, '  ') + '\n', 'utf8');
        }
        var result = await new Promise<string>((resolve, reject) => {
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
            await fs.appendFile(this.logFileName, text + '\n\n', 'utf8');
        }
        try {
            return JSON.parse(text);
        } catch (err) {
            throw new Error(text);
        }
    }
}
