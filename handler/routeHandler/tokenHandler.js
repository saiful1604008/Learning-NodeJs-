const data = require('../../lib/data');
const { hash } = require('../../helper/utilities');
const { parseJSON } = require('../../helper/utilities');
const { createRandomString } = require('../../helper/utilities');

const handler = {};

handler.tokenHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._token[requestProperties.method](requestProperties, callback);

    } else {
        callback(405);
    }

};


handler._token = {};

handler._token.post = (requestProperties, callback) => {
    const phone =
        typeof requestProperties.body.phone === 'string' &&
            requestProperties.body.phone.trim().length === 11
            ? requestProperties.body.phone
            : false;

    const password =
        typeof requestProperties.body.password === 'string' &&
            requestProperties.body.password.trim().length > 0
            ? requestProperties.body.password
            : false;


    if (phone && password) {
        data.read('users', phone, (err, userData) => {
            const hashedPassword = hash(password);
            if (hashedPassword === parseJSON(userData).password) {
                const tokenId = createRandomString(20);
                const expireTime = Date.now() + 60 * 60 * 1000;
                const tokenObject = {
                    id: tokenId,
                    phone,
                    expireTime
                }

                data.create('tokens', tokenId, tokenObject, (err) => {
                    if (!err) {
                        callback(200, tokenObject);

                    } else {
                        callback(500, {
                            message: 'problem in server side.. '
                        });
                    }

                });

            } else {
                callback(400, {
                    message: 'invalid password'
                });
            }
        });


    } else {
        callback(400, {
            message: 'you have a problem in your request'
        });
    }
};

handler._token.get = (requestProperties, callback) => {
    const id =
        typeof requestProperties.parsedQueryObject.id === 'string' &&
            requestProperties.parsedQueryObject.id.trim().length === 20
            ? requestProperties.parsedQueryObject.id
            : false;

    // console.log(typeof(requestProperties.parsedQueryObject.id), ' :type')
    // console.log(id);

    if (id) {
        // read from the file .. 
        data.read('tokens', id, (err, tokenData) => {
            const token = parseJSON(tokenData);
            //console.log('user: ',token);

            if (!err && token) {
                callback(200, token);

            } else {
                callback(404, {
                    message: 'Requested token was not found.....'
                });
            }

        });

    } else {
        callback(404, {
            message: 'Requested token was not found..'
        });
    }
};

handler._token.put = (requestProperties, callback) => {
    const id =
        typeof requestProperties.body.id === 'string' &&
            requestProperties.body.id.trim().length === 20
            ? requestProperties.body.id
            : false;

    const extend = !!(
        typeof requestProperties.body.extend === 'boolean' && requestProperties.body.extend === true
    );


    //console.log('1:', typeof requestProperties.body.id, '2:',typeof requestProperties.body.expireTime, '3:', requestProperties.body.expireTime  )

    if (id && extend) {
        data.read('tokens', id, (err, tokenData) => {
            const tokenObject = parseJSON(tokenData);
            if (tokenObject.expireTime > Date.now()) {
                tokenObject.expireTime = Date.now() + 60 * 60 * 1000;

                data.update('tokens', id, tokenObject, (err) => {
                    if (!err) {
                        callback(200, {
                            message: 'updated token successfully..'
                        });

                    } else {
                        callback(500, {
                            message: 'Error in the server side..'
                        });
                    }
                });

            } else {
                callback(400, {
                    message: 'token already expires..'
                });
            }
        });

    } else {
        callback(400, {
            message: 'error in your request'
        });
    }


};

handler._token.delete = (requestProperties, callback) => {
    const id =
        typeof requestProperties.parsedQueryObject.id === 'string' &&
            requestProperties.parsedQueryObject.id.trim().length === 20
            ? requestProperties.parsedQueryObject.id
            : false;

    if (id) {
        data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200, {
                            message: 'successfully deleted tokens.. '
                        });

                    } else {
                        callback(500, {
                            message: 'error in deleting token'
                        });
                    }
                });

            } else {
                callback(500, {
                    message: 'Error in your request'
                });
            }

        });

    } else {
        callback(400, {
            message: 'problem in deleting tokens .. '
        });
    }

};

handler._token.verify = (id, phone, callback) => {
    data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            console.log(parseJSON(tokenData).phone, phone, parseJSON(tokenData).expireTime , Date.now());
            if (parseJSON(tokenData).phone === phone && parseJSON(tokenData).expireTime > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};


module.exports = handler;
