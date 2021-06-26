// wolfthewizard
// unncessary for normal operation, just a test of some basic operations if implementations change
// import {Vector3, Vector2, Matrix3} from "./test.js";


function testVector3() {
    const v1 = new Vector3(1, 1, 1);
    const v2 = new Vector3(1, 1, 1);

    const expectedAdded = new Vector3(2, 2, 2);
    const actualAdded = v1.add(v2);

    if (!actualAdded.equals(expectedAdded)) {
        console.log(`Error in addition: expected ${expectedAdded}, got ${actualAdded}`);
    }

    const expectedSubtracted = new Vector3(0, 0, 0);
    const actualSubtracted = v1.subtract(v2);
    if (!actualSubtracted.equals(expectedSubtracted)) {
        console.log(`Error in subraction: expected ${expectedSubtracted}, got ${actualSubtracted}`);
    }

    console.log("Test of Vector3 done.");
}


function testMatrix3() {
    const m1 = new Matrix3(
        new Vector3(1, 0, 0),
        new Vector3(0, 1, 0),
        new Vector3(0, 0, 1)
    );

    const m2 = new Matrix3(
        new Vector3(1, 2, 3),
        new Vector3(4, 5, 6),
        new Vector3(7, 8, 9)
    );

    const v = new Vector3(1, 1, 1);


    const expectedIdentity = new Vector3(1, 1, 1);
    const actualIdentity = m1.multiplyByVector3(v);

    if (!actualIdentity.equals(expectedIdentity)) {
        console.log(`Error in identity: expected ${expectedIdentity}, got ${actualIdentity}`);
    }

    const expectedOther = new Vector3(6, 15, 24);
    const actualOther = m2.multiplyByVector3(v);

    if (!actualOther.equals(expectedOther)) {
        console.log(`Error in other: expected ${expectedOther}, got ${actualOther}`);
    }

    console.log("Test of Matrix3 done.");
}


function main() {
    testVector3();
    testMatrix3();
}


main();
