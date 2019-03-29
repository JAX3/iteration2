﻿let game;
 var noise_generator = new Simple1DNoise();
var gameOver = false;
var uiSceneStarted = false;

//var s;

// global game options
let gameOptions = {
    platformStartSpeed: 325,
    spawnRange: [100, 350],
    platformSizeRange: [75, 250],
    platformHeightRange: [-5, 5],
    platformHeighScale: 20,
    platformVerticalLimit: [0.4, 0.8],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 3
}

window.onload = function () {

    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 1334,
        height: 750,
        scene: [playGame, uiScene],
        backgroundColor: 0x444444,

        // physics settings
        physics: {
            default: "arcade",
            arcade: {
                debug: true
               
            }
        }
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}


// playGame scene
class playGame extends Phaser.Scene {
    constructor() {
        super("PlayGame")


    }
    preload() {
        this.load.image('platform', 'assets/platform.png');
        this.load.image('player', 'assets/player.png');

    }
    create() {
      //  function platforms(){
            // group with all active platforms.
            this.platformGroup = this.add.group({

                // once a platform is removed, it's added to the pool
                removeCallback: function (platform) {
                    platform.scene.platformPool.add(platform)
                }
            });

            // platform pool
            this.platformPool = this.add.group({

                // once a platform is removed from the pool, it's added to the active platforms group
                removeCallback: function (platform) {
                    platform.scene.platformGroup.add(platform)
                }
            });


            // number of consecutive jumps made by the player
            this.playerJumps = 1;

        // adding a platform to the game, the arguments are platform width and x position
        this.addPlatform(game.config.width, game.config.width / 2, game.config.height * gameOptions.platformVerticalLimit[1]);
          

            // adding the player;
            this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height / 2, "player");
            this.player.setGravityY(gameOptions.playerGravity);

            // setting collisions between the player and the platform group
            this.physics.add.collider(this.player, this.platformGroup);

            // checking for input
            this.input.on("pointerdown", this.jump, this);

            if (!uiSceneStarted) {
                this.scene.launch('uiScene')
            } else {
                var uiscene = this.scene.manager.getScene('uiScene');
                console.log(uiscene);
                uiscene.startButton.setActive(true);
                uiscene.startButton.setVisible(true);
            }
        //}
       

        this.scene.pause();
       
    }

    // generating the platforms from the sprite location
    addPlatform(platformWidth, posX, posY) {
        this.addedPlatforms++;
        let platform;
        if (this.platformPool.getLength()) {
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.y = posY;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
            let newRatio = platformWidth / platform.displayWidth;
            platform.displayWidth = platformWidth;
            platform.tileScaleX = 1 / platform.scaleX;
        }
        
        else {
            platform = this.physics.add.sprite(posX,  game.config.height * 0.8, "platform");
            platform.setImmovable(true);
            platform.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.platformGroup.add(platform);
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
    }

    // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
    jump() {
        console.log(this.playerJumps);
        if (this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)) {
            if (this.player.body.touching.down) {
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps++;
        }
    }
    update() {
        
        this.player.x = gameOptions.playerStartPosition;

        // recycling platforms
        let minDistance = game.config.width;
        let rightmostPlatformHeight = 0;
        this.platformGroup.getChildren().forEach(function (platform) {
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            if (platformDistance < minDistance) {
                minDistance = platformDistance;
                rightmostPlatformHeight = platform.y;
            }
            if (platform.x < - platform.displayWidth / 2) {
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        // adding new platforms
        // adding new platforms
        if (minDistance > this.nextPlatformDistance) {
            let nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            let platformRandomHeight = gameOptions.platformHeighScale * Phaser.Math.Between(gameOptions.platformHeightRange[0], gameOptions.platformHeightRange[1]);
            let nextPlatformGap = rightmostPlatformHeight + platformRandomHeight;
            let minPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[0];
            let maxPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[1];
            let nextPlatformHeight = Phaser.Math.Clamp(nextPlatformGap, minPlatformHeight, maxPlatformHeight);
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2, nextPlatformHeight);
        }

        
        
        if (this.player.y > game.config.height) {
            var uiScene = this.scene.get('uiScene')
            
            this.player.setVelocityY(0);
            this.playerJumps = 1;
            
            this.player.y = gameOptions.playerStartPosition + 180;
     
            this.scene.pause();
            //platforms.call(this.scene.playGame);
            uiScene.showRestart()
            //  this.scene.start("PlayGame");

        }
       
    }
    
       


};




class uiScene extends Phaser.Scene {
    constructor() {
        super('uiScene');
    }

    preload() {

    }

    create() {
        // create start button - just text with background
        this.startButton = this.add.text(game.config.width / 2, game.config.height / 2, 'Start Game', { fontFamily: 'Arial', fontSize: '32px', backgroundColor: '#000', fill: '#FFF' });
        // set z-index of start button so appears over everything else
        this.startButton.setDepth(2);
        this.startButton.x -= this.startButton.width / 2;
        this.startButton.y -= this.startButton.height / 2;
        // make start text interactive and listen to pointerdown event
        this.startButton.setInteractive();


        this.startButton.on('pointerdown', function () {
            this.scene.scene.resume('PlayGame');
            
            this.setActive(false);
            this.setVisible(false);
        })

        this.restartButton = this.add.text(game.config.width / 2, game.config.height / 2, 'Restart Game', { fontFamily: 'Arial', fontSize: '32px', backgroundColor: '#000', fill: '#FFF' });
        this.restartButton.setDepth(2);
        this.restartButton.setInteractive();
        this.restartButton.x -= this.restartButton.width / 2;
        this.restartButton.y -= this.restartButton.height / 2;
        this.restartButton.on('pointerdown', function () {
            // console.log(playGame);
            this.scene.restart('PlayGame');
            // this.scene.stop(); // do this last

            this.restartButton.setActive(false);
            this.restartButton.setVisible(false);
        }, this)
        this.restartButton.setActive(false);
        this.restartButton.setVisible(false);

        uiSceneStarted = true;
    }
    
    update() {

    }
    showRestart() {
        // create a restart button just like the start button
        this.scene.pause('PlayGame');
        this.restartButton.setActive(true);
        this.restartButton.setVisible(true);
    }


}





//basic resize of the game.
function resize() {
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}

