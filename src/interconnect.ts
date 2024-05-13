"use strict";

import {promises as fs} from "fs"
import { IncomingHttpHeaders } from "http";
import * as http from "http"
import * as querystring from "querystring"

export type TiposPaquete = 'text' | 'urlencoded'
export type Verbs = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type TiposResultado = 'json' | '--json' | 'headers'

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
        tipo?: TiposPaquete, 
        method?: Verbs | null,
        tiposResultados?: TiposResultado | null
    ):Promise<TRec> {
        method = method || 'POST'
        const postData = method == 'GET' ? null : tipo == 'text' ? JSON.stringify(data2send) : querystring.stringify(data2send)
        const queryData = method == 'GET' ? '?' + querystring.stringify(data2send) : ''
        var data = [] as string[];
        if (this.logFileName) {
            await fs.appendFile(this.logFileName, method + ' ' + this.BASE_PATH + path + queryData + '\n', 'utf8');
            await fs.appendFile(this.logFileName, JSON.stringify(data2send) + '\n', 'utf8');
            await fs.appendFile(this.logFileName, '   equivale a:\n', 'utf8');
        }
        var reqParams = {
            method,
            headers: {
                'Content-Type': tipo == 'text' ? 'text' : 'application/x-www-form-urlencoded',
                ...(postData != null ? {'Content-Length': Buffer.byteLength(postData)} : {}),                
                ...headers
            },
            path: this.BASE_PATH + path + queryData,
        };
        if (this.logFileName) {
            await fs.appendFile(this.logFileName, JSON.stringify(reqParams, null, '  ') + '\n', 'utf8');
        }
        var result = await new Promise<string|{statusCode:number|undefined, headers:IncomingHttpHeaders}>((resolve, reject) => {
            var req = http.request(this.URL, reqParams, (res) => {
                if (tiposResultados == 'headers') {
                    var {statusCode, headers} = res;
                    resolve({statusCode, headers});
                } else {
                    res.on('data', (chunk) => {
                        data.push(chunk);
                    });
                    res.on('end', () => {
                        resolve(data.join(''));
                    });
                }
                res.on('error', (err) => {
                    reject(err);
                });
            });
            if (postData != null) {
                req.write(postData);
            }
            req.end();
        });
        if (tiposResultados == 'headers') return result as TRec;
        var text = result as string;
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
