import cp from "child_process";
import * as Operations from "./operations";

export function run(folder, ops, options) {
    var result = {};
    if (!Array.isArray(ops)) ops = [ops];
    for (var i = 0; i < ops.length; i++) {
        var params = [];
        var op = ops[i];
        if (Array.isArray(op.params)) { params = op.params; }
        else if (typeof op.params == "function") { params = op.params(options); }
        var spawnOptions = op.spawnOptions || {};
        spawnOptions.cwd = folder;
        var git = cp.spawnSync(op.exe || 'git', params, spawnOptions);
        ops[i].process(result, git.status, git.stdout + git.stderr);
    }
    return result;
}

export function status(folder) {
    return run(folder, [Operations.status], {});
}

export function remotes(folder) {
    return run(folder, [Operations.remotes], {});
}

export function currentBranch(folder) {
    return run(folder, [Operations.currentBranch], {});
}

export function remoteBranch(folder) {
    return run(folder, [Operations.remoteBranch], {});
}

export function currentHead(folder) {
    return run(folder, [Operations.status], {});
}

export function status(folder) {
    return run(folder, [Operations.status], {});
}

export function remoteRefs(folder, sshUrl) {
    return run(folder, [Operations.remoteRefs], {sshUrl: sshUrl});
}

export function fullStatus(folder, callback) {
    var result = run(folder, [Operations.status, Operations.currentBranch, Operations.remoteBranch], {});
    result.path = folder;
    return result;    
}