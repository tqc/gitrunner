(function() {
    "use strict";
    var gitrunner = module.exports;
    function noop() {}
    gitrunner.runSync = false;

    gitrunner.runGit = function(cwd, params, callback) {
        var cp = require('child_process');
        var spawn = gitrunner.runSync ? cp.spawnSync : cp.spawn;


        var git = spawn('git', params, {
            cwd: cwd
        });

        if (gitrunner.runSync) {
            callback(git.status, git.stdout+git.stderr);
        }
        else {
            git.stdout.on('data', function(data) {
                result += data;
            });
            git.stderr.on('data', function(data) {
                result += data;
            });
            git.on('exit', function(code) {
                callback(code, result);
            });
        }
    };

    gitrunner.gitStatus = function(folder, callback) {
        var result = {};
        gitrunner.runGit(folder, ['status', '--porcelain'], function(code, statusOutput) {
            if (code == 128) {
                // Not a git repo - check subfolders
                result.isRepo = false;
            } else if (code === 0) {
                result.isRepo = true;
                result.changedFiles = [];
                var statusLines = statusOutput.split("\n");
                for (var i = 0; i < statusLines.length; i++) {
                    var line = statusLines[i];
                    if (!line) continue;
                    result.changedFiles.push(line.substr(3));
                }
            } else {
                console.log(statusOutput);
                throw new Error("Unexpected code " + code);
            }
            callback(result);
        });
    };

    gitrunner.gitRemotes = function(folder, callback) {
        var result = {};
        gitrunner.runGit(folder, ['remote', '-v'], function(code, output) {
            if (code === 0) {
                var lines = output.split("\n");
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    if (!line) continue;
                    var name = line.substr(0, line.indexOf("\t"));
                    var url = line.substr(line.indexOf("\t") + 1);
                    url = url.substr(0, url.indexOf(" "));
                    result[name] = url;
                }
                callback(result);
            } else {
                // new repo with no branches defined yet
                console.log(output);
                throw ("Unexpected code " + code);
            }
        });

    };

    gitrunner.gitCurrentBranch = function(folder, callback) {
        gitrunner.runGit(folder, ['rev-parse', '--abbrev-ref', 'HEAD'], function(code, revOutput) {
            if (code === 0) {
                callback(revOutput.substr(0, revOutput.indexOf("\n")));
            } else {
                // new repo with no branches defined yet
                callback();
            }
        });
    };

    gitrunner.gitCurrentTrackingBranch = function(folder, callback) {
        gitrunner.runGit(folder, ['rev-parse', '--symbolic-full-name', '--abbrev-ref', '@{u}'], function(code, revOutput) {
            if (code === 0) {
                callback(revOutput.substr(0, revOutput.indexOf("\n")));
            } else {
                // new repo with no branches defined yet
                callback();
            }
        });
    };


    gitrunner.fullStatus = function(folder, callback) {
        // console.log("checking " + folder);
        gitrunner.gitStatus(folder, function(status) {
            var result;
            if (!status.isRepo) {
                result = {
                    isRepo: false,
                    path: folder
                };
                callback(result);
            } else if (!status.error) {
                result = {
                    isRepo: true,
                    path: folder,
                    changedFiles: status.changedFiles
                };

                gitrunner.gitCurrentBranch(folder, function(b) {
                    if (b) {
                        result.branch = b;
                    }
                    gitrunner.gitRemotes(folder, function(remotes) {
                        result.remotes = remotes;
                        gitrunner.gitCurrentTrackingBranch(folder, function(b) {
                            if (b) {
                                result.remoteBranch = b;
                            }
                            callback(result);
                        });
                    });
                });
            } else {
                // error
            }
        });

    };

    gitrunner.currentHead = function(folder, callback) {
        var result;
        callback = callback || noop;
        gitrunner.runGit(folder, ['rev-parse', 'HEAD'], function(code, revOutput) {
            console.log(code+revOutput);
            if (code === 0) {
                result = revOutput.substr(0, revOutput.indexOf("\n"));
                callback(result);
            } else {
                // new repo with no branches defined yet or not a git repo at all
                callback();
            }
        });
        return result;
    };




})();