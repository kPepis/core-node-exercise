/**
 * Helpers for various tasks
 */

// Dependencies
const crypto = require("crypto");
const config = require("./config");

//  Container for all the helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = function (password) {
  if (typeof password === "string" && password.length > 6) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(password)
      .digest("hex");
    return hash;
  }
  return false;
};

// Parse JSON string to object without throwing
helpers.parseJsonToObject = function (str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
};

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = function (strLength) {
  strLength = typeof strLength === "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    //  Define all the possible characters that could go in a string
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

    //  Start the final string
    let str = "";

    for (let i = 0; i < strLength; i++) {
      //  Get a random character from the possibleCharacters string
      const randomChar = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length),
      );

      //  Append random character to the final string
      str += randomChar;
    }

    //  Return final string
    return str;
  }
  return false;
};

// Export module
module.exports = helpers;
