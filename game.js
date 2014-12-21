/*
"Jeff Forgot How To Platform"
by Calvin Atlan

Main Game Code
*/

//Game initialization
var game = new Phaser.Game(800,600, Phaser.AUTO, 'JFHTP', {preload: preload, create: create, update: update});

/*-----------------------------
Important variable declarations
------------------------------*/
var player;
var platforms;
var walls;
var cursors;
var button1; var button2;
winstate = 0;
losestate = 0;
punching = 0;
punchTimer = 0;
nmove = -1;
rpunch = 0;
movepos = 0;

/*-------------------
Main State Functions
-------------------*/

function preload() {

	game.load.image('sky','assets/sky.png');
	game.load.image('ground', 'assets/platform.png');
	game.load.image('wall', 'assets/wall.png');
	game.load.image('punch', 'assets/punch.png');
	game.load.image('jump', 'assets/jump.png');
	game.load.image('bit', 'assets/platform_break.png');
    game.load.spritesheet('dude','assets/dude.png',32,48);

}

function create() {

	//Add tileSprite background
	game.add.tileSprite(0, 0, 1600, 600, 'sky');

	//Set bounds for camera usage
	game.world.setBounds(0,0, 1600, 600);

	//Initialize Physics
	game.physics.startSystem(Phaser.Physics.ARCADE);

	levelInit();
	playerInit();
	controlInit();

}

function update(){
	
	//Player control code
	game.physics.arcade.collide(player, platforms);
	if (nmove != -1) playerAccel(2, 200);
	if (player.body.velocity.x > 0) player.animations.play('right');
	spaceKey.onDown.add(next_move, this);
	punch();
	win();
	if(player.y > game.world.height )lose();
	game.physics.arcade.overlap(player, walls, wall_break, null, this);


	//Camera Control Code
	follow_spr.body.velocity.x = 0;
 	if (cursors.left.isDown) follow_spr.body.velocity.x = -350;
    else if (cursors.right.isDown) follow_spr.body.velocity.x = 350;


    //Restart Level
	if (winstate == 1 || losestate == 1) spaceKey.onDown.add(restart,this);
	
}

/*----------------------
Level Creation Functions
-----------------------*/

//Creates the level (platforms and walls)
function levelInit(){

	//Create platforms
	platforms = game.add.group();

	platforms.enableBody = true;

	var ground = platforms.create(0, game.world.height - 128, 'ground');

	ground.body.immovable = true;

	ground = addPlatform(ground, 400, 250);
	ground = addPlatform(ground, 1000, 300);


	//Create Walls
	walls = game.add.group();
	walls.enableBody = true;

	var wall = walls.create(600, game.world.height - 425, 'wall');
	wall.immovable = true;
	wall.anchor.setTo(0.5,0.5);
	wall = walls.create(1200, game.world.height - 500, 'wall');
	wall.immovable = true;
	wall.anchor.setTo(0.5,0.5);


	//Wall break code
	emitter = game.add.emitter(0, 0, 100);

    emitter.makeParticles('bit');
    emitter.gravity = 200;

}

//Player creation
function playerInit(){

	player = game.add.sprite(10,game.world.height-200,'dude');
	player.anchor.setTo(0.5,0.5);

	game.physics.arcade.enable(player);

	player.body.gravity.y = 300;

	player.body.bounce.y = 0.2;

	player.animations.add('left', [0, 1, 2, 3], 10, true);
	player.animations.add('right', [5, 6, 7, 8], 10, true);

	player.frame = 4;

}

//Buttons, controls and camera object initialization
function controlInit(){

	//Buttons
	button1 = game.add.button(264, 264, 'jump', add_move, this);
	button2 = game.add.button(464,264, 'punch', add_move, this);

	//Create controls
	spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	cursors = game.input.keyboard.createCursorKeys();

	//Camera
	follow_spr = game.add.sprite(400, 0, null);
	game.physics.arcade.enable(follow_spr);

	game.camera.follow(follow_spr);

}

//Creates a platform x pixels from the left side of the world, and y pixels from the bottom of the world (to account for the y axis reversal convention)
function addPlatform(ground, x, y){

	ground = platforms.create(x, game.world.height - y, 'ground');
	ground.body.immovable = true;
	return ground;

}

/*---------------------------
Player controlling functions
----------------------------*/

//Adds x pixels/second to the velocity of the player per call until he reaches y pixels/second
function playerAccel(x, y){
	if (player.alive && player.body.velocity.x < y) player.body.velocity.x += x;
}

function jump(){
	if (player.alive && player.body.touching.down) player.body.velocity.y -= 300;
}

function punch(){

	if (punching == 0 && spaceKey.isDown && punchTimer == 0 && rpunch == 1){
		punching = 1; punchTimer = 20; player.anchor.setTo(0,0.5);
	}else if(punching == 1){
		player.scale.x+=.1;
		if (player.scale.x >= 1.5) punching = 2;
	}else if (punching == 2){
		player.scale.x-=.1;
		if (player.scale.x <= 1){
			player.scale.x = 1; punching = 0; player.anchor.setTo(0.5,0.5);
		}
	}
	if (punchTimer > 0) punchTimer--;

}

//Kills the wall the player ran into and moves the broken wall emitter to that position
function wall_break(player,walls){

	if(punching==0){
		lose();
	}else{	
		emitter.x = walls.x;
		emitter.y = walls.y;
		walls.kill();
		emitter.start(true,2000,null,20);
	}

}

/*-------------------------
Custom Algorithm Functions
-------------------------*/

function next_move(){

	if (nmove == -1){
		nmove = 0;
		game.camera.follow(player, Phaser.Camera.FOLLOW_PLATFORMER);
		button1.kill();
		button2.kill();
	}else if(nmove == 0){
		rpunch = 0;
		jump();
		nmove = (nmove+1)%2;
	}else{
		rpunch = 1;
		nmove = (nmove+1)%2;
	}

}

//Adds the selected move's icon to the bottom of the screen
function add_move(move){

	newmove = game.add.sprite(movepos*64,600-64,move.key);
	newmove.fixedToCamera = true;
	movepos++;

}

/*---------------------------
Win/Lose Condition Functions
---------------------------*/

function win(){

	if (player.x > game.world.width && winstate == 0){
		var text = "YOU WIN\n-\nCLICK TO START OVER";
		var style = {font: "60px Arial", fill: "#ff0044", align: "center"};
		var t = game.add.text(0,0,text,style);
		t.fixedToCamera = true;
		t.cameraOffset.setTo(60,200);
		winstate = 1;
		player.kill();
	}

}

function lose(){

	if (losestate == 0){
		var text = "YOU LOSE\n-\nCLICK TO START OVER";
		var style = {font: "60px Arial", fill: "#ff0044", align: "center"};
		var t = game.add.text(0,0,text,style);
		t.fixedToCamera = true;
		t.cameraOffset.setTo(60,200);
		losestate = 1;
		player.kill();
	}

}

function restart(){
	window.location.reload();
}