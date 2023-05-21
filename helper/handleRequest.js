const url = require('url');
const { StringDecoder } = require('string_decoder');
const routes = require('../routes');
const { notFoundHandler } = require('../handler/routeHandler/notFoundHandler');
const { parseJSON } = require('./utilities');

const handler = {};


handler.handleRequest = (req, res) => {
    // request handling ............

    const parseUrl = url.parse(req.url, true);
    const path = parseUrl.pathname;
    const trimmedPath = path.replace(/^\/|\/$/g, "");
    const method = req.method.toLowerCase();
    const parsedQueryObject = parseUrl.query;
    const headersObject = req.headers;

    //console.log('the body ------ ', req.body)

    const requestProperties = {
        parseUrl,
        path,
        trimmedPath,
        method,
        parsedQueryObject,
        headersObject,

    };

    const decoder = new StringDecoder('utf-8');
    let realData = '';


    const choosenHandler = routes[trimmedPath] ? routes[trimmedPath] : notFoundHandler;

    //console.log(routes[trimmedPath], 'this is route', trimmedPath, '------ ');



    req.on('data', (buffer) => {
        realData += decoder.write(buffer);
    });

    req.on('end', () => {
        realData += decoder.end();

        requestProperties.body = parseJSON(realData);


        choosenHandler(requestProperties, (statusCode, payload) => {
            statusCode = typeof (statusCode) === 'number' ? statusCode : 500;
            payload = typeof (payload) === 'object' ? payload : {};

            const payloadString = JSON.stringify(payload);

            // return the final response 
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

        });

    });

};

module.exports = handler;
