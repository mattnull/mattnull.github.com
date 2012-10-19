/**
 * Scrubber UI Component
 * @author Matt Null -- hello@mattnull.com
 * Class is dependent on jQuery and RaphaelJS
 */
/*global Raphael:true*/
(function() {
    if (Raphael.vml) {
        Raphael.el.strokeLinearGradient = function() {
            // not supporting VML yet
            return this; // maintain chainability
        };
    } else {
        var setAttr = function(el, attr) {
            var key;
            if (attr) {
                for (key in attr) {
                    if (attr.hasOwnProperty(key)) {
                        el.setAttribute(key, attr[key]);
                    }
                }
            } else {
                return document.createElementNS("http://www.w3.org/2000/svg", el);
            }

            return null;
        };

        var defLinearGrad = function(defId, stops) {
            var def = setAttr("linearGradient");
            var i, l;
            def.id = defId;

            for (i = 0, l = stops.length; i < l; i += 1) {
                var stopEle = setAttr("stop");
                var stop = stops[i];
                setAttr(stopEle, stop);

                def.appendChild(stopEle);
            }

            return def;
        };

        Raphael.el.strokeLinearGradient = function(defId, width, stops) {

            if (stops) {
                this.paper.defs.appendChild(defLinearGrad(defId, stops));
            }

            setAttr(this.node, {
                "stroke": "url(#" + defId + ")",
                "stroke-width": width
            });

            return this; // maintain chainability
        };

        Raphael.st.strokeLinearGradient = function(defId, width, stops) {
            return this.forEach(function(el) {
                el.strokeLinearGradient(defId, width, stops);
            });
        };

        Raphael.fn.defineLinearGradient = function(defId, stops) {

            this.defs.appendChild(defLinearGrad(defId, stops));
        };
    }
}());

var Scrubber = function(params){
	
	var config = {
		containerID : 'scrubber-container',
		canvasWidth : 300,
		canvasHeight : 300,
		innerRadius : 95,
		unreadBarColor : '#9E00FD',
		readBarColor : '#D300EB',
		trackColor : '#FFFFFF',
		strokeWidth : 60,
		trackWidth : 65,
		innerCircleBackground : 'center-bg.png',
		textOffset : 15,
		startTime : (new Date()).getTime()
	};

	this.config = $.extend({}, config, params);

	this.months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	var self = this;

	this.R = R = this.config.innerRadius;
	this.paper = Raphael("scrubber-container", this.config.canvasWidth, this.config.canvasHeight);
	// this.paper.defineLinearGradient("grad1", [{
	//     "id": "s1",
	//     "offset": "0",
	//     "style": "stop-color:#fff;stop-opacity:0.8;"},
	// {
	//     "id": "s2",
	//     "offset": "1",
	//     "style": "stop-color:#fff;stop-opacity:0;"
	// }]);

	this.selector = '#'+ this.config.containerID;
	var canvasPosition = $(this.selector + ' svg').offset();
    this.centerX = canvasPosition.left + (this.config.canvasWidth / 2);
	this.centerY = canvasPosition.top + (this.config.canvasHeight / 2);
   
    var d = new Date(this.config.startTime);
    this.day= d.getDate();
  	this.month = d.getMonth();
    this.year = d.getFullYear();
    this.hours = d.getHours();
    this.minutes = d.getMinutes();
    this.lastVal = 0;

	this.paper.customAttributes.arc = function (value, total, R) {
        var alpha = value == 360 ? 359 : 360 / total * value,
            a = (90 - alpha) * Math.PI / 180,
            x = (self.config.canvasWidth / 2) + R * Math.cos(a),
            y = (self.config.canvasHeight / 2) - R * Math.sin(a),
            path;

		path = [["M", self.config.canvasWidth / 2, self.config.canvasHeight / 2 - R], ["A", R, R, 0, +(alpha > 180), 1, x, y]];	

        return {path: path};
    };

    this.drawInnerCircle();
    this.drawTrack();
    this.drawUnreadBar(90);
    this.drawReadBar(45);
    this.drawTime();
    this.drawDate();
    
    this.attachEvents();
};

Scrubber.prototype.attachEvents = function(){
	var self = this;

    if(this.isTouchDevice()){
    	var handleTouchMove = function(e){
    		e.preventDefault();
		    var touch = e.touches[0];
		    var x = touch.pageX;
		    var y = touch.pageY;
		    self.scrub(x, y);
		    self.trackVelocity(x, y);
    	};

		document.getElementById('track').addEventListener('touchmove', handleTouchMove, false);
		document.getElementById('readbar').addEventListener('touchmove', handleTouchMove, false);
		document.getElementById('unreadbar').addEventListener('touchmove', handleTouchMove, false);
	}
	else{
		var handleDrag = function(dx, dy, x, y, e){
		   	self.scrub(x, y);
		    self.trackVelocity(x, y);
		};

		//set the drag event for each path object
		this.paper.set(this.track, this.unreadBar, this.readBar).drag(handleDrag);
	}

	$(this.selector + ' text').on('click', function(){
		var el = $(this);
		if(el.attr('minimized')){
			el.removeAttr('minimized');
			self.maximize();
		}
		else{
			el.attr('minimized', true);
			self.minimize();
		}
	});
};

Scrubber.prototype.drawInnerCircle = function(){
	console.log('CIRCLE',this.config)
	
	var background = this.paper.image(this.config.innerCircleBackground, this.config.trackWidth + 17, this.config.trackWidth + 17, this.config.canvasWidth / 2 - 15, this.config.canvasHeight / 2 - 15);
	// track.node.setAttribute("class", "dropshadow");
};

Scrubber.prototype.drawTrack = function(){

	this.track = this.paper.path().attr({
    	'stroke': this.config.trackColor, 
    	'stroke-width': this.config.trackWidth, 
    	'stroke-linecap' : 'round',
    	arc: [360, 360, this.R]
    });

	this.trackGlow = this.track.glow({
		color: "#fff",
		opacity: 1,
		width: 20
	});

    this.track.node.id = "track";
    
    console.log(this.track)

	// track.node.setAttribute("class", "dropshadow");
};

Scrubber.prototype.drawReadBar = function(angle){


   	this.readBar = this.paper.path().attr({
   		'stroke': this.config.readBarColor, 
   		'stroke-width': this.config.strokeWidth, 
   		'stroke-linecap' : 'round',
   		arc: [angle, 360, this.R]
   	});
   	/** this was an attempt at the fade effect **/
   	// var hider = this.paper.path().attr({
   	// 	'stroke': this.config.readBarColor, 
   	// 	'stroke-width': this.config.strokeWidth, 
   	// 	'stroke-linecap' : 'round',
   	// 	arc : [angle, 360, this.R]
   	// }).strokeLinearGradient("grad1", this.config.strokeWidth);
   	this.readBar.node.id = "read";
}

Scrubber.prototype.drawUnreadBar = function(angle){

    this.unreadBar = this.paper.path().attr({
    	'stroke': this.config.unreadBarColor, 
    	'stroke-width': this.config.strokeWidth, 
    	'stroke-linecap' : 'round'
    }).animate({arc: [angle, 360, this.R]}); 

   	this.unreadBar.node.id = "unread";
};

Scrubber.prototype.isTouchDevice = function(){
	var el = document.createElement('div');
	el.setAttribute('ongesturestart', 'return;');
	return typeof el.ongesturestart === "function";
};

Scrubber.prototype.drawDate = function(){

   this.date = this.paper.text(this.config.canvasWidth / 2, (this.config.canvasHeight / 2) - this.config.textOffset, this.day + ' '+ this.months[this.month] + ' '+ this.year)
    .attr({
    	'fill' : '#ffffff',
    	'font-size' : '12px',
    	'cursor' : 'pointer'
    });

};

Scrubber.prototype.drawTime = function(){
	var min = this.minutes;
    var hr = this.hours;

    if(this.minutes < 10){
    	min = '0' + this.minutes;
    }
    if(this.hours < 10){
    	hr = '0' + this.hours;
    }

    this.time = this.paper.text(this.config.canvasWidth / 2, (this.config.canvasHeight / 2) + this.config.textOffset, hr + ':' + min).attr({
    	'fill' : '#ffffff',
    	'font-size' : '38px',
    	'cursor' : 'pointer'
    });
};

Scrubber.prototype.trackVelocity = function(x, y){
	var t = (new Date()).getTime();
	var velocity = this.velocity
	var lastX = this.lastX;
	var lastTime = this.lastTime;

	if(lastX > 0){
		velocity =  (x - lastX) / (t - lastTime);
	}

	this.lastX = x;
	this.lastTime = t;
	this.velocity = velocity < 0 ? Math.floor(-velocity * 100) : Math.floor(velocity * 100);
	console.log(velocity)
	//FOR DEMO ~~~~~~~~~~~~~~~~~~
	$('#velocity').text(this.velocity);
	return velocity;
};

Scrubber.prototype.updateTime = function(){
	var min = this.minutes;
	var hr = this.hours;

	if(this.minutes < 10){
		min = '0' + this.minutes;
	}

	if(this.hours < 10){
		hr = '0' + this.hours;
	}

	this.time.attr({text: hr + ':' + min});
};

Scrubber.prototype.scrub = function(x, y){
	var deltaX = x - this.centerX;
	var deltaY = y - this.centerY;		
	var angle = (Math.atan2(deltaY, deltaX) * 180 / Math.PI) + 90;

	var val = (angle < 0) ? 360 + angle : angle;

	console.log('x', x,'y',y, 'angle', angle, 'value', val)
	
	//Time update
	if(val < this.lastVal){ // we are decreasing
		
		if(this.hours == 0 && this.minutes == 0){
			this.day--;			
			this.hours = 24;
			this.minutes = 59;
			this.date.attr({text: this.day + ' '+ this.months[this.month] + ' '+ this.year});
			this.updateTime();
		}
		else if(this.minutes == 0){
			this.minutes = 59;
			this.hours--;
			this.updateTime();
		}
		else{
			this.minutes--;
			this.updateTime();
		}
	}
	else{ // we are increasing

		if(this.hours == 24 && this.minutes == 59){
			this.day++; //increase the day
			this.hours = 0; // reset hours
			this.minutes = 0; //reset minutes
			this.date.attr({text: this.day + ' '+ this.months[this.month] + ' '+ this.year});
			this.updateTime();
		}
		else if(this.minutes < 59){
			this.minutes++; //increase minutes
			this.updateTime();
		}
		else{
			this.hours++;
			this.minutes = 0;
			this.updateTime();
		}
	}

	if(val == 0 || angle > 359) return;

	//el.animate({arc: [val, 360, R]});
	this.lastVal = val;
};

Scrubber.prototype.minimize = function(){
	//DUMMY CODE
	//clearInterval(interval);
	//END DUMMY CODE

	this.R = R = 65;
	this.track.attr({stroke: this.config.trackColor, 'stroke-width': 15, arc: [359, 360, R]});
	this.trackGlow.remove();
	this.trackGlow = this.track.glow({
		color: "#fff",
		opacity: 1,
		width: 10
	});

	this.unreadBar.attr({stroke: this.config.unreadBarColor, 'stroke-width': 10, 'stroke-linecap' : 'round', arc: [this.unreadBar.attrs.arc[0], 360, R]});
	this.readBar.attr({stroke: this.config.readBarColor, 'stroke-width': 10, 'stroke-linecap' : 'round', arc: [this.readBar.attrs.arc[0], 360, R]});

	//DUMMY CODE
	//dummyInterval();
	//END DUMMY CODE
};

Scrubber.prototype.maximize = function(){
	//DUMMY CODE
	//clearInterval(interval);
	//END DUMMY CODE
	this.R = R = 95;	
	this.track.attr({stroke: this.config.trackColor, 'stroke-width': this.config.trackWidth, arc: [359, 360, R]});
	this.trackGlow.remove();
	this.trackGlow = this.track.glow({
		color: "#fff",
		opacity: 1,
		width: 20
	});

	this.unreadBar.attr({stroke: this.config.unreadBarColor, 'stroke-width': this.config.strokeWidth, 'stroke-linecap' : 'round', arc: [this.unreadBar.attrs.arc[0], 360, this.R]});
	this.readBar.attr({stroke: this.config.readBarColor, 'stroke-width': this.config.strokeWidth, 'stroke-linecap' : 'round', arc: [this.readBar.attrs.arc[0], 360, this.R]});

		//DUMMY CODE
	//dummyInterval();
	//END DUMMY CODE
};