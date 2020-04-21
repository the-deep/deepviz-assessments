var Map = {};
var map;
var mapsvg;
var path;
var transform;
var transform2;
var path2;
var heatmapColor = 'entries';

var heatmapColorEntries = [
		'interpolate',
		['linear'],
		['heatmap-density'],
			0,'rgba(254, 240, 217,0)',
			0.05,'rgba(103,169,207,0.2)',
			0.1,'#ddf6f2',
			0.4,'#36BBA6',
			0.7,'#1AA791',
			0.9,'#008974'
		];

var heatmapColorSeverity = [
		'interpolate',
		['linear'],
		['heatmap-density'],
			0,'rgba(254, 240, 217,0)',
			0.05,'rgba(103,169,207,0.3)',
			0.1,'#fef0d9',
			0.3,'#fdcc8a',
			0.5,'#fc8d59',
			0.8,'#e34a33',
			0.95,'#b30000'
		];

var heatmapColorReliability = [
		'interpolate',
		['linear'],
		['heatmap-density'],
			0,'rgba(254, 240, 217,0)',
			0.05,'rgba(103,169,207,0.3)',
			0.1,'#f1eef6',
			0.3,'#bdc9e1',
			0.6,'#74a9cf',
			0.85,'#2b8cbe',
			0.95,'#045a8d'
		];

//**************************
// create map
//**************************
Map.create = function(){

	// set map height

	map = document.getElementById("map");
	map.setAttribute("style","height:"+(map.offsetWidth*mapAspectRatio)+"px");

	mapboxgl.accessToken = mapboxToken;

	// no data fallback
	if(data.length==0) return false; 

	// map toggle
	d3.selectAll('#map-toggle-rect-bubbles')
	.on('click', function(d,i){
		mapToggle = 'bubbles';
		$('#map-toggle-bubbles').show();
		$('#map-toggle-heatmap').hide();
		$('#map-toggle-choropleth').hide();
		Map.updateBubbles();
		map.setLayoutProperty('#heatmap', 'visibility', 'none');
		d3.select('#heatmap-radius-slider-div').style('display', 'none');
	});

	d3.selectAll('#map-toggle-rect-heatmap')
	.on('click', function(d,i){
		mapToggle = 'heatmap';
		$('#map-toggle-bubbles').hide();
		$('#map-toggle-heatmap').show();
		$('#map-toggle-choropleth').hide();
		Map.updateHeatmap();
		$('#heatmap-radius-slider-div').fadeIn();
	});

	d3.selectAll('#map-toggle-rect-choropleth')
	.on('click', function(d,i){
		mapToggle = 'choropleth';
		$('#map-toggle-bubbles').hide();
		$('#map-toggle-heatmap').hide();
		$('#map-toggle-choropleth').show();
		Map.updateChoropleth();
		map.setLayoutProperty('#heatmap', 'visibility', 'none');
		d3.select('#heatmap-radius-slider-div').style('display', 'none');
	});

	$(document).ready(function(){
		setTimeout(function(){
			var obj = $('#adm-toggle object');
			var svg = obj[0].contentDocument.getElementsByTagName('svg')[0];
			$("#adm-toggle").html(svg);
			d3.select('#adm'+filters.admin_level+'_bg').style('fill', '#343434');
			d3.select('#adm'+filters.admin_level+'_label').style('fill', '#FFF');

			d3.selectAll('#adm0, #adm1, #adm2').on('mouseover', function(d,i){
				var thisAdminLevel = this.id.substr(-1);
				if(thisAdminLevel==filters.admin_level){
					return false;
				} else {
					d3.select('#adm'+thisAdminLevel+'_bg').style('fill', '#F2F2F2');
				}
			}).on('mouseout', function(d,i){
				var thisAdminLevel = this.id.substr(-1);
				if(thisAdminLevel==filters.admin_level){
					return false;
				} else {
					d3.select('#adm'+thisAdminLevel+'_bg').style('fill', '#FFF');
					d3.select('#adm'+thisAdminLevel+'_label').style('fill', '#343434');
				}
			}).on('click', function(d,i){
				var thisAdminLevel = this.id.substr(-1);
				filters.admin_level = thisAdminLevel;
				Map.update();
				d3.selectAll('#adm0_bg, #adm1_bg, #adm2_bg').style('fill', '#FFF');
				d3.selectAll('#adm0_label, #adm1_label, #adm2_label').style('fill', '#343434');
				d3.select('#adm'+filters.admin_level+'_bg').style('fill', '#343434');
				d3.select('#adm'+filters.admin_level+'_label').style('fill', '#FFF');
			})		
		},200);
	});

	var bounds = new mapboxgl.LngLatBounds([d3.min(geoBounds.lat),d3.min(geoBounds.lon)], [d3.max(geoBounds.lat),d3.max(geoBounds.lon)] );

    //Setup mapbox-gl map
    map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/mapbox/light-v9',
        center: [d3.mean(geoBounds.lat), d3.mean(geoBounds.lon)],
        zoom: 4,  
        trackResize: true,
        pitchWithRotate: false,
        doubleClickZoom: true,
        dragRotate: false
    });

    mapbox = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    map.scrollZoom.disable();
    map.keyboard.disable()
    map.fitBounds(bounds, {
    	padding: 20
    });

    var container = map.getCanvasContainer()

    mapsvg = d3.select(container).append("svg")
    .attr('id','map-bubble-svg')
    .style('position', 'absolute')
    .style('width', '100%')
    .style('height', '100%');

    transform = d3.geoTransform({point: Map.projectPoint});
    path = d3.geoPath().projection(transform);

    this.createBubbles();
    this.createChoropleth();
    this.createHeatmap();

	d3.selectAll('#geoRemoveFilter').on('click', function(){
		d3.select('#geoRemoveFilter').style('display', 'none').style('cursor', 'default');
		$('#location-search').val(); 
		$('#location-search').trigger('change.select2');
		return Deepviz.filter('geo', 'clear'); 
	});

	this.createSearch();

	// map lasso
	lassoActive = false;

	var lasso = d3.select('#lasso');
	lasso.on('mouseover', function(){
		if(!lassoActive){
			$('#lasso-default').hide();
			$('#lasso-hover').show();
		}
	}).on('mouseout', function(){
		if(!lassoActive){
			$('#lasso-default').show();
			$('#lasso-hover').hide();
		}	
	}).on('click', function(){
		if(!lassoActive){
			lassoActive = true;
			$('#lasso-default').hide();
			$('#lasso-hover').hide();
			$('#lasso-selected').show();
			// disable panning
			map.dragPan.disable();
		    map.boxZoom.disable();
			// change cursor
			d3.select('#map-bubble-svg').style('cursor', 'crosshair');

		} else {
			lassoActive = false;
			$('#lasso-selected').hide();
			$('#lasso-default').show();
			$('#lasso-hover').hide();
			// enable map panning
			map.dragPan.enable();
		    map.boxZoom.enable();
			// change cursor
			d3.select('#map-bubble-svg').style('cursor', 'inherit');
			d3.select('#select-box').attr("visibility", "hidden");
		}
	})

	function rect(x, y, w, h) {
	  return "M"+[x,y]+" l"+[w,0]+" l"+[0,h]+" l"+[-w,0]+"z";
	}

	var selection = mapsvg.append("path")
	  .attr("id", "select-box")
	  .attr("class", "selection")
	  .attr("visibility", "hidden");

	var startSelection = function(start) {
	    selection.attr("d", rect(start[0], start[0], 0, 0))
	      .attr("visibility", "visible");
	};

	var moveSelection = function(start, moved) {
	    selection.attr("d", rect(start[0], start[1], moved[0]-start[0], moved[1]-start[1]));
	};

	var endSelection = function(start, end) {
		selection.attr("visibility", "hidden");
		var bbox = selection.node().getBBox();
		var bounds = [];
		bounds[0] = Map.unprojectPoint(bbox.x, bbox.y);
		bounds[1] = Map.unprojectPoint((bbox.x+bbox.width), (bbox.y+bbox.height));
		if(d3.event.shiftKey){
			var geoArray = filters.geo;
		} else {
			var geoArray = [];
		}

		metadata.geo_array.forEach(function(d,i){
			if ((d.centroid[0] > bounds[0].lng) && (d.centroid[0] < bounds[1].lng) && (d.centroid[1] < bounds[0].lat) && (d.centroid[1] > bounds[1].lat)){
				if(!geoArray.includes(d.id)){
					geoArray.push(d.id);
				}
			}
		});

		if(bbox.width==0){
			Deepviz.filter('geo', 'clear');
		} else {
			filters.geo = geoArray;
			Deepviz.filter('geo', 0);
		}
	};

	mapsvg.on("mousedown", function(e) {
		if(!lassoActive) return false;
	  	var subject = d3.select(window), parent = this.parentNode,
	    start = d3.mouse(parent);
	    startSelection(start);
	    subject
	      .on("mousemove.selection", function() {
	        moveSelection(start, d3.mouse(parent));
	      }).on("mouseup.selection", function() {
	        endSelection(start, d3.mouse(parent), d3.event);
	        subject.on("mousemove.selection", null).on("mouseup.selection", null);
	      });
	});

	mapsvg.on("touchstart", function() {
		if(!lassoActive) return false;
		var subject = d3.select(this), parent = this.parentNode,
	    id = d3.event.changedTouches[0].identifier,
	    start = d3.touch(parent, id), pos;
	    startSelection(start);
	    subject
	      .on("touchmove."+id, function() {
	        if (pos = d3.touch(parent, id)) {
	          moveSelection(start, pos);
	        }
	      }).on("touchend."+id, function() {
	        if (pos = d3.touch(parent, id)) {
	          endSelection(start, pos, d3.event);
	          subject.on("touchmove."+id, null).on("touchend."+id, null);
	        }
	      });
	});

}

Map.createBubbles = function(){

    var gd = dataByDate.filter(function(d){
    	return ((new Date(d.key)>=dateRange[0])&&(new Date(d.key)<dateRange[1]));
    });

    var dataByLocationSum = [];

    for(var g=0; g < metadata.geo_array.length; g++) {
    	dataByLocationSum[g] = 0;
    }

    gd.forEach(function(d,i){
    	for(var g=0; g < metadata.geo_array.length; g++) {
    		if(d.geo[g]>0){
    			var t = (dataByLocationSum[g]) + (d.geo[g]);
    			if(metadata.geo_array[g].admin_level!=0){
	    			dataByLocationSum[g] = t;
    			} else {
	    			dataByLocationSum[g] = 0;
    			}
    		}
    	}
    });

    maxMapBubbleValue = d3.max(dataByLocationSum, function(d) {
    	return d;
    });

    scale.map = d3.scaleLinear()
    .range([0.2,1])
	.domain([0,maxMapBubbleValue]);

	// create bubbles
	var featureElement = mapsvg.selectAll("g")
	.data(dataByLocationSum)
	.enter()
	.append('g')
	.attr('class','bubble')
	.style('outline', 'none')
	.attr('data-tippy-content',function(d,i){
		return metadata.geo_array[i].name;
	})
	.attr('id', function(d,i){
		return 'bubble'+i
	})
	.attr('transform', function(d,i){
		p = Map.projectPoint(metadata.geo_array[i].centroid[0], metadata.geo_array[i].centroid[1]);
		return 'translate('+p.x+','+p.y+')';
	})
	.style('opacity', 1)
	.on('mouseover', function(){
		d3.select(this).style('cursor', function(){
			if(lassoActive) {
				return 'crosshair ';
			} else {
				return 'pointer';
			}
		})
		if(lassoActive) return false;
		d3.select(this).style('opacity', 0.85);
	}).on('mouseout', function(){
		d3.select(this).style('opacity', 1);
	}).on('click', function(d,i){
		if(lassoActive) return false;
		var geo = metadata.geo_array[i];
		Deepviz.filter('geo',geo.id);
	});

	tippy('.bubble', { 
		theme: 'light-border',
		delay: [250,100],
		inertia: false,
		distance: 8,
		allowHTML: true,
		animation: 'shift-away',
		arrow: true,
		size: 'small'
	});

	var featureElementG = featureElement
	.append('g')
	.attr('class', 'map-bubble')
	.attr('transform', function(d,i){
		var size = scale.map(dataByLocationSum[i]);
		return 'scale('+size+')';
	})
	.style('display', function(d,i){
		if(dataByLocationSum[i]>0){
			return 'inline';
		} else {
			return 'none';
		}
	});

	featureElementG
	.append("circle")
	.attr('class',  'outerCircle')
	.attr("stroke", colorNeutral[3])
	.attr("fill", "#FFF")
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('r' , 30)
	.attr("stroke-width", 2);

	featureElementG
	.append("circle")
	.attr('class',  'innerCircle')
	.attr("fill", colorNeutral[3])
	.attr('cx', 0)
	.attr('cy', 0)
	.attr('r' , 26)
	.attr("stroke-width", 0);

	featureElementG
	.append('text')
	.attr('text-anchor', 'middle')
	.attr('class', 'map-bubble-value')
	.text(function(d,i){
		return dataByLocationSum[i];
	})
	.attr('y', 8)
	.style('font-weight', 'normal')
	.style('font-size', '24px')
	.style('fill', '#FFF');

	function update() {
		featureElement.attr('transform', function(d,i){
			p = Map.projectPoint(metadata.geo_array[i].centroid[0], metadata.geo_array[i].centroid[1]);
			return 'translate('+p.x+','+p.y+')';
		});  
	}

	map.on("viewreset", update)

	map.on("movestart", function(){
		mapsvg.classed("hidden", true);
	});	
	map.on("move", function(){
		update();
	});
	map.on("rotate", function(){
		mapsvg.classed("hidden", true);
	});	
	map.on("moveend", function(){
		update()
		mapsvg.classed("hidden", false);
	});

	Map.update();

}

Map.projectPoint = function(lon, lat){
	var point = map.project(new mapboxgl.LngLat(lon, lat));
	return point;
}

Map.unprojectPoint = function(x, y){
	var point = map.unproject([x,y]);
	return point;
}

Map.project = function(lon, lat) {
    var point = map.project(new mapboxgl.LngLat(lon, lat));
	this.stream.point(point.x, point.y);
}


Map.createChoropleth = function(){

	transform2 = d3.geoTransform({point: Map.project});
	path2 = d3.geoPath().projection(transform2);

    var gd = dataByDate.filter(function(d){
    	return ((new Date(d.key)>=dateRange[0])&&(new Date(d.key)<dateRange[1]));
    });

    var dataByLocationSum = [];

    for(var g=0; g < metadata.geo_json.length; g++) {
    	dataByLocationSum[g] = 0;
    }

    gd.forEach(function(d,i){
    	for(var g=0; g < metadata.geo_json.features.length; g++) {
    		if(d.geo[g]>0){
    			var t = (dataByLocationSum[g]) + (d.geo[g]);
    			if(metadata.geo_json.features[g].properties.admin_level!=0){
	    			dataByLocationSum[g] = t;
	    			metadata.geo_json.features[g].properties.value = t;

    			} else {
	    			dataByLocationSum[g] = 0;
	    			metadata.geo_json.features[g].properties.value = 0;
    			}
    		}
    	}
    });

	var featureElement = mapsvg.append('g')
	.attr('id', 'map-polygons')
	.style('display', 'none')
	.selectAll("path")
	.data(metadata.geo_json.features)
	.enter()
    .append("path")
    .attr('id', function(d,i){
    	return 'polygon-'+d.properties.id;
    })
    .attr('class', 'polygon')
    .attr('data-value', function(d,i){
    	return d.properties.value;
    })
    .style("stroke", "#FFF")
    .style('display', function(d,i){
    	if(d.properties.admin_level == 1){
    		return 'block';
    	} else {
    		return 'none';
    	}
    })
    .style("fill", "green")
    .style("fill-opacity", 0.85)
	.on('mouseover', function(){
		d3.select(this).style('cursor', function(){
			if(lassoActive) {
				return 'crosshair ';
			} else {
				return 'pointer';
			}
		})
		if(lassoActive) return false;
		d3.select(this).style('opacity', 0.85);
	}).on('mouseout', function(){
		d3.select(this).style('opacity', 1);
	}).on('click', function(d,i){
		if(lassoActive) return false;
		var geo = metadata.geo_array[i];
		Deepviz.filter('geo',geo.id);
	});

	tippy('.polygon', { 
		theme: 'light-border',
		delay: [250,100],
		inertia: false,
		distance: 8,
		allowHTML: true,
		animation: 'shift-away',
		arrow: true,
		size: 'small',
		onShow(instance) {
			var ref = (instance.reference).__data__;
			var text = ref.properties.name;
			if(instance.reference.dataset.value>0){
				text = text + '<div style="padding-left: 3px; padding-bottom: 2px; display: inline; font-weight: bold; color: '+ colorNeutral[4] + '; font-size: 9px">' + addCommas(ref.properties.value) + ' '+textLabel+'</div>';
			}
			instance.setContent(text);
		}
	});

	function update() {
		featureElement.attr("d", path2); 
	}

	map.on("viewreset", update)

	map.on("movestart", function(){
		mapsvg.classed("hidden", true);
	});	
	map.on("move", function(){
		update();
	});
	map.on("rotate", function(){
		mapsvg.classed("hidden", true);
	});	
	map.on("moveend", function(){
		update()
		mapsvg.classed("hidden", false);
	});

	Map.update();
}

Map.createHeatmap = function(){

    var gd = dataByDate.filter(function(d){
    	return ((new Date(d.key)>=dateRange[0])&&(new Date(d.key)<dateRange[1]));
    });

    var dataByLocationSum = [];

    for(var g=0; g < metadata.geo_json_point.length; g++) {
    	dataByLocationSum[g] = 0;
    }

    gd.forEach(function(d,i){
    	for(var g=0; g < metadata.geo_json_point.features.length; g++) {

			metadata.geo_json_point.features[g].properties.value = 0;

    		if(d.geo[g]>0){
    			var t = (dataByLocationSum[g]) + (d.geo[g]);

    			if(metadata.geo_json_point.features[g].properties.admin_level!=0){
	    			dataByLocationSum[g] = t;
	    			metadata.geo_json_point.features[g].properties.value = t;

    			} else {
	    			dataByLocationSum[g] = 0;
	    			metadata.geo_json_point.features[g].properties.value = 0;
    			}
    		}
    	}
    });

	map.on('load', function() {
		map.addSource('heatmap', {
			type: 'geojson',
			data: metadata.geo_json_point
		});

		map.addLayer({
			'id': '#heatmap',
			'type': 'heatmap',
			'source': 'heatmap',
			'maxzoom': 9,
			'paint': {
			// Increase the heatmap weight based on frequency and property magnitude
			'heatmap-weight': { property: 'value', type: 'exponential', stops: [[0,0],[1,0.1],[100,1]]},
			'heatmap-intensity': 1.4,
			'heatmap-color': heatmapColorEntries,
			'heatmap-radius': 40,
			'heatmap-opacity': 0.6
			}
			},
			'waterway-label'
			);
	});

	Map.update();

	//**************************
	// heatmap radius slider
	//**************************

	// create average svg
	var heatmapSliderSvg = d3.select('#heatmap-radius-slider-div').append('svg')
	.attr('id', 'heatmap-radius-slider')
	.attr('width', 300)
	.attr('height', 30)
	.attr('viewBox', "0 0 "+(520)+" "+(30));

	// create checkbox
	var heatmapCheckbox = heatmapSliderSvg.append('g')
	.attr('id', 'heatmap-checkbox')
	.attr('transform','translate(6,0)');

	heatmapCheckbox.append('rect')
	.attr('x', 4)
	.attr('y', 5)
	.attr('width', 22)
	.attr('height', 22)
	.style('fill', '#FFF')
	.style('stroke-width', 3)
	.style('stroke', '#B7BEBE')
	.attr('rx', 3)
	.attr('ry', 3);

	var heatmapCheck = heatmapCheckbox.append('rect')
	.attr('x', 8)
	.attr('y', 9)
	.attr('width', 14)
	.attr('height', 14)
	.attr('fill', '#FFF')
	.attr('rx', 3)
	.attr('ry', 3);

	heatmapCheckbox.append('text')
	.text('Factor # of entries')
	.attr('font-family', 'SourceSansPro-Bold, Source Sans Pro')
	.attr('font-weight', 'bold')
	.attr('fill', '#363636')
	.attr('font-size', 19)
	.attr('y', 24)
	.attr('x', 33);

	d3.select('#heatmap-checkbox').on('click', function(){
		if(filters.heatmapCheckbox==true){
			// disable checkbox
			filters.heatmapCheckbox = false;
			heatmapCheck.attr('fill', '#FFF');
			Map.update();
		} else {
			// enable checkbox
			filters.heatmapCheckbox = true;
			heatmapCheck.attr('fill', '#666A69');
			Map.update();
		}
	})

	heatmapSliderSvg = heatmapSliderSvg.append('g')
	.attr('transform','translate(230,0)');

	var sliderWidth = 200;

	heatmapSliderSvg.append('rect')
	.attr('x', 66)
	.attr('y', 1)
	.attr('width', sliderWidth+23)
	.attr('height', 33)
	.attr('rx', 7)
	.attr('ry', 7)
	.style('fill', '#FFF')
	.style('stroke-width', 3)
	.style('stroke', '#B7BEBE');

	heatmapSliderSvg.append('text')
	.text('Radius')
	.attr('font-family', 'SourceSansPro-Bold, Source Sans Pro')
	.attr('font-weight', 'bold')
	.attr('fill', '#363636')
	.attr('font-size', 19)
	.attr('y', 24)
	.attr('x', 0);

	var heatmapSliderScale = d3.scaleLinear()
		.domain([0, sliderWidth])
		.range([0, sliderWidth])
		.clamp(true);

	var heatmapSliderScale2 = d3.scaleLinear()
		.domain([10, 70])
		.range([0, sliderWidth])
		.clamp(true);

	var heatmapSlider = heatmapSliderSvg.append("g")
	.attr("class", "heatmap-slider")
	.attr("transform", "translate("+(78)+",22)");

	heatmapSlider.append("line")
	.attr("class", "track")
	.attr("x1", 0)
	.attr("x2", sliderWidth)
	.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	.attr("class", "track-inset")
	.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	.attr("class", "track-overlay")
	.call(d3.drag()
		.on("start.interrupt", function() { heatmapSlider.interrupt(); })
		.on('end', function(){

		})
		.on("start drag", function() { 
			var heatmapScale = heatmapSliderScale(d3.event.x);
			heatmapSliderHandle.attr('transform', 'translate(' + heatmapScale +',-10)');
			var heatmapScaleInvert = heatmapSliderScale2.invert(heatmapScale);
			if(mapToggle == 'heatmap'){
				map.setPaintProperty('#heatmap', 'heatmap-radius', heatmapScaleInvert);
			}
	 }));

	heatmapSlider.insert("g", ".track-overlay")
	.attr("class", "ticks")
	.attr("transform", "translate(0," + 0 + ")");

	heatmapSlider.insert("g", ".track-overlay")
	.attr("class", "ticks")
	.attr("transform", "translate(0," + 0 + ")");

    // slider init
    var heatmapSliderHandle = heatmapSlider.insert('g', '.track-overlay')
    .attr('transform', 'translate('+sliderWidth/2+',-10)')
    .attr("class", "handle");

	if(mapToggle == 'heatmap'){
		map.setPaintProperty('#heatmap', 'heatmap-radius', 40);
	}

    heatmapSliderHandle
    .append('path')
    .attr("stroke", "#000")
    .attr('stroke-width', 0)
    .attr('fill', '#000')
    .attr("cursor", "ew-resize")
    .attr("d", 'M -7,0 -1,9 6,0 z');



}

//**************************
// create select2 location search
//**************************
Map.createSearch = function(){

	var locations = metadata.geo_array;

	locations = $.map(locations, function (obj) {
	  obj.text = obj.text || obj.name; // replace name with the property used for the text
	  return obj;
	});

	$(document).ready(function() {
	    $('#location-search').select2({
	    	data: locations,
	    	placeholder: 'LOCATIONS',
	    	scrollAfterSelect: true,
	    	shouldFocusInput: function() {
				return false;
			},
	    	templateResult: function(data) {
				var $state = $('<span>' + data.text + ' </span><div class="search-adm-id">ADM '+ data.admin_level + '</div>');
				return $state;
			}
	    });

	    $('#location-search').on('select2:select', function (e) {
	    	Deepviz.filter('geo', parseInt(e.params.data.id));
		});


		$('#location-search').on('select2:unselect', function (e) {
			Deepviz.filter('geo', parseInt(e.params.data.id));
			if(!e.params.originalEvent) {
				return;
			}
			e.params.originalEvent.stopPropagation();
		});

		d3.selectAll('.main-content, #main-content').transition().duration(1500).style('opacity', 1);

	});
}

Map.update = function(){
	if(mapToggle=='bubbles') {
		Map.updateBubbles();			
	} else if (mapToggle=='choropleth') {
		Map.updateChoropleth();
	} else if (mapToggle=='heatmap') {
		Map.updateHeatmap();
	}
}

//**************************
// update map bubbles
//**************************
Map.updateBubbles = function(){

	d3.selectAll('.map-bubble')
	.style('opacity', 0);

	d3.select('#map-polygons').style('display', 'none');

	var gd = dataByDate.filter(function(d){
		return ((new Date(d.key)>=dateRange[0])&&(new Date(d.key)<dateRange[1]));
	});

	var dataByLocationSum = [];

	for(var g=0; g < metadata.geo_array.length; g++) {
		dataByLocationSum[g] = 0;
	}

    gd.forEach(function(d,i){
    	for(var g=0; g < metadata.geo_array.length; g++) {
    		if(d.geo[g]>0){
    			var t = (dataByLocationSum[g]) + (d.geo[g]);
    			if(metadata.geo_array[g].admin_level==filters.admin_level){
	    			dataByLocationSum[g] = t;
    			} else {
	    			dataByLocationSum[g] = 0;
    			}
    		}
    	}
    });

    maxMapBubbleValue = d3.max(dataByLocationSum, function(d) {
    	return d;
    });

	scale.map = d3.scaleLinear()
	.range([0.2,1])
	.domain([0,maxMapBubbleValue]);

	var bubbles = d3.selectAll('.map-bubble')
	.attr('transform', function(d,i){
		var size = scale.map(dataByLocationSum[i]);
		return 'scale('+size+')';
	});

	bubbles.select('.map-bubble-value')
	.text(function(d,i){
		return addCommas(dataByLocationSum[i]);
	});

	bubbles.selectAll('.innerCircle').style('fill', colorNeutral[2]);

	// color bubbles accoring to severity/reliability
	var locationBySeverityReliability = dataByLocationArray.filter(function(d){
		if(filters.toggle=='severity'){
			return ((new Date(d.date)>=dateRange[0])&&(new Date(d.date)<dateRange[1])&&(d.s>0));
		} else {
			return ((new Date(d.date)>=dateRange[0])&&(new Date(d.date)<dateRange[1])&&(d.r>0));
		}
	});

	var sev = d3.nest()
	.key(function(d) {  return d.geo;})
	.rollup(function(v) { return Math.round(d3.median(v, function(d) { 
		if(filters.toggle=='severity'){
			return d.s; 
		} else {
			return d.r;
		}
	}))})
	.entries(locationBySeverityReliability);

	sev.forEach(function(d,i){
		if(filters.toggle=='severity'){
			d3.selectAll('#bubble'+(d.key-1)+ ' .innerCircle').style('fill', colorPrimary[d.value]);
			d3.selectAll('#bubble'+(d.key-1)+ ' .outerCircle').style('stroke', colorPrimary[d.value]);
		} else {
			d3.selectAll('#bubble'+(d.key-1)+ ' .innerCircle').style('fill', colorSecondary[d.value]);
			d3.selectAll('#bubble'+(d.key-1)+ ' .outerCircle').style('stroke', colorSecondary[d.value]);
		}
	})

	bubbles
	.style('opacity', function(d,i){
		d3.select(this).select('.outerCircle').style('stroke', function(){
			var id = metadata.geo_array[i].id;
			if(filters.geo.includes(id)){
				return 'cyan';
			}
		});

		if(dataByLocationSum[i]>0){
			return 1;
		} else {
			return 0;
		}
	})
	.style('display', function(d,i){
		if(dataByLocationSum[i]>0){
			return 'block';
		} else {
			return 'none';
		}
	});
	// map.setPaintProperty('choropleth', 'fill-opacity', 0);
	// map.setLayoutProperty('choropleth', 'visibility', 'none');

}

//**************************
// update map choropleth
//**************************
Map.updateChoropleth = function(){

	d3.selectAll('.map-bubble')
	.style('opacity', 0);

	d3.select('#map-polygons').style('display', 'block');

	d3.selectAll('.polygon')
	.style('fill', colorLightgrey[1])
	.attr('data-value', 0);

	var gd = dataByDate.filter(function(d){
		return ((new Date(d.key)>=dateRange[0])&&(new Date(d.key)<dateRange[1]));
	});

	var dataByLocationSum = [];

	for(var g=0; g < metadata.geo_json.features.length; g++) {
		dataByLocationSum[g] = 0;
	}

    gd.forEach(function(d,i){
    	for(var g=0; g < metadata.geo_json.features.length; g++) {
    		if(d.geo[g]>0){
    			var t = (dataByLocationSum[g]) + (d.geo[g]);
    			dataByLocationSum[g] = t;
    			metadata.geo_json.features[g].properties.value = t;
			}
    	}
    });

	maxMapPolygonValue = d3.max(dataByLocationSum, function(d,i) {
		if(metadata.geo_json.features[i].properties.admin_level==filters.admin_level)
    	return d;
    });

    scale.mapPolygons = d3.scaleLinear()
    .range([colorNeutral[0],colorNeutral[4]])
	.domain([0,maxMapPolygonValue]);
	
	metadata.geo_json.features.forEach(function(d,i){
		var v = dataByLocationSum[i];
		d3.select('#polygon-'+d.properties.id).style('fill', function(d,i){
			if(v>0){
				return scale.mapPolygons(v);
			} else {
				return colorLightgrey[1];
			}
		})
		.attr('data-value', v)
		.style('display', function(dd,ii){
			if(dd.properties.admin_level==filters.admin_level){
				return 'block';
			} else {
				return 'none';
			}
		})
		.style('stroke', function(d,i){
			var id = d.properties.id;
			if(filters.geo.includes(id)){
				return 'cyan';
			} else {
				return '#FFF';
			}
		})
	});

}

//**************************
// update heatmap
//**************************
Map.updateHeatmap = function(){

	d3.selectAll('.map-bubble')
	.style('opacity', 0);

	d3.select('#map-polygons').style('display', 'none');

	// heatmap display number of entries
	if(filters.frameworkToggle=='entries'){

		d3.select('#heatmap-checkbox').style('display', 'none');	

		var gd = dataByDate.filter(function(d){
			return ((new Date(d.key)>=dateRange[0])&&(new Date(d.key)<dateRange[1]));
		});

		var dataByLocationSum = [];

		for(var g=0; g < metadata.geo_json_point.features.length; g++) {
			dataByLocationSum[g] = 0;
			metadata.geo_json_point.features[g].properties.value = 0;
		}

	    gd.forEach(function(d,i){
	    	for(var g=0; g < metadata.geo_json_point.features.length; g++) {
	    		var t = 0;
	    		if(d.geo[g]>0){
		    		if(metadata.geo_json_point.features[g].properties.admin_level==filters.admin_level){
		    			t = (dataByLocationSum[g]) + (d.geo[g]);
		    			dataByLocationSum[g] = t;
						metadata.geo_json_point.features[g].properties.value = t;
	    			}
	    		}
			}
	    });

	    var maxMapValue = d3.max(dataByLocationSum, function(d) {
	    	return d;
	    });

		map.getSource('heatmap').setData(metadata.geo_json_point);
		if(maxMapValue>0){
			map.setPaintProperty('#heatmap', 'heatmap-weight', {property: 'value', type: 'exponential', stops: [[0,0],[1,0.4],[maxMapValue,3]]});		
		}

		if(heatmapColor!='entries'){
			heatmapColor = 'entries';
			map.setPaintProperty('#heatmap', 'heatmap-color', heatmapColorEntries);
		}
	// heatmap display severity/reliability
	} else {

		$('#heatmap-checkbox').fadeIn();	

		for(var g=0; g < metadata.geo_json_point.features.length; g++) {
			metadata.geo_json_point.features[g].properties.value = 0;
		}

		// color bubbles accoring to severity/reliability
		var locationBySeverityReliability = dataByLocationArray.filter(function(d){
			if(filters.toggle=='severity'){
				return ((new Date(d.date)>=dateRange[0])&&(new Date(d.date)<dateRange[1])&&(d.s>0));
			} else {
				return ((new Date(d.date)>=dateRange[0])&&(new Date(d.date)<dateRange[1])&&(d.r>0));
			}
		});

		var sev = d3.nest()
		.key(function(d) {  return d.geo;})
		.rollup(function(v) { return {
			'value': Math.round(d3.median(v, function(d) { if(filters.toggle=='severity'){return d.s;} else { return d.r; } } )), 
			'total': d3.sum(v, function(d){
				return 1;
			}) 
		}
		})
		.entries(locationBySeverityReliability);

		sev.forEach(function(d,i){
			var geo = metadata.geo_json_point.features[d.key-1];
			if(geo.properties.admin_level==filters.admin_level){
				if(filters.heatmapCheckbox==true){
					metadata.geo_json_point.features[d.key-1].properties.value = (d.value.value * d.value.total);
				} else {
					metadata.geo_json_point.features[d.key-1].properties.value = d.value.value;
				}
			} 
		});

		if(filters.heatmapCheckbox==true){
		    var maxMapValue = d3.max(metadata.geo_json_point.features, function(d,i){
		    	if(d.properties.admin_level==filters.admin_level){
		    		return d.properties.value;
		    	}
		    })
    		if(maxMapValue<5){
				maxMapValue = 5;
			}
		} else {
		    var maxMapValue = 5;
		}

		map.getSource('heatmap').setData(metadata.geo_json_point);

		if(maxMapValue>0){
			map.setPaintProperty('#heatmap', 'heatmap-weight', {property: 'value', type: 'exponential', stops: [[0,0],[1,0.4],[maxMapValue,3]]});		
		}

		if((heatmapColor!='severity')&&(filters.toggle=='severity')){
			heatmapColor = 'severity';
			map.setPaintProperty('#heatmap', 'heatmap-color', heatmapColorSeverity);
		}

		if((heatmapColor!='reliability')&&(filters.toggle=='reliability')){
			heatmapColor = 'reliability';
			map.setPaintProperty('#heatmap', 'heatmap-color', heatmapColorReliability);
		}
	}
	map.setLayoutProperty('#heatmap', 'visibility', 'visible');		
}