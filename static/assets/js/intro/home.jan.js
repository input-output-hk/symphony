var io_intro_animation = null
var io_intro_num = 0

var use_shader = 0

var io_webgl_error_message = "<p class='c_f00'>Error, Sorry Your device has no 3D WebGL support</p>"

var io_intro_swatches = new Array()
io_intro_swatches[0] = new Array()
io_intro_swatches[1] = new Array('#ffffff', '#00FFFF', '#ff0000', '#FFFA00', '#00EE76', '#FFFF00', '#EE7600', '#EE7AE9', '#00EE76')

var desc_hider_href = "javascript:io_class_toggle('#io_intro_nav','hidedesc')"
var io_intro_rule_desc_hider = '<a href="' + desc_hider_href + '" class=""><span class="hider"><em class="fa fa-minus-square-o"></em></span><span class="shower"><em class="fa fa-info-circle"></em></span></a>'

var io_intro_rule_desc = new Array()
io_intro_rule_desc[0] = new Array()
io_intro_rule_desc[0][0] = '\
<b>Centralised Network</b> - Belongs to a single central power point (a host). Connected to all satellite nodes. <b>Decentralised Network</b> – Belongs to many different hosts. Each with their own satellite nodes. \
<b>Distributed Network</b> – Contains neither a host or satellite nodes. They just contain these self determining end point systems which connect with any node they want.\
'

io_intro_rule_desc[1] = new Array()
io_intro_rule_desc[1][0] = '\
A prime number (or a prime) is a natural number greater than 1 that has no positive divisors other than 1 and itself. They are quite disperse inside the group of natural numbers the and “rare” to be found. \
“Grow like weeds among the natural numbers, seeming to obey no other law than that of chance [but also] exhibit stunning regularity [and] that there are laws governing their behavior, and that they obey these laws with almost military precision.” Don Zagier \
'
io_intro_rule_desc[1][1] = "\
Exponential growth is a phenomenon that occurs when the growth rate of the value of a mathematical function is proportional to the function's current value, resulting in its growth with time being an exponential function. \
Any species growing exponentially under unlimited resource conditions can reach enormous population densities in a short time. Darwin showed how even a slow growing animal like the elephant could reach an enormous population if there were unlimited resources for its growth in its habitat.\
"
io_intro_rule_desc[1][2] = 'In mathematics, a multiplicative inverse or reciprocal for a number x, denoted by 1/x or x−1, is a number which when multiplied by x yields the multiplicative identity, 1. If we invert the state of our cells we have a ping-póng behavior. '

io_intro_rule_desc[1][3] = 'The standard 3d Game of Life is 8574 A cell is "Born" if it has between 8 and 5 neighbours, "Survives" if it has between 7 and 4 living neighbours; it dies otherwise.'

var io_fluid = null

var intro_label = new Array()
intro_label[0] = 'Distributed systems ' + io_intro_rule_desc_hider
intro_label[1] = 'Complexity is beautiful ' + io_intro_rule_desc_hider

function triggerMouseEvent (node, eventType) {
  var clickEvent = document.createEvent('MouseEvents')
  clickEvent.initEvent(eventType, true, true)
  node.dispatchEvent(clickEvent)
}

function webgl_unsupported_shader_feature () {
  $('#io_intro_hint_but,#io_intro_hint').remove()
}

function io_intro_frame () {

}

function io_intro () {
	// IOHP2();

/*

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
			//jQuery("#io_intro_ignit,#io_intro_start").addClass('in');
		},150);
	},200);
*/
	// io_intro_init();

  $('#io_intro_ignit,#io_intro_start-0').click(function () {
	    io_intro_init()
    $('#app').remove()
  })
  $('#io_intro_start-1').click(function () {
    	io_intro_num = 1
    $('#app').remove()
	    io_intro_init()
  })
  $('#io_intro_start-2').click(function () {
    	io_intro_num = 2
    $('#app').remove()
	    io_intro_explorer()
  })

  setTimeout(function () {
    io_intro_num = 2
    $('#app').remove()
    io_intro_explorer()
  }, 500)
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
  jQuery('#entry .btn,#io_intro_ignit').hide(0)
  jQuery('#entry .container').append(str)
  jQuery('#io_intro').removeClass('in')
}

var intro_scrolled = 0
var blocks_selected = 0
var latest_block_date = ''
var date_selected_index = 0
var date_selected = ''

function io_intro_explorer () {
  var daysOfYear = []
  var intro_text_pref = '<a href="javascript:io_class_toggle(\'#intro_text\',\'off\')" class="opener"><em class="fa fa-chevron-down off"></em><em class="fa fa-info-circle on"></em></a>'

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
  <div class="container">\
  \
  <p>This is a Bitcoin blockchain, a continuous list of transactions through time.</p>\
  <p>Scroll to move through the history of the blockchain.</p>\
  \
  </div>'

  var intro_onscroll = '\
  <div class="container">\
  <p>Blocks are organised in a spiral where each revolution represents a day.</p>\
  <p>The ambient soundscape portrays the hashrate.</p>\
  <p>Select a block to find out more.</p>\
  </div>'

  function datetime_nice (date) {
    return '' + io_weekdays[date.getDay()] + ', ' + io_months[date.getMonth()] + ' ' + ordinal_suffix_of(date.getDate()) + ' ' + date.getFullYear() + ' at ' + date.getHours() + ':' + num_pad(date.getMinutes()) + ':' + num_pad(date.getSeconds()) + ' GMT'
  }
  function date_nice (date) {
    return '' + io_weekdays[date.getDay()] + ', ' + io_months[date.getMonth()] + ' ' + ordinal_suffix_of(date.getDate()) + ' ' + date.getFullYear()
  }

  function text_block_selected_first (date, number_of_tx) {
    return '\
    <div class="container">\
    This block was created on <b>' + datetime_nice(date) + '</b> with <b>' + number_of_tx + '</b> transactions. <br>\
    Every block contains a Merkle tree, which is a data structure used to verify and authenticate a block\'s integrity. Here, you can see the block\'s Merkle tree and its shape and structure is determined by how expensive it was to create, an indicator of the overall network health. Each block has a signature that defines its sound, and that signature is created by the number and time of the transactions. Each sound loops and accumulates.\
    </div>'
  }
  function text_block_selected (date, number_of_tx, value) {
    return '<div class="container">This block was created on <b>' + datetime_nice(date) + '</b> from <b>' + number_of_tx + '</b> transactions with a total value of <em class="fa fa-bitcoin"></em> <b>' + value + '</b>.</div>'
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
        $('#details .date').text(date_nice(new Date(date_arr[2], (date_arr[1] * 1 - 1), (date_arr[0] * 1))))
        $('#loading_text').html(svgloader_b)
        $('#welcome_text').addClass('off')
        // alert(dateText);
        app.setDate(new Date(date_arr[2], (date_arr[1] * 1 - 1), (date_arr[0] * 1)))
      },
      onClose: function () {
          // $(this).datepicker("widget").removeClass("ll-skin-melon");
      }
    })
  }

  //					<div class="datepicker ll-skin-melon"></div>
  $('#io_intro_hud').html('<div id="welcome_text" class=""></div>')

	// check that browser supports webgl
  if (!orpheusApp.canRun) {
    $('#welcome_text').html('<p>WebGL Error</p>')
    setTimeout(function () {
      $('#welcome_text').remove(); IOHP2()
    }, 1500)
  }

  //			<form id=symphony-search-form><input id=symphony-search-field type=text placeholder="Enter Block Hash..."> <button id=symphony-search-button>Go</button></form>

  $('#io_intro').html('<canvas id="stage" style=""></canvas>')
  $('#io_intro_hud').html('\
  <div id="mousemove_note" class="none"></div>\
  <div id="welcome_text" class=""></div>\
  <div id="loading_text" class=""></div>\
  <div id="hudx">\
  <div class="search_control none"><a href="javascript:io_class_toggle(\'#search_box\',\'none\')"><em class="fa fa-search"></em></a></div>\
  <div class="credits_control none"><a href="javascript:io_class_toggle(\'#credits_box\',\'none\')"><em class="fa fa-certificate"></em></a></div>\
    <div class="sound_control none"><a href="javascript:io_class_toggle(\'.sound_control\',\'off\')" id="mute"><em class="fa fa-volume-off"></em></a><a href="javascript:io_class_toggle(\'.sound_control\',\'off\')" id="unmute"><em class="fa fa-volume-up"></em></a></div><div id="intro_text" class=""></div>\
    <div id="search_box" class="none">\
      <div class="container">\
        <form action="" method="POST" id="symphony-search-form"><div class="input-group">\
          <input type="text" id="symphony-search-field" class="form-control" placeholder="Insert block hash" aria-describedby="search-input"><span class="input-group-btn" id="search-input"><button class="btn btn-default" type="submit" id="symphony-search-button"><em class="fa fa-search"></em></button></span>\
        </div></form>\
      </div>\
    </div>\
    <div id="credits_box" class="none">\
      <div class="container">\
        Logos\
      </div>\
    </div>\
    <div id="details" class="uppercase empty"></div>\
    <div id="timeline" class="nomobile none">\
      <div class="container">\
      <div class="row">\
      <div class="col-md-14">' + io_intro_timeline() + '</div>\
      <div class="col-md-8 col-md-offset-2"><input type="text" value="000000" id="datepicker" class="datepicker ll-skin-melon" /></div>\
    </div></div></div></div>')

  $('#loading_text').html(svgloader_b)

  /// //////////////////
  // Create the Orpeus App
  orpheusApp({ path: '/dist/static/assets/' }).then(app => {
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

    app.on('dayChanged', ({ date, input, output, fee }) => {
      days_loaded++
      var date_prev = new Date()
      var date_next = new Date()
      date_prev.setDate(date.getDate() - 1)
      date_next.setDate(date.getDate() + 1)

      hudx = '\
      <a href="javascript:io_class_toggle(\'#details\',\'off\')" class="opener"><em class="fa fa-chevron-down off"></em><em class="fa fa-list-alt on"></em></a>\
      <div class="container">\
      \
      <h4 class="tit"><span>Blockchain Day View</span> <br class="nodesktop" /><b class="date">' + date_nice(date) + '</b>  &nbsp; <input type="text" value="000000" id="datepicker2" class="datepicker ll-skin-melon none" /> <a href="#" class="datepicker_icon"><em class="fa fa-calendar"></em></a><span class="pull-right"><a href="#" title="Previous day" class="day_prev" rel="' + date_prev.getFullYear() + '/' + date_prev.getMonth() + '/' + date_prev.getDate() + '"><em class="fa fa-chevron-left"></em></a> &nbsp; <a href="#" title="Next day" class="day_prev" rel="' + date_next.getFullYear() + '/' + date_next.getMonth() + '/' + date_next.getDate() + '"><em class="fa fa-chevron-right"></em></a></span></h4>\
      <div class="row">\
      <div class="col-lg-8 col-sm-12"><small>Fee</small> <em class="fa fa-bitcoin"></em> <b>' + (fee / 100000000).toLocaleString('en') + '</b></div>\
      <div class="col-lg-8 col-sm-12"><small>Total Input Value</small> <em class="fa fa-bitcoin"></em> <b>' + (input / 100000000).toLocaleString('en') + '</b></div>\
      <div class="col-lg-8 col-sm-12"><small>Total Output Value</small> <em class="fa fa-bitcoin"></em> <b>' + (output / 100000000).toLocaleString('en') + '</b></div>\
      </div>\
      </div>'
      date_selected = date
      latest_block_date = hudx

      if (days_loaded == 1) {
        console.log('first day of blocks loaded')
        $('#intro_text').addClass('empty')
        $('#welcome_text').addClass('off')
        $('.sound_control').removeClass('none')
        // $(".search_control").removeClass('none');
        setTimeout(function () {
          $('#welcome_text').html(intro_text)
          $('#welcome_text').removeClass('off')
        }, 1500)
      } else {
        $('#welcome_text').removeClass('off')
        if (blocks_selected > 0) {
          $('#intro_text').addClass('empty').html('')
          $('#welcome_text').addClass('none').html('')
        }
      }

      $('#details').removeClass('empty').html(hudx)
      $('.datepicker').val(num_pad(date.getDate()) + '/' + num_pad(date.getMonth() + 1) + '/' + date.getFullYear())
      datepicker_init()

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
      $('.datepicker_icon').click(function (e) {
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
    $('#welcome_text').addClass('off')
    setTimeout(function () {
      $('#welcome_text').addClass('none').html('')
    }, 1500)
    if ($('#intro_text').hasClass('empty')) {
      $('#intro_text').removeClass('empty')
    }
    blocks_selected++
    if (blocks_selected == 1) {
      $('#intro_text').html(intro_text_pref + text_block_selected_first(time, n_tx))
    } else {
      $('#intro_text').html(intro_text_pref + text_block_selected(time, n_tx, output.toLocaleString('USD')))
    }
    hudx = '\
        <a href="javascript:io_class_toggle(\'#details\',\'off\')" class="opener"><em class="fa fa-chevron-down off"></em><em class="fa fa-list-alt on"></em></a>\
        <div class="container">\
        <h4 class="tit"><a href="#" class="back nomobile"><em class="fa fa-arrow-left"></em></a> <em class="fa fa-bitcoin"></em> <span>Bitcoin</span> <br class="nodesktop" /><b>Block ' + hash.substr(-16) + '</b> &nbsp; <span class="pull-right"><a href="#" title="Previous block" class="block_prev"><em class="fa fa-chevron-left"></em></a> &nbsp; <a href="#" title="Next block" class="block_next"><em class="fa fa-chevron-right"></em></a></span></h4>\
          <div class="row">\
          <div class="col-lg-8 col-sm-12 col-xs-12"><small>Block time</small><br class="nodesktop" /> <b>' + datetime_nice(time) + '</b></div>\
          <div class="col-lg-8 col-sm-12 col-xs-12"><small>Bits</small><br class="nodesktop" /> ' + (bits / 100000000).toLocaleString('en') + '</div>\
          <div class="col-lg-8 col-sm-12 col-xs-12"><small>Fee</small><br class="nodesktop" /> <em class="fa fa-bitcoin"></em> <b>' + (fee / 100000000).toLocaleString('en') + '</b></div>\
          <div class="col-lg-8 col-sm-12 col-xs-12"><small>Fee Level</small><br class="nodesktop" /> ' + feeToInputRatio + '</div>\
          <div class="col-lg-8 col-sm-12 col-xs-12 nomobile"><small>Block height</small><br class="nodesktop" /> ' + height + '</div>\
          <div class="col-lg-8 col-sm-12 col-xs-12 nomobile"><small>Block Hash</small><br class="nodesktop" /> ' + hash.substr(-16) + '</div>\
          <div class="col-lg-8 col-sm-12 col-xs-12"><small>Total Input Value</small><br class="nodesktop" /> <em class="fa fa-bitcoin"></em> <b>' + (input / 100000000).toLocaleString('en') + '</b></div>\
          <div class="col-lg-8 col-sm-12 col-xs-12"><small>Total Output Value</small><br class="nodesktop" /> <em class="fa fa-bitcoin"></em> <b>' + (output / 100000000).toLocaleString('en') + '</b></div>\
          <div class="col-lg-8 col-sm-12 col-xs-12"><small>Number of Transactions</small><br class="nodesktop" /> ' + n_tx + '</div>\
          </div>\
        </div>\
        '
    $('#details').html(hudx)

    $('.block_prev').click(function (e) {
      e.preventDefault()
      app.goToPrevBlock()
    })
    $('.block_next').click(function (e) {
      e.preventDefault()
      app.goToNextBlock()
    })
    $('#details .back').click(function (e) {
      e.preventDefault()
      app.resetDayView()
    })
  	})


    app.on('blockMouseOver', () => {
        document.body.style.cursor = "pointer";
    })
    app.on('blockMouseOut', () => {
        document.body.style.cursor = "default";
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

/*
    app.on('blockHovered', data => {
      var hudx = '\
      <div class="uppercase">\
      <h4>BLOCK <b>'+data.hash.substr(-16)+'</b></h4>\
      <div class=""><small>Block time</small> '+datetime_nice(new Date(data.time*1000))+'</div>\
      <div class=""><small>bits</small> '+data.bits.toLocaleString('en')+'</div>\
      <div class=""><small>Fee</small> <em class="fa fa-bitcoin"></em> '+data.fee.toLocaleString('en')+'</div>\
      <div class=""><small>Input Value</small> <em class="fa fa-bitcoin"></em> '+data.input.toLocaleString('en')+'</div>\
      <div class=""><small>Output Value</small> <em class="fa fa-bitcoin"></em> '+data.output.toLocaleString('en')+'</div>\
      <div class=""><small>Transactions</small> '+data.n_tx+'</div>\
  		</div>';
      $("#mousemove_note").html(hudx);
      console.log(data);
    } ) */
  	/*
  		Event for whenever a block is unselected
  	*/
  	app.on('blockUnselected', _ => {
    $('#intro_text').addClass('empty').html('')
    $('#details').html(latest_block_date)
    $('.datepicker').val(num_pad(date_selected.getDate()) + '/' + num_pad(date_selected.getMonth() + 1) + '/' + date_selected.getFullYear())
    datepicker_init()
    $('.datepicker_icon').click(function (e) {
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
          $('#welcome_text').addClass('off')
          setTimeout(function () {
            $('#welcome_text').html(intro_onscroll)
            $('#welcome_text').removeClass('off')
          }, 1500)
        }
      } else {
        $('#welcome_text').addClass('none').html('')
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

function io_intro_init () {
  lime = null
  $('#io_intro').empty()
  $('#entry').addClass('off')
  $('#intro_parallax').addClass('off')
  $('#io_intro').removeClass('waiting')

  var ww = jQuery(window).width()
  var wh = jQuery(window).height()

  if (webglIE) {
    if (ww > 239) {
      io_intro_gui()
      io_intro_render()
			/**
			jQuery("#io_intro_nav").show(0);
			jQuery(".intro_gui-"+io_intro_num).addClass('opened');
			jQuery("#io_intro_label strong").html(intro_label[io_intro_num]);
			jQuery("#io_intro_label .desc").html('<span class="message">'+io_intro_rule_desc[0][0]+'</span>');
		*/
    } else {
      io_intro_error('')
    }
  } else {
    io_intro_error(io_webgl_error_message)
  }
}

function io_intro_kill () {
  $('body').removeAttr('style')
  $('#app').remove()
  if (io_intro_animation != null) {
    io_intro_animation.stop()
    io_intro_animation = null
  }
  lime = {}
  jQuery('#io_intro').empty()
  jQuery('#io_intro_nav').hide(0)
}

var io_intro_gui_setup = false
function io_intro_gui () {
	// alert(sec);
	// jQuery("#intro_gui_loader").html(intro_gui_set_var[sec]); io_intro_num
	// <div id="intro_gui-0" class="row intro_gui_row">

  jQuery('.io_intro_zoom').slider({
    max: 16,
    max: 80,
    value: 16,
    change: function (event, ui) {
      if (io_intro_animation != null) {
        io_intro_animation.updateZoom(ui.value)
      }
      jQuery('#io_intro_zoom_val').val(ui.value)
    }
  })

  jQuery('.intro_gui-0 .colors .swatches').each(function (index) {
    jQuery(this).append(io_color_swatches(0, index, 8))
  })

  jQuery('.intro_gui-1 .colors .swatches').each(function (index) {
    jQuery(this).append(io_color_swatches(1, index, 9))
  })

  jQuery('#io_intro_nav .dropdown-menu a').click(function (e) {
    var txt = jQuery(this).text()
    jQuery(this).parent().parent().prev().find('.lab').text(txt)
  })

  jQuery('#io_intro2_distance').slider({
    max: 0,
    max: 300,
    value: 0,
    change: function (event, ui) {
      if (io_intro_animation != null) {
        io_intro_animation.changeSampleDistance(ui.value / 200)
      }
    }
  })
  jQuery('#io_intro2_wave').slider({
    max: 0,
    max: 60,
    value: 0,
    change: function (event, ui) {
      if (io_intro_animation != null) {
        io_intro_animation.changeWaveFactor(ui.value / 500)
      }
    }
  })
  jQuery('#io_intro2_expand').slider({
    max: 0,
    max: 300,
    value: 165,
    change: function (event, ui) {
      if (io_intro_animation != null) {
        io_intro_animation.expandTo(ui.value / 100)
      }
    }
  })
  jQuery('#io_intro2_size').slider({
    max: 0,
    max: 200,
    value: 120,
    change: function (event, ui) {
      if (io_intro_animation != null) {
        io_intro_animation.resizeTo(ui.value / 100)
      }
    }
  })

  jQuery('#io_intro_nav-opener').click(function () {
    if (!jQuery('#io_intro_nav').hasClass('ok')) {
      setTimeout(function () {
        jQuery('#io_intro_nav').addClass('ok')
      }, 500)
    } else {
      jQuery('#io_intro_nav').removeClass('ok')
    }
  })

  jQuery('#io_intro_nav .changeRule').each(function (index) {
    jQuery(this).click(function () {
      jQuery('#io_intro_label .desc').html('<span class="message">' + io_intro_rule_desc[1][index] + '</span>')
    })
  })
  jQuery('#io_intro_gui-play').attr('class', 'play pause')
}

function io_intro_render () {
  var parameters = {}
  io_intro_animation = null

  var ww = jQuery(window).width()
  var wh = jQuery(window).height()

  setTimeout(function () {
    if (is_safari) {
      use_shader = 1
    }

    parameters = {
      'particle_path': '/js/intro/textures/particle3.png',
      'container_id': 'io_intro',
      'renderer_id': 'io_intro_renderer',
      'stats_id': 'io_intro_stats',
      'gui_id': 'io_intro_gui',
      'background_color': '#ff0000',
      'electrolized_path': '/js/intro/libs/electrolized.js',
      'spec_path1': '/js/intro/textures/spec_body_squared.jpg',
      'spec_path2': '/js/intro/textures/spec_body5.jpg',
      'spec_path3': '/js/intro/textures/spec_line2.jpg',
      'spec_path4': '/js/intro/textures/spec_body11.jpg',
      'shader_to_use': use_shader,
      'header_text': ' ',
      'focal_length_name': ' ',
      'quality_name': '  ',
      'color_theme_name': '  ',
      'main_color_name': ' ',
      'secondary_color_name': ' ',
      'spheres_color_name': ' ',
      'next_name': 'next ',
      'play_name': 'play ',
      'pause_name': 'pause ',
      'reset_name': 'reset ',
      'next_animation_name': ' ',
            // VERSION 4.5"
      'focal_length_init_val': 20,
            // VERSION 4.6
      'spec_path': '/js/intro/textures/spec_body56B.jpg',
	        'background_stars_count': 100,
	        'now_playing': io_intro_num,

	        // params for anim 2
      'initial_rule': undefined, //
      'initial_theme': 'sky', //
      'initial_primary_color': undefined,
      'initial_secondary_color': undefined,
      'initial_background_color': '#0A0001'
    }

    function onDocumentKeyDown (event) {
      if (event.keyCode == 32) {
        io_intro_pauseplay()
      }
    }

    if (io_intro_animation == null) {
	        io_intro_animation = new Animation01(function () {
          io_intro_error(io_webgl_error_message)
        })
    }

    io_intro_animation.setup(parameters, function () {
      jQuery('.intro_gui-' + io_intro_num).addClass('opened')
      jQuery('#io_intro_label strong').html(intro_label[io_intro_num])
      if (io_intro_num == 1) {
        jQuery('#io_intro_label .desc').html('<span class="message">' + io_intro_rule_desc[io_intro_num][3] + '</span>')
      } else {
        jQuery('#io_intro_label .desc').html('<span class="message">' + io_intro_rule_desc[io_intro_num][0] + '</span>')
      }

	        document.addEventListener('keydown', onDocumentKeyDown, false)

	        document.getElementById('io_intro_gui-play').addEventListener('click', function () { io_intro_pauseplay() })
	        document.getElementById('io_intro_gui-refresh').addEventListener('click', function () {
	        	io_intro_animation.reset()
	        	io_intro_default_gui()
	        })
	        document.getElementById('io_intro_gui-forward').addEventListener('click', function () {
          jQuery('#io_intro').addClass('switch')

	        	setTimeout(function () {
	        	  	io_intro_animation.next()
	        	  	io_intro_animation.reset()
	        	  	if (!io_intro_animation.isRunning()) {
				        io_intro_animation.run()
				    }
	        	  	io_intro_default_gui()
		        	io_intro_num++
          if (io_intro_num > 1) {
            io_intro_num = 0
          }
          jQuery('#io_intro_label strong').html(intro_label[io_intro_num])
          if (io_intro_num == 1) {
            jQuery('#io_intro_label .desc').html('<span class="message">' + io_intro_rule_desc[io_intro_num][3] + '</span>')
          } else {
            jQuery('#io_intro_label .desc').html('<span class="message">' + io_intro_rule_desc[io_intro_num][0] + '</span>')
          }

          jQuery('.intro_gui_row.opened').removeClass('opened')
          jQuery('.intro_gui-' + io_intro_num).addClass('opened')
          jQuery('#io_intro').removeClass('switch')
        }, 1000)
	        })

	      	io_intro_animation.reset()

			// jQuery("#io_intro_renderer").css({height:wh+'px'});
      jQuery('#io_intro').addClass('in')
      if (io_intro_num == 0) {
        if (ww < wh) {
          io_intro_animation.updateZoom(25)
        } else {
          io_intro_animation.updateZoom(16)
        }
        io_intro_animation.updateTheme(1)
        io_intro_animation.updateColorMain('#ff0000')
      }
	    	io_intro_animation.run()
	    	jQuery('#entry').hide(0)
	    	jQuery('#io_intro_nav').show(0)
	    	jQuery('#intro_loading').addClass('in')
    },
        function () {
          console.log('animation has ended')
        })
  }, 500)
}

function io_color_swatches (an, sec, num) {
  var fun = 'io_intro_animation.updateColorMain'
  if (an == 1) {
    fun = 'io_intro_theme2_colors'
  }
  if (sec == 1) {
    fun = 'io_intro_animation.updateColorSecondary'
    if (an == 1) {
      fun = 'changeColorSecondary'
    }
  }
  if (sec == 2) {
    fun = 'io_intro_animation.updateColorSphere'
  }
  var out = ''
  for (var i = 0; i < num; i++) {
    var clr = io_intro_colors.random()
    if (an == 1) {
      clr = io_intro_swatches[1][i]
    }
    out += '<a class="swatch rounded" style="background:' + clr + '" href="javascript:' + fun + '('
    out += "'" + clr + "'"
    out += ')"></a>'
  }
  return out
}

function io_intro_theme2_colors (col) {
  io_intro_animation.changeColorMain(col)
  io_intro_animation.changeColorSecondary(col)
}

function io_intro_theme_update (sec, th) {
  if (sec == 1) {
    	if (th == 0) {
    		io_intro_animation.changeThemeTo('radioactive')
    		// io_intro_animation.changeRuleTo('organic');
    	}
    	if (th == 1) {
    		io_intro_animation.changeThemeTo('sky')
    		// io_intro_animation.changeRuleTo('whale');
    	}
    	if (th == 2) {
    		io_intro_animation.changeThemeTo('oasis')
    		// io_intro_animation.changeRuleTo('city');
    	}
    	if (th == 3) {
    		io_intro_animation.changeThemeTo('hallucination')
    		// io_intro_animation.changeRuleTo('pong');
    	}
  }
}

function io_intro_default_gui () {
  jQuery('.io_intro_zoom').slider({value: 16})

  if (io_intro_num == 1) {
    jQuery('#io_intro_label .desc').html('<span class="message">' + io_intro_rule_desc[io_intro_num][3] + '</span>')
  } else {
    jQuery('#io_intro_label .desc').html('<span class="message">' + io_intro_rule_desc[io_intro_num][0] + '</span>')
  }

  if (io_intro_num == 1) {
    jQuery('#io_intro2_distance').slider({value: 0})
    jQuery('#io_intro2_wave').slider({value: 0})
    jQuery('#io_intro2_expand').slider({value: 165})
    jQuery('#io_intro2_size').slider({value: 120})

    io_intro_animation.changeColorMain('#bb4773')
    io_intro_animation.changeColorSecondary('#8e669b')
    io_intro_animation.changeThemeTo('berry')
    io_intro_animation.changeRuleTo('standard life')

    io_intro_animation.changeSampleDistance(0)
    io_intro_animation.changeWaveFactor(0)
    io_intro_animation.expandTo(1)
    io_intro_animation.resizeTo(1)
  }
}
