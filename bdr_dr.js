
// GLOBALS
// =======

var car;
var key_acc;
var key_left;
var key_right;
var px_red;
var px_green;
var px_blue;
var ctx;
var ctx_height;
var ctx_width;
var car_px;

var time = (Date.now()/1000).toFixed(0);

var now;
var fps;
var dt;

var TO_RADIANS = Math.PI/180;

var spacePressed = false;
var raindropTimer = null;
var snowflakeTimer = null;

// Arrays
var cloudArray = new Array();
var raindropArray = new Array();
var snowflakeArray = new Array();

// OBJECTS
// =======

//Cloud object
function objCloud(x_pos,y_pos,dx){
    this.x_pos = x_pos;
    this.y_pos = y_pos;
    this.dx = dx;
}
//Raindrop object
function objRaindrop(){
    this.x_pos = Math.round(Math.random() * ctx_width);
    this.y_pos = -10;
    this.dx = 4;
    this.speed = Math.round(Math.random() / 5) + 15;
    var rand = Math.random();
    this.img = rand < 0.33?image_raindrop1:rand<0.66?image_raindrop2:image_raindrop3;
}
// Snowflake object
function objSnowflake(){
    this.x_pos = Math.round(Math.random() * ctx_width);
    this.y_pos = -10;
    this.dx = 0;
    this.speed = Math.round(Math.random() / 5) + 3;
    this.radius = Math.random()*4+1;
}
//Car object
function objCar() {
	this.x_pos;
	this.y_pos;
    this.y_pos_old;
    this.acceleration;
    this.rotation;
    this.rotationStep;
    this.speed;
    this.speedDecay;
    this.maxSpeed;
    this.isMoving;
    this.engine_temp;
    this.explode;
    this.sprite_explode;
    this.outside;
    this.reset = function(){
        this.x_pos = 250;
        this.y_pos = 325;
        this.y_pos_old = this.y_pos;
        this.acceleration = 1.1;
        this.rotation = 0;
        this.speed = 0;
        this.speedDecay = 0.98;
        this.maxSpeed = 4;
        this.isMoving = false;
        this.engine_temp = 0;
        this.explode = false;
        this.sprite_explode = 0;
        this.outside = false;
    };
}
//Big data object
function objBD() {
    this.temp = 0;
    this.rain = false;
    this.snow = false;
    this.wind = 0;
    this.cloud = 0;
    this.id;
    this.icon;
    this.desc;
    this.lon;
    this.lat;
    this.name;
    this.sunrise;
    this.sunset;
}
//Game object
function objGame() {
    this.lapcount = 0;
    this.laptot = 2;
    this.oldTime;			
    this.newTime = 0;
    this.dTime = 0;
    this.totTime = 0;
    this.time = time;
    this.night = false;
    this.startlap = true;
    this.lapcheck = false;
    this.started = false;
    this.finished = false;
    this.reset = function(){
        this.lapcount = 0;
        this.oldTime;			
        this.newTime = 0;
        this.dTime = 0;
        this.totTime = 0;
        this.time = time;
        this.startlap = true;
        this.lapcheck = false;
        this.started = false;
        this.finished = false;
    };
}

// HELPER FUNCTIONS
// ================

function getPixel(x,y){
    return ctx.getImageData(0, 0, 1, 1);
}
function addRaindrop() {
    raindropArray[raindropArray.length] = new objRaindrop();
    if (raindropArray.length == 200) { 
        clearInterval(raindropTimer);
    }
}
function addSnowflake() {
    snowflakeArray[snowflakeArray.length] = new objSnowflake();
    if (snowflakeArray.length == 200) { 
        clearInterval(snowflakeTimer);
    }    
}
function createCloud(){
    var weight = bd.cloud*10;
    var ifCloud = Math.floor((Math.random()*(1100-weight))+1)
    if(ifCloud == 1){
        var cloud = new objCloud();
        cloud.x_pos = -image_cloud.width;
        cloud.y_pos = Math.floor((Math.random()*(ctx_height-image_cloud.height))+1);
        cloud.dx = Math.random();
        cloudArray.push(cloud);
    }   
}    
function checkCollision()
{    
    	// Check if car is outside the track
        if(px_red == 77 && px_green == 77 && px_blue == 77){
            return false;
        }else{
            return true;
        }
}
function checkBorders(){
        // Check if car hits the canvas borderStyle
        if((car.outside == false) && (car.x_pos <= 0 || car.x_pos >= ctx_width || car.y_pos <= 0 || car.y_pos >= ctx_height)){
            car.rotation += 180;
            car.outside = true;
            return true;
        }else{
            car.outside = false;
            return false;
        }
}
function lap(){
        // Check for lap
        if(car.y_pos_old >= 301 && car.y_pos <= 301 && car.x_pos > 203 && car.x_pos < 295){
            if(game.startlap){
                game.startlap=false;
            }else if(game.lapcheck){
                game.lapcount++;
                game.lapcheck = false;
                if(game.lapcount == game.laptot){
                    game.started = false;
                    game.finished = true;
                }
            }
        }
        if(car.y_pos_old <= 301 && car.y_pos >= 301 && car.x_pos > 706 && car.x_pos < 798){
            game.lapcheck = true;
        }
}
function explode(){
    if(car.engine_temp == 100){
        car.explode = true;
        car.sprite_explode = 1;
        game.started = false;
        game.finished = true;
    }
}
function engineTemp(accelerate){
    if(accelerate){
        //The warmer the temperature and the faster the speed, the faster the engine heats up when accelerating
        return ((0.02 + bd.temp/1000)*(car.speed/3))*dt;
    }else{
        //The colder the temperature, the faster the engine cools down when not accelerating
        return (-0.10 + bd.temp/1000)*dt;
    }
}
function sound() {
    if(car.sprite_explode == 2){
        sound_explosion.play();
    }
}



// GAME INITIALIZE FUNCTION
// ========================
		
function init()
{						
	//Get canvas references
	var canvas_track = document.getElementById("c_track");
	var canvas_water = document.getElementById("c_water");
	var canvas_car = document.getElementById("c_car");
	var canvas_cloud = document.getElementById("c_cloud");
    var canvas_rain = document.getElementById("c_rain");
	var canvas_score = document.getElementById("c_score");
    var canvas_night = document.getElementById("c_night");

    if(canvas_track.getContext && canvas_water.getContext && canvas_car.getContext && canvas_cloud.getContext && canvas_rain.getContext && canvas_score.getContext)
    {
        //Get canvas width/height (all canvas instances share the same width and height)
		ctx_width = canvas_track.width;
		ctx_height = canvas_track.height;
        
        //Get canvas contexts        
		ctx_track = canvas_track.getContext("2d");
        ctx_water = canvas_water.getContext("2d");
        ctx_car = canvas_car.getContext("2d");
        ctx_cloud = canvas_cloud.getContext("2d");
        ctx_rain = canvas_rain.getContext("2d");
        ctx_night = canvas_night.getContext("2d");
        ctx_score = canvas_score.getContext("2d");
        
		// Load images                
        image_car = new Image();                    //Car           
        image_car.src = "img/car.png";
        image_car_explode = new Image();            //Car explosion
		image_car_explode.src = "img/explosion_50FR.png";	
        image_cloud = new Image();                  //Cloud
        image_cloud.src = "img/cloud.png";
        image_water_big = new Image();              //Water
        image_water_big.src = "img/cool_water_texture.jpg";
        image_snow = new Image();                   //Snow
        image_snow.src = "img/snow.png";
        image_grass_big = new Image();              //Grass
        image_grass_big.src = "img/grass.png";
        image_track = new Image();                  //Grass
        image_track.src = "img/192-racetrack-v5_trans.png";
        image_icon = new Image();                   //Weather icon
        image_title_chinese = new Image();          //Game title in Chinese
        image_title_chinese.src = "img/title_chinese.png";
        image_raindrop1 = new Image();              //Rain drop 1
        image_raindrop1.src = "img/raindrop1.png";
        image_raindrop2 = new Image();              //Rain drop 2
        image_raindrop2.src = "img/raindrop2.png";
        image_raindrop3 = new Image();              //Rain drop 3
        image_raindrop3.src = "img/raindrop3.png";
 
        // Load sounds
		sound_explosion =  document.getElementById("soundExplosion");
        sound_music =  document.getElementById("soundMusic");

 
        // Create game objects
        car = new objCar();
        car.reset();
        bd = new objBD();
        game = new objGame();
                 
        // Get location and weather information
        getLocation();
                     
        // Reset keys
        resetKeys();

		// Set key event listener callback functions
		window.onkeydown = keypressed;	
		window.onkeyup = keyreleased;
    
        // Play game background music
        sound_music.play();
        
        // Start game loop                            
		requestAnimationFrame(gameloop);        
    }
}

// USER INPUT FUNCTIONS
// ====================

function resetKeys()
{
    key_acc = false;
    key_left = false;
    key_right = false;
    
    key_one = false;
    key_two = false;
    key_three = false;
    key_four = false;
    key_five = false;
    key_six = false;
    key_seven = false;
    key_eight = false;
    key_nine = false;
    
}
function keypressed(e)
{			
	// left key (turn left)
	if(e.keyCode == 37){
        key_left = true;
	}			
	// right key (turn right)
	if(e.keyCode == 39){
        key_right = true;
	}		
	// space key (accelerate)
	if(e.keyCode == 32){
        key_acc = true;
	}
	// enter (start)
	if(e.keyCode == 13){
        if(!game.started){
            car.reset();
            game.reset();
            game.finished = false;
            game.started = true;
            game.newTime = Date.now();
        }
	}
    // 1
	if(e.keyCode == 49 && !game.started){game.laptot = 1;}
    // 2
	if(e.keyCode == 50 && !game.started){game.laptot = 2;}
    // 3
	if(e.keyCode == 51 && !game.started){game.laptot = 3;}
    // 4
	if(e.keyCode == 52 && !game.started){game.laptot = 4;}
    // 5
	if(e.keyCode == 53 && !game.started){game.laptot = 5;}
    // 6
	if(e.keyCode == 54 && !game.started){game.laptot = 6;}
    // 7
	if(e.keyCode == 55 && !game.started){game.laptot = 7;}
    // 8
	if(e.keyCode == 56 && !game.started){game.laptot = 8;}
    // 9
	if(e.keyCode == 57 && !game.started){game.laptot = 9;}   
}             
function keyreleased(e)
{			
	// left key (turn left)
	if(e.keyCode == 37){
        key_left = false;
	}			
	// right key (turn right)
	if(e.keyCode == 39){
        key_right = false;
	}		
	// space key (accelerate)
	if(e.keyCode == 32){
        key_acc = false;
	}
}

//BIG DATA FETCHING/PARSING FUNCTIONS
//===================================

//Get location information
function getLocation(){
    jQuery.support.cors = true;
    $.ajax({
        dataType: "json",
        url: "https://freegeoip.net/json/",
        success: getWeather
    });
}
//Get weather information
function getWeather(data){
    bd.lat = data.latitude?data.latitude:0;
    bd.lon = data.longitude?data.longitude:0;
    //Get weather information using AJAX
    var weather_url = 'https://api.openweathermap.org/data/2.5/weather?lat=' + bd.lat + '&lon=' + bd.lon + '&units=metric&APPID=25270c8ee8ecf2a3abea1e0ada20e649';
    console.log("Weather URL: " + weather_url);
    jQuery.support.cors = true;
    $.ajax({
        dataType: "json",
        url: weather_url,
        success: parseWeather
    });
}
//Weather parser function
function parseWeather(data){
        var json = JSON.stringify(data);
        if(json){console.log("Response: " + json);}
        if(data.weather[0].description){bd.desc=data.weather[0].description;console.log("Description: " + data.weather[0].description);}
        if(data.weather[0].id){bd.id=data.weather[0].id;console.log("ID: " + data.weather[0].id);}
        if(data.weather[0].icon){bd.icon=data.weather[0].icon;console.log("Icon: " + data.weather[0].icon);}
        if(data.name){bd.name=data.name;console.log("Name: " + data.name);}
        if(data.main.temp){bd.temp=(data.main.temp).toFixed(0);console.log("Temp: " + data.main.temp);}
        if(data['clouds']['all']){bd.cloud=data['clouds']['all'];console.log("Clouds: " + data['clouds']['all']);}
        if(data.sys.sunrise){bd.sunrise=data.sys.sunrise;console.log("Sunrise: " + data.sys.sunrise);}
        if(data.sys.sunset){bd.sunset=data.sys.sunset;console.log("Sunset: " + data.sys.sunset);}
        if((game.time < bd.sunrise ) || (game.time > bd.sunset)){game.night=true;}
        if(data.dt){
            console.log("Record time: " + data.dt);
            console.log("Current time: " + game.time + " Diff: " + (game.time - data.dt));
            console.log("Night: " + game.night);
        }
        if(data.wind.speed){console.log("Wind speed: " + data.wind.speed);}
        if(data.wind.deg){console.log("Wind direction: " + data.wind.deg);}
                  
        bd.rain = true; //For testing
        bd.snow = false; //For testing
        var temp_icon = (bd.icon).substr(0,2);
        if(bd.rain == true || temp_icon == "09" || temp_icon == "10" || temp_icon == "11"){
            bd.rain = true;
            car.rotationStep = 1.5;
            ctx_water.globalAlpha = 0.5;
            ctx_track.drawImage(image_grass_big, 0,0,ctx_width,ctx_height);
            ctx_water.drawImage(image_water_big, 0,0,ctx_width,ctx_height);            
            raindropTimer = setInterval(addRaindrop, 200);
        }else if(bd.snow == true || temp_icon == "13"){
            bd.snow = true;
            car.rotationStep = 1;
            ctx_water.globalAlpha = 0.5;
            ctx_water.drawImage(image_water_big, 0,0,ctx_width,ctx_height);            
            snowflakeTimer = setInterval(addSnowflake, 200);
        }else{
            car.rotationStep = 4;
            ctx_track.drawImage(image_grass_big, 0,0,ctx_width,ctx_height);
        }
        drawTrack();
}

// PAINT FUNCTIONS
// ===============

/**
 * @function paint */
/**
 * Clear and redrew each canvas that is updated for every
 * game loop iteration.
 *
 */
function paint() {
	ctx_car.clearRect(0,0,ctx_width,ctx_height);
    ctx_cloud.clearRect(0,0,ctx_width,ctx_height);
    ctx_rain.clearRect(0, 0, ctx_width,ctx_height);
    ctx_night.clearRect(0,0,ctx_width,ctx_height);
    ctx_score.clearRect(0,0,ctx_width,ctx_height);
	drawCar();
    if(bd.snow){drawMarks();}
    game.night = false //For testing
    if(game.night){drawDark();}
    if(bd.rain){drawRaindrop();}
    if(bd.snow){drawSnowflake();}
    if(bd.cloud > 0){drawCloud();}
    drawScore();
}
/**
 * Draw the race track. Only called once per game page load
 *
 */
function drawTrack() {    
    ctx_track.drawImage(image_track, 23, 575, 157,156, 200,50,157,156);
    ctx_track.drawImage(image_track, 348, 791, 144,98, 357,50,144,98);
    ctx_track.drawImage(image_track, 348, 791, 144,98, 501,50,144,98);
    ctx_track.drawImage(image_track, 186, 575, 157,156, 645,50,157,156);
    ctx_track.drawImage(image_track, 359, 588, 98,144, 704,206,98,144);
    ctx_track.drawImage(image_track, 359, 588, 98,144, 704,350,98,144);
    ctx_track.drawImage(image_track, 186, 738, 157,156, 645,494,157,156);
    ctx_track.drawImage(image_track, 348, 791, 144,98, 357,553,144,98);
    ctx_track.drawImage(image_track, 348, 791, 144,98, 501,553,144,98);
    ctx_track.drawImage(image_track, 23, 738, 157,156, 200,494,157,156);
    ctx_track.drawImage(image_track, 359, 588, 98,144, 200,350,98,144);
    ctx_track.drawImage(image_track, 359, 588, 98,144, 200,206,98,144);
    drawFinishLine();    
}
/**
 * Draw finish line. Once called once per game page localName
 *
 * The finish line is drawn on a separate canvas, layered on top offscreenBuffering
 * the race track canvas, in order to not interfer with the collision detection function.
 * The speed of the car shall not be impacted when crossing the finish line.
 *
 */
function drawFinishLine() {
    ctx_water.beginPath();
    ctx_water.rect(204, 300, 90, 3);
    ctx_water.fillStyle = 'white';
    ctx_water.fill();
    ctx_water.beginPath();
    ctx_water.rect(707, 300, 90, 3);
    ctx_water.fillStyle = 'white';
    ctx_water.fill();

}
/**
 * Draws wheel marks. 
 *
 */
function drawMarks(){
    ctx_water.save();
    ctx_water.translate(car.x_pos, car.y_pos);
    ctx_water.rotate(car.rotation * TO_RADIANS);
    ctx_water.fillRect(-((image_car.width/2)-4), -(image_car.height/2),1,1);
    ctx_water.fillRect(((image_car.width/2)-4), -(image_car.height/2),1,1);
    ctx_water.restore();
}
/**
 * Draws each cloud in the cloud array. 
 *
 */
function drawCloud() {   
    for(var i=cloudArray.length-1;i>=0;i--)
	{					
		cloudArray[i].x_pos += (cloudArray[i].dx)*dt;
        if(cloudArray[i].x_pos > ctx_width){
            cloudArray.splice(i,1);
        }else{   
            ctx_cloud.drawImage(image_cloud, cloudArray[i].x_pos, cloudArray[i].y_pos);
        }
    }
}
/**
 * Draws a semi-transparent dark box, simulating darkness. A circle around the car
 * is cleared, in order to simulate the car headlights.
 *
 */
function drawDark(){
    ctx_night.save();
    ctx_night.globalAlpha = 0.8;
    ctx_night.fillStyle = 'black';
    ctx_night.beginPath();
    ctx_night.rect(0, 0, ctx_width, ctx_height);
    ctx_night.fillStyle = 'black';
    ctx_night.fill();
    if(car.sprite_explode < 50){
        ctx_night.beginPath();
        ctx_night.arc(car.x_pos, car.y_pos, 100, 0, 2 * Math.PI, false);
        ctx_night.fill();
        ctx_night.clip();
        ctx_night.clearRect(0, 0, ctx_width, ctx_height);
        ctx_night.restore();
    }
}
/**
 * Prints the current lap, the speed, the engine temperature, weather information
 * and additional text in the beginning and end of the game.
 *
 */
function drawScore(){    
	ctx_score.font = "30px Arial";
	ctx_score.fillStyle = "#FFFFFF";
	ctx_score.fillText("SPEED: " + car.speed.toFixed(1),10,50);
    ctx_score.fillText("ENGINE TEMP: " + car.engine_temp.toFixed(0),10,80);
    ctx_score.font = "20px Arial";
    ctx_score.fillText("FPS: " + fps.toFixed(0),10,680);
    
    //Car engine temp
    ctx_score.beginPath();
    ctx_score.rect(10, 110, car.engine_temp*1.5, 20);
    if(car.engine_temp < 70){
        ctx_score.fillStyle = 'yellow';
    }else if(car.engine_temp > 90){
        ctx_score.fillStyle = 'red';
    }else{
        ctx_score.fillStyle = 'orange';
    }
    ctx_score.fill();
    
    //Weather information
	ctx_score.font = "30px Arial";
    ctx_score.textAlign = "center";
	ctx_score.fillStyle = "#FFFFFF";
	ctx_score.fillText("WEATHER",900,50);
    if(bd.name){
        ctx_score.font = "20px Arial";
	    ctx_score.fillStyle = "#FFFFFF";
        ctx_score.fillText(bd.name,900,70);  
    }
    if(bd.icon){
        var icon_url = "https://openweathermap.org/img/w/09d.png"; //For testing
        //var icon_url = "https://openweathermap.org/img/w/" + bd.icon + ".png";
        image_icon.src = icon_url;
        ctx_score.drawImage(image_icon,850,55,100,100);
    }

    ctx_score.font = "20px Arial";
    ctx_score.fillStyle = "#FFFFFF";
    ctx_score.fillText("Temp (C): " + bd.temp,900,175);        
    ctx_score.fillText("Cloud (%): " + bd.cloud,900,200);
    
    //Lap counter
    ctx_score.font = "90px Arial";
    ctx_score.fillStyle = "#FFFFFF";
    ctx_score.fillText("LAP: " + game.lapcount + "/" + game.laptot,500,350);        

    //Race timer
    ctx_score.font = "60px Arial";
    ctx_score.fillStyle = "#FFFFFF";
    ctx_score.fillText("TIME: " + (game.totTime/1000).toFixed(1),500,500);        
    
    //Start text
    if(!game.started){
        ctx_score.drawImage(image_title_chinese,205,160,600,100);
        ctx_score.font = "40px Arial";
        ctx_score.fillStyle = "#0000FF";
        ctx_score.fillText("PRESS ENTER TO START",500,600);
        ctx_score.font = "20px Arial";        
        ctx_score.fillText("LEFT ARROW: TURN LEFT     RIGHT ARROW: TURN RIGHT     SPACE: ACCELERATE     SET LAPS: 1-9",500,650);
    }
    //End text
    if(game.finished){
        ctx_score.font = "40px Arial";
        ctx_score.fillStyle = "#0000FF";
        if(car.explode){
            ctx_score.fillText("GAME OVER!",500,550);
        }else{
            ctx_score.fillText("FINISHED!",500,550);        
        }
    }
    ctx_score.textAlign = "left";    
}
/**
 * Draws the car.
 *
 */
function drawCar() {
    car_px = ctx_track.getImageData(car.x_pos, car.y_pos, 1, 1).data;
    px_red = car_px[0];
    px_green = car_px[1];
    px_blue = car_px[2]; 
    if(car.sprite_explode == 0){
        ctx_car.save();
        ctx_car.translate(car.x_pos, car.y_pos);
        ctx_car.rotate(car.rotation * TO_RADIANS);
        ctx_car.drawImage(image_car, -(image_car.width/2), -(image_car.height/2));
        ctx_car.restore();
    }else if(car.sprite_explode < 50){
        ctx_car.drawImage(image_car_explode,car.sprite_explode*81,0,81,123,car.x_pos-40, car.y_pos-40,80,80);				
		car.sprite_explode += 1;
    }
}
/**
 * Draws each raindrop in the raindrop array
 *
 */
function drawRaindrop() {
    for (var i = 0; i < raindropArray.length; i++) {
        ctx_rain.drawImage(raindropArray[i].img, raindropArray[i].x_pos, raindropArray[i].y_pos);
    }
}
/**
 * Draws each snowflake in the snowflake array
 *
 */
function drawSnowflake() {
    for (var i = 0; i < snowflakeArray.length; i++) {
        ctx_rain.fillStyle = "rgba(255, 255, 255, 0.8)";
		ctx_rain.beginPath();
        ctx_rain.moveTo(snowflakeArray[i].x_pos,snowflakeArray[i].y_pos);
        ctx_rain.arc(snowflakeArray[i].x_pos,snowflakeArray[i].y_pos, snowflakeArray[i].radius, 0, Math.PI*2, true);
		ctx_rain.fill();
    }
}


// GAME MAIN FUNCTIONS
// ===================

function step() {
		 
        // Automatically reduce speed
		if (car.speed < 0.4){
			car.speed = 0;
		}else if (checkCollision()){
			car.speed *= 0.95;
		}else {                       
            car.speed *= car.speedDecay;
        }

        // Key presses
        if(car.explode){
            car.engine_temp = 0;
        }else if(key_acc && !checkCollision() && !game.finished && game.started){                  
            if(car.speed == 0){
                car.speed = 0.4;
            }else if(car.speed < car.maxSpeed){
                if(bd.rain){
                    car.speed *= 1.05;
                }else if(bd.snow){
                    car.speed *= 1.03;
                }else{
                    car.speed *= 1.1;
                }
            }
            if(car.speed > car.maxSpeed){
                car.speed = car.maxSpeed;
            }
            car.engine_temp += engineTemp(true);
            if(car.engine_temp > 100){car.engine_temp = 100;}
        }else if(key_acc && checkCollision() && !game.finished && game.started){
            if(car.speed < 0.5){
                car.speed = 0.5;
            }
            car.engine_temp += engineTemp(true);
            if(car.engine_temp > 100){car.engine_temp = 100;}
        }else{
            car.engine_temp += engineTemp(false);
            if(car.engine_temp < 0){car.engine_temp = 0;}
        }   
        
        if(key_left && car.speed > 0.4){
			car.rotation -= car.rotationStep * (car.speed/car.maxSpeed);
		}
        if(key_right && car.speed > 0.4){
			car.rotation += car.rotationStep * (car.speed/car.maxSpeed);
		}
 
        // Update car position
		car.x_pos += (Math.sin(car.rotation * TO_RADIANS) * car.speed)*dt;
        car.y_pos_old = car.y_pos;
		car.y_pos += (Math.cos(car.rotation * TO_RADIANS) * car.speed * -1)*dt;
        
        // Update raindrop position
        for (var i = 0; i < raindropArray.length; i++) {
            if (raindropArray[i].y_pos < ctx_height) {
                raindropArray[i].y_pos += (raindropArray[i].speed)*dt;
                if (raindropArray[i].y_pos > ctx_height){
                    raindropArray[i].y_pos = -1;
                }

                raindropArray[i].x_pos += raindropArray[i].dx;
                if (raindropArray[i].x_pos > ctx_width){
                    raindropArray[i].x_pos = 0;
                }
            }
        }

        // Update snowflake position
        for (var i = 0; i < snowflakeArray.length; i++) {
            if (snowflakeArray[i].y_pos < ctx_height) {
                snowflakeArray[i].y_pos += (snowflakeArray[i].speed)*dt;
                if (snowflakeArray[i].y_pos > ctx_height){
                    snowflakeArray[i].y_pos = -1;
                }
                snowflakeArray[i].x_pos += snowflakeArray[i].dx;
                if (snowflakeArray[i].x_pos > ctx_width){
                    snowflakeArray[i].x_pos = 0;
                }
            }
        }

        // Check for new cloud
        if(bd.cloud > 0){createCloud();}
}	
function gameloop()
{
	// Calculate FPS and delta time
	now = new Date().getTime();
	if(game.oldTime){
		fps = 1000 / (now - game.oldTime);  // Frames per second
		dt = (25/fps);                      // Same speed with different frame rates
	}else{
        fps = 1;
		dt = 1;
	}
	game.oldTime = now;
            
    if(game.started && !game.finished)
    {
        game.oldTime = game.newTime;
        game.newTime = Date.now();
        game.dTime = game.newTime - game.oldTime;
        game.totTime += game.dTime;
    }
    
    step();
    paint();
    sound();
    checkCollision();
    checkBorders();
    explode();
    lap();

	requestAnimationFrame(gameloop);
}

onload=init;