#GitRunner

[ ![Codeship Status for tqc/gitrunner](https://codeship.com/projects/3f61d780-1afa-0133-1bbd-7e346f2e432c/status?branch=master)](https://codeship.com/projects/94425)

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
