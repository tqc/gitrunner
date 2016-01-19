var git = require("./gitrunner.js");
var refs = git.getRemoteRefs("git@github.com:tqc/gitrunner.git ");
console.log(refs);