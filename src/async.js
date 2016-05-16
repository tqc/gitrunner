import cp from "child_process";
import async from "async";
import * as Operations from "./operations";

export function run(folder, ops, options, callback) {
    var result = options || {};
    if (!Array.isArray(ops)) ops = [ops];
    async.eachSeries(
        ops, 
        function(op, next) {
            var params = [];
            if (Array.isArray(op.params)) { params = op.params; }
            else if (typeof op.params == "function") { params = op.params(options, result); }            
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
                    if (op.process) {
                        op.process(result, code, output);
                    } else if (code != 0) {
                        console.log(output);
                        throw new Error("Unexpected exit code " + code);
                    }
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

export function init(folder, callback) {
    run(folder, [Operations.init], {}, callback);
}

export function status(folder, callback) {
    run(folder, [Operations.status], {}, callback);
}

export function remotes(folder, callback) {
    run(folder, [Operations.remotes], {}, (err, result) => callback(err, result.remotes));
}

export function currentBranch(folder, callback) {
    run(folder, [Operations.currentBranch], {}, (err, result) => callback(err, result.branch));
}

export function remoteBranch(folder, callback) {
    run(folder, [Operations.remoteBranch], {}, (err, result) => callback(err, result.remoteBranch));
}

export function currentHead(folder, callback) {
    run(folder, [Operations.currentHead], {}, (err, result) => callback(err, result.head));
}

export function remoteRefs(folder, sshUrl, callback) {
    run(folder, [Operations.remoteRefs], {sshUrl: sshUrl}, (err, result) => callback(err, result.remoteRefs));
}

export function branches(folder, callback) {
    run(folder, [Operations.branches], {}, (err, result) => callback(err, result.branches));
}

export function branchNames(folder, callback) {
    run(folder, [Operations.branchNames], {}, (err, result) => callback(err, result.branches));
}

export function tree(folder, treeref, callback) {
    run(folder, [Operations.revParse, Operations.treeRef, Operations.tree], {ref: treeref}, (err, result) => callback(err, result.tree));
}

export function fullStatus(folder, callback) {
    run(folder, [Operations.status, Operations.currentBranch, Operations.remoteBranch], {}, function(err, result) {
        result.path = folder;
        callback(err, result);
    });
}