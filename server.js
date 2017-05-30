// http://stackoverflow.com/questions/6084360/using-node-js-as-a-simple-web-server
var connect = require("connect");
var serveStatic = require("serve-static");
var path = require("path");

connect()
.use(serveStatic(path.join(__dirname, "public")))
.listen(80, function () {
  console.log("Server running on port 80");
});