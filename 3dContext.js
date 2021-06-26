// wolfthewizard
// set of classes responsible for drawing on screen and interpretation of 3d shapes


const degRatio = Math.PI / 180;

const minX = 0;
const maxX = 1920;
const minY = 0;
const maxY = 1080;


// a wrapper around basic js canvas
class CanvasOperator {

    constructor() {
        const canvas = document.getElementById("canvas");
        const actualWidth = canvas.offsetWidth;
        const actualHeight = canvas.offsetHeight;
        this.ctx = canvas.getContext("2d");
        this.ctx.font = "12px monospace"
        this.conv = (v) => {
            return [
                (v.x - minX) / (maxX - minX) * actualWidth,
                (maxY - v.y) / (maxY - minY) * actualHeight
            ];
        };
        this.upperLeftCorner = new Vector2(minX, maxY);
        this.lowerRightCorner = new Vector2(maxX, minY);
    }

    moveTo(v) {
        this.ctx.moveTo(...(this.conv(v)));
    }
      
    lineTo(v) {
        this.ctx.lineTo(...(this.conv(v)));
    }
    
    stroke() {
        this.ctx.stroke();
    }
    
    clearAll() {
        this.ctx.clearRect(...(this.conv(this.upperLeftCorner)), ...(this.conv(this.lowerRightCorner)));
        this.ctx.beginPath();
    }
    
    beginPath() {
        this.ctx.beginPath();
    }
    
    endPath() {
        this.ctx.closePath();
    }

    write(text, position) {
        this.ctx.fillText(text, ...(this.conv(position)));
    }

    setTextStyle(style) {
        this.ctx.font = style;
    }
}

// responsible for converting 3d points to 2d perspective projections
class Context3D {

    constructor() {
        this.cameraPosition = new Vector3(0, 0, 0);
        this.cameraRotation = new Vector3(0, 0, 0);
        this.displaySurfacePosition = new Vector3((maxX - minX) / 2, (maxY - minY) / 2, 300);

        this.mapMatrix = new Matrix3(
            new Vector3(1, 0, this.displaySurfacePosition.x / this.displaySurfacePosition.z),
            new Vector3(0, 1, this.displaySurfacePosition.y / this.displaySurfacePosition.z),
            new Vector3(0, 0, 1 / this.displaySurfacePosition.z)
        );
    }

    mapPoint(v) {
        // we don't care about absolute positions, only position in relation to camera
        var d = v.subtract(this.cameraPosition);
        if (!this.cameraRotation.isZero()) {
            // we need to apply rotation matrices
            const m1 = new Matrix3(
                new Vector3(Math.cos(this.cameraRotation.z), Math.sin(this.cameraRotation.z), 0),
                new Vector3(-Math.sin(this.cameraRotation.z), Math.cos(this.cameraRotation.z), 0),
                new Vector3(0, 0, 1)
            );
            const m2 = new Matrix3(
                new Vector3(Math.cos(this.cameraRotation.y), 0, -Math.sin(this.cameraRotation.y)),
                new Vector3(0, 1, 0),
                new Vector3(Math.sin(this.cameraRotation.y), 0, Math.cos(this.cameraRotation.y))
            );
            const m3 = new Matrix3(
                new Vector3(1, 0, 0),
                new Vector3(0, Math.cos(this.cameraRotation.x), Math.sin(this.cameraRotation.x)),
                new Vector3(0, -Math.sin(this.cameraRotation.x), Math.cos(this.cameraRotation.x))
            );

            d = m1.multiplyByVector3(d);
            d = m2.multiplyByVector3(d);
            d = m3.multiplyByVector3(d);
        }

        // takes position of display surface into account
        const f = this.mapMatrix.multiplyByVector3(d);

        // the point we need
        const mappedPoint = new Vector2(f.x / f.z, f.y / f.z);

        return mappedPoint;
    }

    reset() {
        this.cameraPosition = new Vector3(0, 0, 0);
        this.cameraRotation = new Vector3(0, 0, 0);
    }
}

// responsible for rendering objects on screen
// makes use of Context3D to find screen coordinates of points in space
// and then draws lines according to object's rules using CanvasOperator
class Renderer {

    constructor(canvasOperator, context3d) {
        this.canvasOperator = canvasOperator;
        this.context3d = context3d;
        this.renderables = [];
    }

    reset() {
        this.renderables = [];
        this.context3d.reset();
    }

    addRenderable(renderable) {
        this.renderables.push(renderable);
    }

    removeRenderable(renderable) {
        this.renderables.splice(this.renderables.indexOf(renderable), 1);
    }

    setCameraPosition(position) {
        this.context3d.cameraPosition = position;
    }

    render() {
        this.canvasOperator.clearAll();
        for (const renderable of this.renderables) {
            for (const point of renderable.points) {
                point.projected = this.context3d.mapPoint(point);
            }

            const renderRule = renderable.getRenderRule();
            if (renderRule.type === "cbd") {
                this.canvasOperator.moveTo(renderRule.points[0].projected);
                this.canvasOperator.lineTo(renderRule.points[1].projected);
                this.canvasOperator.lineTo(renderRule.points[3].projected);
                this.canvasOperator.lineTo(renderRule.points[2].projected);
                this.canvasOperator.lineTo(renderRule.points[0].projected);
                this.canvasOperator.stroke();

                this.canvasOperator.moveTo(renderRule.points[4].projected);
                this.canvasOperator.lineTo(renderRule.points[5].projected);
                this.canvasOperator.lineTo(renderRule.points[7].projected);
                this.canvasOperator.lineTo(renderRule.points[6].projected);
                this.canvasOperator.lineTo(renderRule.points[4].projected);
                this.canvasOperator.stroke();

                this.canvasOperator.moveTo(renderRule.points[0].projected);
                this.canvasOperator.lineTo(renderRule.points[4].projected);
                this.canvasOperator.stroke();

                this.canvasOperator.moveTo(renderRule.points[1].projected);
                this.canvasOperator.lineTo(renderRule.points[5].projected);
                this.canvasOperator.stroke();

                this.canvasOperator.moveTo(renderRule.points[2].projected);
                this.canvasOperator.lineTo(renderRule.points[6].projected);
                this.canvasOperator.stroke();

                this.canvasOperator.moveTo(renderRule.points[3].projected);
                this.canvasOperator.lineTo(renderRule.points[7].projected);
                this.canvasOperator.stroke();
            } else if (renderRule.type === "lne") {

            }
        }
    }

    stickText(text, position) {
        this.canvasOperator.write(text, position);
    }

    changeStyle(style) {
        this.canvasOperator.setTextStyle(style);
    }

    stickTextOfSize(text, position, size) {
        this.changeStyle(`${size}px monospace`);
        this.stickText(text, position);
        this.changeStyle(`12px monospace`);
    }
}
