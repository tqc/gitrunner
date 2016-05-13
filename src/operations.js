import * as flat from "flat";

export var init = {
    params: (options) => ["init"],
    process: function(result, code, output) {
        if (code === 0) {
            // succeeded
        } else {
            console.log(output);
            throw ("Unexpected code " + code);
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
            throw ("Unexpected code " + code);
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
        result.remoteBranch = output.substr(0, output.indexOf("\n"));
        return result;
    }
};

export var currentHead = {
    params: (options) => ['rev-parse', 'HEAD'],
    process: function(result, code, output) {
        result.head = output.substr(0, output.indexOf("\n"));
        return result;
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
                var m = line.match(/^[0-9a-f]{4}([0-9a-f]{40}) refs\/heads\/(\w*)/);
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
            branches.push(reflines[i].substr(2));
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
            var m = (/..(\w*)\W+([0-9a-f]{40})\W+(.*)/gi).exec(reflines[i]);
            if (!m) continue;
            result.branches.push({
                name: m[1],
                sha: "commit:"+m[2],
                message: m[3]
            });
        }
    }
};

export var lstree = {
    params: (options) => ["ls-tree", "-r", "-t", options.treeref],
    process: function(result, code, output) {
        if (code != 0) throw new Error("Unexpected code " + code);
        var files = [];
        var filehash = {};
        var lslines = output.split("\n") || [];
        for (var i = 0; i < lslines.length; i++) {
            if (!lslines[i]) continue;
            var file = {
                permissions: lslines[i].substr(0, 6),
                // todo: this will break if there is a submodule
                type: lslines[i].substr(7, 4),
                hash: lslines[i].substr(12, 40),
                path: lslines[i].substr(53)
            };
            if (file.type == "tree") {
                filehash[file.path + "/.treesha"] = file.type + ":" + file.hash;
            } else {
                filehash[file.path] = file.type + ":" + file.hash;
            }

            files.push(file);
        }
        result.tree = flat.unflatten(filehash, {
            delimiter: "/"
        });
        //tree[".treesha"] = "tree:" + treeref;
    }
};


