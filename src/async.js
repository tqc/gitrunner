import cp from "child_process";
import async from "async";
import * as Operations from "./operations";

export function run(folder, ops, options, callback) {
    var result = {};
    if (!Array.isArray(ops)) ops = [ops];
    async.eachSeries(
        ops, 
        function(op, next) {
            var params = [];
            if (Array.isArray(op.params)) { params = op.params; }
            else if (typeof op.params == "function") { params = op.params(options); }
            var spawnOptions = op.spawnOptions || {};
            spawnOptions.cwd = folder;
            var git = cp.spawn(op.exe || 'git', params, spawnOptions);
            var output = "";
            git.stdout.on('data', function(data) {
                output += data;
            });
            git.stderr.on('data', function(data) {
                output += data;
            });
            git.on('exit', function(code) {
                try {
                    ops.process(result, code, output);
                    next();
                }
                catch(e) {
                    next(e);
                }
            });            
        },
        function(err) {
            callback(err, result);
        });
}

export function status(folder, callback) {
    run(folder, [Operations.status], {}, callback);
}

export function remotes(folder, callback) {
    run(folder, [Operations.remotes], {}, callback);
}

export function currentBranch(folder, callback) {
    run(folder, [Operations.currentBranch], {}, callback);
}

export function remoteBranch(folder, callback) {
    run(folder, [Operations.remoteBranch], {}, callback);
}

export function currentHead(folder, callback) {
    run(folder, [Operations.status], {}, callback);
}

export function status(folder, callback) {
    run(folder, [Operations.status], {}, callback);
}

export function remoteRefs(folder, sshUrl, callback) {
    run(folder, [Operations.remoteRefs], {sshUrl: sshUrl}, callback);
}

export function fullStatus(folder, callback) {
    run(folder, [Operations.status, Operations.currentBranch, Operations.remoteBranch], {}, function(err, result) {
        result.path = folder;
        callback(err, result);
    });
}