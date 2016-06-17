import * as GitRunner from "../src";
import * as path from "path";
import * as fs from "fs-extra";
import chai from 'chai';
global.expect = chai.expect;

// set up

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0; // eslint-disable-line no-bitwise
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16); // eslint-disable-line no-bitwise
    });
    return uuid;
}


before(function(done) {
    console.log("set up test run");

    // generate a unique id for the test run

    global.testId = generateUUID();
    global.testDir = path.resolve(__dirname, "../build/test", global.testId);

    fs.mkdirsSync(global.testDir);

    GitRunner.Sync.init(global.testDir);

    done();
});

after(function(done) {
    console.log("end test run");

    console.log("deleting test files");

    fs.removeSync(global.testDir);

    done();
});

describe("suite", function() {
    it("should get status for new repo", function() {
        var result = GitRunner.Sync.status(global.testDir);
        expect(result.isRepo).to.equal(true);
        expect(result.changedFiles).to.have.length(0);
    });

    it("should get status for new repo async", function(done) {
        GitRunner.Async.status(global.testDir, function(err, result) {
            expect(err).to.not.exist;
            expect(result.isRepo).to.equal(true);
            expect(result.changedFiles).to.have.length(0);
            done();
        });
    });

    it.skip("should list tree", function() {
        // todo: make this work on the build server
        var tree = GitRunner.Sync.tree(process.cwd(), "master");
        console.log(tree);
        expect(tree).to.exist;
    });


});