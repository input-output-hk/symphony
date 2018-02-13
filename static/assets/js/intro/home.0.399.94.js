var io_intro_animation = null;
var io_intro_num = 0;

var use_shader = 0;

var io_webgl_error_message = "<p class='c_f00'>Error, Sorry Your device has no 3D WebGL support</p>";

var io_intro_swatches = new Array();
io_intro_swatches[0] = new Array();
io_intro_swatches[1] = new Array('#ffffff','#00FFFF','#ff0000','#FFFA00','#00EE76','#FFFF00','#EE7600','#EE7AE9','#00EE76');


var desc_hider_href = "javascript:io_class_toggle('#io_intro_nav','hidedesc')";
var io_intro_rule_desc_hider = '<a href="'+desc_hider_href+'" class=""><span class="hider"><em class="fa fa-minus-square-o"></em></span><span class="shower"><em class="fa fa-info-circle"></em></span></a>';

var io_intro_rule_desc = new Array();
io_intro_rule_desc[0] = new Array();
io_intro_rule_desc[0][0] = '\
<b>Centralised Network</b> - Belongs to a single central power point (a host). Connected to all satellite nodes. <b>Decentralised Network</b> – Belongs to many different hosts. Each with their own satellite nodes. \
<b>Distributed Network</b> – Contains neither a host or satellite nodes. They just contain these self determining end point systems which connect with any node they want.\
';

io_intro_rule_desc[1] = new Array();
io_intro_rule_desc[1][0] = '\
A prime number (or a prime) is a natural number greater than 1 that has no positive divisors other than 1 and itself. They are quite disperse inside the group of natural numbers the and “rare” to be found. \
“Grow like weeds among the natural numbers, seeming to obey no other law than that of chance [but also] exhibit stunning regularity [and] that there are laws governing their behavior, and that they obey these laws with almost military precision.” Don Zagier \
';
io_intro_rule_desc[1][1] = "\
Exponential growth is a phenomenon that occurs when the growth rate of the value of a mathematical function is proportional to the function's current value, resulting in its growth with time being an exponential function. \
Any species growing exponentially under unlimited resource conditions can reach enormous population densities in a short time. Darwin showed how even a slow growing animal like the elephant could reach an enormous population if there were unlimited resources for its growth in its habitat.\
";
io_intro_rule_desc[1][2] = 'In mathematics, a multiplicative inverse or reciprocal for a number x, denoted by 1/x or x−1, is a number which when multiplied by x yields the multiplicative identity, 1. If we invert the state of our cells we have a ping-póng behavior. ';

io_intro_rule_desc[1][3] = 'The standard 3d Game of Life is 8574 A cell is "Born" if it has between 8 and 5 neighbours, "Survives" if it has between 7 and 4 living neighbours; it dies otherwise.';



var io_fluid = null;


var intro_label = new Array();
intro_label[0] = 'Distributed systems '+io_intro_rule_desc_hider;
intro_label[1] = 'Complexity is beautiful '+io_intro_rule_desc_hider;

function triggerMouseEvent (node, eventType) {
    var clickEvent = document.createEvent ('MouseEvents');
    clickEvent.initEvent (eventType, true, true);
    node.dispatchEvent (clickEvent);
}


function webgl_unsupported_shader_feature() {
  $("#io_intro_hint_but,#io_intro_hint").remove();
}


function io_intro_frame() {

}


function io_intro() {

	IOHP2();



	setTimeout(function(){
    io_intro_frame();
    $("#io_intro_hint_but").addClass('ready');
    $("#app").click(function () {
      $("#io_intro_hint").addClass('go');
      $("#io_intro_hint_but").remove();
    })
    $("#app").on('swipe',function () {
      $("#io_intro_hint").addClass('go');
      $("#io_intro_hint_but").remove();
    });
    $("#app").on('touchstart',function () {
      $("#io_intro_hint").addClass('go');
      $("#io_intro_hint_but").remove();
    });
    $("#app").on('click',function () {
      $("#io_intro_hint").addClass('go');
      $("#io_intro_hint_but").remove();
    });
    $("#app").on('mousemove',function () {
      $("#io_intro_hint").addClass('go');
      $("#io_intro_hint_but").remove();
    });


    //$("#window1").removeAttr('style');
    //$("#window1").height(wh-160);
    //


		$("#entry .desc").removeClass('none');
		setTimeout(function(){
			jQuery("#io_intro_ignit,#io_intro_start").addClass('in');
		},150);
	},200);

	//io_intro_init();

    $("#io_intro_ignit,#io_intro_start-0").click(function(){
	    io_intro_init();
      $("#app").remove();
    });
    $("#io_intro_start-1").click(function(){
    	io_intro_num = 1;
      $("#app").remove();
	    io_intro_init();
    });




}

function io_intro_pauseplay() {
    if (io_intro_animation.isRunning()){
    	if(io_intro_num == 0){
	        io_intro_animation.stop();
	    }else{
	        io_intro_animation.pause();
	    }
    }else{
        io_intro_animation.run();
    }
}

function io_intro_error(str){
	$("#entry").removeClass('off');
	$("#intro_parallax").removeClass('off');
	jQuery("#entry").show(0);
	jQuery("#entry .btn,#io_intro_ignit").hide(0);
	jQuery("#entry .container").append(str);
	jQuery("#io_intro").removeClass('in');
}


function io_intro_init(){
	lime = null;
	$("#io_intro").empty();
	$("#entry").addClass('off');
	$("#intro_parallax").addClass('off');
	$("#io_intro").removeClass('waiting');

	var ww = jQuery(window).width();
	var wh = jQuery(window).height();

	if(webglIE){
		if(ww > 239){

			io_intro_gui();
			io_intro_render();
			/**
			jQuery("#io_intro_nav").show(0);
			jQuery(".intro_gui-"+io_intro_num).addClass('opened');
			jQuery("#io_intro_label strong").html(intro_label[io_intro_num]);
			jQuery("#io_intro_label .desc").html('<span class="message">'+io_intro_rule_desc[0][0]+'</span>');
		*/
		}else{
			io_intro_error('');
		}
	}else{
		io_intro_error(io_webgl_error_message);
	}
}


function io_intro_kill(){
  $("body").removeAttr('style');
  $("#app").remove();
	if(io_intro_animation != null){
		io_intro_animation.stop();
		io_intro_animation = null;
	}
	lime = {};
	jQuery("#io_intro").empty();
	jQuery("#io_intro_nav").hide(0);
}



var io_intro_gui_setup = false;
function io_intro_gui(){
	//alert(sec);
	//jQuery("#intro_gui_loader").html(intro_gui_set_var[sec]); io_intro_num
	//<div id="intro_gui-0" class="row intro_gui_row">

	jQuery(".io_intro_zoom").slider({
		max: 16,
		max: 80,
		value: 16,
		change: function( event, ui ) {
			if(io_intro_animation != null){
				io_intro_animation.updateZoom(ui.value);
			}
			jQuery("#io_intro_zoom_val").val(ui.value);
		}
	});

	jQuery(".intro_gui-0 .colors .swatches").each(function(index){
		jQuery(this).append(io_color_swatches(0,index,8));
	});

	jQuery(".intro_gui-1 .colors .swatches").each(function(index){
		jQuery(this).append(io_color_swatches(1,index,9));
	});

	jQuery("#io_intro_nav .dropdown-menu a").click(function(e){
		var txt = jQuery(this).text();
		jQuery(this).parent().parent().prev().find('.lab').text(txt);
	});

	jQuery("#io_intro2_distance").slider({
		max: 0,
		max: 300,
		value: 0,
		change: function( event, ui ) {
			if(io_intro_animation != null){
				io_intro_animation.changeSampleDistance(ui.value/200);
			}
		}
	});
	jQuery("#io_intro2_wave").slider({
		max: 0,
		max: 60,
		value: 0,
		change: function( event, ui ) {
			if(io_intro_animation != null){
				io_intro_animation.changeWaveFactor(ui.value/500);
			}
		}
	});
	jQuery("#io_intro2_expand").slider({
		max: 0,
		max: 300,
		value: 165,
		change: function( event, ui ) {
			if(io_intro_animation != null){
				io_intro_animation.expandTo(ui.value/100);
			}
		}
	});
	jQuery("#io_intro2_size").slider({
		max: 0,
		max: 200,
		value: 120,
		change: function( event, ui ) {
			if(io_intro_animation != null){
				io_intro_animation.resizeTo(ui.value/100);
			}
		}
	});

	jQuery("#io_intro_nav-opener").click(function(){
		if(!jQuery('#io_intro_nav').hasClass('ok')){
			setTimeout(function(){
				jQuery('#io_intro_nav').addClass('ok');
			},500);
		}else{
			jQuery('#io_intro_nav').removeClass('ok');
		}
	});

	jQuery("#io_intro_nav .changeRule").each(function(index){
		jQuery(this).click(function(){
			jQuery("#io_intro_label .desc").html('<span class="message">'+io_intro_rule_desc[1][index]+'</span>');
		});
	});
	jQuery("#io_intro_gui-play").attr('class','play pause');

}

function io_intro_render(){
	var parameters = {};
	io_intro_animation = null;

	var ww = jQuery(window).width();
	var wh = jQuery(window).height();

	setTimeout(function(){
		if(is_safari){
			use_shader = 1;
		}

        parameters = {
            'particle_path' : "/js/intro/textures/particle3.png",
            'container_id' : "io_intro",
            'renderer_id' : "io_intro_renderer",
            'stats_id' : "io_intro_stats",
            "gui_id" : "io_intro_gui",
            "background_color" : "#ff0000",
            "electrolized_path" : '/js/intro/libs/electrolized.js',
            "spec_path1"  : '/js/intro/textures/spec_body_squared.jpg',
            "spec_path2"  : '/js/intro/textures/spec_body5.jpg',
            "spec_path3"  : '/js/intro/textures/spec_line2.jpg',
            "spec_path4"  : '/js/intro/textures/spec_body11.jpg',
            "shader_to_use" : use_shader,
            "header_text" :" ",
            "focal_length_name" :" ",
            "quality_name" :'  ',
            "color_theme_name" : '  ',
            "main_color_name" : ' ',
            "secondary_color_name" : ' ',
            "spheres_color_name" : ' ',
            "next_name" : 'next ',
            "play_name" : 'play ',
            "pause_name" : 'pause ',
            "reset_name" : 'reset ',
            "next_animation_name" : ' ',
            //VERSION 4.5"
            "focal_length_init_val" : 20,
            //VERSION 4.6
            "spec_path"  : '/js/intro/textures/spec_body56B.jpg',
	        "background_stars_count" : 100,
	        "now_playing" : io_intro_num,

	        //params for anim 2
            "initial_rule" : undefined, //
            "initial_theme" : "sky", //
            "initial_primary_color" : undefined,
            "initial_secondary_color" : undefined,
            "initial_background_color" : "#0A0001"
        }

        function onDocumentKeyDown( event ) {
            if (event.keyCode == 32){
                io_intro_pauseplay();
            }
        }

        if(io_intro_animation == null){
	        io_intro_animation = new Animation01(function(){
				io_intro_error(io_webgl_error_message);
			});
        }

		io_intro_animation.setup(parameters,function(){

			jQuery(".intro_gui-"+io_intro_num).addClass('opened');
			jQuery("#io_intro_label strong").html(intro_label[io_intro_num]);
			if(io_intro_num == 1){
				jQuery("#io_intro_label .desc").html('<span class="message">'+io_intro_rule_desc[io_intro_num][3]+'</span>');
			}else{
				jQuery("#io_intro_label .desc").html('<span class="message">'+io_intro_rule_desc[io_intro_num][0]+'</span>');
			}

	        document.addEventListener('keydown',onDocumentKeyDown,false);

	        document.getElementById("io_intro_gui-play").addEventListener("click", function(){io_intro_pauseplay();});
	        document.getElementById("io_intro_gui-refresh").addEventListener("click", function(){
	        	io_intro_animation.reset();
	        	io_intro_default_gui();
	        });
	        document.getElementById("io_intro_gui-forward").addEventListener("click", function(){

				jQuery("#io_intro").addClass('switch');

	        	setTimeout(function(){

	        	  	io_intro_animation.next();
	        	  	io_intro_animation.reset();
	        	  	if (!io_intro_animation.isRunning()){
				        io_intro_animation.run();
				    }
	        	  	io_intro_default_gui();
		        	io_intro_num++;
					if(io_intro_num > 1){
						io_intro_num = 0;
					}
					jQuery("#io_intro_label strong").html(intro_label[io_intro_num]);
					if(io_intro_num == 1){
						jQuery("#io_intro_label .desc").html('<span class="message">'+io_intro_rule_desc[io_intro_num][3]+'</span>');
					}else{
						jQuery("#io_intro_label .desc").html('<span class="message">'+io_intro_rule_desc[io_intro_num][0]+'</span>');
					}

					jQuery(".intro_gui_row.opened").removeClass('opened');
					jQuery(".intro_gui-"+io_intro_num).addClass('opened');
					jQuery("#io_intro").removeClass('switch');

				},1000);
	        });

	      	io_intro_animation.reset();

			//jQuery("#io_intro_renderer").css({height:wh+'px'});
			jQuery("#io_intro").addClass('in');
			if(io_intro_num == 0){
				if(ww < wh){
					io_intro_animation.updateZoom(25);
				}else{
					io_intro_animation.updateZoom(16);

				}
				io_intro_animation.updateTheme(1);
				io_intro_animation.updateColorMain('#ff0000');
			}
	    	io_intro_animation.run();
	    	jQuery("#entry").hide(0);
	    	jQuery("#io_intro_nav").show(0);
	    	jQuery("#intro_loading").addClass('in');

        },
        function(){
            console.log("animation has ended")
        });


	},500);
}



function io_color_swatches(an, sec, num){
	var fun = 'io_intro_animation.updateColorMain';
	if(an == 1){
		fun = 'io_intro_theme2_colors';
	}
	if(sec == 1){
		fun = 'io_intro_animation.updateColorSecondary';
		if(an == 1){
			fun = 'changeColorSecondary';
		}
	}
	if(sec == 2){
		fun = 'io_intro_animation.updateColorSphere';
	}
	var out = '';
	for(var i=0;i<num;i++){
		var clr = io_intro_colors.random();
		if(an == 1){
			clr = io_intro_swatches[1][i];
		}
		out += '<a class="swatch rounded" style="background:'+clr+'" href="javascript:'+fun+'(';
		out += "'"+clr+"'";
		out += ')"></a>';
	}
	return out;
}




function io_intro_theme2_colors(col) {
	io_intro_animation.changeColorMain(col);
	io_intro_animation.changeColorSecondary(col);
}

function io_intro_theme_update(sec,th) {
	if(sec == 1){
    	if(th == 0){
    		io_intro_animation.changeThemeTo('radioactive');
    		//io_intro_animation.changeRuleTo('organic');
    	}
    	if(th == 1){
    		io_intro_animation.changeThemeTo('sky');
    		//io_intro_animation.changeRuleTo('whale');
    	}
    	if(th == 2){
    		io_intro_animation.changeThemeTo('oasis');
    		//io_intro_animation.changeRuleTo('city');
    	}
    	if(th == 3){
    		io_intro_animation.changeThemeTo('hallucination');
    		//io_intro_animation.changeRuleTo('pong');
    	}
	}
}



function io_intro_default_gui() {

	jQuery(".io_intro_zoom").slider({value: 16});

	if(io_intro_num == 1){
		jQuery("#io_intro_label .desc").html('<span class="message">'+io_intro_rule_desc[io_intro_num][3]+'</span>');
	}else{
		jQuery("#io_intro_label .desc").html('<span class="message">'+io_intro_rule_desc[io_intro_num][0]+'</span>');
	}



	if(io_intro_num == 1){

		jQuery("#io_intro2_distance").slider({value: 0});
		jQuery("#io_intro2_wave").slider({value: 0});
		jQuery("#io_intro2_expand").slider({value:165});
		jQuery("#io_intro2_size").slider({value:120});

		io_intro_animation.changeColorMain('#bb4773');
		io_intro_animation.changeColorSecondary('#8e669b');
		io_intro_animation.changeThemeTo('berry');
		io_intro_animation.changeRuleTo('standard life');

		io_intro_animation.changeSampleDistance(0);
		io_intro_animation.changeWaveFactor(0);
		io_intro_animation.expandTo(1);
		io_intro_animation.resizeTo(1);


	}

}
