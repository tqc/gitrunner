#GitRunner

Runs simple git commands and parses the result.

##Installation

    npm install gitrunner


##Usage

    var gitrunner = require("gitrunner");

    gitrunner.<command>(<path>,function(result) {})

### gitStatus

Returns

    {
        isRepo: true,
        changedFiles: []
    }

### gitRemotes

Returns

    {
        origin: 'git@github.com:tqc/gitrunner.git'
    }

### gitCurrentBranch

Returns

    "master"

### gitCurrentTrackingBranch

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

### runGit

For anything else, you can access git more directly:

    gitrunner.runGit(folder, ['remote', '-v'], function(statusCode, output) {})
