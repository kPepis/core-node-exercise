/**
 * Library for storing and editing data
 */

//  Dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

// Container for the module to be exported
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, "/../.data/");

// Write data to a file
lib.create = function (dir, file, data, callback) {
  // Open file for writing
  fs.open(
    `${lib.baseDir + dir}/${file}.json`,
    "wx",
    (openError, fileDescriptor) => {
      if (!openError && fileDescriptor) {
        // Convert data to string
        const stringData = JSON.stringify(data);

        // Write to file and close it
        fs.writeFile(fileDescriptor, stringData, writeError => {
          if (!writeError) {
            fs.close(fileDescriptor, closeError => {
              if (!closeError) {
                callback(false);
              } else {
                callback("Error closing file");
              }
            });
          } else {
            callback("Error writing file");
          }
        });
      } else {
        callback("Could not create new file, it may already exist");
      }
    },
  );
};

// Read data from a file
lib.read = function (dir, file, callback) {
  fs.readFile(`${lib.baseDir + dir}/${file}.json`, "utf-8", (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

// Update data inside a file
lib.update = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(`${lib.baseDir + dir}/${file}.json`, "r+", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      // Truncate file
      fs.ftruncate(fileDescriptor, truncateError => {
        if (!truncateError) {
          // Write to the file and close it
          fs.writeFile(fileDescriptor, stringData, writeError => {
            if (!writeError) {
              fs.close(fileDescriptor, closeError => {
                if (!closeError) {
                  callback(false);
                } else {
                  callback("Error closing file");
                }
              });
            } else {
              callback("Error writing to existing file");
            }
          });
        } else {
          callback("Error truncating file");
        }
      });
    } else {
      callback("Could not open file");
    }
  });
};

lib.delete = function (dir, file, callback) {
  // Unlink file
  fs.unlink(`${lib.baseDir + dir}/${file}.json`, unlinkErr => {
    if (!unlinkErr) {
      callback(false);
    } else {
      callback("Error deleting file");
    }
  });
};

// Export module
module.exports = lib;
