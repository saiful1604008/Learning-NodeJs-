const handler = {};

handler.notFoundHandler = (requestProperties, callback) => {
    console.log(requestProperties);
    
    callback(404, {
        message: 'requested url is not found...',
    });
};
module.exports = handler;