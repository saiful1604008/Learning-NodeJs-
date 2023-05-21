const https = require('https');
const {twilio} = require('./environment');
const querystring = require('querystring');

const notification = {};

notification.sendTwilioSms = (phone, msg, callback) => {
    const userPhone =
        typeof phone === 'string' && phone.trim().length === 11 ? phone.trim() : false;
    const userMessage =
        typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ?
            msg.trim() : false;
    
    if(userPhone && userMessage) {
        // send object which will be requested
        const payload = {
            From: twilio.fromPhone,
            To: `+88${userPhone}`,
            Body: userMessage

        };

        const stringifyPayload = querystring.stringify(payload);

        console.log(stringifyPayload);

        const requestDetails = {
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
            auth: `${twilio.accountSid}:${twilio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const req = https.request(requestDetails, (res)=> {
            const status = res.statusCode;
            if(status === 200 || status === 201) {
                callback(false);
            } else {
                callback(`status code returned was ${status}`);
            }

        });

        req.on('error', (e) => {
            callback(e);
        });

        req.write(stringifyPayload);
        req.end();

    } else {
        callback('missing the parameters or giving wrong info as parameter');
    }

};

module.exports = notification;

