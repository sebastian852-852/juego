class Escena extends Phaser.Scene {

    constructor() {
        super('Escena')
    }
    preload() {
        this.load.image('fondo', '../img/fondo.jpg');
        this.load.spritesheet('player', '../img/player.png', { frameWidth: 180, frameHeight: 180 });
        this.load.tilemapTiledJSON('level1', '../img/map.json');
        this.load.image('gameTiles', '../img/tiles.png');
        this.load.image('flecha', '../img/flecha.png');
        this.load.spritesheet('hormiga', '../img/hormiga.png', { frameWidth: 192, frameHeight: 96 });
        this.load.spritesheet('explosion', '../img/crash.png', { frameWidth: 199, frameHeight: 200 });
        this.load.audio("music", ["../img/Mid-Air_Machine_-_A_Surprising_Power_117__44.mp3"])
        this.load.image('meta', '../img/meta.png');

        this.load.spritesheet('oruga', '../img/oruga.png', {
            frameWidth: 96,
            frameHeight: 192
        });

        this.load.spritesheet('avispa', '../img/avispa.png', {
            frameWidth: 128,
            frameHeight: 128
        });

    }

    create() {

        this.bg = this.add.tileSprite(480, 320, 960, 640, 'fondo').setScrollFactor(0);


        const map = this.add.tilemap('level1');
        const playersFromTiled = this.findObjectsByType('player', map);


        this.player = new Player(this, playersFromTiled[0].x, playersFromTiled[0].y);


        const tileset = map.addTilesetImage('tiles', 'gameTiles');
        map.createStaticLayer('hierbaLayer', tileset).setDepth(100);
        map.createStaticLayer('backgroundLayer', tileset);


        this.collisionLayer = map.createStaticLayer('collisionLayer', tileset);
        // Hacemos que los tiles que pertenecen a la collisionLayer sean colisionables    
        this.collisionLayer.setCollisionByExclusion([-1]);
        // Establecemos la colisión entre el jugador y la collisionLayer
        this.physics.add.collider(this.player, this.collisionLayer);


        this.cursors = this.input.keyboard.createCursorKeys();


        this.animacionesDeLaEscena();
        this.controlesVisuales();
        this.cameras.main.setSize(960, 640);

        const hormigasFromTiled = this.findObjectsByType('hormigaEnemy', map);
        const hormigas = this.insertarMalos(hormigasFromTiled, HormigaEnemy, this);

        const orugasFromTiled = this.findObjectsByType('orugaEnemy', map);
        const orugas = this.insertarMalos(orugasFromTiled, OrugaEnemy, this);
        this.physics.add.overlap(this.player, orugas, this.player.checkEnemy, null, this.player);

        const avispasFromTiled = this.findObjectsByType('avispaEnemy', map);
        this.insertarMalos(avispasFromTiled, AvispaEnemy, this);


        this.physics.add.overlap(this.player, hormigas, this.player.checkEnemy, null, this.player);

        const metaFromTiled = this.findObjectsByType('meta', map)[0];
        this.meta = this.physics.add.sprite(metaFromTiled.x, metaFromTiled.y, 'meta');
        this.meta.body.immovable = true;
        this.meta.body.moves = false;

        this.meta.setSize(160, 160);
        this.physics.add.overlap(this.player, this.meta, this.playerAlcanzaMeta, null, this);

        this.physics.world.setBoundsCollision(false, false, false, true);
        this.physics.world.on('worldbounds', () => {
            this.scene.start('perderScene');
        });

        this.topeDeTiempo = 17;
        this.tiempo = this.topeDeTiempo;
        this.tiempoTXT = this.add.text(835, 130, this.tiempo, {
            fontFamily: 'font1',
            fontSize: 45,
            color: '#000000',
        });

        this.temporizador();




    }
    temporizador() {
        --this.tiempo;
        this.tiempoTXT.setText(this.tiempo);
        if (this.tiempo === 0) {
            this.scene.start('perderScene')
        } else {
            this.time.delayedCall(1000, this.temporizador, [], this);
        }
    }

    playerAlcanzaMeta() {
        this.scene.start('finScene');
    }

    playerGolpeadoPorAvispa() {
        this.player.estaAturdido = true;
        this.player.body.setVelocity(-100, -100);
        this.time.addEvent({ delay: 1000, callback: this.terminoElAturdimiento, callbackScope: this });
    }

    terminoElAturdimiento() {
        this.player.estaAturdido = false;
    }

    findObjectsByType(type, tilemap) {
        const result = [];
        tilemap.objects.forEach(function(element) {
            if (element.name === 'objectsLayer') {
                element.objects.forEach(function(element2) {
                    if (element2.type === type) {
                        element2.y -= tilemap.tileHeight;
                        result.push(element2);
                    }
                });
            }
        });
        return result;
    }

    insertarMalos(arrayDeMalos, type, scene) {
        const enemies = scene.physics.add.group({ classType: type, runChildUpdate: true, runChildCreate: true });
        for (let i = 0; i < arrayDeMalos.length; i++) {
            const malo = new type(arrayDeMalos[i].x, arrayDeMalos[i].y, scene);
            enemies.add(malo);
        }
        return enemies;
    }


    update() {
        this.bg.tilePositionX = this.player.x;

        if (!this.player.estaAturdido) {
            if (this.player.estaVivo) {
                if (this.cursors.left.isDown || this.player.getData('direccionHorizontal') === Phaser.LEFT) {
                    this.player.caminarALaIzquierda()
                } else if (this.cursors.right.isDown || this.player.getData('direccionHorizontal') === Phaser.RIGHT) {
                    this.player.caminarALaDerecha();
                } else {
                    this.player.reposo();
                }

                if (this.cursors.up.isDown || this.player.getData('estaSaltando') === Phaser.UP) {
                    this.player.saltar();
                }

            }
            this.player.update();

        }

        this.cameras.main.scrollX = this.player.x - 400;
        this.cameras.main.scrollY = 0;
        this.cameras.main.setBounds(0, 0, 3520, 640);
        this.music = this.sound.add("music");
        var musicConfig = {
            mute: false,
            volume: 4,
            rate: 1,
            detune: 0,
            seek: 0,
            loop: false,
            delay: 0
        }

    }

    animacionesDeLaEscena() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 2, end: 5 }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: 'reposo',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1,
        });

        this.anims.create({
            key: 'caer',
            frames: this.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
            frameRate: 7,
            repeat: -1,
        });

        this.anims.create({
            key: 'hormiga_caminar',
            frames: this.anims.generateFrameNumbers('hormiga', { start: 0, end: 3 }),
            frameRate: 7,
            repeat: -1,
        });

        this.anims.create({
            key: 'explosionAnim',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }),
            frameRate: 7
        });

        this.anims.create({
            key: 'orugaWalk',
            frames: this.anims.generateFrameNumbers('oruga', { start: 0, end: 3 }),
            frameRate: 7,
            repeat: -1,
        });

        this.anims.create({
            key: 'avispaWalk',
            frames: this.anims.generateFrameNumbers('avispa', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: 'avispaAttack',
            frames: this.anims.generateFrameNumbers('avispa', { frames: [3, 4, 5, 4, 3] }),
            frameRate: 10
        });

        this.anims.create({
            key: 'avispaAttack',
            frames: this.anims.generateFrameNumbers('avispa', { frames: [3, 4, 5, 4, 3] }),
            frameRate: 10
        });
    }


    controlesVisuales() {
        this.player.setData('direccionHorizontal', 0);
        this.player.setData('estaSaltando', false);

        const leftbtn = this.add.sprite(50, 560, 'flecha').setInteractive()
        leftbtn.setScrollFactor(0);
        leftbtn.setDepth(200);
        const rightbtn = this.add.sprite(140, 560, 'flecha').setInteractive();
        rightbtn.flipX = true;
        rightbtn.setScrollFactor(0);
        rightbtn.setDepth(200);

        const upbtn = this.add.sprite(850, 560, 'flecha').setInteractive();
        upbtn.rotation = Math.PI / 2;
        upbtn.setScrollFactor(0);
        upbtn.setDepth(200);

        leftbtn.on('pointerdown', function() {
            this.scene.player.setData('direccionHorizontal', Phaser.LEFT);
        });

        rightbtn.on('pointerdown', function() {
            this.scene.player.setData('direccionHorizontal', Phaser.RIGHT);
        });

        upbtn.on('pointerdown', function() {
            this.scene.player.setData('estaSaltando', Phaser.UP);
        });

        leftbtn.on('pointerup', function() {
            this.scene.player.setData('direccionHorizontal', Phaser.NONE);
        });

        rightbtn.on('pointerup', function() {
            this.scene.player.setData('direccionHorizontal', Phaser.NONE);
        });

        upbtn.on('pointerup', function() {
            this.scene.player.setData('estaSaltando', Phaser.NONE);
        });
    }
}

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.physics.systems.displayList.add(this);
        scene.physics.systems.updateList.add(this);
        scene.physics.world.enableBody(this, 0);
        this.setSize(90, 180, true);

        this.estaVivo = true;
        this.on('animationcomplete', this.animationComplete, this);
        this.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;

    }

    animationComplete(animation, frame, sprite) {
        if (animation.key === 'explosionAnim') {
            this.disableBody(true, true);
            this.scene.scene.start('perderScene');
        }
    }

    checkEnemy(player, enemigo) {
        //  El jugador está cayendo?
        if (this.body.velocity.y > 0) {
            enemigo.morir();
        } else {
            this.morir();
        }
    }

    morir() {
        this.estaVivo = false;
        this.disableBody();
        this.play('explosionAnim', true);
    }

    saltar() {
        if (this.enElSuelo) {
            this.body.setVelocityY(-250);
            this.play('caer', true);
        }
    }

    update() {
        this.enElSuelo = this.body.onFloor();
    }

    caminarALaIzquierda() {
        this.body.setVelocityX(-250);
        this.flipX = true;
        if (this.enElSuelo) this.play('walk', true);
    }

    caminarALaDerecha() {
        this.body.setVelocityX(250);
        this.flipX = false;
        if (this.enElSuelo) this.play('walk', true);
    }

    reposo() {
        this.body.setVelocityX(0);
        if (this.enElSuelo) this.play('reposo', true);

    }
}

class FinScene extends Phaser.Scene {
    constructor() {
        super('finScene');
    }

    preload() {
        this.load.image('fondoFin', '../img/Ganaste xd.jpg');

    }

    create() {
        this.add.sprite(480, 320, 'fondoFin');
        this.input.on('pointerdown', () => this.ComenzarScene())
    }
    ComenzarScene() {
        this.scene.start('ComenzarScene')
    }
}

class PerderScene extends Phaser.Scene {

    constructor() {
        super('perderScene');
    }

    preload() {
        this.load.image('fondoPerder', '../img/perdiste xd.jpg');
    }

    create() {
        this.add.sprite(480, 320, 'fondoPerder');
        this.input.on('pointerdown', () => this.ComenzarScene())
    }
    ComenzarScene() {
        this.scene.start('ComenzarScene')
    }

}



class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, sprite) {
        super(scene, x, y, sprite);
        scene.physics.add.collider(this, scene.collisionLayer);
        scene.add.existing(this);
        this.play('hormiga_caminar');
        this.velocidad = 100;
        this.direccion = -1;

        this.on('animationcomplete', this.animationComplete, this);
    }

    morir() {
        this.disableBody();
        this.play('explosionAnim');
    }
    animationComplete(animation, frame, sprite) {
        if (animation.key === 'explosionAnim') {
            this.disableBody(true, true);
        }

    }
    update() {
        this.body.setVelocityX(this.direccion * this.velocidad);


        const nextX = Math.floor(this.x / 32) + this.direccion;
        let nextY = this.y + this.height / 2;
        nextY = Math.round(nextY / 32);
        const nextTile = this.scene.collisionLayer.hasTileAt(nextX, nextY);
        if (!nextTile && this.body.blocked.down) {
            this.direccion *= -1;
        }
        if (this.direccion > 0) {
            this.flipX = true;
        } else {
            this.flipX = false;
        }
    }

}


class HormigaEnemy extends Enemy {
    constructor(x, y, scene) {
        super(scene, x, y, 'hormiga');
        scene.add.existing(this);
        this.play('hormiga_caminar');
    }
}


class OrugaEnemy extends Enemy {
    constructor(x, y, scene) {
        super(scene, x, y, 'oruga');
        scene.add.existing(this);
        this.play('orugaWalk');
    }
}


class AvispaEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(x, y, scene) {
        super(scene, x, y, 'avispa');
        scene.add.existing(this);
        this.play('avispaLeft', true);
        this.flyPath = new Phaser.Curves.Ellipse(x, y, 100, 100);
        /*this.pathIndex es el grado de completitud de dicha trayetoria. 0 será el punto inicial de la trayectoria circular y 1 el punto final.*/
        this.pathIndex = 0;
        this.pathSpeed = 0.005;
        this.pathVector = new Phaser.Math.Vector2();
        /*    • La función getPoint recibe dos parámetros:
        ◦ El primero es el grado de completitud de la trayectoria (el path).
        ◦ El segundo es la variable (this.pathVector) en la que vamos a almacenar las coordenadas correspondientes a ese grado de completitud de la trayectoria.
        */
        this.flyPath.getPoint(0, this.pathVector);
        this.setPosition(this.pathVector.x, this.pathVector.y);
        /*this.path es variable que almacenará las diferentes trayectorias de la avispa (inicialmente dando vueltas, luego en línea recta hacia el player para atacarle y en línea recta hasta su posición original)*/
        this.path = this.flyPath;

        this.patrolCircle = new Phaser.Geom.Circle(0, 0, 256);
        this.attackPath = new Phaser.Curves.Line([0, 0, 0, 0]);

        this.on('animationcomplete', this.animationComplete, this);
        this.startPlace = new Phaser.Math.Vector2(this.pathVector.x, this.pathVector.y);
    }
    update(delta) {

        if (this.x < this.scene.player.x) {
            this.flipX = true;
        } else {
            this.flipX = false;
        }

        if (this.state === AvispaEnemy.VOLANDO) {
            this.checkPlayer();
        } else if (this.state === AvispaEnemy.PERSIGUIENDO) {
            this.persiguePlayer(delta);
        } else if (this.state === AvispaEnemy.VOLVIENDO) {
            this.pathIndex += this.pathSpeed * 2;
            this.path.getPoint(this.pathIndex, this.pathVector);
            this.setPosition(this.pathVector.x, this.pathVector.y);
            if (this.pathIndex >= 1) {
                this.continuaVolando();
            }
        }

    }

    continuaVolando() {
        this.state = AvispaEnemy.VOLANDO;
        this.path = this.flyPath;
        this.pathIndex = 0;
    }


    animationComplete(animation, frame, sprite) {
        if (animation.key === 'avispaAttack') {
            this.play('avispaLeft', true);
        }
    }

    returnHome() {
        this.attackPath.p0.set(this.x, this.y);
        this.attackPath.p1.set(this.startPlace.x, this.startPlace.y);
        this.pathIndex = 0;
        this.path.getPoint(this.pathIndex, this.pathVector);
        this.setPosition(this.pathVector.x, this.pathVector.y);
        this.state = AvispaEnemy.VOLVIENDO;
    }

    persiguePlayer(delta) {
        this.attackTime += delta;
        var player = this.scene.player;
        this.attackPath.p1.set(player.x, player.y);
        this.pathIndex += this.pathSpeed * 2;
        this.path.getPoint(this.pathIndex, this.pathVector);
        this.setPosition(this.pathVector.x, this.pathVector.y);

        if (this.scene.physics.overlap(this, player) && this.state === AvispaEnemy.PERSIGUIENDO) {
            this.play('avispaAttack', true);
            this.scene.playerGolpeadoPorAvispa();
            this.returnHome();
        }
    }

    checkPlayer() {

        /*Incrementamos pathIndex, que es el coeficiente que indica el grado de completitud de la trayectoria.*/
        this.pathIndex = Phaser.Math.Wrap(this.pathIndex + this.pathSpeed, 0, 1);
        /*Alimentamos la variable pathVector, que estará en función del grado de completitud de la trayectoria.*/
        this.flyPath.getPoint(this.pathIndex, this.pathVector);
        /*Modificamos la posición de la avispa en función de las coordenadas x e y del vector.*/
        this.setPosition(this.pathVector.x, this.pathVector.y);


        this.patrolCircle.x = this.x;
        this.patrolCircle.y = this.y;

        const player = this.scene.player;
        if (this.patrolCircle.contains(player.x, player.y)) {
            this.attackPath.p0.set(this.x, this.y);
            this.attackPath.p1.set(player.x, player.y);
            this.path = this.attackPath;
            this.pathIndex = 0;
            this.attackTime = 0;
            this.state = AvispaEnemy.PERSIGUIENDO;
        }


    }
}

AvispaEnemy.VOLANDO = 0;
AvispaEnemy.PERSIGUIENDO = 1;
AvispaEnemy.VOLVIENDO = 2;
class ComenzarScene extends Phaser.Scene {

    constructor() {
        super('ComenzarScene');
    }

    preload() {
        this.load.image('Start', '../img/Comenzar.png');
    }

    create() {
        this.add.sprite(480, 320, 'Start');
        this.input.on('pointerdown', () => this.volverAjugar())
    }
    volverAjugar() {
        this.scene.start('Escena')
    }

}


const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    scene: [ComenzarScene, Escena, FinScene, PerderScene],
    scale: {
        mode: Phaser.Scale.FIT
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 300,
            },
        },
    }
};

new Phaser.Game(config);