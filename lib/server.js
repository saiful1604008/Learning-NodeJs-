// dependenices
const http = require('http');
const {handleRequest} = require('../helper/handleRequest');
const environment = require('../helper/environment');
// const data = require('./lib/data');
const { sendTwilioSms } = require('../helper/notification');

// app object 
const server = {};

// configuration --- environment.js file .... 


// create server
server.createServer = () => {
    const createServerVariable = http.createServer(server.handleRequest);
    createServerVariable.listen(environment.port, () => {
        console.log(`server is running on port ${environment.port}`);
    });
};

// handle request response
server.handleRequest = handleRequest;

server.init = () => {
    server.createServer();
}

module.exports = server;

