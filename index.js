/*
 * Title: Uptime Monitoring Application
 * Description: A RESTFul API to monitor up or down time of user defined links
 * Author: Saiful Alam
 * Date: 14/05/2023
 *
 */



// dependenices
const server = require('./lib/server');
const worker = require('./lib/workers');

// app object 
const app = {};

app.init = () => {
    server.init();
    worker.init();

};

app.init();

module.exports = app;