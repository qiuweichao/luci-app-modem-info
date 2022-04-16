'use strict';
'require view';
'require poll';
'require fs';

/*
	Copyright 2021-2022 Rafał Wabik - IceG - From eko.one.pl forum
	
	rssi/rsrp/rsrq/sinnr formulas for percentages taken from
	https://github.com/koshev-msk/luci-app-modeminfo
*/

function initMap(){
	createMap();//创建地图
	setMapEvent();//设置地图事件
	addMapControl();//向地图添加控件
	//addMapOverlay();//向地图添加覆盖物
}

function createMap(){ 
    // map = new BMap.Map("map"); 
	map.centerAndZoom(ggPoint,16); 	
}

function setMapEvent(){
	map.enableScrollWheelZoom(true);
	map.enableKeyboard();
	map.enableDragging();
	map.enableDoubleClickZoom()
}

function addMapOverlay(){
	
	marker = new BMap.Marker(ggPoint);
	map.addOverlay(marker);
	var myGeo = new BMap.Geocoder(); 
	marker.addEventListener("click", function(){       
	  myGeo.getLocation(ggPoint, function(rs){
		   if (rs){
			  infoWindow = new BMap.InfoWindow(rs.address, opts);
			  map.openInfoWindow(infoWindow, ggPoint);
		   }
	  });     
	});
}

var map;
var x;
var y;
var ggPoint;
var markergg;
var marker;
var opts = {
	width : 200,     // 信息窗口宽度
	height: 100,     // 信息窗口高度
	title : "GPS坐标位置" , // 信息窗口标题
	message:"这里是"
}
var infoWindow;

function LoadBaiduMapScript() {
		//console.log("初始化百度地图脚本...");
		//const AK = 你的密钥;
	const BMap_URL = "https://api.map.baidu.com/api?v=2.0&ak="+ AK +"&s=1&callback=onBMapCallback";
	return new Promise((resolve, reject) => {
			// 如果已加载直接返回
		if(typeof BMap !== "undefined") {
			resolve(BMap);
			return true;
		}
			// 百度地图异步加载回调处理
		window.onBMapCallback = function () {
			console.log("百度地图脚本初始化成功...");
			resolve(BMap);
			map= new BMap.Map("map");
			console.log(x);
			console.log(y);
			ggPoint= new BMap.Point(x,y);
			console.log(map);
		};
			// 插入script脚本
		let scriptNode = document.createElement("script");
		scriptNode.setAttribute("type", "text/javascript");
		scriptNode.setAttribute("src", BMap_URL);
		document.body.appendChild(scriptNode);
	});
}

  //向地图添加控件
function addMapControl(){
	var scaleControl = new BMap.ScaleControl({anchor:BMAP_ANCHOR_BOTTOM_LEFT});
	scaleControl.setUnit(BMAP_UNIT_IMPERIAL);
	map.addControl(scaleControl);
	var navControl = new BMap.NavigationControl({anchor:BMAP_ANCHOR_TOP_LEFT,type:0});
	map.addControl(navControl);
	var overviewControl = new BMap.OverviewMapControl({anchor:BMAP_ANCHOR_BOTTOM_RIGHT,isOpen:false});
	map.addControl(overviewControl);
}

function translateCallback(data){
	if(data.status === 0) {
	  markergg = new BMap.Marker(data.points[0]);
	  map.addOverlay(markergg);
	  //var label = new BMap.Label("转换后的百度坐标（正确）",{offset:new BMap.Size(20,-10)});
	  //marker.setLabel(label); //添加百度label
	  map.setCenter(data.points[0]);
	  var myGeo = new BMap.Geocoder(); 
		markergg.addEventListener("click", function(){       
		  myGeo.getLocation(data.points[0], function(rs){
				if (rs){
					infoWindow = new BMap.InfoWindow(rs.address, opts);
					map.openInfoWindow(infoWindow, data.points[0]);
				}
		  });     
		});
	}
  }

function wgs84_to_bd09(){
	  var convertor = new BMap.Convertor();
	  var pointArr = [];
	  pointArr.push(ggPoint);
	  convertor.translate(pointArr, 1, 5, translateCallback)
}

function csq_bar(v, m) {
var pg = document.querySelector('#csq')
var vn = parseInt(v) || 0;
var mn = parseInt(m) || 100;
var pc = Math.floor((100 / mn) * vn);
		if (vn >= 20 && vn <= 31 ) 
			{
			pg.firstElementChild.style.background = 'lime';
			var tip = _('Very good');
			};
		if (vn >= 14 && vn <= 19) 
			{
			pg.firstElementChild.style.background = 'yellow';
			var tip = _('Good');
			};
		if (vn >= 10 && vn <= 13) 
			{
			pg.firstElementChild.style.background = 'darkorange';
			var tip = _('Weak');
			};
		if (vn <= 9 && vn >= 1) 
			{
			pg.firstElementChild.style.background = 'red';
			var tip = _('Very weak');
			};
pg.firstElementChild.style.width = pc + '%';
pg.style.width = '33%';
pg.setAttribute('title', '%s'.format(v) + ' | ' + tip + ' ');
}

function rssi_bar(v, m) {
var pg = document.querySelector('#rssi')
var vn = parseInt(v) || 0;
var mn = parseInt(m) || 100;
if (vn > -50) { vn = -50 };
if (vn < -110) { vn = -110 };
var pc =  Math.floor(100*(1-(-50 - vn)/(-50 - mn)));
		if (vn >= -74) 
			{
			pg.firstElementChild.style.background = 'lime';
			var tip = _('Very good');
			};
		if (vn >= -85 && vn <= -75) 
			{
			pg.firstElementChild.style.background = 'yellow';
			var tip = _('Good');
			};
		if (vn >= -93 && vn <= -86) 
			{
			pg.firstElementChild.style.background = 'darkorange';
			var tip = _('Weak');
			};
		if (vn < -94) 
			{
			pg.firstElementChild.style.background = 'red';
			var tip = _('Very weak');
			};
pg.firstElementChild.style.width = pc + '%';
pg.style.width = '33%';
pg.firstElementChild.style.animationDirection = "reverse";
pg.setAttribute('title', '%s'.format(v) + ' | ' + tip + ' ');
}

function rsrp_bar(v, m) {
var pg = document.querySelector('#rsrp')
var vn = parseInt(v) || 0;
var mn = parseInt(m) || 100;
if (vn > -50) { vn = -50 };
if (vn < -140) { vn = -140 };
var pc =  Math.floor(120*(1-(-50 - vn)/(-50 - mn)));
		if (vn >= -79 ) 
			{
			pg.firstElementChild.style.background = 'lime';
			var tip = _('Very good');
			};
		if (vn >= -90 && vn <= -80) 
			{
			pg.firstElementChild.style.background = 'yellow';
			var tip = _('Good');
			};
		if (vn >= -100 && vn <= -91) 
			{
			pg.firstElementChild.style.background = 'darkorange';
			var tip = _('Weak');
			};
		if (vn < -100) 
			{
			pg.firstElementChild.style.background = 'red';
			var tip = _('Very weak');
			};
pg.firstElementChild.style.width = pc + '%';
pg.style.width = '33%';
pg.firstElementChild.style.animationDirection = "reverse";
pg.setAttribute('title', '%s'.format(v) + ' | ' + tip + ' ');
}

function sinr_bar(v, m) {
var pg = document.querySelector('#sinr')
var vn = parseInt(v) || 0;
var mn = parseInt(m) || 100;
var pc = Math.floor(100-(100*(1-((mn - vn)/(mn - 25)))));
		if (vn >= 21 ) 
			{
			pg.firstElementChild.style.background = 'lime';
			var tip = _('Excellent');
			};
		if (vn >= 13 && vn <= 20)
			{
			pg.firstElementChild.style.background = 'yellow';
			var tip = _('Good');
			};
		if (vn > 0 && vn <= 12) 
			{
			pg.firstElementChild.style.background = 'darkorange';
			var tip = _('Mid cell');
			};
		if (vn <= 0) 
			{
			pg.firstElementChild.style.background = 'red';
			var tip = _('Cell edge');
			};
pg.firstElementChild.style.width = pc + '%';
pg.style.width = '33%';
pg.firstElementChild.style.animationDirection = "reverse";
pg.setAttribute('title', '%s'.format(v) + ' | ' + tip + ' ');
}

function rsrq_bar(v, m) {
var pg = document.querySelector('#rsrq')
var vn = parseInt(v) || 0;
var mn = parseInt(m) || 100;
var pc = Math.floor(115-(100/mn)*vn);
if (vn > 0) { vn = 0; };
		if (vn >= -9 ) 
			{
			pg.firstElementChild.style.background = 'lime';
			var tip = _('Excellent');
			};
		if (vn >= -15 && vn <= -10) 
			{
			pg.firstElementChild.style.background = 'yellow';
			var tip = _('Good');
			};
		if (vn >= -20 && vn <= -16) 
			{
			pg.firstElementChild.style.background = 'darkorange';
			var tip = _('Mid cell');
			};
		if (vn < -20) 
			{
			pg.firstElementChild.style.background = 'red';
			var tip = _('Cell edge');
			};
pg.firstElementChild.style.width = pc + '%';
pg.style.width = '33%';
pg.firstElementChild.style.animationDirection = "reverse";
pg.setAttribute('title', '%s'.format(v) + ' | ' + tip + ' ');
}

return view.extend({
	render: function() {
		//loadScript();
		poll.add(function() {
			return L.resolveDefault(fs.exec_direct('/usr/share/3ginfo-lite/3ginfo.sh', 'json'))
			.then(function(res) {
				var json = JSON.parse(res);
					
					var icon;
					var p = (json.signal);
					if (p < 0)
						icon = L.resource('icons/3ginfo-0.png');
					else if (p == 0)
						icon = L.resource('icons/3ginfo-0.png');
					else if (p < 20)
						icon = L.resource('icons/3ginfo-0-20.png');
					else if (p < 40)
						icon = L.resource('icons/3ginfo-20-40.png');
					else if (p < 60)
						icon = L.resource('icons/3ginfo-40-60.png');
					else if (p < 80)
						icon = L.resource('icons/3ginfo-60-80.png');
					else
						icon = L.resource('icons/3ginfo-80-100.png');


					if (document.getElementById('signal')) {
						var view = document.getElementById("signal");
						view.innerHTML = String.format('<medium>%d%%</medium></br>' + '<img style="padding-left: 10px;" src="%s"/>', p, icon);
					}

					if (document.getElementById('connst')) {
						var view = document.getElementById("connst");
						if (json.connt == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = '⏱ '+ json.connt + ' | ↓' + json.connrx + ' ↑' + json.conntx;
						}
					}

					if (document.getElementById('operator')) {
						var view = document.getElementById("operator");
						if (json.operator_name == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = json.operator_name;
						}
					}

					if (document.getElementById('sim')) {
						var view = document.getElementById("sim");
						if (json.registration == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = json.registration;
						if (json.registration == '0') { 
							view.textContent = _('Not registered');
						}
						if (json.registration == '1') { 
							view.textContent = _('Registered');
						}
						if (json.registration == '2') { 
							view.textContent = _('Searching');
						}
						if (json.registration == '3') { 
							view.textContent = _('Registering denied');
						}
					}
					}

					if (document.getElementById('mode')) {
						var view = document.getElementById("mode");
						if (json.mode == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = json.mode;
						}
					}

					if (document.getElementById('modem')) {
						var view = document.getElementById("modem");
						if (json.modem == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = json.modem;
						}
					}

					if (document.getElementById('fw')) {
						var view = document.getElementById("fw");
						if (json.firmware == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = json.firmware;
						}
					}

					if (document.getElementById('cport')) {
						var view = document.getElementById("cport");
						if (json.cport == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = json.cport;
						}
					}

					if (document.getElementById('protocol')) {
						var view = document.getElementById("protocol");
						if (json.protocol == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = json.protocol;
						}
					}

					if (document.getElementById('temp')) {
						var view = document.getElementById("temp");
						var viewn = document.getElementById("tempn");
						var t = json.mtemp;
						if (t == '') { 
						viewn.style.display = "none";
						}
						else {
						view.textContent = t.replace('&deg;', '°');
						}
					}

					if (document.getElementById('csq')) {
						var view = document.getElementById("csq");
						if (json.csq == '') { 
						view.textContent = '-';
						}
						else {
						csq_bar(json.csq, 31);
						}
					}

					if (document.getElementById('rssi')) {
						var view = document.getElementById("rssi");
						var viewn = document.getElementById("rssin");
						if (json.rssi == '') { 
						viewn.style.display = "none";
						}
						else {
							var z = json.rssi;
							if (z.includes('dBm')) { 
							var rssi_min = -110;
							rssi_bar(json.rssi, rssi_min);	
							}
							else {
							var rssi_min = -110;
							rssi_bar(json.rssi + " dBm", rssi_min);
							}
						}
					}

					if (document.getElementById('rsrp')) {
						var view = document.getElementById('rsrp');
						var viewn = document.getElementById("rsrpn");
						if (json.rsrp == '') { 
						viewn.style.display = "none";
						}
						else {
							var z = json.rsrp;
							if (z.includes('dBm')) { 
							var rsrp_min = -140;
							rsrp_bar(json.rsrp, rsrp_min);

							}
							else {
							var rsrp_min = -140;
							rsrp_bar(json.rsrp + " dBm", rsrp_min);
							}
						}
					}

					if (document.getElementById('sinr')) {
						var view = document.getElementById("sinr");
						var viewn = document.getElementById("sinrn");
						if (json.sinr == '') { 
						viewn.style.display = "none";
						}
						else {
							var z = json.sinr;
							if (z.includes('dB')) { 
							view.textContent = json.sinr;
							}
							else {
							var sinr_min = -21;
							sinr_bar(json.sinr + " dB", sinr_min);
							}
						}
					}

					if (document.getElementById('rsrq')) {
						var view = document.getElementById("rsrq");
						var viewn = document.getElementById("rsrqn");
						if (json.rsrq == '') { 
						viewn.style.display = "none";
						}
						else {
							var z = json.rsrq;
							if (z.includes('dB')) { 
							view.textContent = json.rsrq;
							}
							else {
							var rsrq_min = -20;
							rsrq_bar(json.rsrq + " dB", rsrq_min);
							}
						}
					}

					if (document.getElementById('mccmnc')) {
						var view = document.getElementById("mccmnc");
						if (json.operator_mcc == '' & json.operator_mnc == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = json.operator_mcc + " " + json.operator_mnc;
						}
					}

					if (document.getElementById('imsi')) {
						var view = document.getElementById("imsi");

						if (json.imsi == '') {
							view.textContent = '-';
						}
						else {
							view.textContent = json.imsi;
						}
					}

					if (document.getElementById('iccid')) {
						var view = document.getElementById("iccid");

						if (json.iccid == '') {
							view.textContent = '-';
						}
						else {
							view.textContent = json.iccid;
						}
					}

					if (document.getElementById('imei')) {
						var view = document.getElementById("imei");

						if (json.imei == '') {
							view.textContent = '-';
						}
						else {
							view.textContent = json.imei;
						}
					}

					if (document.getElementById('lac')) {
						var view = document.getElementById("lac");
						if (json.lac_dec == '' || json.lac_hex == '') { 
						var lc = json.lac_hex   + ' ' + json.lac_dec;
						var ld = lc.split(' ').join('');
						view.textContent = ld;
						}
						else {
						view.textContent = json.lac_hex   + ' (' + json.lac_dec + ')' ;
						}

					}

					if (document.getElementById('tac')) {
						var view = document.getElementById("tac");

						if (json.tac_hex == json.lac_hex) {
						view.textContent = json.tac_hex + ' (' + json.lac_dec + ')' ;
						}
						else {
						view.textContent = json.tac_hex + ' (' + json.tac_dec + ')' ;
						}
						if (json.tac_dec == '' || json.tac_hex == '') {
						view.textContent = json.lac_hex   + ' (' + json.lac_dec + ')' ;
						}
					}


					if (document.getElementById('cid')) {
						var view = document.getElementById("cid");
						if (json.cid_dec == '' || json.cid_hex == '') { 
						var cc = json.cid_hex   + ' ' + json.cid_dec;
						var cd = cc.split(' ').join('');
						view.textContent = cd;
						}
						else {
						view.textContent = json.cid_hex   + ' (' + json.cid_dec + ')' ;
						}
					}

					if (document.getElementById('pci')) {
						var view = document.getElementById("pci");
						if (json.pci == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = json.pci + ' ' + json.earfcn;
						}
					}

					if (document.getElementById('spci')) {
						var view = document.getElementById("spci");
						if (json.spci == '') { 
						view.textContent = '-';
						}
						else {
						view.textContent = json.spci + ' ' + json.searfcn;
						}
					}

					if (document.getElementById('longitude')) {
						var view = document.getElementById("longitude");

						if (json.longitude == '') {
							view.textContent = '-';
						}
						else {
							view.textContent = json.longitude;
							x=json.wsg_lo;
						}
					}

					if (document.getElementById('latitude')) {
						var view = document.getElementById("latitude");

						if (json.latitude == '') {
							view.textContent = '-';
						}
						else {
							view.textContent = json.latitude;
							y=json.wsg_la;
						}
					}

					if (document.getElementById('satellite')) {
						var view = document.getElementById("satellite");

						if (json.satellite == '') {
							view.textContent = '-';
						}
						else {
							view.textContent = json.satellite;
						}
					}

					if (document.getElementById('gstate')) {
						var view = document.getElementById("gstate");

						if (json.gstate == '') {
							view.textContent = '-';
						}
						else {
							view.textContent = json.gstate;
						}
					}
					
					
					if (document.getElementById('map')) {
						LoadBaiduMapScript();
						var view = document.getElementById("map");
						initMap();
						wgs84_to_bd09();
					}
			});
		});
		return E([], [
			E('h2', {}, [ _('3ginfo-lite') ]),
			E('div', { class: 'cbi-section-descr' }, _('More information about the 3ginfo on the')+ ' <a href="https://eko.one.pl/?p=openwrt-3ginfo" target="_blank">' + _('eko.one.pl forum') + '</a>.'),
			E('h2', {}, [ _('General Information') ]),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('Signal strength:')]),
					E('div', { 'class': 'td left', 'id': 'signal' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('Operator:')]),
					E('div', { 'class': 'td left', 'id': 'operator' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('SIM status:')]),
					E('div', { 'class': 'td left', 'id': 'sim' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('Connection statistics:')]),
					E('div', { 'class': 'td left', 'id': 'connst' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('Mode:')]),
					E('div', { 'class': 'td left', 'id': 'mode' }, [ '-' ]),
					]),
			]),

			E('h2', {}, [ _('Modem Information') ]),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('Modem type:')]),
					E('div', { 'class': 'td left', 'id': 'modem' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('Revision / Firmware:')]),
					E('div', { 'class': 'td left', 'id': 'fw' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('IP adress / Communication Port:')]),
					E('div', { 'class': 'td left', 'id': 'cport' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('Protocol:')]),
					E('div', { 'class': 'td left', 'id': 'protocol' }, [ '-' ]),
					]),
				E('tr', { 'id': 'tempn', 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('Chip Temperature:')]),
					E('div', { 'class': 'td left', 'id': 'temp' }, [ '-' ]),
					]),
			]),

			E('h2', {}, [ _('Cell / Signal Information') ]),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('MCC MNC: ')]),
					E('div', { 'class': 'td left', 'id': 'mccmnc' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('LAC: ')]),
					E('div', { 'class': 'td left', 'id': 'lac' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('CellID: ')]),
					E('div', { 'class': 'td left', 'id': 'cid' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('TAC: ')]),
					E('div', { 'class': 'td left', 'id': 'tac' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('IMSI: ')]),
					E('div', { 'class': 'td left', 'id': 'imsi' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('ICCID: ')]),
					E('div', { 'class': 'td left', 'id': 'iccid' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('IMEI: ')]),
					E('div', { 'class': 'td left', 'id': 'imei' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('CSQ: ')]),
					E('div', { 'class': 'td' }, E('div', {
							'id': 'csq',
							'class': 'cbi-progressbar',
							'title': '-'
							}, E('div')
						))
					]),
				E('tr', { 'id': 'rssin', 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('RSSI: ')]),
					E('div', { 'class': 'td' }, E('div', {
							'id': 'rssi',
							'class': 'cbi-progressbar',
							'title': '-'
							}, E('div')
						))
					]),
				E('tr', { 'id': 'rsrpn', 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('RSRP: ')]),
					E('div', { 'class': 'td' }, E('div', {
							'id': 'rsrp',
							'class': 'cbi-progressbar',
							'title': '-'
							}, E('div')
						))
					]),
				E('tr', { 'id': 'sinrn', 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('SINR: ')]),
					E('div', { 'class': 'td' }, E('div', {
							'id': 'sinr',
							'class': 'cbi-progressbar',
							'title': '-'
							}, E('div')
						))
					]),
				E('tr', { 'id': 'rsrqn', 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('RSRQ: ')]),
					E('div', { 'class': 'td' }, E('div', {
							'id': 'rsrq',
							'class': 'cbi-progressbar',
							'title': '-'
							}, E('div')
						))
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('PCI & EARFCN: ')]),
					E('div', { 'class': 'td left', 'id': 'pci' }, [ '-' ]),
					]),
			]),

			E('h2', {}, [ _('GPS信息') ]),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('GPS状态:')]),
					E('div', { 'class': 'td left', 'id': 'gstate' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('经度:')]),
					E('div', { 'class': 'td left', 'id': 'longitude' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('纬度:')]),
					E('div', { 'class': 'td left', 'id': 'latitude' }, [ '-' ]),
					]),
				E('tr', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [ _('卫星数:')]),
					E('div', { 'class': 'td left', 'id': 'satellite' }, [ '-' ]),
					]),
			]),
			E('div', {'style': 'width:900px;height:550px;border:#ccc solid 1px;font-size:12px', 'id':'map'}, [ _('-') ]),
		]);
	},
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
