var io_zotero_json = null;
var io_zotero_setup = false;
var io_zotero_detail = false;
var io_zotero_preview = false;
var io_zotero_group = 478201;
var io_zotero_pubkey = 'Qcjdk4erSuUZ8jvAah59Asef';
var io_zotero_selection = '';
var io_zotero_layout = '';
var io_zotero_default_tag = 'anonymity';
var io_zotero_arr_obj = new Object();
var io_zotero_search_arr_obj = new Object();


var io_zotero_loaded = 0;
var io_zotero_load_reach = 100;

var io_zotero_valid = 0;


var io_zotero_IOHK_papers = false;

var detail_layout = new Object();
detail_layout['default'] = new Array();
detail_layout['default'][0] = 'col-lg-19 col-lg-offset-1 col-md-18 col-md-offset-1 col-sm-17 col-sm-offset-2';
detail_layout['default'][1] = 'col-lg-4 col-md-5 col-sm-6 rightcol';
detail_layout['papers'] = new Array();
detail_layout['papers'][0] = 'col-lg-17 col-lg-offset-1 col-md-16 col-md-offset-1 col-sm-16 col-sm-offset-2';
detail_layout['papers'][1] = 'col-lg-6 col-md-7 col-sm-6 rightcol';


/*
var io_library_tags_arr = new Array();
io_library_tags_arr['anonymity'] = new Object();
io_library_tags_arr['anonymity'].loaded = false;
io_library_tags_arr['attack'] = new Object();
io_library_tags_arr['attack'].loaded = false;
*/
var io_lib_item_selected = '';


var io_zotero_loaded_full = false;
var io_zotero_search_step = 50;
var io_zotero_search_loaded = 0;

var io_zotero_lib_list_tag = ' ';
var io_zotero_lib_list_step = 100;
var io_zotero_lib_list_loaded = 0;

var zotero_current_order = 'desc';
var zotero_current_sort = 'date';

var zotero_order = new Object();
zotero_order.asc = 'Ascending';
zotero_order.desc = 'Descending';


var zotero_sorting = new Object();
zotero_sorting.dateAdded = 'Date Added';
zotero_sorting.date = 'Date';
zotero_sorting.title = 'Title';
zotero_sorting.publisher = 'Publisher';


var library_tools = function(){
	var out = '\
	<li><a href="javascript:io_zotero_view_control('+"'"+'icons-s'+"'"+')" class="view_control active"><em class="fa fa-th"></em></a></li>\
	<li><a href="javascript:io_zotero_view_control('+"'"+'icons-b'+"'"+')" class="view_control"><em class="fa fa-th-large"></em></a></li>\
	<li><a href="javascript:io_zotero_view_control('+"'"+'icons-list'+"'"+')" class="view_control"><em class="fa fa-th-list"></em></a></li>\
	<li class="dropdown sort_by">\
		<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">\
			<span class="extra">Sort by </span><span class="lab">'+zotero_sorting[zotero_current_sort]+'</span>\
			<span class="caret extra"></span>\
		</a>\
		<ul class="dropdown-menu date_sorter">\
			<li><a href="javascript:;" onclick="io_zotero_reorder(this)" rel="sort" val="date">Date</a></li>\
			<li><a href="javascript:;" onclick="io_zotero_reorder(this)" rel="sort" val="title">Title</a></li>\
		</ul>\
	</li>\
	<li class="dropdown sort_by">\
		<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">\
			<span class="lab">'+zotero_order[zotero_current_order]+'</span>\
			<span class="caret extra"></span>\
		</a>\
		<ul class="dropdown-menu">\
			<li><a href="javascript:;" onclick="io_zotero_reorder(this)" rel="order" val="asc">Ascending</a></li>\
			<li><a href="javascript:;" onclick="io_zotero_reorder(this)" rel="order" val="desc">Descending</a></li>\
		</ul>\
	</li>\
';
	return out;
}

var lisec = "/library/";

var library_item_tools = function(){
	var title = io_zotero_arr_obj[io_zotero_selection].data.title;
	var url = homeurl+'/research'+lisec+'#'+io_zotero_arr_obj[io_zotero_selection].key;
	var out = '\
	    <li><a type="button" class=" btn-print" onclick="window.print()"><em class="fa fa-print"></em></a></li>\
	    <li><a type="button" class="" data-title="'+title+'" data-link="'+url+'" onclick="io_send_mail(this)"><em class="fa fa-envelope"></em></a></li>\
	    <li><a href="http://twitter.com/share?url='+url+'&text='+title+'&via=InputOutput" class="" target="_blank"><em class="fa fa-twitter"></em></a></li>\
	    <li><a href="http://www.facebook.com/sharer.php?u='+url+'&t='+title+'" class="" target="_blank"><em class="fa fa-facebook"></em></a></li>\
	    <li><a href="http://www.linkedin.com/shareArticle?mini=true&url='+url+'" class="" target="_blank"><em class="fa fa-linkedin"></em></a></li>\
	    <li><a href="https://plusone.google.com/_/+1/confirm?hl=en&url='+url+'" class="" target="_blank"><em class="fa fa-google-plus"></em></a></li>\
	    <li><a href="http://reddit.com/submit?url='+url+'&title='+title+'" class="" target="_blank"><em class="fa fa-reddit"></em></a></li>\
	';
	return out;
}

var io_zotero_itemtype_icon = new Object();
io_zotero_itemtype_icon['book'] = '<em class="fa fa-book rounded" title="Book"></em>';
io_zotero_itemtype_icon['document'] = '<em class="fa fa-file-o rounded" title="Document"></em>';
io_zotero_itemtype_icon['conferencePaper'] = '<em class="fa fa-file-text-o rounded" title="Conference Paper"></em>';
io_zotero_itemtype_icon['journalArticle'] = '<em class="fa fa-newspaper-o rounded" title="Journal Article"></em>';
io_zotero_itemtype_icon['report'] = '<em class="fa fa-file-text-o rounded" title="Report"></em>';
io_zotero_itemtype_icon['webpage'] = '<em class="fa fa-file-text-o rounded" title="Report"></em>';



function io_get_member(nam){
	var out = false;
	for(var i=0;i<io_team_arr.length;i++){
		if(io_team_arr[i]['key'] == io_slug(io_strip(nam))){
			out = i;
		}
	}
	return out;
}

function io_get_member_link(nam,iohk){
	var out = nam;
	if(iohk){
		out = false;
	}
	var member = io_get_member(nam);
	if(member){
		//out = '<a href="/team/'+io_team_arr[member]['key']+'/" class="ajaxhref profile-link" title="IOHK profile of '+io_team_arr[member]['tit']+'"><img src="/'+io_team_arr[member]['pic']+'" alt="" width="30" height="30" />&nbsp;'+io_team_arr[member]['tit']+'</a>';
		out = '<a href="/team/'+io_team_arr[member]['key']+'/" rel="'+member+'" class="ajaxhref profile-link" title="IOHK profile of '+io_team_arr[member]['tit']+'">'+io_team_arr[member]['tit']+'</a>';
		//out = '<a href="javascript:io_team_pop('+"'"+'#iohk_member-'+member+''+"'"+')" rel="'+member+'" tabindex="0" role="button" data-trigger="focus" class="profile-link" id="iohk_member-'+member+'">'+io_team_arr[member]['tit']+'</a>';
		//<a id="example-popover-2" tabindex="0" role="button" data-trigger="focus">Example popover #2</a>
	}
	return out;
}

function io_zotero_get_attachment(key) {
	var showData = $(target);
    $.getJSON(feed, function (data) {
    	if(data){
    		showData.empty();
			for(var i=0;i<data.length;i++){
				//console.log(data[i].data.title);
				var item = '<div>'+data[i].data.title+'</div>';
				showData.append(item);
			}
    	}
	});
}

function io_zotero_get_tag() {
	var tag = io_hash();
    if(tag){
    	if (tag.match('tag-')) {
	    	tag = tag.replace('tag-','');
	    	return tag;
	    }else{
	    	return false;
	    }
	}else{
    	return false;
    }
}

function io_zotero_get_id() {
	var hash = document.location.hash;
    if (hash.match('#')) {
    	hash = hash.replace('#','');
    	return hash;
    }else{
    	return false;
    }
}

function io_zotero_date(date,pre,d1,d2,end) {
	//2016-09-15T13:13:51Z
	var out = '';
	var arr = date.split('T');
	var date_arr = arr[0].split('-');
	out = pre+date_arr[2]+d1+io_months[date_arr[1]-1]+d2+date_arr[0]+end;
	return out;
}

function io_zotero_tag_ok(tags) {
	var valid = false;
	var has_current_tag = 0;
	if(tags != undefined){
		var tag_filter = io_zotero_get_tag();
		for(var i=0;i<tags.length;i++){
			if (tags[i].tag.match('website-')) {
				//alert(tag_filter);
				if(tag_filter != false){
					valid = false;
					if (tags[i].tag == 'website-'+tag_filter+'') {
						valid = true;
						has_current_tag++;
					}
				}else{
					valid = true;
				}
			}
		}
		if(has_current_tag != 0){
			valid = true;
		}
	}
	return valid;
}

function io_zotero_is_tag_papers(tags) {
	var out = false;
	if(tags != undefined){
		for(var i=0;i<tags.length;i++){
			if (tags[i].tag.match('website-papers')) {
				out = true;
			}
		}
	}
	return out;
}

function io_zotero_tag_papers(tags) {
	var out = '';
	if(io_zotero_is_tag_papers(tags)){
		out = 'IOHK-papers';
	}
	return out;
}

function io_zotero_tag_in_tags(tag,tags) {
	var valid = false;
	var has_current_tag = 0;
	if(tags != undefined){
		var tag_filter = io_zotero_get_tag();
		for(var i=0;i<tags.length;i++){
			if(tag_filter != false){
				if ('website-'+tag_filter == tags[i].tag) {
					valid = true;
				}
			}
		}
	}
	return valid;
}

function io_zotero_item_iohk_creators(dataload) {
	var creators = '';
	if(dataload.data.creators != undefined){
		for(var c=0;c<dataload.data.creators.length;c++){
			if(dataload.data.creators[c].firstName != undefined){
				var member = io_get_member(dataload.data.creators[c].firstName.split(' ').join('&nbsp;')+'&nbsp;'+dataload.data.creators[c].lastName.split(' ').join('&nbsp;'));
				if(member){
					creators += '<li><a href="/team/'+io_team_arr[member]['key']+'/" rel="'+member+'" class="ajaxhref profile-link" title="IOHK profile of '+io_team_arr[member]['tit']+'"><img src="/'+io_team_arr[member]['pic']+'" alt="'+io_team_arr[member]['tit']+'" class="img-circle" width="60" height="60" /> <h3>'+io_team_arr[member]['tit']+'</h3> <p class="uppercase">'+io_team_arr[member]['role']+'<br /><span class="loc">'+io_team_arr[member]['loc']+'</span></p></a></li>';
				}
			}else{
				var member = io_get_member(dataload.data.creators[c].name);
				if(member){
					creators += '<li><a href="/team/'+io_team_arr[member]['key']+'/" rel="'+member+'" class="ajaxhref profile-link" title="IOHK profile of '+io_team_arr[member]['tit']+'"><img src="/'+io_team_arr[member]['pic']+'" alt="'+io_team_arr[member]['tit']+'" class="img-circle" width="60" height="60" /> <h3>'+io_team_arr[member]['tit']+'</h3> <p class="uppercase">'+io_team_arr[member]['role']+'<br /><span class="loc">'+io_team_arr[member]['loc']+'</span></p></a></li>';
				}
			}
		}
	}
	return creators;
}

function io_zotero_item_creators(dataload) {
	var creators = '';
	if(dataload.data.creators != undefined){
		for(var c=0;c<dataload.data.creators.length;c++){
			if(c != 0){
				creators += ', ';
			}
			if(dataload.data.creators[c].firstName != undefined){
				creators += io_get_member_link(dataload.data.creators[c].firstName.split(' ').join('&nbsp;')+'&nbsp;'+dataload.data.creators[c].lastName.split(' ').join('&nbsp;'),false);
			}else{
				creators += io_get_member_link(dataload.data.creators[c].name,false);
			}
		}
	}
	return creators;
}



function io_zotero_library() { // if(io_zotero_tag_ok(data[i].data.tags)){
	var out = '';
	for (var key in io_zotero_arr_obj) {
		var ok = true;
		var router = io_zotero_get_tag();
    	if(router != false){
    		if(io_zotero_tag_in_tags(router,io_zotero_arr_obj[key].data.tags)){
    			//console.log(io_zotero_arr_obj[key]);
				out += io_zotero_library_item(io_zotero_arr_obj[key]);
    		}
    	}else{
			out += io_zotero_library_item(io_zotero_arr_obj[key]);
    	}
	}
	return out;
}

function io_zotero_item_details(dataload) {
	var date = '';

	if(io_zotero_is_tag_papers(dataload.data.tags)){
		io_zotero_IOHK_papers = true;
	}else{
		io_zotero_IOHK_papers = false;
	}


	if(dataload.data.date != undefined && dataload.data.date != ''){
		date = '<em class="fa fa-clock-o"></em> <b>'+dataload.data.date+'</b>';
	}
	var abstractNote = '';
	if(dataload.data.abstractNote != undefined && dataload.data.abstractNote != ''){
		abstractNote += '<div class="abstractNote"><div class="text">'+io_get_urls_in_content(dataload.data.abstractNote).replace(/\n/g, "<br/>")+'</div><div class="grad"></div><a href="javascript:io_class_toggle(';
		abstractNote += "'.abstractNote','showing'";
		abstractNote += ')" class="block button_posts" title="Show all"><em class="fa fa-angle-double-down shower"></em><em class="fa fa-angle-double-up hider"></em></a></div>';
	}

	var place = '';
	if(dataload.data.place != undefined && dataload.data.place != ''){
		place = '<div class="place"><em class="fa fa-globe"></em> '+dataload.data.place+'</div>';
	}
	var ISBN = '';
	if(dataload.data.ISBN != undefined && dataload.data.ISBN != ''){
		ISBN = '<div class="ISBN"><em class="fa fa-book"></em> '+dataload.data.ISBN+'</div>';
	}
	var url = '';
	if(dataload.data.url != undefined && dataload.data.url != ''){
		url = '<div class="url"><a class="btn btn-primary rounded bg_f00 c_fff" href="'+dataload.data.url+'" target="_blank">Link &nbsp;<em class="fa fa-external-link"></em></a></div>';
	}
	var publisher = '';
	if(dataload.data.publisher != undefined && dataload.data.publisher != ''){
		if(date != ''){
			publisher += ', ';
		}
		publisher += dataload.data.publisher;
	}
	if(dataload.data.publicationTitle != undefined && dataload.data.publicationTitle != ''){
		if(date != ''){
			publisher += ', ';
		}
		publisher += dataload.data.publicationTitle;
	}
	var conferenceName = '';
	if(dataload.data.conferenceName != undefined && dataload.data.conferenceName != ''){
		if(dataload.data.conferenceName != dataload.data.publisher){
			if(date != '' || publisher != ''){
				publisher = ', ';
			}
			publisher += dataload.data.conferenceName;
		}
		conferenceName = '<span class="block conferenceName">'+conferenceName+'</span>';
	}
	var libraryCatalog = '';
	if(dataload.data.libraryCatalog != undefined && dataload.data.libraryCatalog != ''){
		if(dataload.data.libraryCatalog != dataload.data.publisher){
			if(dataload.data.libraryCatalog != dataload.data.conferenceName){
				if(date != '' || publisher != ''){
					publisher = ', ';
				}
				publisher += dataload.data.libraryCatalog;
			}
		}
		libraryCatalog = '<span class="block libraryCatalog">'+libraryCatalog+'</span>';
	}
	var extra = '';
	if(dataload.data.extra != undefined && dataload.data.extra != ''){
		if(publisher == ''){
			if(date != '' || publisher != ''){
				publisher = ', ';
			}
			publisher += dataload.data.extra;
		}
		extra = '<span class="block extra"><h6 class="uppercase electrolize">Learn More</h6> '+io_get_urls_in_content(dataload.data.extra).replace(/\n/g, "<br/>")+' <br><br></span>';
	}

	if(publisher != ''){
		publisher = '<span class="publisher">'+publisher+'</span>';
	}

	var icons = '';
	if(dataload.icons != undefined && dataload.icons != ''){
		icons = dataload.icons;
	}
	var tags = '';
	for(var i=0;i<dataload.data.tags.length;i++){
		if (dataload.data.tags[i].tag.match('website-')) {
			var tag_title = dataload.data.tags[i].tag.replace('website-','');
			tags += '<span class="label '+io_slug(dataload.data.tags[i].tag)+'"><a href="#tag-'+io_slug(tag_title)+'"><em class="fa fa-tag"></em> '+tag_title.toUpperCase()+'</a></span> ';
		}
	}

	var authors_iohk = '';
	authors_iohk = io_zotero_item_iohk_creators(dataload);
	if(authors_iohk != ''){
		authors_iohk = '<div class="authors iohk"><h6 class="uppercase electrolize">IOHK team authors</h6><ul>'+authors_iohk+'</ul></div>'
	}

	var out = '';
	//io_zotero_IOHK_papers
	var pretit = '';
	if(io_zotero_is_tag_papers(dataload.data.tags)){
		pretit = '<div class="symbol-wrap"><div class="svg-iohk-symbol"><h3 class="uppercase electrolize"><span class="c_f00">IOHK</span> Paper</h3></div></div>';
	}
	if(io_zotero_layout == 'item'){
		out += '<a href="javascript:io_zotero_item_back_button()" class="back rounded"><em class="fa fa-chevron-left"></em><span>'+iolab_back+'</span></a>\
		'+pretit+'\
		 <h1 class="margint0 roboto">';
		 if(dataload.data.url != undefined && dataload.data.url != ''){
			 out += '<a href="'+dataload.data.url+'" target="_blank">';
		 }
		 out += dataload.data.title;
		 if(dataload.data.url != undefined && dataload.data.url != ''){
			 out += '&nbsp;<sup><small><em class="fa fa-external-link"></em></small></sup></a>';
		 }
		 out += '</h1>';
	}else{
		out += '<button class="close" onclick="io_zotero_item_deselect()"><em class="fa fa-times-circle"></em></button><h2 class="margint0"><a href="#'+dataload.key+'">'+dataload.data.title+'</a></h2>';
	}

	out += '\
    <h4 class="margint0 authors"><em class="fa fa-graduation-cap"></em>&nbsp;'+io_zotero_item_creators(dataload)+'</h4>\
    <div class="url uppercase pull-right">'+url+'</div>\
    <div class="date">'+date+''+io_nohttp(publisher)+'</div>\
    '+conferenceName+'\
    '+libraryCatalog+'\
    <div class="tags">'+tags+'</div>\
    '+place+'\
    '+ISBN+'\
    '+abstractNote+'\
    <div class="row buttons uppercase"><div class="col-sm-12 col-xs-12"><a class="btn btn-primary" href="#'+dataload.key+'">'+iolab_read_more+' &nbsp;<em class="fa fa-chevron-right"></em></a></div><div class="col-sm-12 col-xs-12 text-right"><a class="btn btn-default" href="javascript:io_zotero_item_deselect()">Close</a></div></div>\
	';
/*

<div class="widget">
  <h6 class="uppercase electrolize">{{page.lib_search}} in Library</h6>
  <div id="library_search-widget" class="post_links library_searcher"></div>
  <input id="library-search" type="hidden" class="form-control input-lg" value="{{page.lib_search}}" />
</div>

if($("#library_search-widget").hasClass('library_searcher')){
	io_zotero_search_arr_obj = {};
	io_zotero_search_init = false;
	io_zotero_search('.library_searcher',true);
}
*/
//console.log(dataload.data.tags);

	if(io_zotero_layout == 'item'){

		if(io_zotero_IOHK_papers){
			out = '\
			<div class="'+detail_layout['papers'][0]+'">\
			'+out+'\
			</div>\
			<div class="'+detail_layout['papers'][1]+'">\
			<div id="zotero-file"></div>\
			'+authors_iohk+'\
			'+extra+'\
			</div>\
			';
		}else{
			out = '\
			<div class="'+detail_layout['default'][0]+'">\
			'+out+'\
			</div>\
			<div class="'+detail_layout['default'][1]+'">\
			<div id="zotero-file"></div>\
			</div>\
			';
		}
	}
	return out;
}



function io_zotero_item_back_button() {
	if(io_zotero_arr_obj.length > 1){
		window.history.back();
	}else{
		if(window.location.href.match('papers')){
			lisec = "/papers/";
		}
		document.location.href = '/research'+lisec;
	}
}

function io_zotero_item_html(dataload) {
	$("#zotero_load,#zotero_load_preview").empty();
	$("#zotero_load_details").html(io_zotero_item_details(dataload));
	if(io_zotero_is_tag_papers(dataload.data.tags)){
		if(!$("#zotero_load_details").hasClass('IOHK-paper')){
			$("#zotero_load_details").addClass('IOHK-paper');
		}
	}else{
		$("#zotero_load_details").removeClass('IOHK-paper');
	}
	$("#io-lib-tools").html(library_item_tools);
	$("#zotero_load").html('');
	io_zotero_item_attachments();
	iohk_videos();

	var th = $('.abstractNote .text').height();
	if(th > 200){
		$('.abstractNote').addClass('hiding');
		$('.abstractNote .grad,.abstractNote .button_posts').show();
	}else{
		$('.abstractNote .grad,.abstractNote .button_posts').hide();
	}

	setTimeout(function(){
		$('html, body').animate({
				scrollTop: $("#zotero_load_details").offset().top
		}, 200);
	},300);

}

function io_papers_list() {
	$.getJSON('https://api.zotero.org/groups/'+io_zotero_group+'/items?start=0&limit=100&format=json&tag=website-papers&v=1&key='+io_zotero_pubkey, function (data) {
		if(data.length > 0){
			/*
			<div class="papers-row">
				<div id="papers-list" class="papers-list"></div>
			</div>
			<div class="papers-row-hider text-center">
				<a href="" id="papers-list-hider" class="papers-list-hider"><em class="fa fa-th"></em></a>
			</div>
			*/
			$("#papers-list").empty();
			var items_row = 0;
			var item = 246;
			var out = '';

			if(document.width < 768){
				item = 216;
			}

			for(var i=0;i<data.length;i++){
				if(io_zotero_tag_ok(data[i].data.tags)){
					items_row += item;
					io_zotero_arr_obj[data[i].key] = new Object();
					io_zotero_arr_obj[data[i].key] = data[i];
					io_zotero_arr_obj[data[i].key].loaded = false;
					out += io_zotero_library_item(data[i]);
				}
			}


			$("#papers-row").html('\
				<div class="papers-wrapper">\
					<div id="papers-list" class="papers-list">'+out+'</div>\
				</div>\
				<div class="papers-row-scrollhide"></div>\
			<div class="container ">\
				<div class="papers-row-hider">\
				<a href="javascript:io_class_toggle(\'#papers-row\',\'showing\')" class="papers-list-hider rounded btn uppercase" title="Toggle papers list view">\
				<span class="shower">View all papers</span>\
				<span class="hider"><em class="fa fa-chevron-up"></em></span>\
				</a>\
				</div>\
			</div>\
			');
			//$("#papers-list").width(items_row);
			$('.papers-wrapper').mousewheel(function(e, delta) {
        this.scrollLeft -= (delta * 40);
        e.preventDefault();
	    });

		}else{
			return false;
		}
	});
}

function io_zotero_item_attachments() {
	io_pop();
	if(io_zotero_IOHK_papers){
		io_papers_list();
	}
	if(io_zotero_selection == ''){
		io_zotero_selection = window.location.hash.replace('#','');
	}
	//$("#zotero_load").html('');
	var fileurl = io_zotero_arr_obj[io_zotero_selection].data.url;
	//fileurl = 'https://eprint.iacr.org/2017/573/';
	var sufix = fileurl.substr(fileurl.length-4,4);

	if(fileurl.match('eprint.iacr.org')){
		if(sufix != '.pdf'){
			if(fileurl.substr(fileurl.length-1,1) != '/'){
				fileurl = fileurl+'.pdf';
			}else{
				fileurl = fileurl.substr(0,fileurl.length-1)+'.pdf';
			}
		}
		//alert(fileurl);
	}

	if(sufix == '.pdf'){
//////////////////


		var iframes = '';
		 var icons = '';
		 var github = '';
		 if(io_zotero_arr_obj[io_zotero_selection].data.rights != undefined){
		 	if(io_zotero_arr_obj[io_zotero_selection].data.rights != ''){
		 		github = '<br><br><p class=" github" style="line-height:1.2"><a href="'+io_zotero_arr_obj[io_zotero_selection].data.rights+'" class=" "><span class="big"><span class="big"><em class="big fa fa-github"></em></span></span> <small class="small block"><b>GITHUB</b></small></a></p>';
		 	}
		 }


				 var cls = '';
				 var attach_id = io_zotero_selection;
				 var icon = '<img src="/images/pdf.png" width="84" height="84" alt="" />';


				 icons = '<a class="icon" href="'+fileurl+'" title="'+io_zotero_arr_obj[io_zotero_selection].data.title+'" dataType="pdf" target="_blank" data-toggle="tooltip"><span class="ico">'+icon+'</span> <b class="block">'+io_zotero_arr_obj[io_zotero_selection].data.title+'</b></a>';
				 icons +=	github;


				 var layout = 'default';
				 if(io_zotero_IOHK_papers){
					 layout = 'papers';
				 }


				 iframes += '\
					 <iframe id="'+cls+'" src="'+fileurl+'" width="100%" height="1200" style="border:0;border-bottom:1px solid #555">Loading ...</iframe>\
					 ';

		 iframes += '';


		 var search_str = io_zotero_arr_obj[io_zotero_selection].data.tags[0].tag.replace('website-','');
		 if(search_str == 'papers'){
			 search_str = io_zotero_arr_obj[io_zotero_selection].data.tags[1].tag.replace('website-','');
		 }

		 var relateditems = '\
		 <div class="widget">\
			 <h6 class="uppercase electrolize">'+search_str+' in Library</h6>\
			 <div id="library_search-widget" class="post_links library_searcher"></div>\
			 <input id="widget-search" type="hidden" class="form-control input-lg" value="'+search_str+'" />\
		 </div>';

		 console.log(layout);
		 var cols = '<br>\
		 <div class="row filerow">\
			 <div class="'+detail_layout[layout][0]+'">\
			 '+iframes+'\
			 </div>\
			 <div class="'+detail_layout[layout][1]+'">\
			 '+relateditems+'\
			 </div>\
		 </div>\
		 ';

		 $("#zotero-file").html('<div class="icons">'+icons+'</div><div class="clear"></div>');
		 $("#zotero_load").html(cols);
		 $("#zotero_loading").removeClass('loading');

		 setTimeout(function(){


			 if($("#library_search-widget").hasClass('library_searcher')){
				 io_zotero_search_arr_obj = {};
				 io_zotero_search_init = false;
				 io_zotero_search('.library_searcher',true);
			 }


			 if(io_zotero_arr_obj[io_zotero_selection] != undefined){
				 io_zotero_arr_obj[io_zotero_selection].icons = icons;
				 io_zotero_arr_obj[io_zotero_selection].iframes = iframes;
			 }
		 },500);



		/////////////////
	}else{


		if(io_zotero_arr_obj[io_zotero_selection].iframes == undefined){
			if(!$("#zotero_loading").hasClass('loading')){
				$("#zotero_loading").addClass('loading');
			}

			$.getJSON('https://api.zotero.org/groups/'+io_zotero_group+'/items/'+io_zotero_selection+'/children?key='+io_zotero_pubkey+'&format=json&include=data', function (data) {
		    	if(data){
		    		//$("#zotero_load_details").empty();
		    		var iframes = '';
						var icons = '';
						var github = '';
						var layout = 'default';
						if(io_zotero_IOHK_papers){
							layout = 'papers';
						}

						for(var i=0;i<data.length;i++){

							if(data[i].data.rights != undefined){
								if(data[i].data.rights != ''){
									github = '<a href="'+github+'" class="big "><em class="big fa fa-github"></em></a>';
								}
							}

							if(data[i].data.filename != undefined){
								var cls = '';
								var attach_id = data[i].key;
								var icon = '<span class="bigbig"><em class="fa fa-file-o"></em></span>';
								if(data[i].data.contentType == "text/html"){
									icon = '<span class="bigbig"><em class="fa fa-file-text-o"></em></span>';
									cls = 'fdsafads';
								}
								if(data[i].data.contentType == "application/pdf"){
									icon = '<span class="bigbig"><em class="fa fa-file-pdf-o"></em></span>';
									icon = '<img src="/images/pdf.png" width="84" height="84" alt="" />';
								}

								icons = '<a class="icon" href="https://api.zotero.org/groups/'+io_zotero_group+'/items/'+attach_id+'/file/view?key='+io_zotero_pubkey+'" title="'+data[i].data.filename+'" dataType="'+data[i].data.contentType+'" target="_blank" data-toggle="tooltip"><span class="ico">'+icon+'</span> <b class="block">'+data[i].data.filename+'</b> <small class="block">'+data[i].data.dateModified.substr(0,10)+'</small></a>';
								icons += github;

								iframes += '\
									<iframe id="'+cls+'" src="https://api.zotero.org/groups/'+io_zotero_group+'/items/'+attach_id+'/file/view?key='+io_zotero_pubkey+'" width="100%" height="1200" style="border:0;border-bottom:1px solid #555">Loading ...</iframe>\
									';
							}

						}
						iframes += '';

						if(io_zotero_IOHK_papers){
							layout = 'papers';
						}

						var search_str = io_zotero_arr_obj[io_zotero_selection].data.tags[0].tag.replace('website-','');
						if(search_str == 'papers'){
							search_str = io_zotero_arr_obj[io_zotero_selection].data.tags[1].tag.replace('website-','');
						}

						var relateditems = '\
						<div class="widget">\
							<h6 class="uppercase electrolize">'+search_str+' in Library</h6>\
							<div id="library_search-widget" class="post_links library_searcher"></div>\
							<input id="widget-search" type="hidden" class="form-control input-lg" value="'+search_str+'" />\
						</div>';


						var cols = '<br>\
						<div class="row filerow">\
							<div class="'+detail_layout[layout][0]+'">\
							'+iframes+'\
							</div>\
							<div class="'+detail_layout[layout][1]+'">\
							'+relateditems+'\
							</div>\
						</div>\
						';

	    			$("#zotero-file").html('<div class="icons">'+icons+'</div><div class="clear"></div>');
	    			$("#zotero_load").html(cols);
						$("#zotero_loading").removeClass('loading');

						setTimeout(function(){


							if($("#library_search-widget").hasClass('library_searcher')){
								io_zotero_search_arr_obj = {};
								io_zotero_search_init = false;
								io_zotero_search('.library_searcher',true);
							}


							if(io_zotero_arr_obj[io_zotero_selection] != undefined){
								io_zotero_arr_obj[io_zotero_selection].icons = icons;
					    	io_zotero_arr_obj[io_zotero_selection].iframes = iframes;
							}
						},500);


		    	}
			});
		}
	}

	setTimeout(function(){
		if (location.hash === "#9BKRHCSI") {
			$('.icons').prepend("<div class='featured-paper'><a class='icon' href='http://www.springer.com/us/book/9783319636870' target='_blank' alt='Advances in Cryptology – CRYPTO 2017'><span class='ico'><img class='featured-image' src='../../images/logo/iacr-logo.png' alt='IACR logo'/></span><b class='block'>Featured in Advances in Cryptology – CRYPTO 2017</b><small class='block'>2017-08-20</small></a></div>");
		}

		if(io_slug(io_zotero_arr_obj[io_zotero_selection].data.shortTitle) == 'cardano'){
			$('.icons').prepend("<div class='cardano-paper uppercase'><a class='icon' href='/projects/cardano/'><span class='ico'><img class='featured-image' src='../../images/logo/cardano.png' alt='' /></span><b class='block'>Cardano</b></a></div><br>");
		}
		if(io_slug(io_zotero_arr_obj[io_zotero_selection].data.shortTitle) == 'ethereum-classic'){
			$('.icons').prepend("<div class='ethereum-classic-paper uppercase'><a class='icon' href='/projects/ethereum-classic/'><span class='ico'><img class='featured-image' src='../../images/logo/etc.png' alt='' height='124' width='75' style='width:75px;height:124px' /></span><p> <b class='block'>Ethereum classic</b></p></a></div><br>");
		}

		$(".show-videos").click(function(){
			io_class_toggle(".video", "show");
			io_class_toggle(".show-videos", "fewer-videos");
		});

	},1000);

	return false;
}

function io_zotero_item_deselect() {
	io_zotero_preview = false;
	$('.is-expanded').removeClass('is-expanded').addClass('is-collapsed');
	$("#zotero_load_preview").empty();
}


function io_zotero_item_preview_note() {
	var th = $('.is-expanded .abstractNote .text').height();
	if(th > 200){
		$('.is-expanded .abstractNote').addClass('hiding');
		$('.is-expanded .abstractNote .grad,.is-expanded .abstractNote .button_posts').show();
	}else{
		$('.is-expanded .abstractNote .grad,.is-expanded .abstractNote .button_posts').hide();
	}
}


function io_zotero_item_click(obj) {
	io_lib_item_selected = obj.getAttribute('rel');

	if(window.location.href.match('papers')){
		$("#zotero_load").empty();
		window.location.hash = '#'+io_lib_item_selected;
		return false;
	}
	var hash = window.location.hash;
	$(".open_book.selected").removeClass('selected');

	var thisCell = $(obj).closest('.book');
	if (thisCell.hasClass('is-collapsed')) {
		$("#library .is-expanded").removeClass('is-expanded').addClass('is-collapsed');
		thisCell.removeClass('is-collapsed').addClass('is-expanded');
	} else {
		thisCell.removeClass('is-expanded').addClass('is-collapsed');
	}
	if(!io_zotero_IOHK_papers){
		setTimeout(function(){
			$('html, body').animate({
					scrollTop: $(".is-expanded").offset().top-($(window).height()/25)
			}, 200);
		},300);
	}

	io_zotero_preview = true;
	$(obj).addClass('selected');
	if(io_zotero_layout != 'item'){

		$("#zotero_load_preview").html('<div class="wrap"><div class="inner">\
			<div class="logo"><img class="" src="/images/iohk-logo.png" width="214" height="50" alt="IOHK" /> <strong class="electrolize"><span class="extra">Research </span>Library</strong> <button class="close" onclick="io_zotero_item_deselect()"><em class="fa fa-times-circle"></em></button></div> '+io_zotero_item_details(io_zotero_arr_obj[io_lib_item_selected])+'</div></div>');
			$(".is-expanded .zotero_details_wrap").html(io_zotero_item_details(io_zotero_arr_obj[io_lib_item_selected]));
			io_zotero_item_preview_note();

	}else{
		if(io_zotero_IOHK_papers){
		//	$("#zotero_load").empty();
			//$(".is-expanded .zotero_details_wrap").html(io_zotero_item_details(io_zotero_arr_obj[io_lib_item_selected]));
		}
	}

}

function io_zotero_item() {
	$(".library_autocomplete").empty();
	$("#zotero_loading").addClass('loading');
	$("#zotero_load_preview,#zotero_load").empty();
	$("#papers-row").removeClass('showing');

	var which = io_zotero_get_id();
	io_zotero_selection = which;
	io_zotero_layout = 'item';
	if(io_zotero_arr_obj[which] == undefined){
		$("#zotero_load").empty();
		$.getJSON('https://api.zotero.org/groups/'+io_zotero_group+'/items/'+which+'/?key='+io_zotero_pubkey+'&format=json&include=data', function (data) {
	    	if(data){
			    io_zotero_arr_obj[which] = data;
			    io_zotero_item_html(io_zotero_arr_obj[which]);
	    	}else{
					$("#zotero_loading").removeClass('loading');
	    	}
		});
	}else{
    	io_zotero_item_html(io_zotero_arr_obj[which]);
	}
	io_zotero_lib_list_tag = which;
	return false;
}


function io_zotero_library_item(dataload) {
	var date = '';
	if(dataload.data.date != undefined && dataload.data.date != ''){
		date = '<b>'+dataload.data.date+'</b>';
	}
	var abstractNote = '';
	if(dataload.data.abstractNote != undefined && dataload.data.abstractNote != ''){
		abstractNote = '<div class="abstractNote"><hr class="red short opa100" />'+dataload.data.abstractNote+'</div>';
	}
	var place = '';
	if(dataload.data.place != undefined && dataload.data.place != ''){
		place = '<div class="place"><em class="fa fa-globe"></em> '+dataload.data.place+'</div>';
	}
	var ISBN = '';
	if(dataload.data.ISBN != undefined && dataload.data.ISBN != ''){
		ISBN = '<div class="ISBN"><em class="fa fa-book"></em> '+dataload.data.ISBN+'</div>';
	}
	var publisher = '';
	if(dataload.data.publisher != undefined && dataload.data.publisher != ''){
		if(date != ''){
			publisher = ', ';
		}
		publisher += dataload.data.publisher;
	}
	if(dataload.data.conferenceName != undefined && dataload.data.conferenceName != ''){
		if(dataload.data.conferenceName != dataload.data.publisher){
			if(date != '' || publisher != ''){
				publisher = ', ';
			}
			publisher += dataload.data.conferenceName;
		}

	}
	if(dataload.data.libraryCatalog != undefined && dataload.data.libraryCatalog != ''){
		if(dataload.data.libraryCatalog != dataload.data.publisher){
			if(dataload.data.libraryCatalog != dataload.data.conferenceName){
				if(date != '' || publisher != ''){
					publisher = ', ';
				}
				publisher += dataload.data.libraryCatalog;
			}
		}
	}

	if(dataload.data.extra != undefined && dataload.data.extra != ''){
		if(date != '' || publisher != ''){
			publisher = ', ';
		}
		publisher += dataload.data.extra;
	}

	if(publisher != ''){
		publisher = '<span class="publisher">'+publisher+'</span>';
	}


	var tags = '';
	var cover_tags = '';
	for(var i=0;i<dataload.data.tags.length;i++){
		if (dataload.data.tags[i].tag.match('website-')) {
			var tag_title = dataload.data.tags[i].tag.replace('website-','');
			cover_tags += '<span class="label '+io_slug(dataload.data.tags[i].tag)+'"><a href="#tag-'+io_slug(tag_title)+'">'+tag_title.toUpperCase()+'</a></span> ';
			tags += '<div class="tag '+io_slug(dataload.data.tags[i].tag)+'" title="'+tag_title+'" data-toggle="tooltip"></div>';
		}
	}
	var active = '';
	if(window.location.hash.match(dataload.key)){
		active = 'selected';
	}
	//console.log(dataload);
	var item = '\
    <div class="book is-collapsed '+io_zotero_tag_papers(dataload.data.tags)+' '+io_slug(dataload.data.shortTitle)+' '+active+'">\
        <div class="text">\
            <div class="open_book " id="book-'+dataload.key+'" rel="'+dataload.key+'" onclick="io_zotero_item_click(this)">\
            	<div class="tags side">'+tags+'</div>\
            	<div class="bg">\
                    <div class="typeicon none"><button class="close"><em class="fa fa-times"></em></button>'+io_zotero_itemtype_icon[dataload.data.itemType]+'</div>\
                    <h2 class="margin0">'+dataload.data.title+'</h2>\
					<hr class="red short opa100" />\
                    <h3 class="margint0 authors">'+io_strip(io_zotero_item_creators(dataload))+'</h3>\
                    <p class="date">'+dataload.data.date+''+io_nohttp(publisher)+'</p>\
                    <div class="tags">'+cover_tags+'</div>\
                    <div class="footopener"><a href="#'+dataload.key+'" class="btn btn-default rounded">'+iolab_read_more+' &nbsp;<em class="fa fa-chevron-right"></em></a></div>\
                </div>\
            </div>\
			<div class="arrow--up"></div>\
        </div>\
        <div class="book--expand">\
	        <div class="zotero_details_wrap zotero_details"></div>\
    	</div>\
    </div>\
	';
	return item;
}

function io_zotero_tag_select(tag) {
	$("#library_tags .btn.selected").removeClass('selected');
	$("#library_tags .btn").each(function(){
		var url = $(this).attr('href');
		if(url == '#tag-'+tag){
			$(this).addClass('selected');
		}
	});
}


function io_zotero_search_load(autocom,widget) {
	if(io_zotero_search_init){
	if(!io_zotero_loaded_full){
		$.getJSON('https://api.zotero.org/groups/'+io_zotero_group+'/items?start='+io_zotero_search_loaded+'&limit='+io_zotero_search_step+'&format=json&search=website-&v=1&key='+io_zotero_pubkey, function (data) {
	    	if(data.length > 0){
					for(var i=0;i<data.length;i++){
						if(io_zotero_tag_ok(data[i].data.tags)){
							io_zotero_search_arr_obj[data[i].key] = new Object();
							io_zotero_search_arr_obj[data[i].key] = data[i];
							io_zotero_search_arr_obj[data[i].key].loaded = false;
						}
					}
					io_zotero_search_loaded += io_zotero_search_step;
					io_zotero_searching(autocom,widget);
				  io_zotero_search_load(autocom,widget);
	    	}else{
					if(widget){
						$(autocom).removeClass('loading');
						if(io_zotero_found_arr_obj.length == undefined){
							$(autocom).parent().remove();
						}
					}else{
						$('#library-search-button').removeClass('loading');
					}
	    		io_zotero_loaded_full = true;
	    		return false;
	    	}
			});
		}
	}
}

function io_zotero_lib_list_setup() {
	var tag = io_zotero_get_tag();
	$("#zotero_details,#zotero_load_preview,#zotero_load").empty();
	$("#io-lib-tools").html(library_tools);
	if(!tag){
    	$("#zotero_load").html(io_zotero_library());
	}else{
    	$("#zotero_load_details").html('<div class="library-title"><h2 class="margint0"><em class="icon fa fa-tag website-'+tag+' rounded"></em> '+tag+'</h2></div>');
    	$("#zotero_load").html(io_zotero_library());
    	io_zotero_tag_select(tag);
	}
	$('[data-toggle="tooltip"]').tooltip();
}

function io_zotero_reorder(obj) {
	var changing = $(obj).attr('rel');
	var val = $(obj).attr('val');

	if(changing == 'sort'){
		zotero_current_sort = val;
		if(val == 'title'){
			zotero_current_order = 'asc';
		}
		//alert(zotero_sorting[zotero_current_sort]);
		$(obj).parent().parent().prev().find('.lab').text(zotero_sorting[zotero_current_sort]);
	}else{
		zotero_current_order = val;
		$(obj).parent().parent().prev().find('.lab').text(zotero_order[zotero_current_order]);
	}
	//alert(zotero_current_sort);
	io_zotero_json.abort();
	io_zotero_json = null;
	io_zotero_arr_obj = {};
	io_zotero_setup = false;
	io_zotero_lib_list_loaded = 0;
	io_zotero_valid = 0;
	io_zotero();
}

function io_zotero_load(tag,callback) {
	$(".library_autocomplete,#papers-row").empty();
	$("#zotero_loading").addClass('loading');
	if(io_zotero_lib_list_tag != tag){
		$("#zotero_load,#zotero_load_detail").html('');
	}
	//console.log(io_zotero_lib_list_loaded);
	io_zotero_layout = 'list';
	//if(io_zotero_loaded_full){
	//	io_zotero_lib_list_setup();
	//}else{
		if(io_zotero_lib_list_tag != tag){
			io_zotero_lib_list_loaded = 0;
		}
		var lib_list = true;
		var tag_val = '&search=website-';
		if(tag != ''){
			tag_val = '&tag=website-'+tag+'';
		}else{
			if(!io_hash()){
				lib_list = true;
			}else{
				lib_list = false;
			}
		}
		if(tag == 'all'){
			tag_val = '&search=website-';
		}
		if(io_zotero_IOHK_papers){
			tag_val = '&tag=website-papers';
			//console.log(tag_val);
		}
		//tag_val = '&tag=website-crypto';
		//alert("a");
		io_zotero_json = $.getJSON('https://api.zotero.org/groups/'+io_zotero_group+'/items?sort='+zotero_current_sort+'&direction='+zotero_current_order+'&start='+io_zotero_lib_list_loaded+'&limit='+io_zotero_lib_list_step+'&format=json'+tag_val+'&v=3&key='+io_zotero_pubkey, function (data) {
				if(data){
					if(data.length == 0){
						$("#zotero_loading").removeClass('loading');
						return false;
					}
					for(var i=0;i<data.length;i++){
						//console.log(data[i].key);
						if(io_zotero_tag_ok(data[i].data.tags)){
							//console.log(data[i].data.title);
							io_zotero_valid++;
							io_zotero_arr_obj[data[i].key] = new Object();
							io_zotero_arr_obj[data[i].key] = data[i];
							io_zotero_arr_obj[data[i].key].loaded = false;
							if(io_zotero_lib_list_tag == tag){
					    	$("#zotero_load").append(io_zotero_library_item(data[i]));
							}
					    //console.log(data[i]);
						}
					}
					//if(io_zotero_lib_list_tag != tag){
						io_zotero_lib_list_setup();
					//}

					io_zotero_lib_list_tag = tag;

			    io_zotero_lib_list_loaded += io_zotero_lib_list_step;
		    	io_zotero_selection = tag;

					//alert(io_zotero_valid);
					if(io_zotero_valid < 8){

						if(window.location.hash){
							if(!window.location.hash.match('tag')){
								return false;
							}
						}

						var router = io_hash();
				    if(!router){ // default library
							io_zotero_load('',null);
						}else{
							router = io_zotero_get_tag();
				    	if(router){ // tag library
								io_zotero_load(router,null);
							}
				    }

					}else{
						$("#zotero_loading").removeClass('loading');
						io_pop();
						if(typeof callback == 'function'){
				    	callback();
			    	}
					}
    	}
		});
	//}
}

var io_zotero_search_init = false;
var io_zotero_search_autocomplete = true;
var io_zotero_found_arr_obj = new Object();

function io_zotero_search_action() {
	io_zotero_layout = 'search';
    io_zotero_search_autocomplete = false;
    $("#io-lib-tools").html(library_tools);
		io_zotero_searching('.library_autocomplete',false);
}

function io_zotero_search(autocom,widget) {
	//if(!io_zotero_search_init){
		io_zotero_search_loaded = 0;
		io_zotero_search_arr_obj = {};
		io_zotero_found_arr_obj = {};
		io_zotero_search_init = true;
		io_zotero_loaded_full = false;
		io_zotero_search_load(autocom,widget);
		if(!widget){
			$('#library-search-button').addClass('loading');
			$('#library-search').on('input', function() {
			    io_zotero_search_autocomplete = true;
					io_zotero_searching(autocom,widget);
			});
			$('#library-search-button').on('click', function() {
			    io_zotero_search_action();
			});
			$('html').click(function() {
				$(autocom).empty();
			});
			$('#library-search,'+autocom).click(function(event){
			    event.stopPropagation();
			});
		}else{
			io_zotero_search_autocomplete = true;
			io_zotero_searching(autocom,widget);
			$(autocom).addClass('loading');
		}
		//io_zotero_search_init = true;
	//}
	$(".library_autocomplete.none").removeClass('none');
}

function io_zotero_searching(autocom,widget) {
	var out = '';
	if(!$("#library-search").hasClass('form-control')){
		return false;
	}
	var searched = $("#library-search").val();
	if(widget){
		searched = $("#widget-search").val();
	}
	if(searched.length > 0){
		$(autocom).empty();
		for (var key in io_zotero_search_arr_obj) {
			if(io_zotero_search_arr_obj[key].data.title != undefined){ ///io_zotero_item_creators(dataload)
				var str = false;
				var tit = '';
				var aut = '';
				var tags = '';
				var tagline = '';
				var searching_title = io_slug(io_zotero_search_arr_obj[key].data.title).search(io_slug(searched));
				var searching_authors = io_slug(io_strip(io_zotero_item_creators(io_zotero_search_arr_obj[key]))).search(io_slug(searched));
				var searching_tags = new Array();


				var dataload = io_zotero_search_arr_obj[key];
				var date = '';
				if(dataload.data.date != undefined && dataload.data.date != ''){
					date = '<em class="fa fa-clock-o"></em> <strong>'+dataload.data.date+'</strong>';
				}
				var abstractNote = '';
				if(dataload.data.abstractNote != undefined && dataload.data.abstractNote != ''){
					abstractNote = '<div class="abstractNote">'+dataload.data.abstractNote+'</div>';
				}
				var place = '';
				if(dataload.data.place != undefined && dataload.data.place != ''){
					place = '<span class="place"><em class="fa fa-globe"></em> '+dataload.data.place+'</span>';
				}
				var ISBN = '';
				if(dataload.data.ISBN != undefined && dataload.data.ISBN != ''){
					ISBN = '<span class="ISBN"><em class="fa fa-book"></em> '+dataload.data.ISBN+'</span>';
				}
				var publisher = '';
				if(dataload.data.publisher != undefined && dataload.data.publisher != ''){
					publisher += '<span class="publisher">'+dataload.data.publisher+'</span>';
				}

				var tit_tag = 'h2';
				if(searching_title != -1){
					var tit_s = io_zotero_search_arr_obj[key].data.title;
					if(io_zotero_search_autocomplete){
						tit_tag = 'span';
					}
					tit += '<'+tit_tag+' class="block title">';
					if(!io_zotero_search_autocomplete){
						tit += '<a href="#'+io_zotero_search_arr_obj[key].key+'">';
					}
					tit += tit_s.substr(0,searching_title)+'<b>'+tit_s.substr(searching_title,searched.length)+'</b>'+tit_s.substr(searching_title+searched.length,tit_s.length);
					if(!io_zotero_search_autocomplete){
						tit += '</a>';
					}
					tit += '</'+tit_tag+'>';
					str = true;
				}
				if(!widget){
					if(searching_authors != -1){
						var aut_s = io_strip(io_zotero_item_creators(io_zotero_search_arr_obj[key]));
						aut += '<div class="block authors"><em class="fa fa-graduation-cap"></em> '+aut_s.substr(0,searching_authors)+'<b>'+aut_s.substr(searching_authors,searched.length)+'</b>'+aut_s.substr(searching_authors+searched.length,aut_s.length)+'</div>';
						str = true;
					}
				}

				if(io_zotero_tag_ok(io_zotero_search_arr_obj[key].data.tags)){
					for(var i=0;i<io_zotero_search_arr_obj[key].data.tags.length;i++){
						if (io_zotero_search_arr_obj[key].data.tags[i].tag.match('website-')) {
							searching_tags[i] = io_slug(io_zotero_search_arr_obj[key].data.tags[i].tag).search(io_slug(searched));
							var tag_s = io_zotero_search_arr_obj[key].data.tags[i].tag.replace('website-','');
							if(searching_tags[i] != -1){
								tags += '<span class="tag">'+tag_s.substr(0,searching_tags[i])+'<b>'+tag_s.substr(searching_tags[i],searched.length)+'</b>'+tag_s.substr(searched.length,tag_s.length)+'</span> ';
								if(io_zotero_search_autocomplete){
									tagline += '<span class="tag">'+tag_s.substr(0,searching_tags[i])+'<b>'+tag_s.substr(searching_tags[i],searched.length)+'</b>'+tag_s.substr(searching_tags[i]+searched.length,tag_s.length)+'</span> ';
								}else{
									tagline += '<span class="label tag '+io_slug(io_zotero_search_arr_obj[key].data.tags[i].tag)+'"><a href="#tag-'+io_slug(tag_s)+'"><em class="fa fa-tag"></em> '+tag_s.substr(0,searching_tags[i])+'<b>'+tag_s.substr(searching_tags[i],searched.length)+'</b>'+tag_s.substr(searching_tags[i]+searched.length,tag_s.length)+'</a></span>';
								}
							}else{
								if(io_zotero_search_autocomplete){
									tagline += '<span class="tag">'+tag_s+'</span> ';
								}else{
									tagline += '<span class="label tag '+io_slug(io_zotero_search_arr_obj[key].data.tags[i].tag)+'"><a href="#tag-'+io_slug(tag_s)+'"><em class="fa fa-tag"></em> '+tag_s+'</a></span>';
								}
							}
						}
					}
				}

				if(tags != ''){
					str = true;
				}
				if(str){
					io_zotero_found_arr_obj[key] = new Object();
					io_zotero_found_arr_obj[key] = io_zotero_search_arr_obj[key];

					if(tit == ''){
						tit = '<'+tit_tag+' class="block title">'+io_zotero_search_arr_obj[key].data.title+'</'+tit_tag+'>';
					}
					if(aut == ''){
						aut = '<span class="block authors"><em class="fa fa-graduation-cap"></em> '+io_strip(io_zotero_item_creators(io_zotero_search_arr_obj[key]))+'</span>';
					}
					tagline = '<span class="block tags uppercase">'+tagline+'</span>';

					out += '<li class="item">';
					if(io_zotero_search_autocomplete){
						out += '<a href="/research/library/#'+io_zotero_search_arr_obj[key].key+'">';
					}
					out += tit;

					var dateandpublisher = '';

					if(io_zotero_search_autocomplete){
						if(date != ''){
							dateandpublisher += date;
						}
						if(publisher != ''){
							if(date != ''){
								dateandpublisher += '<br>';
							}
							dateandpublisher += publisher;
						}
						if(dateandpublisher != ''){
							out += '<span class="dateandpublisher">'+dateandpublisher+'</span>';
						}
					}else{

						if(date != ''){
							dateandpublisher += date;
						}
						if(publisher != ''){
							if(date != ''){
								dateandpublisher += ', ';
							}
							dateandpublisher += publisher;
						}
						if(place != ''){
							if(date != ''){
								dateandpublisher += ' &nbsp; ';
							}
							dateandpublisher += place;
						}
						if(ISBN != ''){
							if(date != ''){
								dateandpublisher += ' &nbsp; ';
							}
							dateandpublisher += ISBN;
						}
						if(dateandpublisher != ''){
							out += '<span class="dateandpublisher">'+dateandpublisher+'</span>';
						}
					}


					out += aut;
					out += tagline;

					if(!io_zotero_search_autocomplete){
						out += abstractNote;
						out += '<a class="btn btn-default rounded readmore" href="#'+io_zotero_search_arr_obj[key].key+'">'+iolab_read_more+' &nbsp;<em class="fa fa-chevron-right"></em></a>';
					}

					if(io_zotero_search_autocomplete){
						out += '</a>';
					}

					out += '</li>';

				}
			}
		}
	}else{
		$(autocom).empty();
	}
	if(out != ''){
		if(io_zotero_search_autocomplete){
			$(autocom).html('<ul>'+out+'</ul>');
		}else{
	   		$("#zotero_load_details").empty();
				$(autocom).empty();
	    	$("#zotero_load_details").html('<div class="library-title"><h2 class="margint0"><em class="icon fa fa-search searched rounded"></em> Search for "'+searched+'"</h2></div>');
	    	$("#zotero_load").html('<ul class="results">'+out+'</ul>');
		}
	}
}


function io_zotero_init() {
	if(!io_zotero_setup){
		io_zotero_lib_list_loaded = 0;
		io_zotero_arr_obj = {};
		io_zotero_search_arr_obj = {};
		io_zotero_search_init = false;
		io_zotero_setup = true;
	}
}



function io_zotero() {
	if($("#library").hasClass('Library')){
		io_zotero_IOHK_papers = false;
	}
	if($("#library").hasClass('Papers')){
		io_zotero_IOHK_papers = true;
	}

	io_zotero_init();
	$("#io-lib-tools").html(library_tools);
	$("#zotero_load,#zotero_load_details,#zotero_details").empty();
	var router = io_hash();
	if(!router){ // default library
		//alert("default");
		io_zotero_load('',null);
		//io_zotero_tag('',null);
		return false;
	}else{
		router = io_zotero_get_tag();
    if(router){ // tag library
			//alert("tag");
			io_zotero_load(router,null);
			//console.log("-io_zotero_load");
			return false;
		}else{ // library detail
	    	io_zotero_detail = true;
				if(io_zotero_selection == ''){
					io_zotero_selection = window.location.hash.replace('#','');
				}
				io_zotero_item();
				return false;
	    }
    }
}

var io_zotero_current_view = 'icons-s';
function io_zotero_view_control(view) {
   	$(".view_control").removeClass("active");
   	$("#zotero_load").removeClass(io_zotero_current_view);
   	io_zotero_current_view = view;
   	$("#zotero_load").addClass(io_zotero_current_view);
   	//$(obj).addClass("active");
}



$(window).scroll(function(){
	if($(window).scrollTop() > 200){
		//$('#rightcol').attr('class','fixtop');
	}else{
		//$('#rightcol').attr('class','');
	}
	if(!io_zotero_IOHK_papers){
	  if ($(window).scrollTop() == $(document).height()-$(window).height()){
	    var router = io_hash();
	    if(!router){ // default library
				io_zotero_load('',null);
				return false;
			}else{
				router = io_zotero_get_tag();
	    	if(router){ // tag library
					io_zotero_load(router,null);
					return false;
				}
	    }
		}
	}



});




$(window).resize(function(){

});

$(window).on('hashchange', function() {
	if(io_zotero_lib_list_tag != ' '){
		io_zotero_search_init = true;
		$("#library-search").val('');
		$('#library-search-button').removeClass('loading');
		$("#zotero_load,#zotero_load_details,#zotero_details").empty();
		$(".library_autocomplete").empty();
		io_zotero();

	}
});

$(document).ready(function() {


});
