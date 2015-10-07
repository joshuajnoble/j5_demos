
var express = require('express')
var app = express()
var http = require('http').Server(app);
var request = require('request');
var pixel = require("node-pixel");
var io = require('socket.io')(http);

// this is the neopixel strip
var strip;
var stripReady = false;

// registers for theDRC2605
var DRV2605_ADDR = 0x5A;

var DRV2605_REG_STATUS = 0x00;
var DRV2605_REG_MODE = 0x01;
var DRV2605_MODE_INTTRIG  = 0x00;
var DRV2605_MODE_EXTTRIGEDGE  = 0x01;
var DRV2605_MODE_EXTTRIGLVL  = 0x02;
var DRV2605_MODE_PWMANALOG  = 0x03;
var DRV2605_MODE_AUDIOVIBE  = 0x04;
var DRV2605_MODE_REALTIME  = 0x05;
var DRV2605_MODE_DIAGNOS  = 0x06;
var DRV2605_MODE_AUTOCAL  = 0x07;

var DRV2605_REG_RTPIN = 0x02;
var DRV2605_REG_LIBRARY = 0x03;
var DRV2605_REG_WAVESEQ1 = 0x04;
var DRV2605_REG_WAVESEQ2 = 0x05;
var DRV2605_REG_WAVESEQ3 = 0x06;
var DRV2605_REG_WAVESEQ4 = 0x07;
var DRV2605_REG_WAVESEQ5 = 0x08;
var DRV2605_REG_WAVESEQ6 = 0x09;
var DRV2605_REG_WAVESEQ7 = 0x0A;
var DRV2605_REG_WAVESEQ8 = 0x0B;

var DRV2605_REG_GO = 0x0C;
var DRV2605_REG_OVERDRIVE = 0x0D;
var DRV2605_REG_SUSTAINPOS = 0x0E;
var DRV2605_REG_SUSTAINNEG = 0x0F;
var DRV2605_REG_BREAK = 0x10;
var DRV2605_REG_AUDIOCTRL = 0x11;
var DRV2605_REG_AUDIOLVL = 0x12;
var DRV2605_REG_AUDIOMAX = 0x13;
var DRV2605_REG_RATEDV = 0x16;
var DRV2605_REG_CLAMPV = 0x17;
var DRV2605_REG_AUTOCALCOMP = 0x18;
var DRV2605_REG_AUTOCALEMP = 0x19;
var DRV2605_REG_FEEDBACK = 0x1A;
var DRV2605_REG_CONTROL1 = 0x1B;
var DRV2605_REG_CONTROL2 = 0x1C;
var DRV2605_REG_CONTROL3 = 0x1D;
var DRV2605_REG_CONTROL4 = 0x1E;
var DRV2605_REG_VBAT = 0x21;
var DRV2605_REG_LRARESON = 0x22;

app.use(express.static(__dirname));

/// arduino connection
var five = require("johnny-five");
var board = new five.Board();

var led3Color;

var boardReady = false;

// socket handler so that when our webpages send information
// we can handle it somewhere
io.on('connection', function(socket) {
	console.log("connected");
	// handle all the arduino messages
	socket.on('led_slider', function(data) {
		if(boardReady)
		{
		  // Create a standard `led` component instance
		  // var led = new five.Led(parseInt(data.id));

		  // led.pulse(data.val);
		  // led.stop();

		  board.digitalWrite(parseInt(data.id), 1);
		  board.wait(data.val, function(){
		  	 board.digitalWrite(parseInt(data.id), 0);
		  });
		}
	});

	socket.on('start_haptic', function(data)
	{
		if(boardReady)
		{

			board.i2cConfig();

		    board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_MODE, 0x00); // out of standby
 
			board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_RTPIN, 0x00); // no real-time-playback

			board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_WAVESEQ1, 1); // strong click
			board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_WAVESEQ2, 0);

			board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_OVERDRIVE, 0); // no overdrive

			board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_SUSTAINPOS, 0);
			board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_SUSTAINNEG, 0);
			board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_BREAK, 0);
			board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_AUDIOMAX, 0x64);
		}
	});

	socket.on('set_haptic', function(data) {
		if(boardReady)
		{

			console.log(data);

			// get ready 
			board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_MODE, DRV2605_MODE_INTTRIG);

			if(data.type == "erm")
			{
				board.i2cRead(DRV2605_ADDR, DRV2605_REG_FEEDBACK, 1, function(bytes) {
					board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_FEEDBACK, bytes & 0x7F);
					// data needs to have a library and some waves
				    board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_LIBRARY, data.library);

				    for( var wave in data.waves )
				    {
				    	board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_WAVESEQ1+wave.slot, wave.form);
				    }
				});
				
			}
			else
			{
				board.i2cRead(DRV2605_ADDR, DRV2605_REG_FEEDBACK, 1, function(bytes) {
					board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_FEEDBACK, bytes | 0x80);
					// data needs to have a library and some waves
				    board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_LIBRARY, data.library);

				    for( var wave in data.waves )
				    {
				    	board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_WAVESEQ1+wave.slot, wave.form);
				    }
				});
			}

		    
		}
	});

	socket.on('trigger_haptic', function(data) {
		board.i2cWriteReg(DRV2605_ADDR, DRV2605_REG_GO, 1);
	});

	socket.on('neopixel_start', function(){
		strip = new pixel.Strip({
	        data: 6,
	        length: 4,
	        firmata: board,
	        controller: "FIRMATA",
	    });

	    strip.on("ready", function() {
	        // do stuff with the strip here.
	        stripReady = true;
	    });
	});

	socket.on('neopixel_start', function(){
		if(stripReady)
		{
			
		}
	});

	socket.on('set_vibrate', function(data) {
		console.log(data);

		var i = 0;

		function loop(i, d){
			if(d[i].hasOwnProperty('duration'))
			{
				board.digitalWrite(parseInt(d[i].pin), ((d[i].on)?1:0) );
			    setTimeout(function() {
			        if (i < d.length-1) {
			        	loop(i + 1, d);
			        }
			    }, d[i].duration);
			}
		}

		loop(0, data);

	});


});


board.on("ready", function() {

  boardReady = true;

});


http.listen(8000,  function() {
	console.log(" listening ");
});

