import cp from "child_process";
import async from "async";
import * as Operations from "./operations";

export function run(folderOrSpawnOptions, ops, options, callback) {
    options = options || {};
    var result = options || {};
    if (!Array.isArray(ops)) ops = [ops];
    async.eachSeries(
        ops,
        function(op, next) {
            var params = [];
            if (Array.isArray(op.params)) { params = op.params; }
            else if (typeof op.params == "function") { params = op.params(options, result); }

            var spawnOptions;
            if (typeof folderOrSpawnOptions == "string") {
                spawnOptions = {
                    cwd: folderOrSpawnOptions
                };
            } else {
                spawnOptions = Object.assign({}, folderOrSpawnOptions);
            }

            if (options.env) {
                spawnOptions.env = Object.assign({}, spawnOptions.env || {}, options.env);
            }
            var buf = Buffer.alloc(0);
            var git = cp.spawn(op.exe || 'git', params, spawnOptions);

            git.stdout.on('data', function(data) {
                if (typeof data == "string") buf.write(data);
                else buf = Buffer.concat([buf, data]);
            });
            git.stderr.on('data', function(data) {
               // output += data;
            });
            if (op.provideInput) {
                op.provideInput(git.stdin);
            }
            git.on('exit', function(code) {
                try {
                    var output = spawnOptions.encoding == "binary" ? buf : buf.toString('utf8');
                    if (code != 0 && (op.requireZeroExitCode || !op.process)) {
                        console.log(output);
                        throw new Error("Unexpected exit code " + code);
                    }
                    if (op.process) {
                        op.process(result, code, output);
                    }
                    else {
                        result.output = output;
                    }
                    setTimeout(next, 0);
                }
                catch (e) {
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

export function submodules(folder, callback) {
    run(folder, [Operations.submodules], {}, (err, result) => callback(err, result.submodules));
}

export function branchNames(folder, callback) {
    run(folder, [Operations.branchNames], {}, (err, result) => callback(err, result.branches));
}

export function revParse(folder, ref, callback) {
    run(folder, [Operations.revParse], {ref: ref}, (err, result) => callback(err, result.ref));
}

export function show(folder, ref, callback) {
    run(folder, [Operations.show], {ref: ref}, (err, result) => callback(err, result.contents));
}

export function tree(folder, treeref, callback) {
    run(folder, [Operations.revParse, Operations.treeRef, Operations.tree], {ref: treeref}, (err, result) => callback(err, result.tree));
}

export function fullStatus(folder, callback) {
    run(folder, [Operations.status, Operations.currentBranch, Operations.remoteBranch, Operations.unpushedCommits], {}, function(err, result) {
        result.path = folder;
        callback(err, result);
    });
}