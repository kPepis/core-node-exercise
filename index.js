/**
 * Primary file for the API
 */

// Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const fs = require("fs");
const config = require("./lib/config");
const handlers = require("./lib/handlers");
const helpers = require("./lib/helpers");

// Define request router
const router = {
  ping: handlers.ping,
  sample: handlers.sample,
  notFound: handlers.notFound,
  users: handlers.users,
  tokens: handlers.tokens,
  forums: handlers.forums,
};

// Server logic for both http and https
const unifiedServer = function (req, res) {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get query string as an object
  const queryStringObject = parsedUrl.query;

  // Get HTTP method
  const method = req.method.toLowerCase();

  // Get headers as an object
  const { headers } = req;

  // Get payload if any
  const decoder = new StringDecoder("utf-8");
  let buffer = "";
  req.on("data", data => {
    buffer += decoder.write(data);
  });
  req.on("end", () => {
    buffer += decoder.end();

    // Choose handler this request should go to. If not found, go to notFound
    // handler
    const chosenHandler = typeof router[trimmedPath] !== "undefined"
      ? router[trimmedPath]
      : router.notFound;

    // Construct the data object to be sent to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode = 200, payload = {}) => {
      // Convert payload to string
      const payloadString = JSON.stringify(payload);

      // Return response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log request path
      console.log(`Returning: ${statusCode}: ${payloadString}`);
    });

    // Send response
    // res.end("Hello World!\n");

    // Log the request path
    console.log(`${method} request received on path: ${trimmedPath}`);
  });
};

// Instantiate http server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// Start http server
httpServer.listen(
  config.httpPort,
  console.log(
    `Server listening on port ${config.httpPort} in ${config.envName} mode`,
  ),
);

// Instatiate https server
const httpServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};
const httpsServer = https.createServer(httpServerOptions, (req, res) => {
  unifiedServer(req, res);
});

// Start https server
httpsServer.listen(
  config.httpsPort,
  console.log(
    `Server listening on port ${config.httpsPort} in ${config.envName} mode`,
  ),
);
