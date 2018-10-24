/**
 * Request handlers
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");

// Handlers
const handlers = {};

// Variables
const userMinLength = 3;
const passwordMinLength = 6;

// Users
handlers.users = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.includes(data.method)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};

// Users - POST
// Required data: user, password
// Optional data: none
handlers._users.post = function(data, callback) {
  // Check that all required fields are filled out
  const user =
    typeof data.payload.user === "string" &&
    data.payload.user.trim().length > userMinLength
      ? data.payload.user.trim()
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.length > passwordMinLength
      ? data.payload.password
      : false;

  if (user && password) {
    // Make sure user doesn't already exist
    _data.read("users", user, (readErr, readData) => {
      if (readErr) {
        // Hash password
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // Create user object
          const userObject = {
            user,
            hashedPassword,
          };

          // Store user
          _data.create("users", user, userObject, createErr => {
            if (!createErr) {
              callback(200);
            } else {
              callback(500, { Error: "Could not create new user" });
            }
          });
        } else {
          callback(500, { Error: "Could not hash user's password" });
        }
      } else {
        // User already exists
        callback(400, { Error: "User already exists" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Users - GET
// Required data: user
// Optional data: none
handlers._users.get = function(data, callback) {
  //  Check that user is valid
  const user =
    typeof data.queryStringObject.user === "string" &&
    data.queryStringObject.user.trim().length > userMinLength
      ? data.queryStringObject.user.trim()
      : false;
  if (user) {
    // Get token from the headers
    const token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    // Verify given token is valid for user
    handlers._tokens.verifyToken(token, user, tokenIsValid => {
      if (tokenIsValid) {
        console.log("Token is valid");
        //  Lookup user
        _data.read("users", user, (readErr, readData) => {
          if (!readErr && readData) {
            //  Remove the hashed password from the user object before returning
            // it to the requester
            delete readData.hashedPassword;
            callback(200, readData);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, { Error: "Missing or invalid token in header" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Users - PUT
// Required data: user
// Optional field: field to update (password)
// todo Only let an authenticated user update themselves
handlers._users.put = function(data, callback) {
  //  Check for required fields
  const user =
    typeof data.payload.user === "string" &&
    data.payload.user.trim().length > userMinLength
      ? data.payload.user.trim()
      : false;

  //  Check optional fields
  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.length > passwordMinLength
      ? data.payload.password
      : false;

  if (user) {
    //  Error if nothing is sent to update
    if (password) {
      // Get token from the headers
      const token =
        typeof data.headers.token === "string" ? data.headers.token : false;
      // Verify given token is valid for user
      handlers._tokens.verifyToken(token, user, tokenIsValid => {
        if (tokenIsValid) {
          // Look up the user
          _data.read("users", user, (readErr, userData) => {
            if (!readErr && userData) {
              //  Update fields if necessary
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }

              //  Store new updates
              _data.update("users", user, userData, updateErr => {
                if (!updateErr) {
                  callback(200);
                } else {
                  callback(500, { Error: "Could not update user" });
                }
              });
            } else {
              callback(400, { Error: "Specified user does not exist" });
            }
          });
        } else {
          callback(403, { Error: "Missing or invalid token in header" });
        }
      });
    } else {
      callback(400, { Error: "Missing field to update" });
    }
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Users - DELETE
// Required field: user
// Todo Only let an authenticated user delete themselves
// Todo Delete any other data files associated with this user
handlers._users.delete = function(data, callback) {
  //  Check that user is valid
  const user =
    typeof data.queryStringObject.user === "string" &&
    data.queryStringObject.user.trim().length > userMinLength
      ? data.queryStringObject.user.trim()
      : false;
  if (user) {
    // Get token from headers
    const token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    // Verify given token is valid for user
    handlers._tokens.verifyToken(token, user, tokenIsValid => {
      if (tokenIsValid) {
        //  Lookup user
        _data.read("users", user, (readErr, readData) => {
          if (!readErr && readData) {
            _data.delete("users", user, (deleteErr, deleteData) => {
              if (!deleteErr) {
                callback(200);
              } else {
                callback(500, { Error: "COuld not find specified user" });
              }
            });
          } else {
            callback(400, { Error: "Could not find specified user" });
          }
        });
      } else {
        callback(403, { Error: "Missing or invalid token in header" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Tokens
handlers.tokens = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.includes(data.method)) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - POST
// Required data: user, password
// Optional data: none
handlers._tokens.post = function(data, callback) {
  // Check that all required fields are filled out
  const user =
    typeof data.payload.user === "string" &&
    data.payload.user.trim().length > userMinLength
      ? data.payload.user.trim()
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.length > passwordMinLength
      ? data.payload.password
      : false;

  if (user && password) {
    //  Look up user
    _data.read("users", user, (readErr, userData) => {
      if (!readErr && userData) {
        //  Hash the sent password and compare it to the stored password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          //  If valid, create a new token with a random name
          //  Expiration date to one hour in the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            user,
            id: tokenId,
            expires,
          };

          //  Store token
          _data.create("tokens", tokenId, tokenObject, createErr => {
            if (!createErr) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not create new token" });
            }
          });
        } else {
          callback(400, { Error: "Passwords do not match" });
        }
      } else {
        callback(400, { Error: "Could not find specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Tokens - GET
// Required data: id
// Optional data: none
handlers._tokens.get = function(data, callback) {
  //  Check that id is valid
  const id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length >= 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    //  Lookup token
    _data.read("tokens", id, (readErr, tokenData) => {
      if (!readErr && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Tokens - PUT
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback) {
  const id =
    typeof data.payload.id === "string" && data.payload.id.trim().length >= 20
      ? data.payload.id.trim()
      : false;

  const extend =
    typeof data.payload.extend === "boolean" && data.payload.extend === true;

  if (id && extend) {
    // Look up token
    _data.read("tokens", id, (readErr, tokenData) => {
      if (!readErr && tokenData) {
        //  Make sure token is not expired
        if (tokenData.expires > Date.now()) {
          // Set expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the updates
          _data.update("tokens", id, tokenData, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not update token" });
            }
          });
        } else {
          callback(400, { Error: "Token is expired" });
        }
      } else {
        callback(400, { Error: "Specified token does not exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing or invalid required field(s)" });
  }
};

// Tokens - DELETE
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback) {
  //  Check that id is valid
  const id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length >= 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    //  Lookup token
    _data.read("tokens", id, (readErr, readData) => {
      if (!readErr && readData) {
        _data.delete("tokens", id, deleteErr => {
          if (!deleteErr) {
            callback(200);
          } else {
            callback(500, { Error: "Could not find specified token" });
          }
        });
      } else {
        callback(400, { Error: "Could not find specified token" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(tokenId, user, callback) {
  // Look up token
  _data.read("tokens", tokenId, (readErr, tokenData) => {
    if (!readErr && tokenData) {
      // Check that token is for the given user and has not expired
      if (tokenData.user === user && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Forums
handlers.forums = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.includes(data.method)) {
    handlers._forums[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for forums methods
handlers._forums = {};

// Forums - POST
// Required data: title
// Optional data: description
handlers._forums.post = function(data, callback) {
  // Validate inputs
  const title =
    typeof data.payload.title === "string" &&
    data.payload.title.trim().length > 0
      ? data.payload.title.trim()
      : false;
  const description =
    typeof data.payload.description === "string" &&
    data.payload.description.trim().length > 0
      ? data.payload.description.trim()
      : "";

  if (title) {
    // Get token from headers
    const token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    // Look up user with token
    _data.read("tokens", token, (readErr, tokenData) => {
      if (!readErr && tokenData) {
        const user = tokenData.user;

        // Look up user data
        _data.read("users", user, (userReadErr, userData) => {
          if (!userReadErr && userData) {
            
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing or invalid required inputs" });
  }
};

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// Ping handler
handlers.ping = function(data, callback) {
  callback(200);
};

module.exports = handlers;
