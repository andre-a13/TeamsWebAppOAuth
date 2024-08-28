import * as restify from "restify";
import * as fs from "fs";
import * as CryptoJS from "crypto";
import * as querystring from "querystring";
import send from "send";

//Create HTTP server.
const server = restify.createServer({
  key: process.env.SSL_KEY_FILE
    ? fs.readFileSync(process.env.SSL_KEY_FILE)
    : undefined,
  certificate: process.env.SSL_CRT_FILE
    ? fs.readFileSync(process.env.SSL_CRT_FILE)
    : undefined,
  formatters: {
    "text/html": (req, res, body) => {
      return body;
    },
  },
});


server.get(
  "/static/*",
  restify.plugins.serveStatic({
    directory: __dirname,
  })
);

server.listen(process.env.port || process.env.PORT || 3333, function () {
  console.log(`\n${server.name} listening to ${server.url}`);
});

// Adding tabs to our app. This will setup routes to various views
// Setup home page
server.get("/", (req, res, next) => {
  send(req, __dirname + "/views/hello.html").pipe(res);
});

// Setup the static tab
server.get("/tab", (req, res, next) => {
  send(req, __dirname + "/views/hello.html").pipe(res);
});

server.get("/auth-start", (req, res, next) => {
  const authorizationUrl = `${process.env.AUTHORITY_URL}/connect/authorize` ;
  const teamsParams = new URLSearchParams(req.url);
  const params = {
    response_type: "code",
    client_id: process.env.CLIENT_ID,
    code_challenge: teamsParams.get('challenge'),
    code_challenge_method: "S256",
    redirect_uri: `${process.env.TAB_ENDPOINT}/auth-end`,
    scope: "openid",
    state: JSON.stringify({
      authId: teamsParams.get("authId"),
      hostRedirectUrl: teamsParams.get("hostRedirectUrl"),
      oauthRedirectMethod: "deeplink",
    }), // generate a random state value here
    prompt: "login",
  };
  const url = authorizationUrl + "?" + querystring.stringify(params);
  res.redirect(301, url, next);
});

server.get("/auth-end", (req, res, next) => {
  send(req, __dirname + "/views/auth-end.html").pipe(res);
});
