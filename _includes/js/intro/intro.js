var io_intro_animation = null
var io_intro_num = 0

var use_shader = 0

var io_webgl_error_message = "<p class='c_f00'>Error, Sorry Your device has no 3D WebGL support</p>"

var io_intro_swatches = new Array()
io_intro_swatches[0] = new Array()
io_intro_swatches[1] = new Array('#ffffff', '#00FFFF', '#ff0000', '#FFFA00', '#00EE76', '#FFFF00', '#EE7600', '#EE7AE9', '#00EE76')

var desc_hider_href = "javascript:io_class_toggle('#symphony_nav','hidedesc')"
var io_intro_rule_desc_hider = '<a href="' + desc_hider_href + '" class=""><span class="hider"><em class="fa fa-minus-square-o"></em></span><span class="shower"><em class="fa fa-info"></em></span></a>'





var io_fluid = null

var symphony_label = new Array()
symphony_label['en'] = new Array()
symphony_label['en']['desc'] = '<p>An interactive, visual and auditory exploration of Bitcoin, cryptocurrency and blockchain technology.</p> '



function triggerMouseEvent (node, eventType) {
  var clickEvent = document.createEvent('MouseEvents')
  clickEvent.initEvent(eventType, true, true)
  node.dispatchEvent(clickEvent)
}

function webgl_unsupported_shader_feature () {
  $('#symphony_hint_but,#symphony_hint').remove()
}

function io_intro_frame () {

}

function io_intro () {
  io_intro_explorer()
}

function io_intro_pauseplay () {
  if (io_intro_animation.isRunning()) {
    if (io_intro_num == 0) {
      io_intro_animation.stop()
    } else {
      io_intro_animation.pause()
    }
  } else {
    io_intro_animation.run()
  }
}

function io_intro_error (str) {
  $('#entry').removeClass('off')
  $('#intro_parallax').removeClass('off')
  jQuery('#entry').show(0)
  jQuery('#entry .btn,#symphony_ignit').hide(0)
  jQuery('#entry .container').append(str)
  jQuery('#symphony').removeClass('in')
}

var intro_scrolled = 0
var blocks_selected = 0
var latest_block_date = ''
var date_selected_index = 0
var date_selected = ''


function io_intro_kill(){
  //$("body").removeAttr('style');
  //setTimeout(function () {
  //console.log("kill")
    //jQuery("#symphony").addClass('mask');
  //}, 2000)
	jQuery("#symphony").empty();
  jQuery("#app").remove();
}



function io_intro_explorer () {
  var daysOfYear = []
  var intro_text_pref = ''

  function io_intro_timeline () {
    var out = ''
    var now = new Date()
    var month_num = 0
    var month = ''
    for (var d = new Date(2017, 10, 1); d <= now; d.setDate(d.getDate() + 1)) {
      daysOfYear.push(new Date(d))
      var m = d.getMonth()
      if (month_num != d.getMonth()) {
        month_num = d.getMonth()
        month = '<span class="month">' + io_mons[month_num] + '</span>'
      } else {
        month = ''
      }
      var num = ''
      if (d.getDate() == 1 || d.getDate() == 10 || d.getDate() == 20) {
        num = '<span class="date">' + d.getDate() + '</span>'
      }

      out += '<div class="day" style="left:' + daysOfYear.length * 7 + 'px;width:' + daysOfYear.length * 7 + 'px;">' + month + ' ' + num + ' <a href="#" class="io_timeline_day" title="' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + '" rel="' + d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + '">&nbsp;</a></div>'
    }
    return '<div class="timeline"><div class="line"><hr />' + out + '</div></div>'
  }

  $('#entry').addClass('off')
  setTimeout(function () {
    $('#entry').addClass('none')
  }, 1000)

	// <canvas id="stage"></canvas>
  var intro_text = '\
  <div class="inner">\
  \
  <p><em><b>This is a Bitcoin blockchain, a continuous list of transactions through time.</b></em></p> <hr>\
  <p>Scroll to move through the history of the blockchain.</p>\
  \
  </div>'

  var intro_onscroll = '\
  <div class="inner">\
  <p>Blocks are organised in a spiral where each revolution represents a day.</p>\
  <p>The ambient soundscape portrays the hashrate.</p>\
  <p>Select a block to find out more.</p>\
  </div>'

  function datetime_nice (date) {
    return '' + io_weekdays[date.getDay()] + ', ' + io_months[date.getMonth()] + ' ' + ordinal_suffix_of(date.getDate()) + ' ' + date.getFullYear() + ', ' + date.getHours() + ':' + num_pad(date.getMinutes()) + ':' + num_pad(date.getSeconds()) + ' GMT'
  }
  function date_nice (date) {
    return '\
    <span class="nomobile">' + io_weekdays[date.getDay()] + ', ' + io_months[date.getMonth()] + ' ' + ordinal_suffix_of(date.getDate()) + ' ' + date.getFullYear()+'</span>\
    <span class="nodesktop">' + io_weekdays[date.getDay()].substr(0,3) + ', ' + io_months[date.getMonth()].substr(0,3) + ' ' + ordinal_suffix_of(date.getDate()) + ' ' + date.getFullYear()+'</span>\
    '
  }

  function text_block_selected_first (date, number_of_tx) {
    return '\
    <div class="inner">\
    This block was created on <b>' + datetime_nice(date) + '</b> with <b>' + number_of_tx + '</b> transactions. <br>\
    Every block contains a Merkle tree, which is a data structure used to verify and authenticate a block\'s integrity. Here, you can see the block\'s Merkle tree and its shape and structure is determined by how expensive it was to create, an indicator of the overall network health. <!--Each block has a signature that defines its sound, and that signature is created by the number and time of the transactions. Each sound loops and accumulates.-->\
    </div>'
  }
  function text_block_selected (date, number_of_tx, value) {
    return '<div class="inner">This block was created on <b>' + datetime_nice(date) + '</b> from <b>' + number_of_tx + '</b> transactions with a total value of <em class="fa fa-bitcoin"></em> <b>' + value + '</b>.</div>'
  }
  function datepicker_init () {
    $('.datepicker').datepicker({
      dateFormat: 'dd/mm/yy',
      maxDate: 0,
      minDate: new Date(2009, 0, 9),
      beforeShow: function () {
        $(this).datepicker('widget').wrap('<div class="ll-skin-melon">')
      },
      onSelect: function (dateText, inst) {
        var date_arr = dateText.split('/')
        $('#details .date').html(date_nice(new Date(date_arr[2], (date_arr[1] * 1 - 1), (date_arr[0] * 1))))
        $('#loading_text').html(svgloader_b)
        $('#welcome_text').addClass('off')
        //$('.pane.left.bottom').addClass('off')
        // alert(dateText);
        app.setDate(new Date(date_arr[2], (date_arr[1] * 1 - 1), (date_arr[0] * 1)))
      },
      onClose: function () {
          // $(this).datepicker("widget").removeClass("ll-skin-melon");
      }
    })
  }

  //					<div class="datepicker ll-skin-melon"></div>
  $('#symphony_hud').html('<div id="welcome_text" class=""></div>')

	// check that browser supports webgl
  if (!orpheusApp.canRun) {
    $('#welcome_text').html('<p>WebGL Error</p>')
    $('.pane.left.bottom .update').html('<p>WebGL Error</p>')
    setTimeout(function () {
      $('#welcome_text').remove(); IOHP2()
      $('.pane.left.bottom .update').remove(); IOHP2()
    }, 1500)
  }

  //			<form id=symphony-search-form><input id=symphony-search-field type=text placeholder="Enter Block Hash..."> <button id=symphony-search-button>Go</button></form>

  $('#symphony').html('<canvas id="stage" style=""></canvas>')
  $('#symphony_hud').html('\
  <div id="mousemove_note" class="none"></div>\
  <div class="controls top none nomobile">\
    <div class="container">\
      <div class="inner">\
        <div class="inline-block pane sound sound_control">\
          <a href="javascript:io_class_toggle(\'.sound_control\',\'off\')" id="mute"><em class="icon-volume-off"></em></a><a href="javascript:io_class_toggle(\'.sound_control\',\'off\')" id="unmute"><em class="icon-volume-2 "></em></a>\
        </div>\
        <div class="inline-block pane date">\
          <a href="" class="day_prev"><img src="/static/assets/images/arrow-left.svg" alt="Prev" /></a>\
          <span class="date"></span> &nbsp; \
          <input type="text" value="000000" id="datepicker" class="datepicker ll-skin-melon none" style="position:fixed;top:0left:0" /> <a href="#" class="datepicker_icon"><em class="fa fa-calendar"></em></a>\
          <a href="" class="day_next"><img src="/static/assets/images/arrow-right.svg" alt="Next" /></a>\
        </div>\
        <div class="inline-block pane search">\
          <div class="search_control"><a href="javascript:io_class_toggle(\'#symphony_hud\',\'search_box_on\')"><em class="icon-magnifier"></em></a></div>\
        </div>\
      </div>\
    </div>\
  </div>\
  <div class="block pane left bottom off none">\
  <span class="glow nomobile"><img src="/static/assets/images/glow.png" alt="" /></span>\
    <span class="link"></span>\
    <a href="javascript:io_class_toggle(\'.pane.bottom\',\'off\')" class="opener"><span class="off"><em class="icon-arrow-left nomobile"></em><em class="icon-arrow-down nodesktop"></em></span><em class="fa fa-info on"></em><span class="lab">About Symphony</span></a>\
    <div class="inner">\
      <div class="top">'+symphony_label['en']['desc']+'</div> <div class="update"></div>\
    </div>\
  </div>\
  <div class="block pane left top off"></div>\
  <div class="block pane left middle off"></div>\
  <div class="controls top bottom none nodesktop">\
    <div class="container">\
      <div class="inner">\
        <div class="inline-block pane sound sound_control">\
          <a href="javascript:io_class_toggle(\'.sound_control\',\'off\')" id="mute2"><em class="icon-volume-off"></em></a><a href="javascript:io_class_toggle(\'.sound_control\',\'off\')" id="unmute2"><em class="icon-volume-2 "></em></a>\
        </div>\
        <div class="inline-block pane date">\
          <a href="" class="day_prev"><img src="/static/assets/images/arrow-left.svg" alt="Prev" /></a>\
          <span class="date"></span> &nbsp; \
          <input type="text" value="000000" id="datepicker2" class="datepicker ll-skin-melon none" /> <a href="#" class="datepicker_icon"><em class="fa fa-calendar"></em></a>\
          <a href="" class="day_next"><img src="/static/assets/images/arrow-right.svg" alt="Next" /></a>\
        </div>\
        <div class="inline-block block-controls text-center">\
          <a href="#" title="Previous block" class="block_prev"><img src="/static/assets/images/arrow-left.svg" alt="Prev" /></a>\
          <a href="#" title="Next block" class="block_next"><img src="/static/assets/images/arrow-right.svg" alt="Next" /></a>\
          <a href="#" title="Close block" class="block_close"><img src="/static/assets/images/close-block.svg" alt="Cancel" /></a>\
        </div>\
        <div class="inline-block pane search">\
          <div class="search_control"><a href="javascript:io_class_toggle(\'#symphony_hud\',\'search_box_on\')"><em class="icon-magnifier"></em></a></div>\
        </div>\
      </div>\
    </div>\
  </div>\
  <div id="welcome_text" class=""></div>\
  <div id="loading_text" class=""></div>\
  <div id="search_box" class="">\
    <a href="javascript:io_class_toggle(\'#symphony_hud\',\'search_box_on\')" class="opener"><span class="off"><img src="/static/assets/images/close.svg" alt="&times;" /></span></a>\
    <div class="container">\
      <form action="" method="POST" id="symphony-search-form"><div class="input-group">\
        <input type="text" id="symphony-search-field" class="form-control" placeholder="Insert block hash" aria-describedby="search-input"><span class="input-group-btn" id="search-input"><button class="btn btn-default" type="submit" id="symphony-search-button"><em class="icon-magnifier"></em></button></span>\
      </div></form>\
    </div>\
  </div>\
  <div id="hudx">\
  <div class="credits_control none"><a href="javascript:io_class_toggle(\'#credits_box\',\'none\')"><em class="fa fa-certificate"></em></a></div>\
    <div id="intro_text" class="none"></div>\
    <div id="credits_box" class="none">\
      <div class="container">\
        Logos\
      </div>\
    </div>\
    <div id="details" class="uppercase empty none"></div>\
    <div id="timeline" class="nomobile none">\
      <div class="container">\
      <div class="row">\
      <div class="col-md-14">' + io_intro_timeline() + '</div>\
      <div class="col-md-8 col-md-offset-2"><input type="text" value="000000" id="datepickerx" class="datepicker ll-skin-melon" /></div>\
    </div></div></div></div>')

  $('#symphony_hud').addClass('block-top-off block-middle-off block-bottom-off');
  $('#loading_text').html(svgloader_b)

  /// //////////////////
  // Create the Orpeus App
  orpheusApp({ path: '/static/assets/' }).then(app => {
    window.app = app

    window.addEventListener('resize', () => app.setSize(window.innerWidth, window.innerHeight))
    app.setSize(window.innerWidth, window.innerHeight)

  /*
    Destroys the Orpheus instance and unloads all data.
    The application instance cannot be used after this is called
  */
  // app.destroy()
    const goToNextBlock = app.goToBlock
    const goToPrevBlock = app.goToBlock
    window.goToNextBlock = goToNextBlock
    window.goToPrevBlock = goToPrevBlock

  	/*
  		Event called when the first day loads
  	*/
    var days_loaded = 0
    /*
  	app.on('firstDayLoaded', data => {
      console.log('first day of blocks loaded');

      $("#intro_text").addClass('empty');
      $("#welcome_text").addClass('off');
      setTimeout(function(){
        $("#welcome_text").html(intro_text);
        $("#welcome_text").removeClass('off');
      },1500);

      //$("#intro_text").html(intro_text_pref+intro_text);
      $(".io_timeline_day").click(function(e){
        e.preventDefault();
        var rel = $(this).attr('rel');
        io_timeline_day(rel);
      });
      $(".datepicker").val('01/01/2018');
      datepicker_init();
    })
    */
    $('#symphony_hud').addClass('viewing-about')

    $(".pane.bottom .opener").click(function(e){
      if($(".pane.bottom").hasClass('off')){
        if(!$(".pane.middle").hasClass('off')){
          //app.resetDayView();
          $(".pane.middle").addClass('off');
        }
      }
      if($("#symphony_hud").hasClass('block-bottom-off')){
        $("#symphony_hud").removeClass('block-bottom-off');
      }else{
        $("#symphony_hud").addClass('block-bottom-off');
      }
      if(!$('#symphony_hud').hasClass('viewing-about')){
        $('#symphony_hud').addClass('viewing-about')
      }else{
        $('#symphony_hud').removeClass('viewing-about')
      }
    });

    $("#navbar ul a").click(function(e){
      app.audio.muteAudio()
      app.destroy()
    });







    function io_timeline_day (date) {
      var date_arr = date.split('-')
      app.setDate(new Date(date_arr[0], date_arr[1], date_arr[2]))
    }

    function io_get_date_index (date) {
      out = ''
      for (var i = 0; i < daysOfYear.length; i++) {
        if (date === daysOfYear[i]) {
          out = i
        }
      }
      return out
    }

  	/*
  		Event called as a user scrolls through time and the current day changes
  	*/

    /*
    $("#search-input-button").click(function(e){
      e.preventDefault();
      alert($("#search-field").val());
      app.goToBlock($("#search-field").val());
      //alert("fa");
    });
    */
    $('.pane.left.middle').addClass('none');

    app.on('dayChanged', ({ date, input, output, fee }) => {
      days_loaded++
      var date_prev = new Date()
      var date_next = new Date()
      date_prev.setDate(date.getDate() - 1)
      date_next.setDate(date.getDate() + 1)

      hudx = '\
      <span class="glow nomobile"><img src="/static/assets/images/glow.png" alt="" /></span>\
      <span class="link"></span>\
      <a href="javascript:io_class_toggle(\'.pane.top\',\'off\')" class="opener"><span class="off"><em class="icon-arrow-left nomobile"></em><em class="icon-arrow-down nodesktop"></em></span><span class="on"><em class="fa fa-calendar nomobile"></em><em class="fa fa-info nodesktop"></em></span><span class="lab">Day View</span></a>\
      <div class="inner">\
      <h4 class="tit"><span>Bitcoin Blockchain</span> <br class="" /><i class="date">' + date_nice(date) + '</i></h4>\
      <div class="ul">\
      <div class="li"><small>Fee</small> <em class="fa fa-bitcoin"></em> <b>' + (fee / 100000000).toLocaleString('en') + '</b></div>\
      <div class="li"><small>Total Input Value</small> <em class="fa fa-bitcoin"></em> <b>' + (input / 100000000).toLocaleString('en') + '</b></div>\
      <div class="li"><small>Total Output Value</small> <em class="fa fa-bitcoin"></em> <b>' + (output / 100000000).toLocaleString('en') + '</b></div>\
      </div>\
      </div>'

      date_selected = date
      latest_block_date = hudx

      if (days_loaded == 1) {
        console.log('first day of blocks loaded')
        $('#intro_text').addClass('empty')
        //$('#welcome_text').addClass('off')
        //$('.pane.left.bottom').addClass('off')
        $('.sound_control').removeClass('off')
        $('.pane.left.bottom').removeClass('none')
        // $(".search_control").removeClass('none');
        setTimeout(function () {
          //$('#welcome_text').html(intro_text)
          //$('#welcome_text').removeClass('off')
          $('.pane.left.bottom .update').html(intro_text)
          //$('.pane.left.bottom').removeClass('off')
        }, 1500)
      } else {
        //$('#welcome_text').removeClass('off')
        //$('.pane.left.bottom').removeClass('off')
        if (blocks_selected > 0) {
          $('#intro_text').addClass('empty').html('')
          //$('#welcome_text').addClass('none').html('')
          //$('.pane.left.bottom').addClass('off')
          //$('.pane.left.bottom .update').html('')
        }
      }
      $('.pane.left.bottom').removeClass('off')
      $("#symphony_hud").removeClass('block-top-off');

      $('.pane.left.top').removeClass('off').html(hudx)
      $('.day_prev').attr('rel',date_prev.getFullYear() + '/' + date_prev.getMonth() + '/' + date_prev.getDate());
      $('.day_next').attr('rel',date_next.getFullYear() + '/' + date_next.getMonth() + '/' + date_next.getDate());

      $('.controls.top').removeClass('none');
      $('.controls.top .date .date').html(date_nice(date));


      if($('#symphony').hasClass('view-block')){
        $('#symphony').removeClass('view-block');
      }
      if(!$('#symphony').hasClass('view-day')){
        $('#symphony').addClass('view-day');
      }

      if(!$('#symphony_hud').hasClass('viewing-day')){
        $('#symphony_hud').addClass('viewing-day')
      }
      if($('#symphony_hud').hasClass('viewing-block')){
        $('#symphony_hud').removeClass('viewing-block')
      }

      $('.datepicker').val(num_pad(date.getDate()) + '/' + num_pad(date.getMonth() + 1) + '/' + date.getFullYear())
      datepicker_init()


      $('.pane.top .opener').click(function (e) {
        if($("#symphony_hud").hasClass('block-top-off')){
          $("#symphony_hud").removeClass('block-top-off');
        }else{
          $("#symphony_hud").addClass('block-top-off');
        }
      })

      $('.day_prev').click(function (e) {
        e.preventDefault()
        var rel = $(this).attr('rel')
        var date_arr = rel.split('/')
        app.setDate(new Date(date_arr[0], date_arr[1], date_arr[2]))
      })
      $('.day_next').click(function (e) {
        e.preventDefault()
        var rel = $(this).attr('rel')
        var date_arr = rel.split('/')
        app.setDate(new Date(date_arr[0], date_arr[1], date_arr[2]))
      })
      $('.nomobile .datepicker_icon').click(function (e) {
        e.preventDefault()
        $('#datepicker').datepicker('show')
      })
      $('.nodesktop .datepicker_icon').click(function (e) {
        e.preventDefault()
        $('#datepicker2').datepicker('show')
      })
      $('#loading_text').html('')
      setTimeout(function () {
        $('#loading_text').html('')
      }, 1000)
    })

    /*
    Event called when a block is selected
    */
  	app.on('blockSelected', ({ bits, fee, feeToInputRatio, hash, height, input, n_tx, output, size, time }) => {
    $('#intro_text').empty()
    console.log('search opened')
    //$('#welcome_text').addClass('off')
    //$('.pane.left.bottom').addClass('off')
    setTimeout(function () {
      //$('#welcome_text').addClass('none').html('')
      //$('.pane.left.bottom .update').addClass('none').html('')
    }, 1500)
    if ($('#intro_text').hasClass('empty')) {
      $('#intro_text').removeClass('empty')
    }
    blocks_selected++
    if (blocks_selected == 1) {
      //$('#intro_text').html(intro_text_pref + text_block_selected_first(time, n_tx))
      $('.pane.left.bottom .update').html(intro_text_pref + text_block_selected_first(time, n_tx))
    } else {
      //$('#intro_text').html(intro_text_pref + text_block_selected(time, n_tx, output.toLocaleString('USD')))
      $('.pane.left.bottom .update').html(intro_text_pref + text_block_selected(time, n_tx, output.toLocaleString('USD')))
    }
    hudx = '\
    <span class="glow nomobile"><img src="/static/assets/images/glow.png" alt="" /></span>\
      <span class="link"></span>\
        <a href="javascript:io_class_toggle(\'.pane.middle\',\'off\')" class="opener"><span class="off"><em class="icon-arrow-left nomobile"></em><em class="icon-arrow-down nodesktop"></em></span><span class="on"><em class="fa fa-bitcoin nomobile"></em><em class="fa fa-info nodesktop"></em></span><span class="lab">Block details</span></a>\
        <div class="inner">\
        <h4 class="tit">Block ' + hash.substr(-16) + ' <br class="" /><i class="date">' + datetime_nice(time) + '</i></h4>\
          <div class="ul">\
          <div class="li"><small>Bits</small> ' + (bits / 100000000).toLocaleString('en') + '</div>\
          <div class="li"><small>Fee</small> <em class="fa fa-bitcoin"></em> <b>' + (fee / 100000000).toLocaleString('en') + '</b></div>\
          <div class="li"><small>Fee Level</small> ' + feeToInputRatio + '</div>\
          <div class="li nomobile"><small>Block height</small> ' + height + '</div>\
          <div class="li nomobile"><small>Block Hash</small> ' + hash.substr(-16) + '</div>\
          <div class="li"><small>Total Input Value</small> <em class="fa fa-bitcoin"></em> <b>' + (input / 100000000).toLocaleString('en') + '</b></div>\
          <div class="li"><small>Total Output Value</small> <em class="fa fa-bitcoin"></em> <b>' + (output / 100000000).toLocaleString('en') + '</b></div>\
          <div class="li"><small>Number of Transactions</small> ' + n_tx + '</div>\
          </div>\
          <div class="controls text-center nomobile">\
            <a href="#" title="Previous block" class="block_prev"><img src="/static/assets/images/arrow-left.svg" alt="Prev" /></a>\
            <a href="#" title="Next block" class="block_next"><img src="/static/assets/images/arrow-right.svg" alt="Next" /></a>\
            <a href="#" title="Close block" class="block_close"><img src="/static/assets/images/close-block.svg" alt="Cancel" /></a>\
          </div>\
        </div>\
        '
      //$('#details').html(hudx)
      $('.pane.left.middle').removeClass('none');
      $('.pane.left.middle').removeClass('off').html(hudx)
      $("#symphony_hud").removeClass('block-middle-off');


      if (!$('.pane.left.bottom').hasClass('off')) {
        $('.pane.left.bottom').addClass('off');
      }
      if($(document).width() < 768){
        if (!$('.pane.left.top').hasClass('off')) {
          $('.pane.left.top').addClass('off');
        }
        if (!$("#symphony_hud").hasClass('block-bottom-off')) {
          $("#symphony_hud").addClass('block-bottom-off');
        }

      }

      if($('#symphony').hasClass('view-day')){
        $('#symphony').removeClass('view-day');
      }
      if(!$('#symphony').hasClass('view-block')){
        $('#symphony').addClass('view-block');
      }

      if(!$('#symphony_hud').hasClass('viewing-block')){
        $('#symphony_hud').addClass('viewing-block')
      }
      if($('#symphony_hud').hasClass('viewing-day')){
        $('#symphony_hud').removeClass('viewing-day')
      }

      $('.block_prev').click(function (e) {
        e.preventDefault()
        app.goToPrevBlock()
      })
      $('.block_next').click(function (e) {
        e.preventDefault()
        app.goToNextBlock()
      })
      $('#details .back,.block_close').click(function (e) {
        e.preventDefault();
        $('.pane.left.middle').addClass('none');
        app.resetDayView()
      })

      $(".pane.middle .opener").click(function(e){
        if(!$(".pane.bottom").hasClass('off')){
          //if(!$(".pane.middle").hasClass('off')){
            //app.resetDayView();
            $(".pane.bottom").addClass('off');
          //}
        }
        if($("#symphony_hud").hasClass('block-middle-off')){
          $("#symphony_hud").removeClass('block-middle-off');
        }else{
          $("#symphony_hud").addClass('block-middle-off');
        }
      });



  	})


    app.on('blockMouseOver', () => {
      if($("#page").hasClass('home')){
        document.body.style.cursor = "pointer";
      }
    })
    app.on('blockMouseOut', () => {
      if($("#page").hasClass('home')){
        document.body.style.cursor = "default";
      }
    })

    /**
     * on iOS devices, the user must first interact with the page before any sound will play
     */
    app.audio.on('bgAudioLoaded', function () {
      StartAudioContext(app.audio.context, '#stage')

      var muteButton = document.querySelector('#mute')
      if (muteButton) {
        muteButton.addEventListener('click', function () {
          app.audio.muteAudio()
        })
      }

      var unMuteButton = document.querySelector('#unmute')
      if (unMuteButton) {
        unMuteButton.addEventListener('click', function () {
          app.audio.unMuteAudio()
        })
      }

      var muteButton2 = document.querySelector('#mute2')
      if (muteButton2) {
        muteButton2.addEventListener('click', function () {
          app.audio.muteAudio()
        })
      }

      var unMuteButton2 = document.querySelector('#unmute2')
      if (unMuteButton2) {
        unMuteButton2.addEventListener('click', function () {
          app.audio.unMuteAudio()
        })
      }


    })

    const cameraMove = function (direction = 'positive', speedMultiplier = 1, lookatOffset = 1000) {
      if (app.scrollBlocked) {
        return
      }
      if (app.currentBlockObject) {
        return
      }

      app.scrollBlocked = true

      setTimeout(() => {
        app.scrollBlocked = false
      }, 50)

      if (direction === 'positive') {
        app.stage.targetCameraPos.z += app.stage.cameraMoveStep * speedMultiplier
      } else {
        app.stage.targetCameraPos.z -= app.stage.cameraMoveStep * speedMultiplier
      }

      app.stage.targetCameraLookAt.z = app.stage.targetCameraPos.z - lookatOffset
    }

    /**
     * touch navigation
     */
    var stageEl = document.getElementById('stage')

    var hammer = new Hammer(stageEl)
    hammer.get('pinch').set({ enable: true })
    hammer.on('pinchin', function (e) {
      cameraMove('positive', 0.5)
    })
    hammer.on('pinchout', function (e) {
      cameraMove('negative', 0.5)
    })

  	app.on('blockUnselected', _ => {
    //$('#intro_text').addClass('empty').html('')
    //$('#details').html(latest_block_date)
    //$('.pane.top').html(latest_block_date)
    $('.pane.middle').addClass('none');
    $('.datepicker').val(num_pad(date_selected.getDate()) + '/' + num_pad(date_selected.getMonth() + 1) + '/' + date_selected.getFullYear())
    datepicker_init()

    if(!$('#symphony').hasClass('view-day')){
      $('#symphony').addClass('view-day');
    }
    if($('#symphony').hasClass('view-block')){
      $('#symphony').removeClass('view-block');
    }
    if(!$('#symphony_hud').hasClass('viewing-day')){
      $('#symphony_hud').addClass('viewing-day')
    }
    if($('#symphony_hud').hasClass('viewing-block')){
      $('#symphony_hud').removeClass('viewing-block')
    }

    if($(document).width() < 768){
      if ($('.pane.left.top').hasClass('off')) {
        $('.pane.left.top').removeClass('off');
      }
    }


    $('.nomobile .datepicker_icon').click(function (e) {
      e.preventDefault()
      $('#datepicker').datepicker('show')
    })
    $('.nodesktop .datepicker_icon').click(function (e) {
      e.preventDefault()
      $('#datepicker2').datepicker('show')
    })

    $('.day_prev').click(function (e) {
      e.preventDefault()
      var rel = $(this).attr('rel')
      var date_arr = rel.split('/')
      app.setDate(new Date(date_arr[0], date_arr[1], date_arr[2]))
    })
    $('.day_next').click(function (e) {
      e.preventDefault()
      var rel = $(this).attr('rel')
      var date_arr = rel.split('/')
      app.setDate(new Date(date_arr[0], date_arr[1], date_arr[2]))
    })
  })

    var scrolled_once = 0
  // move camera on z axis with mouse wheel
  $("#symphony_hud").removeClass('block-bottom-off');

  // move camera on z axis with mouse wheel
    const onDocumentMouseWheel = function (event) {
      if (event.deltaY > 0) {
        cameraMove('negative')
      } else {
        cameraMove('positive')
      }
      intro_scrolled += event.deltaY
      if (blocks_selected == 0) {
        scrolled_once++
        if (scrolled_once == 1) {
          //$('#welcome_text').addClass('off')
          //$('.pane.left.bottom').addClass('off')
          setTimeout(function () {
            //$('#welcome_text').html(intro_onscroll)
            //$('#welcome_text').removeClass('off')
            $('.pane.left.bottom .update').html(intro_onscroll)
            //$('.pane.left.bottom').removeClass('off')
          }, 1500)
        }
      } else {
        //$('#welcome_text').addClass('none').html('')
        //$('.pane.left.bottom').addClass('off')
        //$('.pane.left.bottom .update').html('')
      }
    }

    document.addEventListener('wheel', onDocumentMouseWheel, false)
    document.addEventListener('mousewheel', onDocumentMouseWheel, false)
    window.onscroll = onDocumentMouseWheel

    document.querySelector('#symphony-search-form').addEventListener('submit', function (e) {
      e.preventDefault()
      var searchInput = document.querySelector('#symphony-search-field')
      console.log('search hit')
      searchInput.value = searchInput.value.trim()

      if (searchInput.value !== '') {
        app.goToBlock(searchInput.value)
          .then(function (data) {
            console.log(data)
          })
          .catch(function (error) {
            console.log(error)
          })
      }
    })
  })
}
