// wolfthewizard
// this file contains core class to the game, that coordinates operations, and input handler


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function randomIntInInterval(from, to) {
    return Math.round(from - 0.5 + Math.random() * (to - from + 0.99));
}

// class responsible for the game
class GameEngine {

    // static variables, fiddle with them to customize your experience
    static fps = 60;

    static worldSize = 1000;

    static minSpaceBetweenGroups = 500;
    static maxSpaceBetweenGroups = 1000;
    static minSpaceBetweenColleagues = 50;
    static maxSpaceBetweenColleagues = 200;
    static minColleaguesInGroup = 1;
    static maxColleaguesInGroup = 4;
    static minCuboidDimensions = new Vector3(200, 200, 50);
    static maxCuboidDimensions = new Vector3(800, 800, 250);
    static generationDistance = 2000;

    static titlePosition = new Vector2(600, 900);
    static instructionPosition = new Vector2(700, 540);
    static inputsPosition = new Vector2(700, 510);
    static inputs2Position = new Vector2(700, 480);
    static startPosition = new Vector2(700, 420);
    static fpsPosition = new Vector2(25, 1035);
    static distancePosition = new Vector3(850, 1000);
    static gameOverPosition = new Vector3(850, 600);
    static scorePosition = new Vector3(850, 500);
    static restartPosition = new Vector3(850, 400);
    static pausePosition = new Vector2(800, 150);

    static titleText = "WireBoids";
    static instructionText = "Go as far as you can while dodging cuboids.";
    static inputsText = "WSAD / Arrow Keys to move.";
    static inputs2Text = "Space to Pause / Unpause.";
    static startText = "Press 'R' to start.";
    static gameOverText = "Game Over";
    static restartText = "Press 'R' to restart.";
    static pauseText = "PAUSE";

    static titleSize = 72;
    static gameOverSize = 36;
    static scoreSize = 24;
    static pauseSize = 48;

    constructor(renderer) {
        this.renderer = renderer;
        this.gameWorld = new GameWorld(
            new Cuboid(
                new Vector3(-GameEngine.worldSize / 2, -GameEngine.worldSize / 2, 1), 
                new Vector3(GameEngine.worldSize / 2, GameEngine.worldSize / 2, 2000)
            )
        );
        this.inputHandler = new InputHandler(this.start.bind(this), this.pause.bind(this));

        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameUpdate = undefined;
        this.previousFpsCounterId = undefined;
        this.framesSinceCounting = 0;
        this.countedFps = 0;
        this.nextGenerationZ = 0;
        this.colleaguesLeft = randomIntInInterval(
            this.minColleaguesInGroup, this.maxColleaguesInGroup
        );

        this.speed = new Vector3(0, 0, 0.5);
        this.cameraSpeed = new Vector3(0.5, 0.5, 0);

        this.gameLoop = this.gameLoop.bind(this);
          
        this.renderer.stickTextOfSize(
            GameEngine.titleText, GameEngine.titlePosition, GameEngine.titleSize
        );
        this.renderer.stickText(GameEngine.instructionText, GameEngine.instructionPosition);
        this.renderer.stickText(GameEngine.inputsText, GameEngine.inputsPosition);
        this.renderer.stickText(GameEngine.inputs2Text, GameEngine.inputs2Position);
        this.renderer.stickText(GameEngine.startText, GameEngine.startPosition);
    }

    // basic initialization of game
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameUpdate = new Date().getTime();
            this.previousFpsCounterId = Math.floor(this.lastFrameUpdate / 1000 % 10);
            this.nextGenerationZ = 0;

            this.gameWorld.reset();
            this.renderer.reset();

            this.renderer.addRenderable(this.gameWorld.boundingBox);

            setTimeout(this.gameLoop, 1 / GameEngine.fps * 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            if (this.isPaused) {
                this.lastFrameUpdate = new Date().getTime();
                this.isPaused = false;
                setTimeout(this.gameLoop, 1 / GameEngine.fps * 1000);
            } else {
                this.isPaused = true;
            }
        }
    }

    // core loop of the game
    async gameLoop() {
        while (true) {
            if (this.isPaused) {
                this.renderer.stickTextOfSize(
                    GameEngine.pauseText, GameEngine.pausePosition, GameEngine.pauseSize
                );
                break;
            }

            // real fps may vary on different machines and with different settings (GameEngine.fps)
            // that's why we compute deltaTime to take that into account
            // all actions happening on screen (player flying forward, moving sideways etc.)
            // are computed proportional to time passed since previous update
            // this eliminates link of gameplay speed to framerate
            const startTime = new Date().getTime();
            const deltaTime = startTime - this.lastFrameUpdate;
            this.lastFrameUpdate = startTime;

            this.processInput(deltaTime);
            const isDed = this.processLogic(deltaTime);
            if (isDed) {
                this.renderer.canvasOperator.clearAll();
                this.renderer.stickTextOfSize(
                    GameEngine.gameOverText, GameEngine.gameOverPosition, GameEngine.gameOverSize
                );
                this.renderer.stickTextOfSize(
                    `score: ${(this.gameWorld.playerPosition.z / 1000).toFixed(1)}k`, 
                    GameEngine.scorePosition,
                    GameEngine.scoreSize
                );
                this.renderer.stickText(GameEngine.restartText, GameEngine.restartPosition);
                this.isRunning = false;
                break;
            }
            this.renderer.setCameraPosition(this.gameWorld.playerPosition);
            this.renderer.render();

            const endTime = new Date().getTime();
            const runTime = endTime - startTime;
            const timeTillNextUpdate = 1 / GameEngine.fps * 1000 - runTime;
            const delay = timeTillNextUpdate > 0 ? timeTillNextUpdate : 0;
            const fpsCounterId = Math.floor(endTime / 1000 % 10);
            if (fpsCounterId != this.previousFpsCounterId) {
                this.countedFps = this.framesSinceCounting;
                this.previousFpsCounterId = fpsCounterId;
                this.framesSinceCounting = 0;
            }
            this.framesSinceCounting += 1;

            this.renderer.stickText(`${this.countedFps}fps`, GameEngine.fpsPosition);
            this.renderer.stickText(
                `distance: ${(this.gameWorld.playerPosition.z / 1000).toFixed(1)}k`, 
                GameEngine.distancePosition
            );
            await sleep(delay);
        }
    }

    // before moving player forward, we check if they wish to move sideways
    processInput(deltaTime) {
        const moveBasis = new Vector3(
            this.cameraSpeed.x * this.inputHandler.inputAxis.x, 
            this.cameraSpeed.y * this.inputHandler.inputAxis.y, 
            0
        );
        if (!moveBasis.isZero()) {
            const moveVector = moveBasis.timesScalar(deltaTime);
            this.gameWorld.playerPosition = this.gameWorld.playerPosition.add(moveVector);

            if (this.gameWorld.playerPosition.x < this.gameWorld.boundingBox.lowerX) {
                this.gameWorld.playerPosition.x = this.gameWorld.boundingBox.lowerX;
            } else if (this.gameWorld.playerPosition.x > 
                this.gameWorld.boundingBox.higherX) {
                this.gameWorld.playerPosition.x = this.gameWorld.boundingBox.higherX;
            }

            if (this.gameWorld.playerPosition.y < this.gameWorld.boundingBox.lowerY) {
                this.gameWorld.playerPosition.y = this.gameWorld.boundingBox.lowerY;
            } else if (this.gameWorld.playerPosition.y > 
                this.gameWorld.boundingBox.higherY) {
                this.gameWorld.playerPosition.y = this.gameWorld.boundingBox.higherY;
            }
        }
    }

    // here lies logic of generating cuboids and checking collisions
    processLogic(deltaTime) {
        var isDed = false;
        const moveVector = this.speed.timesScalar(deltaTime);
        this.gameWorld.playerPosition = this.gameWorld.playerPosition.add(
            moveVector
        );
        this.gameWorld.boundingBox.translate(moveVector);
        for (const cb of this.gameWorld.objects) {
            // cuboid may have started moving behind the screen
            if (cb.getDepth() < this.gameWorld.playerPosition.z) {
                // here we check if a collision occured
                if (!isDed) {
                    if (
                        this.gameWorld.playerPosition.x >= cb.lowerX && 
                        this.gameWorld.playerPosition.x <= cb.higherX && 
                        this.gameWorld.playerPosition.y >= cb.lowerY && 
                        this.gameWorld.playerPosition.y <= cb.higherY
                    ) {
                        // game over!
                        isDed = true;
                    }
                }
                this.gameWorld.removeObject(cb);
                this.renderer.removeRenderable(cb);
            }
        }

        if (this.gameWorld.playerPosition.z > this.nextGenerationZ) {
            // we have passed the point where we should generate next cuboid
            const faceCenter = new Vector2(
                randomIntInInterval(
                    this.gameWorld.boundingBox.lowerX, 
                    this.gameWorld.boundingBox.higherX
                ), randomIntInInterval(
                    this.gameWorld.boundingBox.lowerY, 
                    this.gameWorld.boundingBox.higherY
                )
            );
            const dimensions = new Vector3(
                randomIntInInterval(
                    GameEngine.minCuboidDimensions.x,
                    GameEngine.maxCuboidDimensions.x
                ), randomIntInInterval(
                    GameEngine.minCuboidDimensions.y,
                    GameEngine.maxCuboidDimensions.y
                ), randomIntInInterval(
                    GameEngine.minCuboidDimensions.z,
                    GameEngine.maxCuboidDimensions.z
                )
            );
            const origin = new Vector3(
                faceCenter.x - dimensions.x / 2, 
                faceCenter.y - dimensions.y / 2,
                this.nextGenerationZ + GameEngine.generationDistance
            );
            const diagonal = new Vector3(
                faceCenter.x + dimensions.x / 2,
                faceCenter.y + dimensions.y / 2,
                this.nextGenerationZ + dimensions.z + GameEngine.generationDistance
            );
            
            // the cuboid may go out of bounds; if it does so we stick it to the wall
            const cb = new Cuboid(origin, diagonal);
            if (origin.x < this.gameWorld.boundingBox.lowerX) {
                cb.translate(new Vector3(this.gameWorld.boundingBox.lowerX - origin.x, 0, 0));
            } else if (diagonal.x > this.gameWorld.boundingBox.higherX) {
                cb.translate(new Vector3(this.gameWorld.boundingBox.higherX - diagonal.x, 0, 0));
            }
            if (origin.y < this.gameWorld.boundingBox.lowerY) {
                cb.translate(new Vector3(0, this.gameWorld.boundingBox.lowerY - origin.y, 0));
            } else if (diagonal.y > this.gameWorld.boundingBox.higherY) {
                cb.translate(new Vector3(0, this.gameWorld.boundingBox.higherY - diagonal.y, 0));
            }

            this.gameWorld.addObject(cb);
            this.renderer.addRenderable(cb);
            
            // cuboids generate in groups of random sizes
            // if there are no colleagues left then we will initiate next group
            // distances between groups are bigger than distances between cuboids in the same group
            this.colleaguesLeft -= 1;
            if (this.colleaguesLeft <= 0) {
                this.colleaguesLeft = randomIntInInterval(
                    minColleaguesInGroup, maxColleaguesInGroup
                );
                this.nextGenerationZ += dimensions.z + randomIntInInterval(
                    GameEngine.minSpaceBetweenGroups, GameEngine.maxSpaceBetweenGroups
                );
            } else {
                this.nextGenerationZ += dimensions.z + randomIntInInterval(
                    GameEngine.minSpaceBetweenColleagues, GameEngine.maxSpaceBetweenColleagues
                );
            }
        }
        return isDed;
    }
}

// responsible for checking input of the player, and storing movement axis
class InputHandler {

    static upKeys = ["w", "ArrowUp"];
    static downKeys = ["s", "ArrowDown"];
    static rightKeys = ["d", "ArrowRight"];
    static leftKeys = ["a", "ArrowLeft"];
    static pauseKeys = [" "];
    static restartKeys = ["r"];

    constructor(startFunction, pauseFunction) {
        this.inputAxis = new Vector2(0, 0);
        this.registerBlock = [
            [false, false],
            [false, false]
        ];

        this.startFunction = startFunction;
        this.pauseFunction = pauseFunction;

        document.addEventListener("keydown", this.checkKeyDown.bind(this), false);
        document.addEventListener("keyup", this.checkKeyUp.bind(this), false);
    }

    checkKeyDown(event) {
        if (InputHandler.upKeys.includes(event.key)) {
            event.preventDefault();
            if (!this.registerBlock[1][0]) {
                this.inputAxis.y += 1;
                this.registerBlock[1][0] = true;
            }
        } else if (InputHandler.downKeys.includes(event.key)) {
            event.preventDefault();
            if (!this.registerBlock[1][1]) {
                this.inputAxis.y -= 1;
                this.registerBlock[1][1] = true;
            }
        } else if (InputHandler.rightKeys.includes(event.key)) {
            event.preventDefault();
            if (!this.registerBlock[0][0]) {
                this.inputAxis.x += 1;
                this.registerBlock[0][0] = true;
            } 
        } else if (InputHandler.leftKeys.includes(event.key)) {
            event.preventDefault();
            if (!this.registerBlock[0][1]) {
                this.inputAxis.x -= 1;
                this.registerBlock[0][1] = true;
            } 
        } else if (InputHandler.restartKeys.includes(event.key)) {
            event.preventDefault();
            this.startFunction();
        } else if (InputHandler.pauseKeys.includes(event.key)) {
            event.preventDefault();
            this.pauseFunction();
        } 
    }

    checkKeyUp(event) {
        if (InputHandler.upKeys.includes(event.key)) {
            event.preventDefault();
            this.inputAxis.y -= 1;
            this.registerBlock[1][0] = false;
        } else if (InputHandler.downKeys.includes(event.key)) {
            event.preventDefault();
            this.inputAxis.y += 1;
            this.registerBlock[1][1] = false;
        } else if (InputHandler.rightKeys.includes(event.key)) {
            event.preventDefault();
            this.inputAxis.x -= 1;
            this.registerBlock[0][0] = false;
        } else if (InputHandler.leftKeys.includes(event.key)) {
            event.preventDefault();
            this.inputAxis.x += 1;
            this.registerBlock[0][1] = false;
        } 
    }
}