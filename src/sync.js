import cp from "child_process";
import * as Operations from "./operations";

export function run(folder, ops, options) {
    var result = options || {};
    if (!Array.isArray(ops)) ops = [ops];
    for (var i = 0; i < ops.length; i++) {
        var params = [];
        var op = ops[i];
        if (Array.isArray(op.params)) { params = op.params; }
        else if (typeof op.params == "function") { params = op.params(options, result); }
        var spawnOptions = op.spawnOptions || {};
        spawnOptions.cwd = folder;
        var git = cp.spawnSync(op.exe || 'git', params, spawnOptions);
        if (op.process) {
            op.process(result, git.status, git.stdout + git.stderr);
        } else {
            result.output = git.stdout + git.stderr;
            if (git.status != 0) {
                console.log(git.stdout + git.stderr);            
                throw new Error("Unexpected exit code " + git.status);
            }
        }
    }
    return result;
}

export function init(folder) {
    return run(folder, [Operations.init], {});
}

export function status(folder) {
    return run(folder, [Operations.status], {});
}

export function remotes(folder) {
    return run(folder, [Operations.remotes], {}).remotes;
}

export function currentBranch(folder) {
    return run(folder, [Operations.currentBranch], {}).branch;
}

export function remoteBranch(folder) {
    return run(folder, [Operations.remoteBranch], {}).remoteBranch;
}

export function currentHead(folder) {
    return run(folder, [Operations.currentHead], {}).head;
}

export function remoteRefs(folder, sshUrl) {
    return run(folder, [Operations.remoteRefs], {sshUrl: sshUrl}).remoteRefs;
}

export function branches(folder) {
    return run(folder, [Operations.branches], {}).branches;
}

export function branchNames(folder) {
    return run(folder, [Operations.branchNames], {}).branches;
}

export function revParse(folder, ref) {
    return run(folder, [Operations.revParse], {ref: ref}).ref;
}

export function tree(folder, treeref) {
    return run(folder, [Operations.revParse, Operations.treeRef, Operations.tree], {ref: treeref}).tree;
}


export function fullStatus(folder, callback) {
    var result = run(folder, [Operations.status, Operations.currentBranch, Operations.remoteBranch], {});
    result.path = folder;
    return result;    
}