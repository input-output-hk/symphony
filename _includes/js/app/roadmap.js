var rm_lang_current = 'en';

var rm_lang = new Object();

rm_lang['en'] = new Object();
rm_lang['en']['progress'] = 'Progress';

rm_lang['jp'] = new Object();
rm_lang['jp']['progress'] = '進捗';

rm_lang['cn'] = new Object();
rm_lang['cn']['progress'] = '进展';

rm_lang['kr'] = new Object();
rm_lang['kr']['progress'] = '진행';

var milestone_header = '';
var lang = $("#lang_meta").attr('content');
var countdown_clock = '<br>\
<h5 class="text-center opa30">'+rm_labels[lang]['readmorein']+'</h5>\
<div id="countdown" class="hidden">\
  <div class="display days">\
    <div class="circle">\
      <div class="counter">00</div>\
    </div>\
    <div class="unit">'+rm_labels[lang]['days']+'</div>\
  </div>\
  <div class="separator">:</div>\
  <div class="display hours">\
    <div class="circle">\
      <div class="counter">00</div>\
    </div>\
    <div class="unit">'+rm_labels[lang]['hours']+'</div>\
  </div>\
  <div class="separator">:</div>\
  <div class="display minutes">\
    <div class="circle">\
      <div class="counter">00</div>\
    </div>\
    <div class="unit">'+rm_labels[lang]['minutes']+'</div>\
  </div>\
  <div class="separator">:</div>\
  <div class="display seconds">\
    <div class="circle">\
      <div class="counter">00</div>\
    </div>\
    <div class="unit">'+rm_labels[lang]['seconds']+'</div>\
  </div>\
</div>\
';

var rm_icons = new Object();
rm_icons['press'] = '<em class="icon-book-open"></em>';
rm_icons['research'] = '<em class="icon-eyeglasses"></em>';
rm_icons['launch'] = '<em class="icon-rocket"></em>';
rm_icons['github'] = '<em class="fa fa-github"></em>';
rm_icons['presentation'] = '<em class="icon-eye"></em>';




var rm_month = new Array(' ','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');

$.fn.scrollEnd = function(callback, timeout) {
  $(this).scroll(function(){
    var $this = $(this);
    if ($this.data('scrollTimeout')) {
      clearTimeout($this.data('scrollTimeout'));
    }
    $this.data('scrollTimeout', setTimeout(callback,timeout));
  });
};


function io_video_modal_update() {
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


function rm_strip(html){
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}
function rm_slug(str) {
    var re = /[^a-z0-9]+/gi; // global and case insensitive matching of non-char/non-numeric
    var re2 = /^-*|-*$/g;     // get rid of any leading/trailing dashes
    str = str.replace(re, '-');  // perform the 1st regexp
    return str.replace(re2, '').toLowerCase(); // ..aaand the second + return lowercased result
}

function rm_class_toggle(cls,tgl) {
    jQuery(cls).toggleClass(tgl);
}

function rm_progress_label(num){
  var lang = $("#lang_meta").attr('content');
  var out = 'Early Development';
  if(lang == 'jp'){ out = '初期開発';  }
  if(lang == 'cn'){ out = '早期发展';  }
  if(lang == 'kr'){ out = '초기 개발';  }
  if(num >= 30){
    out = 'Implementing';
    if(lang == 'jp'){ out = '実装';  }
    if(lang == 'cn'){ out = '实施';  }
    if(lang == 'kr'){ out = '구현 중';  }
  }
  if(num >= 60){
    out = 'Review';
    if(lang == 'jp'){ out = 'レビュー';  }
    if(lang == 'cn'){ out = '评论';  }
    if(lang == 'kr'){ out = '리뷰';  }
  }
  if(num >= 85){
    out = 'Deployed';
    if(lang == 'jp'){ out = '配置';  }
    if(lang == 'cn'){ out = '部署';  }
    if(lang == 'kr'){ out = '전개';  }
  }
  return out;
}

function rm_get_member(auth){
	var out = false;
	for(var i=0;i<io_team_arr.length;i++){
    if(io_team_arr[i]['mail'] == auth){
			out = i;
		}
    if(io_team_arr[i]['tit'] == auth){
			out = i;
		}
	}
	return out;
}
var new_item = '';
function rm_item(item){
  var title = item.gsx$title.$t;
  var lang = $("#lang_meta").attr('content');
  var out = '';
  var links = '';
  var links_arr = new Array();
  var pdf = item.gsx$pdf.$t;
  var link = item.gsx$link.$t;
	var symphony = item.gsx$subcategory.$t;
  var github = item.gsx$github.$t;
  var updated_item = '';
  if(item.gsx$newtag != undefined){
    new_item = item.gsx$newtag.$t;
  }
  if(item.gsx$updatedtag != undefined){
    updated_item = item.gsx$updatedtag.$t;
  }

  var reddit = '';
  if(item.gsx$reddit != undefined){    reddit = item.gsx$reddit.$t;  }
  var slack = '';
  if(item.gsx$slack != undefined){    slack = item.gsx$slack.$t;  }

  var image1 = '';
  if(item.gsx$image1 != undefined){    image1 = item.gsx$image1.$t;  }
  var image1caption = '';
  if(item.gsx$image1caption != undefined){    image1caption = item.gsx$image1caption.$t;  }
  var image1link = '';
  if(item.gsx$image1link != undefined){    image1link = item.gsx$image1link.$t;  }

  var image2 = '';
  if(item.gsx$image2 != undefined){    image2 = item.gsx$image2.$t;  }
  var image2caption = '';
  if(item.gsx$image2caption != undefined){    image2caption = item.gsx$image2caption.$t;  }
  var image2link = '';
  if(item.gsx$image2link != undefined){    image2link = item.gsx$image2link.$t;  }

  var image3 = '';
  if(item.gsx$image3 != undefined){    image3 = item.gsx$image3.$t;  }
  var image3caption = '';
  if(item.gsx$image3caption != undefined){    image3caption = item.gsx$image3caption.$t;  }
  var image3link = '';
  if(item.gsx$image3link != undefined){    image3link = item.gsx$image3link.$t;  }

  var image4 = '';
  if(item.gsx$image4 != undefined){    image4 = item.gsx$image4.$t;  }
  var image4caption = '';
  if(item.gsx$image4caption != undefined){    image4caption = item.gsx$image4caption.$t;  }
  var image4link = '';
  if(item.gsx$image4link != undefined){    image4link = item.gsx$image4link.$t;  }

  var image5 = '';
  if(item.gsx$image5 != undefined){    image5 = item.gsx$image5.$t;  }
  var image5caption = '';
  if(item.gsx$image5caption != undefined){    image5caption = item.gsx$image5caption.$t;  }
  var image5link = '';
  if(item.gsx$image5link != undefined){    image5link = item.gsx$image5link.$t;  }

  var video = item.gsx$video.$t;
  var contact = item.gsx$contact.$t;
  var icon = item.gsx$icon.$t;
  var state = item.gsx$done.$t;
  var owner = item.gsx$owner.$t;
  var hidden = item.gsx$hidden.$t;
  var owner_arr = item.gsx$owner.$t.split(',');


  if(pdf != ''){
   links_arr.push('<a href="'+pdf+'" class="pdf" target="_blank"><em class="fa fa-file-pdf-o"></em></a>');
  }
  if(github != ''){
   links_arr.push('<a href="'+github+'" class="github" target="_blank" title="'+io_nohttp(github)+'"><em class="fa fa-github"></em></a>');
  }
  if(reddit != ''){
   links_arr.push('<a href="'+reddit+'" class="reddit" target="_blank" title="'+io_nohttp(reddit)+'"><em class="fa fa-reddit"></em></a>');
  }
  if(slack != ''){
   links_arr.push('<a href="'+slack+'" class="slack" target="_blank" title="'+io_nohttp(slack)+'"><em class="fa fa-commenting-o"></em></a>');
  }

  /*  if(image1 != ''){
   links_arr.push('<a data-fancybox="'+io_nohttp(title)+'" data-caption="'+image1caption+'" href="'+image1+'" class="imageButton" target="_blank" title="'+io_nohttp(title)+'"><em class="fa fa-picture-o"></em></a><span data-fancybox="'+io_nohttp(title)+'" data-caption="'+image2caption+'" href="'+image2+'" class="imageButton" target="_blank" title="'+io_nohttp(title)+'"></span><span data-fancybox="'+io_nohttp(title)+'" data-caption="'+image3caption+'" href="'+image3+'" class="imageButton" target="_blank" title="'+io_nohttp(title)+'"></span><br><br><img data-fancybox="'+io_nohttp(title)+'" data-caption="'+image1caption+'" href="'+image1+'" width="100%" height="100px" src="'+image1+'"/>');
  }*/

  if(contact != ''){
   links_arr.push('<a href="'+contact+'" class="external-link" target="_blank" title="'+io_nohttp(contact)+'"><em class="fa fa-external-link"></em></a>');
  }
  if(video != ''){
    var video_arr = new Array();
    video_arr = video.split('/');
   links_arr.push('<a href="'+video+'" class="video iohk_video_load_modal" target="_blank" rel="'+video_arr[video_arr.length-1]+'"><em class="fa fa-youtube-play"></em></a>');
  }

  /*if (image1 != '') {
    links_arr.push('<a href="#'+decodeURI(title)+'-1"><em class="fa fa-picture-o"></em></a>');
  }*/
  var updated_label = '';
  if(updated_item != ''){
    links_arr.push('<span class="updated_label text-center"><img src="/static/assets/images/issue/updated-label.svg" alt="" /></span>');
  }
  var new_label = '';
  if(new_item != ''){
    links_arr.push('<span class="new_label text-center"><img src="/static/assets/images/issue/new-label.svg" alt="" /></span>');
  }
  links = links_arr.join('<span class="dash">—</span>');


  var img_arr = new Array();



  if(image1 != ''){    img_arr.push('<img class="gallery-thumbnail fancybox" data-fancybox="'+io_nohttp(title)+'" data-caption="'+image1caption+'" href="'+image1link+'" src="'+image1+'"/>');  }else{    image2 = '';  }
  if(image2 != ''){    img_arr.push('<img class="gallery-thumbnail fancybox" data-fancybox="'+io_nohttp(title)+'" data-caption="'+image2caption+'" href="'+image2link+'" src="'+image2+'"/>');  }else{    image2 = '';  }
  if(image3 != ''){    img_arr.push('<img class="gallery-thumbnail fancybox" data-fancybox="'+io_nohttp(title)+'" data-caption="'+image3caption+'" href="'+image3link+'" src="'+image3+'"/>');  }else{    image3 = '';  }
  if(image4 != ''){    img_arr.push('<img class="gallery-thumbnail fancybox" data-fancybox="'+io_nohttp(title)+'" data-caption="'+image4caption+'" href="'+image4link+'" src="'+image4+'"/>');  }else{    image4 = '';  }
  if(image5 != ''){    img_arr.push('<img class="gallery-thumbnail fancybox" data-fancybox="'+io_nohttp(title)+'" data-caption="'+image5caption+'" href="'+image5link+'" src="'+image5+'"/>');  }else{    image5 = '';  }

  if(img_arr.length > 0){
    links_arr.push('<div class="gallery">'+img_arr.join('')+'</div>');
    links = links_arr.join(' ');
  }


  if(state != ''){
     state = '\
     <div class="state">\
       <h5>'+rm_lang[lang]['progress']+' <span class="val">'+state+'%</span></h5>\
       <div class="bar"><div class="done" style="width:'+state+'%"></div></div>\
       <h5>'+rm_progress_label(state)+'</h5>\
     </div>\
     ';
  }

  var owner_cls = 'noowner';
	if(owner != ''){
	  if(owner_arr.length > 0){
      owner_cls = '';
	    var owner = '<span class="author">';
	    if(links_arr.length != 0){
	      owner += '<span class="author__dash left">—</span>';
	    }
	    for(var i = 0;i < owner_arr.length;i++){
	      var auth_id = rm_get_member(owner_arr[i].trim());
				//console.log(auth_id);
				if(auth_id){
					if(i < 0){
		        if(links_arr.length != 0){
		          owner += '<span class="author__dash">—</span>';
		        }
		      }
          var owner_link = 'https://iohk.io/team/'+io_team_arr[auth_id]['key'];
          if(io_team_arr[auth_id]['redirect'] != undefined){
            if(io_team_arr[auth_id]['redirect'] != ''){
              owner_link = io_team_arr[auth_id]['redirect'];
            }
          }
		      owner += '<a href="'+owner_link+'/" title="'+io_team_arr[auth_id]['tit']+'" target="_blank"><img src="/static/assets/'+io_team_arr[auth_id]['pic']+'" width="40" height="40" alt="'+io_team_arr[auth_id]['tit']+'" /></a>';
				}else{
          owner += '<img src="/static/assets/images/team/member.png" width="40" height="40" alt="" class="img-circle blank-member" />';
        }
	    }

	    owner += '</span>';
      if(owner_arr.length > 4){
				owner_cls = 'owners-toomany';
			}
	  }
	}else{
    owner += '<img src="/static/assets/images/blank.gif" width="40" height="40" alt="" class="img-circle blank-member" />';
  }


  var equal = 2;
  if(lang == 'jp'){
    equal = 3;
  }
  var html_converter = new showdown.Converter();
  var content = item.gsx$description.$t;
  var html = html_converter.makeHtml(content);

  var summary = item.gsx$summary.$t;
  var summary_html = html_converter.makeHtml(summary);

	var expand_cls = 'expanding';
	var expand = '<a href="javascript:;" class="class-toggle opener" data-target="parent" data-toggle="opened"><em class="fa fa-chevron-down"></em><em class="fa fa-chevron-up"></em></a>';
  var expanded = '<div class="summary">'+summary_html+'</div><div class="cont">'+html+'</div>';
  if(content == ''){
		expand_cls = 'noexpand';
    expand = '';
    expanded = '<div class="summary">'+summary_html+'</div>';
  }
  var q = ['0','1','1','1','2','2','2','3','3','3','4','4','4'];
  var date_arr = item.gsx$deadline.$t.split('/');
  var time = '';
  var time_cls = 'notime';
	if(date_arr.length > 1){
    if(rm_month[date_arr[0]*1] != undefined){
      time = '<span class="time">'+date_arr[1]+' '+rm_month[date_arr[0]*1]+' <span class="year">'+date_arr[2]+'</span></span> <hr />';
    }

    time_cls = 'time';
	}
  var symphony_cls = 'nosymphony';
	if(symphony != ''){
		symphony = '<div class="symphony '+io_slug(symphony).replace('-',' ')+' uppercase"><span class="logo"></span> '+symphony+'</div>';
    symphony_cls = 'symphony';
	}
  var icon_cls = 'noicon';
  if(icon != ''){
    icon_cls = '';
		icon = '<img class="icon" src="/static/assets/images/issue/'+icon+'" alt="" />';
  }

  var title = item.gsx$title.$t;

  var title_cls = '';
  if(title == ''){
		title_cls = 'notitle';
  }
  var link_cls = '';
  var link_js = '';
  if(link != ''){
    link_cls = 'linked';
    //link_js = ' onclick="window.location.href=\''+link+'\'"';
		title = '<a href="'+link+'" target="_blank" title="'+io_nohttp(link)+'">'+title+'</a>';
  }

  var subcategory_cls = rm_slug(item.gsx$subcategory.$t);
  var milestone_heading = '';
  var milestone_desc = '';
  var milestone_img = '';
  var milestone_cat = item.gsx$category.$t;


  if(item != undefined){
    if(content != '' || summary != ''){

      out = new_label+milestone_heading+'\
      <div id="" class="item item-symphony item-'+rm_slug(item.gsx$category.$t)+' item-'+rm_slug(item.gsx$subcategory.$t)+' '+rm_slug(item.gsx$version.$t)+' '+expand_cls+' '+owner_cls+'">\
        <div class="spacer clear"></div>\
        <div class="link nodesktop"><img src="/static/assets/images/circle.svg" class="circle" alt="" /></div>\
        <div class="attributes">\
          <div class="link nomobile"><img src="/static/assets/images/circle.svg" class="circle" alt="" /></div>\
          <h2 class="">'+title+' <span class="icon">'+rm_icons[rm_slug(item.gsx$category.$t)]+'</span></h2>\
          <div class="links"> \
            '+owner+'\
          </div>\
          <div class="clear"></div>\
          '+state+'\
        </div><!-- .attributes -->\
        <div class="content">\
        <span class="glow"><img src="/static/assets/images/glow.png" alt="" /></span>\
          <div class="desc">\
            <div class="inner">\
            '+time+' \
            '+expanded+'\
            '+links+'\
            </div>\
   				 '+expand+'\
          </div>\
        </div><!-- .content -->\
        <div class="spacer clear"></div>\
      </div><!-- .item -->\
      ';

      if(item.gsx$title.$t == 'Introduction'){
        var intro_tit = item.gsx$title.$t;
        var intro_sum = html_converter.makeHtml(item.gsx$summary.$t);

        out = '\
        <div class="introduction-small text-center">\
          <h4>'+intro_tit+'</h4><br>\
          <div class="introduction-inner text-left">\
            '+intro_sum+'\
            <br>\
          </div>\
        </div>\
        <br><br>\
        ';
      }

    }
  }

  if(hidden == io_slug('yes')){
    if(milestone_heading != ''){
      return '<div class="timeline short nomobile"></div>'+milestone_heading+'';
    }else{
      return '';
    }
  }


  return out;
}


function rm_item_after(){
    $('.class-toggle').on('click',function(e){
        var pat = $(this).attr('data-target');
        var pat_match = pat.match(/parent/g);
        if(pat_match == null){
            $($(this).attr('data-target')).toggleClass($(this).attr('data-toggle'));
        }else{
            var $new = $(this);
            for(var i=0;i<pat_match.length;i++){
                $new = $new.parent();
            }
            $($new).toggleClass($(this).attr('data-toggle'));
        }
    });
}

function rm_load(){
  $("#roadmap-load").html('');

  var out = '';
  var year = '';
  for(var i = 0;i < roadmap_arr.length;i++){

      out += rm_item(roadmap_arr[i]);


  }

  $("#roadmap-load").html(out);
	$(".nav--lines .dot").removeClass('active');
	$(".nav--container a").removeClass('active');

  $(".countdown--wrap").removeClass('none');

  //$('.introduction-inner').columnize({width:480});
  //countdownTo(Date.UTC(2018, 0, 4, 1, 20, 0));
  //countdownTo(Date.UTC(2018, 0, 5, 0, 0, 0));
  //countdownTo(Date.UTC(2018, 1, 5, 0, 0, 0));

  io_video_modal_update();
  rm_item_after();


$('.gallery-thumbnail.fancybox').fancybox({
    // Options will go here
    selector : '[data-fancybox]',
    loop     : true,
    animationEffect : "zoom",
    prevEffect : 'slide',
    nextEffect : 'fade',
    arrows    : true,
  });


}




function rm_hash_arr(){
  var out = [];
  $("#nav--primary.nav--wrapper a").each(function() {
    if($(this).hasClass('active')){
      out.push($(this).attr('rel'));
    }
  });
  return out;
}


var roadmap_arr = new Array();

function rm_reload(){
  //$("#roadmap-load").html('');
  roadmap_arr = [];
    var url = '/js/content-jan.json';
    url = 'https://spreadsheets.google.com/feeds/list/1d_i5iMBZlFLhKRe4JJv47GDAmMDWrgWPF0nxF0k60to/od6/public/values?alt=json';
    //url = 'https://spreadsheets.google.com/feeds/list/14uD0DMi_HYpJkf4cSSGWDiGyMHoOPeoUArUW1uMmRuo/od6/public/values?alt=json';
    url = '/static/assets/js/roadmap/values1.json';

    $.getJSON(url, function(data) {
        var entry = data.feed.entry;
        //console.log(entry);
        var out = '';
        var year = '';
        $(entry).each(function(){
          roadmap_arr.push(this);
        });
        rm_load();
    });
}

function rm_init(){
  rm_reload();
}
