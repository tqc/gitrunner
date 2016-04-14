"use strict";

import cp from "child_process";

export var runSync = false;

function noop() {}

export function runGit(cwd, params, callback) {
    var spawn = exports.runSync ? cp.spawnSync : cp.spawn;


    var git = spawn('git', params, {
        cwd: cwd
    });

    if (exports.runSync) {
        callback(git.status, git.stdout + git.stderr);
    } else {
        var result = "";
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
}

export function gitStatus(folder, callback) {
    var result = {};
    runGit(folder, ['status', '--porcelain'], function(code, statusOutput) {
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
}

export function gitRemotes(folder, callback) {
    var result = {};
    runGit(folder, ['remote', '-v'], function(code, output) {
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

}

export function gitCurrentBranch(folder, callback) {
    runGit(folder, ['rev-parse', '--abbrev-ref', 'HEAD'], function(code, revOutput) {
        if (code === 0) {
            callback(revOutput.substr(0, revOutput.indexOf("\n")));
        } else {
            // new repo with no branches defined yet
            callback();
        }
    });
}

export function gitCurrentTrackingBranch(folder, callback) {
    runGit(folder, ['rev-parse', '--symbolic-full-name', '--abbrev-ref', '@{u}'], function(code, revOutput) {
        if (code === 0) {
            callback(revOutput.substr(0, revOutput.indexOf("\n")));
        } else {
            // new repo with no branches defined yet
            callback();
        }
    });
}


export function fullStatus(folder, callback) {
    // console.log("checking " + folder);
    gitStatus(folder, function(status) {
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

            gitCurrentBranch(folder, function(b) {
                if (b) {
                    result.branch = b;
                }
                gitRemotes(folder, function(remotes) {
                    result.remotes = remotes;
                    gitCurrentTrackingBranch(folder, function(b) {
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
}

export function currentHead(folder, callback) {
    var result;
    callback = callback || noop;
    runGit(folder, ['rev-parse', 'HEAD'], function(code, revOutput) {
        if (code === 0) {
            result = revOutput.substr(0, revOutput.indexOf("\n"));
            callback(result);
        } else {
            // new repo with no branches defined yet or not a git repo at all
            callback();
        }
    });
    return result;
}

// Get all current refs from a remote. This needs to use ssh directly, as 
// git normally fetches as part of the same command.
// sshUrl must be in the form "git@github.com:user/repo.git "
export function getRemoteRefs(sshUrl, callback) {
    var result = {};
    callback = callback || noop;
    var server = sshUrl.substr(0, sshUrl.indexOf(":"));
    var repo = sshUrl.substr(sshUrl.indexOf(":") + 1);
    var ssh = cp.spawnSync("ssh", ["-x", server, "git-upload-pack '" + repo + "'"], {
        input: "0000\n",
        timeout: 10000,
        encoding: "utf8"
    });
    console.log(ssh.status);
    console.log(ssh.output);
    if (ssh.status === 0) {
        var lines = ssh.stdout.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            console.log(line);
            var m = line.match(/^[0-9a-f]{4}([0-9a-f]{40}) refs\/heads\/(\w*)/);
            if (m) {
                result[m[2]] = m[1];
            }
        }
        callback(result);
    } else {
        // new repo with no branches defined yet or not a git repo at all
        callback();
    }
    return result;
}
