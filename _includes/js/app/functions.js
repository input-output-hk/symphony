var teamgrid = '';
var homeloaded = false;

var io_loadto = ['#middle','#main'];


function io_disqus(){
	var disqus_config = function () {
	    this.page.url = document.location.href;
	    this.page.identifier = jQuery('.entry').data('slug');
	};
	(function() {
	    var d = document, s = d.createElement('script');
	    s.src = '//iohk.disqus.com/embed.js';
	    s.setAttribute('data-timestamp', +new Date());
	    (d.head || d.body).appendChild(s);
	})();
}

function io_loadmodal(obj,tit){
	jQuery("#morecontent-modal-header").text(tit);
	jQuery("#morecontent-modal-body").html(jQuery(obj).html());
}

var io_current_team_filter = 'show-all';
function io_team_filter(filt,obj){
	jQuery(".filters .active").removeClass('active');
	jQuery(".filters ."+obj).addClass('active');

	jQuery("#teamgrid").removeClass(io_current_team_filter);
	io_current_team_filter = obj;
	jQuery("#teamgrid").addClass(io_current_team_filter);

	jQuery("#teamgrid .griditem").not('.'+filt).hide(500);
	if(filt == 'all'){
		jQuery("#teamgrid .griditem").show(500);
	}else{
		filt = '.'+filt;
		jQuery("#teamgrid "+filt).show(500);
	}
}




function io_twitter_fetcher(username,count){
	var configProfile = {
	  "profile": {"screenName": username},
	  "domId": 'twitter_fetcher',
	  "maxTweets": count,
	  "enableLinks": true,
	  "showUser": true,
	  "showTime": true,
	  "showImages": false,
	  "lang": 'en'
	};
	twitterFetcher.fetch(configProfile);
}





function io_pop_item(arr,ide,cnt,blog){
	if(arr[ide] != undefined){
		var tit = arr[ide].tit;
		var sub = '';
		if(blog){
			tit = blog[0];
			sub = '<h6 class="uppercase">'+arr[ide].tit+', '+blog[1]+'</h6>';
		}
		var out = '<div class="float_profile roboto">\
			<img src="/'+arr[ide].pic+'" class="pull-right img-circle" width="80" height="80" /><h2>'+tit+'</h2>'+sub+'<h6 class="role uppercase">'+arr[ide].role+'</h6><div class="loc uppercase"><b>'+arr[ide].loc+'</b></div><hr />\
			<div id="" class="info"></div><div class="shade"></div>\
		</div>';
		return out;
	}
}


function io_pop(){
	//$.getJSON('/team.json', function (data) {
		//if(data){ //<div id="tester"></div>
			//$("#main").append('<div id="io_member_info" class="none"></div>');
			$.widget("ui.tooltip", $.ui.tooltip, {
			    options: {
						position: { my: "left+15 center", at: "right center" },
		        content: function ()           {
							if($(this).hasClass('profile-link')){
								var ide = $(this).attr('rel');
								return io_pop_item(io_team_arr,ide,$("#io_member_info").text(),false);
							}else {
								var ide = $(this).find('.author').attr('rel');
								var blog_arr = new Array();
								blog_arr = [$(this).attr('alt'),$(this).attr('date')];
								return io_pop_item(io_team_arr,ide,$("#io_member_info").text(),blog_arr);
							}




		        },
						open: function(event, ui) {
							if($(this).hasClass('blog-link')){
								var tit = $(this).attr('alt');
								$(".float_profile").addClass('blog-link');
								//$(".float_profile .tit").html('<h2>'+tit+'</h2>');
							}

							var url = $(this).attr('href');
							$(".float_profile .info").load(url+' #entry');

						}
			    }
			});
			var ww = $(window).width();
			if(ww > 767){

				$(".profile-link,.blog-link").each(function(){
					$(this).tooltip();
				});

			}



	//	}
	//});
}



function io_form_contact() {
	$("#form_contact").submit(function(){
		// id="form_message"
		var txt = $("#form_message").val();
		if(txt.replace(' ','').trim().length < 100){
			if(txt.replace(' ','').trim().length == ''){
				alert("Empty message");
			}else{
				alert("Your message has to be at least 100 characters long");
			}
			return false;
		}else{
			$("#form_message").val(txt);
		}
	});

}




function io_crypto_prices(){
	var url = $("#crypto_prices").attr('rel');
	var out = '';
	$.getJSON(url, function (data) {
		if(data){ //<div id="tester"></div>
				var currency_symbol = new Object();
				currency_symbol['USD'] = '<em class="opa60 fa fa-usd"></em>';
				currency_symbol['BTC'] = '<em class="opa60 fa fa-bitcoin"></em>';

			for(item in data){
				out += '<p>'  + currency_symbol[item] +'&nbsp;<span class="price">' + data[item] + '</span></p>';
			}
			$("#crypto_prices").prepend(out);
		}
	});
}


function io_cut_arr(arr){
	var out = new Array();
	for(var i=0;i<arr.length;i++){
		if(is_even(i)){
			arr[i] = '';
		}
	}
	return arr;
}



var allVideos = jQuery("iframe[src^='//www.youtube.com']");
var fluidEl = jQuery("body");

function io_fluid_videos(){
	allVideos = jQuery("iframe[src^='//www.youtube.com']"),
	fluidEl = jQuery("body");
	allVideos.each(function() {
		jQuery(this).data('aspectRatio', this.height / this.width).removeAttr('height').removeAttr('width');
	});
}



function io_ajaxload() {
	$(".ajaxload").unbind('click');
	$(".ajaxload").on('click',function(e){
		var url = $(this).attr('href');
		var obj = $(this).data('ide');
		var target = $(this).data('hash');
		var active = $(this).data('active');
		var callback = $(this).data('callback');

		io_loadto = [obj,target];

		$(active).removeClass('active');
		e.preventDefault();
		History.pushState(io_hist, "Symphony",url);
		//io_load_page(url,obj,target,callback);
		$(this).closest(active).addClass('active');
	});
}



function io_load_page(url,obj,hash,callback){
	choice = url;
	if(hash == '#main'){
		if($("body").hasClass('transin')){
		 	$("body").removeClass('transin');
		}
	}else{
		$(obj).addClass('transout');
	}
	var url_a = url.split('/');
	if(iolang == 'en'){
		chosen = url_a[url_a.length-2];
	}else{
		chosen = url_a[url_a.length-3];
	}
	console.log(chosen);
	if(url.match('team')){
		chosen = 'team';
	}
	if(url.match('blog')){
		chosen = 'blog';
	}
	if(url.match('papers')){
		chosen = 'papers';
	}
	setTimeout(function(){
		$(obj).load(url+' '+hash,function(){
			io_nav();
			var bodyvar = chosen;
			if(bodyvar == '' || bodyvar == 'symp.com' || bodyvar == 'sympdev.net' || bodyvar == 'symphony.iohk.io' || bodyvar == 'symphonydev.iohk.io'){
				bodyvar = 'home';
			}
			$("#page").attr('class',bodyvar);
			$("title").text($("h1 .title").text()+' - '+sitename);
			//io_retitle();
			$("html, body").animate({ scrollTop: 0 }, 300);

			setTimeout(function(){

				if(hash == '#main'){
					if(!$("body").hasClass('transin')){
					 	$("body").addClass('transin');
					}
				}else{
					$(obj).removeClass('transout');
				}

			},100);

			io_which_way_alter();
			if(typeof callback == 'function'){
				return callback;
			}

		});

	},500);
}



function io_navbar() {

	if($("#page").hasClass('page-404')){
		return false;
	}

	$(".navbar a,.block.title a").click(function(e){

		e.preventDefault();
		if(!$(this).hasClass('home')){
			io_intro_kill();
		}
		io_zotero_setup = false;
		$(".navbar .active").removeClass('active');
		$(this).parent().addClass('active');
		var urlchoice = $(this).attr('href');
		io_loadto[0] = '#middle';
		io_loadto[1] = '#main';
		if(!lowie){
			//window.history.pushState(io_hist, "Symphony", urlchoice);
			History.pushState(io_hist, "Symphony",urlchoice);
			//io_load_page(urlchoice);
		}else{
			document.location.href = urlchoice;
		}
		if($("#navhider").hasClass('in')){
		 	$("#navhider").removeClass('in');
		}
		if(!$(".navbar-toggle").hasClass('collapsed')){
		 	$(".navbar-toggle").addClass('collapsed');
		}




	});
}

function io_translate_update() {
	if(choice != ''){
		$("#lang-chooser a").each(function(){
			var lang = $(this).attr('class');
			if(lang == 'en'){
				lang = '';
			}
			var lang_choice = choice;
			if(lang_choice == '/'){
				lang_choice = '';
			}
			if(iolang == 'en'){
				$(this).attr('href',lang_choice+''+lang+'');
			}else{
				$(this).attr('href',lang_choice.substr(0,choice.length-4)+'/'+lang+'');
			}
		});
	}
}

function io_nav() {
	$(".subpages a,a.ajaxhref").unbind('click');
	$(".subpages a,a.ajaxhref").click(function(e){
		e.preventDefault();
		$(".subpages .active,a.ajaxhref").removeClass('active');
		$(this).parent().addClass('active');
		var urlchoice = $(this).attr('href');
		choice = urlchoice;
		io_loadto[0] = '#middle';
		io_loadto[1] = '#main';
		if(!lowie){
			History.pushState(io_hist, "Symphony",urlchoice);
			//alert(urlchoice);
			if(document.location.hash){
				//alert("hash");
				document.location.href = urlchoice;
			}

		}else{
			document.location.href = urlchoice;
		}
	});
	io_ajaxload();
	//io_altnav();
}

function io_altnav() {
	$("a.fadehref").unbind('click');
	$("a.fadehref").click(function(e){
		e.preventDefault();
		$("a.fadehref").removeClass('active');
		$(this).parent().addClass('active');
		var urlchoice = $(this).attr('href');
		choice = urlchoice;
		io_loadto = ['#middle','#main'];
		if(!lowie){
			History.pushState(io_hist, "Symphony",urlchoice);
			io_goto_page(urlchoice);
		}else{
			document.location.href = urlchoice;
		}
	});
}

function io_subajax_loader(){
	var lowievar = false;
	$("#main a.io_ajax_load").click(function(e){
		e.preventDefault();
		var urlchoice = $(this).attr('href');
		var target = $(this).attr('data-target');
		var rel = $(this).attr('data-load');
		choice = urlchoice;
		$(".sidecol .active").removeClass('active');
		$(this).parent().addClass('active');
		if(lowie){
			if(lowievar){
				document.location.href = urlchoice;
			}
		}
		io_load_subpage(target,urlchoice,rel);
	});
}

function io_load_subpage(target,url,rel){
	if(!$("body").hasClass('transsub')){
	 	$("body").addClass('transsub');
	}
	setTimeout(function(){
		$(target).load(url+' '+rel,function(){
			lowievar = true;
			$("html, body").animate({ scrollTop: 0 }, 300);
			$("title").text($("h1").text()+' - '+homename);
			if($("body").hasClass('transsub')){
			 	$("body").removeClass('transsub');
			}
		}).delay(500);
	},300);
}

function io_goto_page(url){
	choice = url;
	if($("body").hasClass('transin')){
	 	$("body").removeClass('transin');
	}
	var url_a = url.split('/');
	if(iolang == 'en'){
		chosen = url_a[url_a.length-2];
	}else{
		chosen = url_a[url_a.length-3];
	}
	setTimeout(function(){
		document.location.href = url;
	},500);
}

var team_sec = 0;
var team_car = true;
function io_alter_title(){
	$("h1 .active").removeClass('active');
	$("h1 a").each(function(i,v){
		if(i == team_sec){
			$(this).addClass('active');
		}
	});
}

function io_title_typing(){
	var txt = $("h1").text();
	//$("h1").typewriter();
	if(txt.match('Symphony |')){
		setTimeout(function(){
			txt = txt.replace('Symphony |','<span class="c_f00">Symphony |</span>');
			$("h1").html(txt);
		},3500);
	}
}

var current_chosen = '';

function io_which_way_alter(){
	//$("title").text($("h1").text()+' - '+sitename);
	//$("html, body").animate({ scrollTop: 0 }, 300);

	io_translate_update();
	if(!webglAvailable){
      $(".io_webgl").remove();
  }

	io_zotero_setup = false;

	if(chosen == jobspage){
		//io_subajax_loader();
	 	//$(".sidecol li a:first").trigger('click');
	 	//io_job_list();

	}
	if($("#main").hasClass('container-fluid')){
		$("#main").attr('class','container');
	}
	if($("#page").hasClass('intropage')){
		$("#page").removeClass('intropage');
	}

	if($("#roadmap-load").hasClass('ready')){
		rm_init();
	}


	var loadedgource = false;
	var loadgource = false;

	//gource.iohk.io/client/build/static/js/gource.main.2e291bb8.js
	//console.log(chosen);

		if($("#gource-box").hasClass('ready')){

			if(!loadedgource){

				$.getScript( "//gource.iohk.io/client/build/static/js/gource.main.js?bust="+buster, function( data, textStatus, jqxhr ) {

				loadedgource = true;
					var config = {
	          git: {
							owner: 'input-output-hk',
							repo: 'symphony',
	            commitHash: '', // hash of commit to load
	            commitDate: '', // date to load (YYYY-MM-DD)
	            loadLatest: true // load latest commit in db
	          },
	          display: {
	            showUI: true,
							showSidebar: true
	          },
	          FDG: {
	            nodeSpritePath: '/static/assets/textures/gource/dot.png', // path to node texture
	            nodeUpdatedSpritePath: '/static/assets/textures/gource/dot-concentric.png', // path to node updated state texture
	            fontTexturePath: '/static/assets/textures/gource/UbuntuMono.png', // path to font texture
	 						nodeSpritePathBlur: '/static/assets/textures/gource/dot-blur.png', // path to blur node texture
	            autoPlay: false,
	            delayAmount: 1500, // time in between new commits being added to the graph
	            sphereProject: 0, // project graph onto sphere? 1 == true, 0 == false
	            sphereRadius: 700, // radius of sphere if in sphere projection mode
	            showFilePaths: false, // display filepath overlay on nodes
	            colorCooldownSpeed: 0.05, // speed at which node colors cycle
	            cycleColors: false, // cycle colors based on file edit time from red to blue to white
	            colorPalette: [ // colors to use if cycleColors is switched off (colors cannot contain)
	              '#eb2256',
	              '#f69ab3',
	              '#1746a0',
	              '#6f9cef',
	              '#652b91',
	              '#0e5c8d',
	              '#1fc1c3'
	            ]
	          },
						scene: {
	            fullScreen: true,
	            width: 800,
	            height: 600,
	            bgColor: 0x121327,
	            antialias: false,
	            canvasID: 'gource-stage', // ID of webgl canvas element
	            autoRotate: false, // auto rotate camera around target
	            autoRotateSpeed: 0.0 // speed of auto rotation
	          },
	          post: {
	            vignette: true
	          },
	          camera: {
	            fov: 45,
							enableZoom: false,
	            initPos: {x: 0, y: 0, z: 600}
	          }
	        }
					if (gource.canRun()) {
	          gource.init(config).on('ready', function() {

							function commitInfo(data){
								return '\
								<ul onclick="javascript:io_class_toggle(\'#gource-box\',\'infohidden\')">\
								<li class="msg"><small>'+grc_label[lang]['message']+' </small><b>'+data.msg+'</b></li>\
								<li class="date"><small>'+grc_label[lang]['date']+' </small><b>'+data.date+'</b></li>\
								<li class="author"><small>'+grc_label[lang]['author']+' </small><b>'+data.author+'</b></li>\
								<li class="added"><small>'+grc_label[lang]['filesadded']+' </small><b>'+data.added+'</b></li>\
								<li class="changed"><small>'+grc_label[lang]['fileschanged']+' </small><b>'+data.changed+'</b></li>\
								<li class="removed"><small>'+grc_label[lang]['filesdeleted']+' </small><b>'+data.removed+'</b></li>\
								<li class="hash"><small>'+grc_label[lang]['hash']+' </small><b><a href="https://github.com/'+config.git.owner+'/'+config.git.repo+'/commit/'+data.hash+'" target="_blank">'+data.hash+' <em class="icon-link"></em></a></b></li>\
								</ul>\
								';
							}



							var commitCurrent = new Object();
							var commitFirst = new Object();
							var commitLast = new Object();

							setTimeout(function(){


							gource.getFirstCommit().then(data => {
			            //console.log(data)
									commitFirst = data;
									gource.getlastCommit().then(data => {


										commitLast = data;
										commitCurrent = data;
										$("#gource-box .opener").removeClass('opa0');
										$("#gource-box .opener").removeClass('none');

										var nav = '<div class="commit--switcher">\
				              <b>'+grc_label[lang]['allcommits']+'</b>\
				              <a href="javascript:;" class="prev" title="'+grc_label[lang]['previouscommit']+'"><em class="icon-arrow-down"></em></a><a href="javascript:;" class="next" title="'+grc_label[lang]['nextcommit']+'"><em class="icon-arrow-up"></em></a>\
				            </div>';
										$(".gource-sidebar").wrap('<div class="gource-wrap" />');
										$(".gource-wrap").prepend(nav);

										setTimeout(function(){
											$(".sidebar-github-view").text(grc_label[lang]['viewongithub']);
												$(".sidebar-github-view").attr('title',grc_label[lang]['viewongithub']);
										},2000);




										$("#gource-box .opener").click(function(e){
											io_class_toggle('#gource-box','fullscreen');
											if($('#gource-box').hasClass('fullscreen')){
												gource.setConfig({
			                    camera: {
			                      enableZoom: true,
			                    },
													FDG: {
														showFilePaths: true
													}
			                  })
											}else{
												gource.setConfig({
			                    camera: {
			                      enableZoom: false
			                    },
													FDG: {
														showFilePaths: false
													}
			                  })
											}
										});
										gource.setConfig({
											camera: {
												enableZoom: false
											}
										})


										var min_val = commitFirst.date/1000;
										var max_val = commitLast.date/1000;

										var end = new Date(commitLast.date);

										gource.setDate(formatBot(end));

										$(".welcome .timestamp").html('<a href="https://github.com/input-output-hk/cardano-sl/" target="_blank">Cardano SL</a> '+grc_label[lang]['repository']+' '+formatNice(end)+', '+zeroPad(end.getHours(),2)+':'+zeroPad(end.getMinutes(),2)+':'+zeroPad(end.getSeconds(),2));

										function zeroPad(num, places) {
										  var zero = places - num.toString().length + 1;
										  return Array(+(zero > 0 && zero)).join("0") + num;
										}
										function formatNice(__dt) {
										    var year = __dt.getFullYear();
										    var month = zeroPad(__dt.getMonth()+1, 2);
										    var date = zeroPad(__dt.getDate(), 2);
										    return  date+'. '+month+'. '+year;
										}
										function formatBot(__dt) {
										    var year = __dt.getFullYear();
										    var month = zeroPad(__dt.getMonth()+1, 2);
										    var date = zeroPad(__dt.getDate(), 2);
										    return  year+'-'+month+'-'+date;
										}
										var manual = true;
										$( ".date--slider.normal" ).slider({
											min: min_val,
											max: max_val,
											value: max_val,
											slide: function( event, ui ) {
												manual = true;
												var dt_cur_from = new Date(ui.value*1000);
												$(".date--slider.normal").find(".ui-slider-handle").html('<span class="lab">'+formatNice(dt_cur_from)+'</span>');
												$(".date--mobile").html('<span class="lab">'+formatNice(dt_cur_from)+'</span>');
											}
											,
											change: function( event, ui ) {
												var dt_cur_from = new Date(ui.value*1000);
												$(".date--slider.normal").find(".ui-slider-handle").html('<span class="lab">'+formatNice(dt_cur_from)+'</span>');
												$(".date--mobile").html('<span class="lab">'+formatNice(dt_cur_from)+'</span>');
												if(manual){
													console.log('setting slider '+formatBot(dt_cur_from));
													gource.setDate(formatBot(dt_cur_from));
												}
											},
											create: function( event, ui ) {
												var dt_cur_from = new Date(min_val*1000);
												$(".date--slider.normal").find(".ui-slider-handle").html('<span class="lab">'+formatNice(dt_cur_from)+'</span>');
												$(".date--mobile").html('<span class="lab">'+formatNice(dt_cur_from)+'</span>');
											}
										});

										$('.datepicker').datepicker({
											dateFormat: 'yy-mm-dd',
											maxDate: new Date(max_val*1000),
											minDate: new Date(min_val*1000),
											beforeShow: function () {
												$(this).datepicker('widget').wrap('<div class="ll-skin-melon">')
											},
											onSelect: function (dateText, inst) {
												console.log('picking '+dateText);
												gource.setDate(dateText);
												$(".ll-skin-melon").remove();
											},
											onClose: function () {
													// $(this).datepicker("widget").removeClass("ll-skin-melon");
											}
										})
										$('#gource-box .daterange.nomobile .datepicker_icon').click(function (e) {
							        e.preventDefault()
							        $('#gource-datepicker').datepicker('show')
							      })
										$('#gource-box .controls.nodesktop .datepicker_icon').click(function (e) {
							        e.preventDefault()
							        $('#gource-datepicker2').datepicker('show')
							      })

										gource.on('commitChanged', (data) => {
											manual = false;
											commitCurrent = data;
											var pos = Date.parse(data.date)/1000;
											console.log('getting '+data.date);
											$( ".date--slider" ).slider( "value", pos );

											if(data.index == 0){
												$("#gource-box").addClass('commit-first');
											}else{
												if($("#gource-box").hasClass('commit-first')){
													$("#gource-box").removeClass('commit-first');
												}
											}
											if(data.index == commitLast.index){
												$("#gource-box").removeClass('playing');
												$("#gource-box").addClass('commit-last');
											}else{
												if($("#gource-box").hasClass('commit-last')){
													$("#gource-box").removeClass('commit-last');
												}
											}
											if(commitLast.index == data.index){
												$("#gource-box").removeClass('playing');
											}
											$("#gource-box .infopanel .inner").html(commitInfo(data));
										})



										$(".commit--switcher a.prev").click(function(){
											gource.goToPrev()
										})
										$(".commit--switcher a.next").click(function(){
											gource.goToNext()
										})

										$(".view--switcher a.normal").click(function(){
											gource.setSphereView(false);
										})
										$(".view--switcher a.sphere").click(function(){
											gource.setSphereView(true);
										})
										$(".play--switcher a.play").click(function(){
											if(commitCurrent.index == commitLast.index){
												var start = new Date(commitFirst.date);
												gource.setDate(formatBot(start));
											}
											gource.setPlay(true);
										})
										$(".play--switcher a.stop").click(function(){
											gource.setPlay(false);
										})


								})
							})

							},500);


						});


					}else{
						$("#gource-box").addClass('notsupported');
						$(".welcome .timestamp").html('<p class="comingsoon">Gource coming soon to this device</p>');
					}


				});

			}
		}


	if($("#symphony").hasClass('ready')){
		if(loadedgource){
			loadedgource = false;
			gource.destroy()
		}

		if($("#symphony").hasClass('mask')){
			if($("#page").hasClass('home')){
				setTimeout(function () {
					$("#symphony").removeClass('mask');
			  }, 2000)
			}
		}

		if(!$("#symphony").hasClass('loaded')){

			$("#symphony").addClass('loaded');
			$("#main").attr('class','container-fluid');
			//$("#page").addClass('intropage home');
			homeloaded = true;
			$("#symphony .preloader").remove();
			io_intro_num = 2;
	    $("#app").remove();
	    io_intro();
		}
	}



	if($(".entry").data('type') == 'blog-post'){
		io_fluid_videos();
	}
	if($("#page").hasClass('blog') || $("#page").hasClass('video')){
		io_fluid_videos();
	}
	iohk_video_modal_update();

	if($("#nav-tabs").hasClass('nav-tabs')){
		io_hash_tabs();
	}

	if(!$("body").hasClass('transin')){
	 	$("body").addClass('transin');
	}

	if($("#form_contact").hasClass('form_contact')){
	 	io_form_contact();
	}

	if($("#main").hasClass('blog')){
		$(".entry a[href^='http://']").attr("target","_blank");
		$(".entry a[href^='https://']").attr("target","_blank");
	}

	$(".modal-image").each(function(){
		$(this).click(function(e){
			e.preventDefault();
			var url = $(this).attr('href');
			$("#iohk-modal-load").html('<img src="'+url+'" alt="" class="fullwidth" />');
			$("#iohk-modal").modal();
		});
	});

	if($(".iohk-video-list").hasClass('youtube')){
		iohk_videos();
	}
	current_chosen = chosen;

}


function iohk_video_modal_update() {
  $(".iohk_video_load_modal").each(function(){
    var url = $(this).attr('rel');
    $(this).click(function(e){
      e.preventDefault();
      //$("#videomodal iframe").attr('src','https://www.youtube.com/embed/'+url+'?autoplay=1');
      $("#videomodal iframe").attr('src','https://www.youtube.com/embed/'+url+'');
      $('#videomodal').modal();

			$('#videomodal .close').click(function(){
				$("#videomodal iframe").attr('src','');
			});
			$('#videomodal').on('hide.bs.modal', function (event) {
				$("#videomodal iframe").attr('src','');
			});

    });
  });
}

function iohk_video_preview(cnt,obj) {
	var out = '';
    out = '<div class="'+iohk_playlist_grid+' video-'+cnt+'"><div class="video"><a href="https://www.youtube.com/watch?v='+obj.snippet.resourceId.videoId+'" class="iohk_video_load_modal" rel="'+obj.snippet.resourceId.videoId+'"><img src="'+obj.snippet.thumbnails.high.url+'" alt="" class="fullwidth" /></a><div class="title"><h3><a href="https://www.youtube.com/watch?v='+obj.snippet.resourceId.videoId+'" class="iohk_video_load_modal" rel="'+obj.snippet.resourceId.videoId+'">'+obj.snippet.title+'</a></h3></div></div></div>';
	return out;
}

var iohk_playlist = '';
var iohk_playlist_grid = 'col-md-8 col-sm-12';
var iohk_playlist_count = 3;
var iohk_playlist_active = 0;
var iohk_playlist_arr = new Array();



function iohk_videos() {
	$.getScript( "https://apis.google.com/js/client.js?onload=iohk_videos_load", function( data, textStatus, jqxhr ) {});
}


function iohk_videos_load() {
	var ii = 0;
    $(".iohk-video-list").each(function(){
			$(this).html(svgloader);
        var iohk_playlist_arr_var = new Array();
        iohk_playlist_arr_var['rel'] = $(this).attr('rel');
        iohk_playlist_arr_var['id'] = $(this).attr('id');
        iohk_playlist_arr_var['grid'] = $(this).attr('grid');
				if(iohk_playlist_arr_var['grid'] == undefined){
					iohk_playlist_arr_var['grid'] = iohk_playlist_grid;
				}

				iohk_playlist_arr_var['count'] = $(this).attr('count')*1;

				iohk_playlist_arr.push(iohk_playlist_arr_var);

				ii++;
		});
    iohk_videos_load_call();
}

function iohk_videos_load_call() {
  if(iohk_playlist_arr[iohk_playlist_active] != undefined){
		//console.log(iohk_playlist_arr);
    gapi.client.setApiKey('AIzaSyAIqaKbClCtxWJ3pKCICB16A48yhe2VZQE');
    gapi.client.load('youtube', 'v3', function() {
    var request = gapi.client.youtube.playlistItems.list({
        part: 'snippet',
        playlistId: iohk_playlist_arr[iohk_playlist_active]['rel'],
        maxResults: iohk_playlist_arr[iohk_playlist_active]['count']
    });
    request.execute(function(response) {
      var out = '';
      var cnt = 0;
			if(response.items != undefined){
        for (var i = 0; i < response.items.length; i++) {
          if(response.items[i].snippet.title != 'Private video'){
            if(cnt < iohk_playlist_arr[iohk_playlist_active]['count']){
              out += iohk_video_preview(i,response.items[i]);
              cnt++;
            }
          }
        }
				if(cnt > 5){
					$(".show-videos").css('display','block');
				}
        out = '<div class="row">'+out+'</div>';
        $("#"+iohk_playlist_arr[iohk_playlist_active]['id']).html(out);
        iohk_video_modal_update();
        iohk_playlist_active++;
        iohk_videos_load_call();
			}else{
				console.log(response);
			}
    });

    });
  }
}




function io_which_way(){
	var ww = $(window).width();
	var wh = $(window).height();
	var row = wh/20;
	chosen = pageslug;
	io_nav();
	//io_retitle();
	io_which_way_alter();
	if(!$("body").hasClass('introin')){
	 	$("body").addClass('introin');
	}


}

function io_resize(){

}


function io_hash_tabs() {
    var url = document.location.hash;
    if (url.match('#')) {
        $('.nav-tabs a[href=#'+url.split('#')[1]+']').tab('show') ;
    }
    $('.nav-tabs a').on('shown.bs.tab', function (e) {
        window.location.hash = e.target.hash;
    });
}

function io_load_commits() {
	var url = $("#io_project_commits").data('url');
	if(url.length > 0){
		io_load_rss(url,"#io_project_commits",$("#io_project_commits").data('count'),$("#io_project_commits").data('show'));
	}

}

function io_load_rss(feed,target,items,itemshidden) {
	$("#io_project_commits").rss(feed,{
		limit: 8,
		ssl: true,
			dateFormat: 'MMMM Do, YYYY',
			entryTemplate: '<li><a class="block" href="{url}">{title}</a><small class="uppercase light block" style="margin:4px 0 0 0">{author} - {date}</small></li>'
	});
}

function io_search_links(words) {

}




$(window).resize(function(){
	/*
	if(io_intro_animation != null){
		io_intro_animation.updateCanvas();
	}
	*/
	var newWidth = fluidEl.width();
	allVideos.each(function() {
		var $el = $(this);
		$el.width(newWidth).height(newWidth * $el.data('aspectRatio'));
	});

  if($("#subheader").hasClass('particles')){
    	$("#subheader-particles").height($("#subheader").height());
	}


	if($("#symphony").hasClass('ready')){
		//io_intro_frame();
	}

});

var moreloaded = 0;


window.onload = function() {
	io_which_way();
}



/* Navbar Scroll Function */
var nav_scroll = 0;
var screen_width = $(window).width();

$(window).scroll(function() {
    nav_scroll = $(window).scrollTop();
    if (nav_scroll >= 20) {
    	$(".navbar-fixed-top").addClass("shrink");
    	$(".secondary-nav").addClass('pull-up-nav');
    }
    else if (nav_scroll < 20) {
    	$(".navbar-fixed-top").removeClass("shrink");
    	$(".secondary-nav").removeClass('pull-up-nav');
    }
    else if (screen_width <= 768) {
    	$(".navbar-fixed-top").removeClass("shrink");
    	$(".secondary-nav").removeClass('pull-up-nav navbar-fixed-top');
    }
});



/* Go Back Function */

function goBack() {
	window.history.back();

	$(window).bind('anchorchange',function (event) {
            var state = History.getState().hash,
                stateWithoutHash,
                index = state.indexOf('#');
            if (index === -1) {
                window.location.reload(); // reload
            } else {
                stateWithoutHash = state.substring(0, index);
            }
            if(window.location.pathname !== stateWithoutHash) {
                window.location.reload(); // reload
            }
        });
}



$(document).ready(function() {
	io_navbar();
	var config = {
		scene: {
			fullScreen: false,
			width: 200,
			height: 200,
			antialias: window.devicePixelRatio === 1,
			canvasID: 'logo-stage', // ID of wegbl canvas element
			autoRotate: false, // auto rotate camera around target
			autoRotateSpeed: 0.01 // speed of auto rotation
		},
		camera: {
			fov: 60,
			initPos: {x: 0, y: 0, z: 0}
		},
	}
	if (logo.canRun()) {
		logo.init(config)
	}else {
		console.log('no');
	}


	History.Adapter.bind(window, 'statechange', function() {
		var State = History.getState();
		//console.log(State.url);
		io_load_page(State.url,io_loadto[0],io_loadto[1],null);

	});
});
