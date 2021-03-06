export var init = {
    params: (options) => ["init"],
    process: function(result, code, output) {
        if (code === 0) {
            // succeeded
        } else {
            console.log(output);
            throw new Error("Unexpected code " + code);
        }
        return result;
    }
};

export var status = {
    params: (options) => ['status', '--porcelain'],
    process: function(result, code, statusOutput) {
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
        return result;
    }
};

export var unpushedCommits = {
    params: (options, result) => ['rev-list', (options.branch || result.branch), '^' + (options.remoteBranch || result.remoteBranch)],
    process: function(result, code, statusOutput) {
        result.unpushedCommits = [];
        if (code === 0) {
            for (var line of statusOutput.split("\n")) {
                if (!line) continue;
                result.unpushedCommits.push(line.substr(3));
            }
        } else {
            // most likely no branch found by previous operation - ignore
        }
        return result;
    }
};


export var remotes = {
    params: (options) => ['remote', '-v'],
    process: function(result, code, output) {
        result.remotes = {};
        if (code === 0) {
            var lines = output.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (!line) continue;
                var name = line.substr(0, line.indexOf("\t"));
                var url = line.substr(line.indexOf("\t") + 1);
                url = url.substr(0, url.indexOf(" "));
                result.remotes[name] = url;
            }
        } else {
            // new repo with no branches defined yet
            console.log(output);
            throw new Error("Unexpected code " + code);
        }
        return result;
    }
};

export var currentBranch = {
    params: (options) => ['rev-parse', '--abbrev-ref', 'HEAD'],
    process: function(result, code, output) {
        if (code === 0) {
            result.branch = output.substr(0, output.indexOf("\n"));
        } else {
            // new repo with no branches defined yet
        }
        return result;
    }
};

export var remoteBranch = {
    params: (options) => ['rev-parse', '--symbolic-full-name', '--abbrev-ref', '@{u}'],
    process: function(result, code, output) {
        if (code == 0) {
            result.remoteBranch = output.substr(0, output.indexOf("\n"));
        } else {
            // non-zero likely just means there is no tracking branch - do nothing
        }
        return result;
    }
};

export var currentHead = {
    params: (options) => ['rev-parse', 'HEAD'],
    requireZeroExitCode: true,
    process: function(result, code, output) {
        result.head = output.substr(0, output.indexOf("\n"));
        return result;
    }
};

export var revParse = {
    params: (options, result) => ['rev-parse', options.ref],
    requireZeroExitCode: true,
    process: function(result, code, output) {
        result.ref = output.substr(0, output.indexOf("\n"));
        return result;
    }
};

export var show = {
    params: (options, result) => ['show', options.ref],
    requireZeroExitCode: true,
    process: function(result, code, output) {
        result.contents = output;
        return result;
    }
};

export var treeRef = {
    params: (options, result) => ['show', "-q", "--format=%T", options.ref],
    process: function(result, code, output) {
        let m = output.match(/^tree [0-9a-f]{40}\n/);

        if (m) {
            result.treeRef = result.ref;
        }
        else {
            let m2 = output.match(/^[0-9a-f]{40}\n$/);
            if (!m2) throw new Error("Tried to read blob " + result.ref + " as a tree");

            result.commitRef = result.ref;
            result.treeRef = output.substr(0, output.indexOf("\n"));
        }
    }
};

// Get all current refs from a remote. This needs to use ssh directly, as
// git normally fetches as part of the same command.
// sshUrl must be in the form "git@github.com:user/repo.git "
export var remoteRefs = {
    exe: "ssh",
    spawnOptions: {
        input: "0000\n",
        timeout: 10000,
        encoding: "utf8"
    },
    params: (options) => {
        var sshUrl = options.sshUrl;
        var server = sshUrl.substr(0, sshUrl.indexOf(":"));
        var repo = sshUrl.substr(sshUrl.indexOf(":") + 1);
        return ["-x", server, "git-upload-pack '" + repo + "'"];
    },
    process: function(result, code, output) {
        result.remoteRefs = {};
        if (code == 0) {
            var lines = output.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                console.log(line);
                var m = line.match(/^[0-9a-f]{4}([0-9a-f]{40}) refs\/heads\/(\S*)/);
                if (m) {
                    result.remoteRefs[m[2]] = m[1];
                }
            }
        }
        else {
            // new repo with no branches defined yet or not a git repo at all
        }

        return result;
    }
};


export var branchNames = {
    params: ['branch', '--list'],
    process: function(result, code, output) {
        if (code != 0) throw new Error("Unexpected code " + code);
        result.branches = [];
        var reflines = output.split("\n") || [];
        for (var i = 0; i < reflines.length; i++) {
            if (!reflines[i]) continue;
            result.branches.push(reflines[i].substr(2));
        }
    }
};

export var branches = {
    params: ["branch", "-v", "--abbrev=40"],
    process: function(result, code, output) {
        if (code != 0) throw new Error("Unexpected code " + code);
        result.branches = [];
        var reflines = output.split("\n") || [];
        for (var i = 0; i < reflines.length; i++) {
            if (!reflines[i]) continue;
            var m = (/..(\S*)\s+([0-9a-f]{40})\s+(.*)/gi).exec(reflines[i]);
            if (!m) continue;
            result.branches.push({
                name: m[1],
                sha: "commit:" + m[2],
                message: m[3]
            });
        }
    }
};

export var submodules = {
    params: ["submodule", "status"],
    process: function(result, code, output) {
        if (code != 0) throw new Error("Unexpected code " + code);
        result.submodules = [];
        var reflines = output.split("\n") || [];
        for (var i = 0; i < reflines.length; i++) {
            if (!reflines[i]) continue;
            var m = (/(.)([0-9a-f]{40})\s+(\S*)\s+\((.*)\)/gi).exec(reflines[i]);
            if (!m) continue;
            var sm = {
                name: m[3],
                sha: "commit:" + m[2],
                branch: m[4]
            };
            if (m[1] == "+") sm.status = "Changed";
            else if (m[1] == "-") sm.status = "Uninitialized";
            else if (m[1] == "U") sm.status = "Conflicted";
            else sm.status = "OK";
            result.submodules.push(sm);
        }
    }
};

export var tree = {
    params: (options) => ["ls-tree", "-r", "-t", "-l", options.treeRef],
    requireZeroExitCode: false,
    process: function(result, code, output) {
        if (code != 0) {
            throw new Error("Unexpected exit code running ls-tree on " + result.treeRef);
        }
        var lslines = output.split("\n") || [];
        var i = 0;

        result.tree = {
            commit: result.commitRef,
            hash: result.treeRef,
            type: "tree",
            path: "",
            contents: {}
        };

        function updateTree(treeNode) {
            while (i < lslines.length) {
                var line = lslines[i];
                if (!line) return;

                let m = line.match(/(\d{6}) (tree|blob|commit) ([0-9a-f]{40})\s+(((\d+)|-)[ \t]+)?(((.*)\/)?(.*))/);
                if (!m) {
                    throw new Error("Unexpected ls-tree output format: " + line);
                }

                var parentPath = m[9] || "";
                if (parentPath != treeNode.path) return;

                var file = {
                    permissions: m[1],
                    type: m[2],
                    hash: m[3],
                    path: m[7],
                    name: m[10]
                };

                if (m[6]) file.size = parseInt(m[6]);

                treeNode.contents[file.name] = file;
                i++;

                if (file.type == "tree") {
                    file.contents = {};
                    updateTree(file);
                }
            }
        }

        updateTree(result.tree);
    }
};


