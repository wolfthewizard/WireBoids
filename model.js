// wolfthewizard
// there are only model classes in this file (vectors, cuboids, GameWorld etc.)
// they have at most basic operations of structures they model


class Vector3 {

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.projected = undefined;
    }

    toString() {
        return `(${this.x}, ${this.y}, ${this.z})`;
    }

    equals(other) {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }

    negate() {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    add(other) {
        return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    subtract(other) {
        return this.add(other.negate());
    }

    timesScalar(s) {
        return new Vector3(this.x * s, this.y * s, this.z * s);
    }

    isZero() {
        return this.x == 0 && this.y == 0 & this.z == 0;
    }
}


class Vector2 {

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return `(${this.x}, ${this.y})`;
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}


class Matrix3 {

    constructor(v1, v2, v3) {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
    }

    toString() {
        return `[${this.v1.x} ${this.v1.y} ${this.v1.z}]
[${this.v2.x} ${this.v2.y} ${this.v2.z}]
[${this.v3.x} ${this.v3.y} ${this.v3.z}]`;
    }

    equals(other) {
        return this.v1 === other.v1 && this.v2 === other.v2 && this.v3 === other.v3;
    }

    multiplyByVector3(v) {
        return new Vector3(
            v.x * this.v1.x + v.y * this.v1.y + v.z * this.v1.z,
            v.x * this.v2.x + v.y * this.v2.y + v.z * this.v2.z,
            v.x * this.v3.x + v.y * this.v3.y + v.z * this.v3.z
        );
    }
}


class Cuboid {

    constructor(origin, diagonal) {
        this.points = [
            origin,
            new Vector3(origin.x, origin.y, diagonal.z),
            new Vector3(origin.x, diagonal.y, origin.z),
            new Vector3(origin.x, diagonal.y, diagonal.z),
            new Vector3(diagonal.x, origin.y, origin.z),
            new Vector3(diagonal.x, origin.y, diagonal.z),
            new Vector3(diagonal.x, diagonal.y, origin.z),
            diagonal
        ];
    }

    translate(v) {
        for (const [index, point] of this.points.entries()) {
            this.points[index] = point.add(v);
        }
    }

    getDepth() {
        const d1 = this.points[0].z;
        const d2 = this.points[1].z;
        return d1 < d2 ? d1 : d2;
    }

    getFacingRectangle() {
        const minX = this.points[0].x < this.points[7].x ? this.points[0].x : this.points[7].x;
        const maxX = this.points[0].x > this.points[7].x ? this.points[0].x : this.points[7].x;
        const minY = this.points[0].y < this.points[7].y ? this.points[0].y : this.points[7].y;
        const maxY = this.points[0].y > this.points[7].y ? this.points[0].y : this.points[7].y;
        
        return new Rectangle(new Vector2(minX, minY), new Vector2(maxX, maxY));
    }

    getRenderRule() {
        return new RenderRule("cbd", this.points);
    }

    get lowerX() {
        return this.points[0].x < this.points[7].x ? this.points[0].x : this.points[7].x;
    }

    get higherX() {
        return this.points[0].x > this.points[7].x ? this.points[0].x : this.points[7].x;
    }

    get lowerY() {
        return this.points[0].y < this.points[7].y ? this.points[0].y : this.points[7].y;
    }

    get higherY() {
        return this.points[0].y > this.points[7].y ? this.points[0].y : this.points[7].y;
    }

    get lowerZ() {
        return this.points[0].z < this.points[7].z ? this.points[0].z : this.points[7].z;
    }

    get higherZ() {
        return this.points[0].z > this.points[7].z ? this.points[0].z : this.points[7].z;
    }
}


class Line {

    constructor() {
        this.points = [];
    }

    addPoint(v) {
        this.points.push(v);
    }

    getRenderRule() {
        return new RenderRule("lne", this.points);
    }
}


class Rectangle {
    
    constructor(origin, diagonal) {
        this.origin = origin;
        this.diagonal = diagonal;
    }
}


class RenderRule {

    constructor(type, points) {
        this.type = type;
        this.points = points;
    }
}


class GameWorld {

    constructor(boundingBox) {
        this.boundingBox = boundingBox;
        this.objects = [boundingBox];
        this.playerPosition = new Vector3(0, 0, 0);
    }

    reset() {
        this.boundingBox.translate(new Vector3(0, 0, 1 - this.boundingBox.points[0].z));
        this.objects = [this.boundingBox];
        this.playerPosition = new Vector3(0, 0, 0);
    }

    addObject(object) {
        this.objects.push(object);
    }

    removeObject(object) {
        this.objects.splice(this.objects.indexOf(object), 1);
    }
}
