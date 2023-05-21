const data = require('../../lib/data');
const { parseJSON } = require('../../helper/utilities');
const { createRandomString } = require('../../helper/utilities');
const tokenHandler = require('./tokenHandler');

const handler = {};

handler.checkHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._check[requestProperties.method](requestProperties, callback);

    } else {
        callback(405);
    }

};


handler._check = {};

handler._check.post = (requestProperties, callback) => {
    const protocol =
        typeof requestProperties.body.protocol === 'string' &&
            ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
            ? requestProperties.body.protocol : false;

    //console.log('type protocol: ', typeof requestProperties.body.protocol, 'data: ', requestProperties.body.protocol.trim().length, 'val: ', requestProperties.body.protocol)

    const url =
        typeof requestProperties.body.url === 'string' &&
            requestProperties.body.url.trim().length > 0
            ? requestProperties.body.url : false

    //console.log('type url: ', typeof requestProperties.body.url, 'data: ', requestProperties.body.url.trim().length, 'val: ', requestProperties.body.url)

    const method =
        typeof requestProperties.body.method === 'string' &&
            ['POST', 'GET', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1
            ? requestProperties.body.method : false;

    //console.log('type method: ', typeof requestProperties.body.method,  'val: ', requestProperties.body.method)

    const successCode =
        typeof requestProperties.body.successCode === 'object' &&
            requestProperties.body.successCode instanceof Array ? requestProperties.body.successCode : false;


    //console.log('type successCode: ', typeof requestProperties.body.successCode, 'val: ', requestProperties.body.successCode)

    const timeoutSeconds =
        typeof requestProperties.body.timeoutSeconds === 'number' &&
            requestProperties.body.timeoutSeconds % 1 === 0 && requestProperties.body.timeoutSeconds >= 1 &&
            requestProperties.body.timeoutSeconds <= 5 ? requestProperties.body.timeoutSeconds : false;


    //console.log('type timeoutSeconds: ', typeof requestProperties.body.timeoutSeconds, 'val: ', requestProperties.body.timeoutSeconds)

    if (protocol && url && method && successCode && timeoutSeconds) {
        const token =
            typeof requestProperties.headersObject.token === "string"
                ? requestProperties.headersObject.token : false;
        // look up user by using token
        data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = parseJSON(tokenData).phone;
                //console.log(userPhone);
                data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
                            if (tokenIsValid) {
                                const userObject = parseJSON(userData);
                                const userChecks =
                                    typeof userObject.checks === 'object' && userObject.checks instanceof Array ?
                                        userObject.checks : [];

                                if (userChecks.length < 5) {
                                    const checkId = createRandomString(20);
                                    const checkObject = {
                                        id: checkId,
                                        userPhone,
                                        protocol,
                                        url,
                                        method,
                                        successCode,
                                        timeoutSeconds
                                    };

                                    data.create('checks', checkId, checkObject, (err) => {
                                        if (!err) {
                                            // adding checkId to userObject
                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId);

                                            // update the users data
                                            data.update('users', userPhone, userObject, (err) => {
                                                if (!err) {
                                                    callback(200, userObject);

                                                } else {
                                                    callback(500, {
                                                        message: 'Error in the server side'
                                                    });
                                                }
                                            });

                                        } else {
                                            callback(500, {
                                                message: 'Error in the server side'
                                            });
                                        }

                                    });
                                } else {
                                    callback(401, {
                                        message: 'user reached max check limit'
                                    });
                                }

                            } else {
                                callback(403, {
                                    message: 'Authentication problem'
                                });
                            }

                        });


                    } else {
                        callback(403, {
                            messgae: 'User not found'
                        });
                    }

                });

            } else {
                callback(403, {
                    messgae: 'Authentication problem'
                });
            }
        });

    } else {
        callback(400, {
            messgae: 'Erron in your request'
        });
    }

};

handler._check.get = (requestProperties, callback) => {
    const id =
        typeof requestProperties.parsedQueryObject.id === 'string' &&
            requestProperties.parsedQueryObject.id.trim().length === 20
            ? requestProperties.parsedQueryObject.id
            : false;

    //console.log(requestProperties.parsedQueryObject.id, '----------')

    if (id) {
        data.read('checks', id, (err, checkData) => {
            //console.log(checkData)
            if (!err && checkData) {
                const token =
                    typeof requestProperties.headersObject.token === "string"
                        ? requestProperties.headersObject.token : false;
                const userPhone = parseJSON(checkData).userPhone;
                tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        callback(200, parseJSON(checkData));
                    } else {
                        callback(403, {
                            messgae: 'Authentication Failed..'
                        });
                    }
                });


            } else {
                callback(400, {
                    messgae: 'error in your request......'
                });
            }
        });

    } else {
        callback(400, {
            message: 'problem in your request'
        });
    }

};

handler._check.put = (requestProperties, callback) => {
    const id =
        typeof requestProperties.body.id === 'string' &&
            requestProperties.body.id.trim().length === 20
            ? requestProperties.body.id
            : false;

    const protocol =
        typeof requestProperties.body.protocol === 'string' &&
            ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
            ? requestProperties.body.protocol : false;

    const url =
        typeof requestProperties.body.url === 'string' &&
            requestProperties.body.url.trim().length > 0
            ? requestProperties.body.url : false

    const method =
        typeof requestProperties.body.method === 'string' &&
            ['POST', 'GET', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1
            ? requestProperties.body.method : false;

    const successCode =
        typeof requestProperties.body.successCode === 'object' &&
            requestProperties.body.successCode instanceof Array ? requestProperties.body.successCode : false;


    const timeoutSeconds =
        typeof requestProperties.body.timeoutSeconds === 'number' &&
            requestProperties.body.timeoutSeconds % 1 === 0 && requestProperties.body.timeoutSeconds >= 1 &&
            requestProperties.body.timeoutSeconds <= 5 ? requestProperties.body.timeoutSeconds : false;

    if (id) {
        if (protocol || url || method || successCode || timeoutSeconds) {
            data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {
                    const checkObject = parseJSON(checkData);
                    const token =
                        typeof requestProperties.headersObject.token === "string"
                            ? requestProperties.headersObject.token : false;

                    tokenHandler._token.verify(token, checkObject.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            if (protocol) { checkObject.protocol = protocol; }
                            if (url) { checkObject.url = url; }
                            if (method) { checkObject.method = method; }
                            if (successCode) { checkObject.successCode = successCode; }
                            if (timeoutSeconds) { checkObject.timeoutSeconds = timeoutSeconds; }

                            data.update('checks', id, checkObject, (err) => {
                                if (!err) {
                                    callback(200, {
                                        message: 'successfully updated data'
                                    });
                                } else {
                                    callback(500, {
                                        message: 'server side problem'
                                    });
                                }
                            });

                        } else {
                            callback(500, {
                                messgae: 'Authentication error'
                            });
                        }

                    });

                } else {
                    callback(400, {
                        message: 'Error in your request'
                    });
                }
            });
        }

    } else {
        callback(400, {
            message: 'problem in your request, provide atleast one value to update'
        });
    }

};

handler._check.delete = (requestProperties, callback) => {
    const id =
        typeof requestProperties.parsedQueryObject.id === 'string' &&
            requestProperties.parsedQueryObject.id.trim().length === 20
            ? requestProperties.parsedQueryObject.id
            : false;

    if (id) {
        data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                const token =
                    typeof requestProperties.headersObject.token === "string"
                        ? requestProperties.headersObject.token : false;

                const userPhone = parseJSON(checkData).userPhone;
                tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        // delete the data
                        data.delete('checks', id, (err) => {
                            if (!err) {
                                data.read('users', userPhone, (err, userData) => {
                                    const userObject = parseJSON(userData);
                                    if (!err && userData) {
                                        const userChecks =
                                            typeof userObject.checks === 'object' &&
                                                userObject.checks instanceof Array
                                                ? userObject.checks
                                                : [];

                                        const checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            // now save the info in the userObject
                                            userObject.checks = userChecks;
                                            data.update('users', userObject.phone, userObject, (err) => {
                                                if (!err) {
                                                    callback(200, {
                                                        message: 'successfully deleted data.. '
                                                    });

                                                } else {
                                                    callback(500, {
                                                        message: 'problem in server side... '
                                                    });
                                                }
                                            });


                                        } else {
                                            callback(400, {
                                                message: 'could not find the position'
                                            });
                                        }

                                    } else {
                                        callback(400, {
                                            message: 'problem in finding users'
                                        });
                                    }
                                });

                            } else {
                                callback(500, {
                                    messgae: 'error in server side'
                                });
                            }
                        });

                    } else {
                        callback(403, {
                            messgae: 'Authentication Failed..'
                        });
                    }
                });


            } else {
                callback(400, {
                    messgae: 'error in your request......'
                });
            }
        });

    } else {
        callback(400, {
            message: 'problem in your request'
        });
    }
};


module.exports = handler;
