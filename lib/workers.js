// dependenices
const data = require('./data');
const { parseJSON } = require('../helper/utilities');
const url = require('url');
const http = require('http');
const https = require('https');
const { sendTwilioSms } = require('../helper/notification');

// app object 
const worker = {};

// lookup all checks from database
worker.gatherAllChecks = () => {
    //get all the checks
    data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach(checks => {
                data.read('checks', checks, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        // pass the data to the check validator
                        worker.validateCheckData(parseJSON(originalCheckData));

                    } else {
                        console.log('error in reading one of the check data')
                    }
                });
            });
        } else {
            console.log('could not find any checks to process');
        }
    });

};

// validate individual check data .. 
worker.validateCheckData = (originalCheckData) => {
    if (originalCheckData && originalCheckData.id) {
        originalCheckData.state =
            typeof originalCheckData.state === 'string' &&
                ['up', 'down'].indexOf(originalCheckData.state > -1) ?
                originalCheckData.state : 'down';

        originalCheckData.lastCheck =
            typeof originalCheckData.lastCheck === 'number' &&
                originalCheckData.lastCheck > 0 ? originalCheckData.lastCheck : false;

        // pass to the next process
        worker.performCheck(originalCheckData);
    } else {
        console.log('error check was invalid or not properly formatted')
    }
};

// perform check
worker.performCheck = (originalCheckData) => {
    // prepare initial check outcome
    let checkOutcome = {
        'error': false,
        'responseCode': false

    };
    // mark the outcome has not been sent yet
    let outcomeSent = false;

    // parse the hostname & full url from original data
    const parseUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
    const hostName = parseUrl.hostname;
    const path = parseUrl.path;

    const requestDetails = {
        protocol: `${originalCheckData.protocol}:`,
        hostname: hostName,
        method: originalCheckData.method.toUpperCase(),
        path: path,
        timeout: originalCheckData.timeoutSeconds * 1000,
    };

    const protocolToUse = originalCheckData.protocol === 'http' ? http : https;

    let req = protocolToUse.request(requestDetails, (res) => {
        const status = res.statusCode;
        checkOutcome.responseCode = status;
        //update the outcome and pass to the next process
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('error', (e) => {
        checkOutcome = {
            error: true,
            value: e,

        };
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', () => {
        checkOutcome = {
            error: true,
            value: 'timeout',
        };

        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }

    });

    req.end();

    worker.processCheckOutcome = (originalCheckData, checkOutcome) => {
        let state = !checkOutcome.error && checkOutcome.responseCode &&
            originalCheckData.successCode.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

        let alertWanted = originalCheckData.lastCheck &&
            originalCheckData.state !== state ? true : false

        // update the check data
        let newcheckData = originalCheckData;
        newcheckData.state = state;
        newcheckData.lastCheck = Date.now();

        // update the check to db
        data.update('checks', newcheckData.id, newcheckData, (err)=> {
            if(!err) {
                if(alertWanted) {
                    worker.alertToUserchange(newcheckData);
                } else {
                    console.log('no need to send notification')
                }
                
            } else {
                console.log('error trying to store the update')
            }
        }) ;
    };

};

worker.alertToUserchange = (newcheckData) => {
    const msg = `Alert: Your check for ${newcheckData.method.toUpperCase()} ${
        newcheckData.protocol}://${newcheckData.url} is currently ${newcheckData.state}`;

    sendTwilioSms(newcheckData.userPhone, msg, (err) => {
        if(!err) {
            console.log(`User was alerted to a status change via SMS: ${msg}`);
        } else {
            console.log('There was a problem sending sms to one of the user!');
        }
    });

};

// worker loop...
worker.loop = () => {
    setInterval(() => {
        worker.gatherAllChecks();
    }, 1000 * 60);
};

worker.init = () => {
    // gather all the checks
    worker.gatherAllChecks();

    // call the function in using loop...
    worker.loop();
}

module.exports = worker;



