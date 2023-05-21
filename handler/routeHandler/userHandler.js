const data = require("../../lib/data");
const { hash } = require("../../helper/utilities");
const { parseJSON } = require("../../helper/utilities");
const tokenHandler = require("./tokenHandler");

const handler = {};

handler.userHandler = (requestProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._users[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

handler._users = {};

handler._users.post = (requestProperties, callback) => {
  const firstName =
    typeof requestProperties.body.firstName === "string" &&
      requestProperties.body.firstName.trim().length > 0
      ? requestProperties.body.firstName
      : false;
  //console.log('firstname:',typeof(requestProperties.body.firstName), 'len: ',requestProperties.body.firstName.trim().length  );

  const lastName =
    typeof requestProperties.body.lastName === "string" &&
      requestProperties.body.lastName.trim().length > 0
      ? requestProperties.body.lastName
      : false;
  //console.log('lastName:',typeof(requestProperties.body.lastName), 'len: ',requestProperties.body.lastName.trim().length  );

  const phone =
    typeof requestProperties.body.phone === "string" &&
      requestProperties.body.phone.trim().length === 11
      ? requestProperties.body.phone
      : false;
  //console.log('phone:',typeof(requestProperties.body.phone), 'len: ',requestProperties.body.phone.trim().length  );

  const password =
    typeof requestProperties.body.password === "string" &&
      requestProperties.body.password.trim().length > 0
      ? requestProperties.body.password
      : false;
  //console.log('password:',typeof(requestProperties.body.password), 'len: ',requestProperties.body.password.trim().length  );

  const checkMarks = requestProperties.body.checkMarks
    ? requestProperties.body.checkMarks
    : false;

  //console.log('checkMarks:',typeof(requestProperties.body.checkMarks), 'len: ', requestProperties.body.checkMarks );

  if (firstName && lastName && phone && password && checkMarks) {
    // make sure user not exist...
    data.read("users", "phone", (err) => {
      if (err) {
        let userObject = {
          firstName,
          lastName,
          phone,
          password: hash(password),
          checkMarks,
        };

        data.create("users", phone, userObject, (err) => {
          if (!err) {
            callback(200, {
              message: "user created successfully",
            });
          } else {
            callback(500, {
              messgae: "could not create users..",
            });
          }
        });
      } else {
        callback(500, {
          message: "problem in the server side",
        });
      }
    });
  } else {
    callback(400, {
      message: "you have a problem in your connection",
    });
  }
};

handler._users.get = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.parsedQueryObject.phone === "string" &&
      requestProperties.parsedQueryObject.phone.trim().length === 11
      ? requestProperties.parsedQueryObject.phone
      : false;

  if (phone) {
    //verify token
    const token =
      typeof requestProperties.headersObject.token === "string"
        ? requestProperties.headersObject.token : false;

    ///console.log( requestProperties.headersObject.token, '111')

    tokenHandler._token.verify(token, phone, (tokenId) => {

      //console.log(tokenId, 'rrrrrr')
      if (tokenId) {
        // read from the file ..
        data.read("users", phone, (err, data) => {
          const user = parseJSON(data);
          console.log("user: ", user);

          if (!err && user) {
            delete user.password;
            callback(200, user);
            console.log(user);
          } else {
            callback(404, {
              message: "Requested user was not found.."
            });
          }
        });
      } else {
        callback(403, {
          message: "Authentication failed.."
        });
      }
    });
  } else {
    callback(404, {
      message: "Requested user was not found..",
    });
  }
};

handler._users.put = (requestProperties, callback) => {
  const firstName =
    typeof requestProperties.body.firstName === "string" &&
      requestProperties.body.firstName.trim().length > 0
      ? requestProperties.body.firstName
      : false;

  const lastName =
    typeof requestProperties.body.lastName === "string" &&
      requestProperties.body.lastName.trim().length > 0
      ? requestProperties.body.lastName
      : false;

  const phone =
    typeof requestProperties.body.phone === "string" &&
      requestProperties.body.phone.trim().length === 11
      ? requestProperties.body.phone
      : false;

  const password =
    typeof requestProperties.body.password === "string" &&
      requestProperties.body.password.trim().length > 0
      ? requestProperties.body.password
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      const token =
        typeof requestProperties.headersObject.token === "string"
          ? requestProperties.headersObject.token : false;

      tokenHandler._token.verify(token, phone, (tokenId) => {

        console.log(tokenId, ':tokenId')

        if (tokenId) {
          data.read("users", phone, (err, UserData) => {
            const updateUserData = parseJSON(UserData);
            if (!err && updateUserData) {
              if (firstName) {
                updateUserData.firstName = firstName;
              }
              if (lastName) {
                updateUserData.lastName = lastName;
              }
              if (password) {
                updateUserData.password = hash(password);
              }

              data.update("users", phone, updateUserData, (err) => {
                if (!err) {
                  callback(200, {
                    message: "user updated successfully",
                  });
                } else {
                  callback(400, {
                    message: "error in updating user .. ",
                  });
                }
              });
            } else {
              callback(400, {
                message: "Error in your request .. ",
              });
            }
          });

        } else {
          callback(403, {
            message: "Authentication failed.."
          });
        }
      });
    }
  } else {
    callback(400, {
      message: "Incorrect phone number entered.. ",
    });
  }
};

handler._users.delete = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.parsedQueryObject.phone === "string" &&
      requestProperties.parsedQueryObject.phone.trim().length === 11
      ? requestProperties.parsedQueryObject.phone
      : false;

  if (phone) {
    const token =
      typeof requestProperties.headersObject.token === "string"
        ? requestProperties.headersObject.token : false;

    tokenHandler._token.verify(token, phone, (tokenId) => {
      //console.log(tokenId, ':tokenId')
      if (tokenId) {
        data.read("users", phone, (err, UserData) => {
          if (!err && UserData) {
            data.delete("users", phone, (err) => {
              if (!err) {
                callback(200, {
                  message: "successfully deleted.. ",
                });
              } else {
                callback(500, {
                  message: "error in deleting data",
                });
              }
            });
          } else {
            callback(500, {
              message: "problem in your request",
            });
          }
        });

      } else {
        callback(403, {
          message: "Authentication failed.."
        });
      }
    });

  } else {
    callback(400, {
      message: "problem in deleting data.. ",
    });
  }
};

module.exports = handler;

