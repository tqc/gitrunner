#GitRunner

[ ![Codeship Status for tqc/gitrunner](https://codeship.com/projects/3f61d780-1afa-0133-1bbd-7e346f2e432c/status?branch=master)](https://codeship.com/projects/94425)

Runs simple git commands and parses the result.

##Installation

    npm install gitrunner


##Usage

    var git = require("gitrunner").Sync;
    var status = git.status(folder);

or

    var git = require("gitrunner").Async;
    var result = git.status(folder, function(err, result) {});

### status

Returns

    {
        isRepo: true,
        changedFiles: []
    }

### remotes

Returns

    {
        origin: 'git@github.com:tqc/gitrunner.git'
    }

### currentBranch

Returns

    "master"

### remoteBranch

Returns

    "origin/master"

### fullStatus

A high level command that calls several of the lower level functions. Result is

    {
        isRepo: true,
        path: 'c:\\git\\gitrunner',
        changedFiles: [
            'README.md'
            ],
        branch: 'master',
        remotes: {
            origin: 'git@github.com:tqc/gitrunner.git'
            },
        remoteBranch: 'origin/master'
    }

### run

For anything else, you can access git more directly:
    
    var op = {
        params: ['remote', '-v'],
        process: function(resultObject, statusCode, output) {
            if (statusCode != 0) throw new Error("Something went wrong")
            resultObject.something = output.substr(0,5);
        }
    }    
    result = git.run(folder, op).something // sync
    git.run(folder, op, undefined, function(err, resultObject) {}); // async

