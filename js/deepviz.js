//**************************
// define variables
//**************************
var dateRange  = [new Date(2019, 4, 15), new Date(2019, 7, 31)]; // selected dateRange on load
// var minDate = new Date('2019-08-05');

// use url parameters
var url = new URL(window.location.href);
var minDate;
var maxDate;
var dateIndex;
var scale = {
	'timechart': {x: '', y1: '', y2: ''},
	'entrieschart': {x: '', y: ''},
	'map': '',
	'eventdrop': '',
	'finalScore': {x: '', y: ''},
	'sector': {x: '', y: ''},
	'sparkline': {x: '', y: ''},
	'tooltipSparkline': {x: '', y: ''},
	'severity': {x: '', y: ''},
	'affected_groups': {x: '', y: ''},
	'organisation': {x: '', y: ''},
};

var atype_keys = {};
var data_collection_technique_keys = {};

var textLabel = 'Assessments';
var timeFormat = d3.timeFormat("%d-%m-%Y");
var mapbox;
var mapboxToken = 'pk.eyJ1Ijoic2hpbWl6dSIsImEiOiJjam95MDBhamYxMjA1M2tyemk2aHMwenp5In0.i2kMIJulhyPLwp3jiLlpsA';
var mapToggle = 'bubbles';
var lassoActive = false;
var expandActive = false;
var collapsed = false;
// data related
var metadata;
var metadataEntries;
var originalData; // full original dataset without filters (used to refresh/clear filters)
var originalDataEntries; // full original dataset without filters (used to refresh/clear filters)
var data; // active dataset after filters applied
var dataNotScore;// topline severity/score charts must filter indepenently
var dataEntries;
var dataEntriesNotSeverity;
var dataByDate;
var dataByMonth;
var dataByYear;
var dataByLocation;
var dataByLead;
var dataByPublisher;
var dataByAssessmentType;
var dataByOrganisation;
var dataByOrganisationType;
var dataByDataCollectionTechnique;
var dataByUnitOfAnalysis;
var dataByUnitOfReporting;
var dataByMethodologyContent;
var dataByAdditionalDocumentation;
var dataByLanguage;
var dataBySamplingApproach;
var dataByLocationSum;
var dataByLocationArray;
var dataByFocus;
var dataByFocusArray;
var dataBySector;
var dataByFramework;
var dataByFrameworkSector;
var	databyFrameworkContext;
var dataBySpecificNeeds;
var dataByAffectedGroups;
var dataFitForPurpose;
var coordinatedJointId;
var coordinatedHarmonizedId;
var uncoordinatedId;
var stakeholder_type_keys = {};
var total = 0;
var disableSync = false;
var disableSync_location_threshold = 1000;
var disableSync_entries_threshold = 5000;
var maxValue; // max value on a given date
var maxFocusValue;
var tp_finalScore = [];
var tp_reliability = [];
var duration = 700;
// timechart variables
var timechartInit = 0;
var timechartyAxis;
var timechartyGrids;
var displayCalendar = false;
var hoverColor = 'rgba(0,0,0,0.03)';
var entriesAxis;
var entriesMax;
var width = 1300;
var margin = {top: 18, right: 17, bottom: 0, left: 45};
var timechartViewBoxHeight = 970;
var timechartViewBoxWidth = width;
var timechartSvgHeight = 970;
var timechartHeight = 336;
var timechartHeight2 = timechartHeight;
var timechartHeightOriginal = timechartHeight;
var entriesChartHeight = 80;
var entriesTopMargin = 34;
var brush;
var gBrush; 
var barWidth;
var numContextualRows;
var numCategories;
var frameworkToggleImg;
var tooltipSparklineHeight = 40;
var tooltipSparklineWidth = 140;
// trendline
var trendlinePoints;
var avgSliderBrushing = false; // brush state
var pathData = {};
var clickTimer = 0;
var smoothingVal = 10;
var curvedLine = d3.line()
.x(function(d,i){
	return scale.timechart.x(dataByDate[i].date);
})
.y(d => (d))
.curve(d3.curveLinear);

var labelCharLimit = 30;

// map
var maxMapBubbleValue;
var maxMapPolygonValue;
var mapAspectRatio = 1.3;
var geoBounds = {'lat': [], 'lon': []};
// radar
var radarChartOptions;
var radarMargin;
var radarHeight;
var radarWidth;
var radarColor; 

// filters
var filters = {
	id: [],
	str: '',
	sector: [],
	sector_count: [],
	sampling_approach: [],
	language: [],
	additional_documentation: [],
	methodology_content: [],
	unit_of_reporting: [],
	unit_of_analysis: [],
	data_collection_technique: [],
	assessment_type: [],
	finalScore: [],
	severity: [],
	affected_groups: [],
	stakeholder_type: [],
	context: [],
	focus: [],
	organisation: [],
	coordination: [],
	top: [],
	geo: [],
	toggle: 'finalScore',
	admin_level: 1,
	frameworkToggle: 'entries',
	time: 'd',
	panelLayout: 'default'
};

var svg_summary1;
var svg_summary2;
var svg_summary3;
var svg_quality;

var printing = false;

// colors
var colorPrimary = ['#A1E6DB','#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33', '#b30000']; // finalScore (multi-hue)
var colorGrey = ['#CDCDCD', '#AFAFAF', '#939393', '#808080', '#646464'];
var colorLightgrey = ['#EBEBEB', '#CFCFCF', '#B8B8B7', '#A8A9A8', '#969696'];
var colorLightgrey = ['#fafafa','#F5F5F5', '#DFDFDF', '#D0D0D0', '#C7C7C7', '#BABABA'];
var colorBlue = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];
var colorNeutral = ['#ddf6f2', '#76D1C3', '#36BBA6', '#1AA791', '#008974'];
var colorPrimary = ['#ddf6f2', '#76D1C3', '#36BBA6', '#1AA791', '#008974'];
var colorSecondary = ['#A1E6DB','#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33', '#b30000']; // finalScore (multi-hue)

var maxCellSize = 4;
var cellColorScale = d3.scaleSequential().domain([1,maxCellSize])
.interpolator(d3.interpolateReds);

var Deepviz = function(sources, callback){

	//**************************
	// load data
	//**************************

	// define the data source to be loaded. replace with API URL endpoint
	var files = sources;

	// load each data source
	var promises = [];
	files.forEach(function(url) {
        // Error handle for invalid URL
        if(url.startsWith('http')){
			parsed_url = new URL(url);
	        pathname = parsed_url.pathname;
        } else {
        	pathname = url;
        }
		if(pathname.endsWith('json')){
			promises.push(d3.json(url));			
		};
		if(pathname.endsWith('csv')){
			promises.push(d3.csv(url));			
		};
		if(pathname.endsWith('svg')){
			promises.push(d3.xml(url));			
		};
	});

	// after all data has been loaded
	Promise.all(promises).then(function(values) {
		//**************************
		// all data loaded
		//**************************

		// return the data
		dataEntries = values[0].entry_data.data;
		dataAssessments = values[0].ary_data.data;

		svg_summary1 = values[1];
		svg_summary2 = values[2];
		svg_summary3 = values[3];
		svg_quality = values[4];

		metadata = values[0].ary_data.meta;
		metadata.geo_array = values[0].geo_data;
		metadataEntries = values[0].entry_data.meta;
		metadataEntries.geo_array = metadata.geo_array;

		frameworkToggleImg = values[1];

		parseGeoData();

		metadata = parseAssessmentsMetadata(metadata);
		data = parseAssessmentsData(dataAssessments, metadata);

		metadataEntries = parseEntriesMetadata(metadataEntries);
		dataEntries = parseEntriesData(dataEntries, metadataEntries);

		// disableSync threshold
		if(metadata.geo_array.length>disableSync_location_threshold) disableSync = true;
		if(data.length>disableSync_entries_threshold) disableSync = true;
		if(urlQueryParams.get('disableSync')) disableSync = true;

		// parse url variable options
		if(urlQueryParams.get('minDate')){
			minDate = new Date(urlQueryParams.get('minDate'));
			minDate.setHours(0);
			minDate.setMinutes(0);
			data = data.filter(function(d){
				return d.date >= minDate;
			});
			dataEntries = dataEntries.filter(function(d){
				return d.date >= minDate;
			});
		}
		if(urlQueryParams.get('maxDate')){
			maxDate = new Date(urlQueryParams.get('maxDate'));
			maxDate.setHours(0);
			maxDate.setMinutes(0);
			data = data.filter(function(d){
				return d.date <= maxDate;
			})
			dataEntries = dataEntries.filter(function(d){
				return d.date <= maxDate;
			})
		}
		if(urlQueryParams.get('time')){
			filters.time=urlQueryParams.get('time');
		}
		if(urlQueryParams.get('admin_level')){
			filters.admin_level=parseInt(urlQueryParams.get('admin_level'));
		}

		// set the data again for reset purposes
		originalData = data;
		dataNotScore = data;
		originalDataEntries = dataEntries;
		dataEntriesNotSeverity = dataEntries;

		// num contextual rows
		numContextualRows = metadata.focus_array.length;

		//**************************
		// find maximum and minimum values in the data to define scales
		//**************************

		// define maximum date 
		maxDate = new Date(d3.max(data, function(d){
			return d.date;
		}));

		maxDateEntries = new Date(d3.max(dataEntries, function(d){
			return d.date;
		}));

		if(maxDateEntries>maxDate) maxDate = maxDateEntries;

		maxDate.setDate(maxDate.getDate() + 1);
		maxDate.setHours(0);
		maxDate.setMinutes(0);

		var today = new Date();
		if(maxDate<today){
			maxDate = today;
		};

		dateRange[1] = maxDate;
		
		// define minimum date 
		minDate = new Date(d3.min(data, function(d){
			return d.date;
		}));

		minDateEntries = new Date(d3.min(dataEntries, function(d){
			return d.date;
		}));

		if(minDateEntries<minDate) minDate = minDateEntries;

		minDate.setDate(minDate.getDate());
		minDate.setHours(0);
		minDate.setMinutes(0);

		// override colors
		d3.select('#total_assessments').style('color',colorNeutral[3]);
		d3.select('#finalScore_value').style('color',colorPrimary[3]);
		d3.select('#reliability_value').style('color',colorSecondary[3]);
		d3.select('.selection').style('fill', colorNeutral[3]);
		d3.select('#dateRange').style('color', colorNeutral[4]);
		
		return callback(values);
	});

	var refreshData = function(){

		dataByDate = d3.nest()
		.key(function(d) { return d.date;})
		.key(function(d) { return d.finalScore; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(data);	

		dataEntriesByDate = d3.nest()
		.key(function(d) { return d.date;})
		.key(function(d) { return d.severity; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(dataEntries);	

		if(filters.time=='m'){
			dataByDate = d3.nest()
			.key(function(d) { return d.month;})
			.key(function(d) { return d.finalScore; })
			.rollup(function(leaves) { return leaves.length; })
			.entries(data);	

			dataEntriesByDate = d3.nest()
			.key(function(d) { return d.month;})
			.key(function(d) { return d.severity; })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataEntries);			
		}

		if(filters.time=='y'){
			dataByDate = d3.nest()
			.key(function(d) { return d.year;})
			.key(function(d) { return d.finalScore; })
			.rollup(function(leaves) { return leaves.length; })
			.entries(data);	

			dataEntriesByDate = d3.nest()
			.key(function(d) { return d.year;})
			.key(function(d) { return d.severity; })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataEntries);			
		}

		dataByFrameworkSector = [];
		dataBySector = [];
		dataByFramework = [];
		dataByAffectedGroups = [];
		dataBySpecificNeeds = [];
		dataByAssessmentType = [];
		dataByDataCollectionTechnique = [];
		dataByOrganisation = [];
		dataByOrganisationType = [];
		dataByLocationArray = [];
		dataByFocusArray = [];
		dataByFrameworkContext = [];
		dataByUnitOfAnalysis = [];
		dataByUnitOfReporting = [];
		dataByLanguage= [];
		dataBySamplingApproach = [];
		dataByPublisher = [];
		var publisherArray = [];

		dataByMethodologyContent = [];
		dataByAdditionalDocumentation = [];
		// assessment data
		data.forEach(function(d,i){
			var frameworks = [];
			var contexts = [];
			var sectors = [];

			d.sector.forEach(function(dd,ii){
				// unique entries by sector
				var sectorRow = {"date": d.date, "month": d.month, "year": d.year, "sector": dd, 's': d.finalScore, 'r': null };
				if(!sectors.includes(dd)){
					dataBySector.push(sectorRow);
					sectors.push(dd);
				}
			});

			d.geo.forEach(function(dd,ii){
				var adm = null;
				metadata.geo_array.forEach(function(d,i){
					if(dd==d.id){
						adm = d.admin_level;
					}
				})
				dataByLocationArray.push({"date": d.date, "month": d.month, "year": d.year, "geo": dd, "admin_level": adm, 's': d.severity, 'r': d.reliability });
			});

			d.focus.forEach(function(dd,ii){
				dataByFocusArray.push({"date": d.date, "month": d.month, "year": d.year, "focus": dd, 's': d.finalScore, 'r': null})
			});

			d.affected_groups.forEach(function(dd,ii){
				dataByAffectedGroups.push({"date": d.date, "month": d.month, "year": d.year, "affected_groups": dd, 's': d.finalScore, 'r': null });
			});

			d.unit_of_analysis.forEach(function(dd,ii){
				dataByUnitOfAnalysis.push({"date": d.date, "month": d.month, "year": d.year, "unit_of_analysis": dd, 's': d.finalScore, 'r': null });
			});

			d.unit_of_reporting.forEach(function(dd,ii){
				dataByUnitOfReporting.push({"date": d.date, "month": d.month, "year": d.year, "unit_of_reporting": dd, 's': d.finalScore, 'r': null });
			});

			d.language.forEach(function(dd,ii){
				dataByLanguage.push({"date": d.date, "month": d.month, "year": d.year, "language": dd, 's': d.finalScore, 'r': null });
			});

			d.sampling_approach.forEach(function(dd,ii){
				dataBySamplingApproach.push({"date": d.date, "month": d.month, "year": d.year, "sampling_approach": dd, 's': d.finalScore, 'r': null });
			});

			d.methodology_content.forEach(function(dd,ii){
				dataByMethodologyContent.push({"date": d.date, "month": d.month, "year": d.year, "methodology_content": dd.id, 's': d.finalScore, 'r': null });
			});

			d.additional_documentation.forEach(function(dd,ii){
				for (i = 0; i < dd.value; i++) {
					dataByAdditionalDocumentation.push({"date": d.date, "month": d.month, "year": d.year, "additional_documentation": dd.id, 's': d.finalScore, 'r': null });
				}
			})

			dataByAssessmentType.push({"date": d.date, "month": d.month, "year": d.year, 'assessment_type': parseInt(d.assessment_type), 's': d.finalScore, 'r': null});

			d.organization_and_stakeholder_type.forEach(function(dd,ii){
				var name;
				metadata.organization.forEach(function(ddd,ii){
					if(parseInt(ddd.id)==parseInt(dd[1])){
						name = ddd.name;
						dataByOrganisation.push({"date": d.date, "month": d.month, "year": d.year, "stakeholder_type": dd[0], "organisation": dd[1], 'name': name, 's': d.finalScore, 'r': null });
					}
				});
			});

			d.data_collection_technique.forEach(function(dd,ii){
				if(dd!==null)
				dataByDataCollectionTechnique.push({"date": d.date, "month": d.month, "year": d.year, "data_collection_technique": dd, 's': d.finalScore, 'r': null });
			});

			// publishers (unique based on source_raw strinng)
			if(d.lead.source){
				var src = d.lead.source.id;
			} else {
				var src = d.lead.source_raw;
			}
			var publisherArrayStr = d.date.getTime()+'-'+src;
			if(!publisherArray.includes(publisherArrayStr)){
				publisherArray.push(publisherArrayStr);
				var publisherRow = {"date": d.date, "month": d.month, "year": d.year, publisher_str: src};
				if(src>0){
					dataByPublisher.push(publisherRow);
				}
			};

		});

		// entries data
		dataByLead = [];
		var leadArray = [];
		dataEntries.forEach(function(d,i){
			// leads
			var leadArrayStr = d.date.getTime()+'-'+d.lead.id;
			if(!leadArray.includes(leadArrayStr)){
				leadArray.push(leadArrayStr);
				var leadRow = {"date": d.date, "month": d.month, "year": d.year, lead_id: d.lead.id};
				dataByLead.push(leadRow);
			};
		})

		dataByLocation = d3.nest()
		.key(function(d) { return d.date;})
		.key(function(d) { return d.geo; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(dataByLocationArray);

		dataByFocus = d3.nest()
		.key(function(d) { return d.date;})
		.key(function(d) { return d.focus; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(dataByFocusArray);

		if(filters.time=='m'){

			dataByLocation = d3.nest()
			.key(function(d) { return d.month;})
			.key(function(d) { return d.geo; })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataByLocationArray);

			dataByFocus = d3.nest()
			.key(function(d) { return d.month;})
			.key(function(d) { return d.focus; })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataByFocusArray);

		}

		if(filters.time=='y'){

			dataByLocation = d3.nest()
			.key(function(d) { return d.year;})
			.key(function(d) { return d.geo; })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataByLocationArray);

			dataByFocus = d3.nest()
			.key(function(d) { return d.year;})
			.key(function(d) { return d.focus; })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataByFocusArray);
		}

		maxFocusValue = d3.max(dataByFocus, function(d) {
			var m = d3.max(d.values, function(d) {
				return d.value;
			})
			return m;
		});

		scale.eventdrop = d3.scaleLinear()
		.range([0,12])
		.domain([0,maxFocusValue]);

		trendlinePoints = [];
		tp = [];

		dataByLocation.forEach(function(d,i){
			var dt = new Date(d.key);
			dt.setHours(0,0,0,0);
			d.date = d.key;
		});

		dataByDate.forEach(function(d,i){
			var dt = new Date(d.key);
			dt.setHours(0,0,0,0);
			d.key = dt;
			d.date = d.key;

			var count = 0;

			d.finalScore = [0,0,0,0,0,0];

			d.values.forEach(function(dx){
				d.finalScore[dx.key] = dx.value;
				count += dx.value;
			});

			d.reliability = [0,0,0,0,0,0];

			// set up empty context array for data loop
			var contextArr = [];
			var numContextRows = metadata.focus_array.length;

			for(b=0; b<=numContextRows-1; b++){
				contextArr[b] = 0;
			}

			dataByFocus[i] && dataByFocus[i].values.forEach(function(dx, ii){
				var k = dx.key-1;
				contextArr[k] = dx.value
			});

			d.focus = contextArr;

		    // geo array
		    var geoArr = [];

	    	dataByLocation.forEach(function(dl,ii){
	    		if(dl.key==d.key){
				    dl.values.forEach(function(dx, ii){
				    	var k = dx.key-1;
				    	geoArr[k] = dx.value;
				    });
	    		}
	    	})

		    d.geo = geoArr;

		    d.total_assessments = count;

		    dataByDate[i].barValues = d[filters.toggle];

		    delete d.values;
		});
	
		dataEntriesByDate.forEach(function(d,i){
			var dt = new Date(d.key);
			dt.setHours(0,0,0,0);
			d.key = dt;
			d.date = d.key;
			var count = 0;
			d.severity = [0,0,0,0,0,0];
			d.values.forEach(function(dx){
				d.severity[dx.key] = dx.value;
				count += dx.value;
			});
			d.total_entries = count;
			d.severity_avg = ( (1*d.severity[1]) + (2*d.severity[2]) + (3*d.severity[3]) + (4*d.severity[4]) + (5*d.severity[5]) ) / count;
		    dataEntriesByDate[i].barValues = d['severity'];
		    delete d.values;
		});

		dataEntriesByDate.sort(function(x,y){
			return d3.ascending(x.date, y.date);
		})

		dataByDate.sort(function(x,y){
			return d3.ascending(x.date, y.date);
		})

		dataByLocation.sort(function(x,y){
			return d3.ascending(x.date, y.date);
		})

		maxValue = d3.max(dataByDate, function(d) {
			return d.total_assessments;
		});

		entriesMax = d3.max(dataEntriesByDate, function(d) {
			return d.total_entries;
		});

		Summary.update(true);
		updateRadarCharts();
		BarChart.updateStackedBars('affected_groups', dataByAffectedGroups);
		BarChart.updateStackedBars('assessment_type', dataByAssessmentType);
		BarChart.updateStackedBars('data_collection_technique', dataByDataCollectionTechnique);
		BarChart.updateStackedBars('sampling_approach', dataBySamplingApproach);
		BarChart.updateBars('methodology_content', dataByMethodologyContent);
		BarChart.updateBars('additional_documentation', dataByAdditionalDocumentation);
		BarChart.updateStackedBars('unit_of_reporting', dataByUnitOfReporting);
		BarChart.updateStackedBars('unit_of_analysis', dataByUnitOfAnalysis);
		BarChart.updateStackedBars('language', dataByLanguage);
		BarChart.updateStackedBars('sector', dataBySector);
		BarChart.updateBars('focus', dataByFocusArray);
		BarChart.updateStackedBars('organisation', dataByOrganisation)
		return dataByDate;

	}

	//**************************
	// create svg function (reuseable)
	//**************************
	this.createSvg = function(options){

		// defaults
		var w = '100%',
		height = '100%',
		viewBoxWidth = options.viewBoxWidth,
		viewBoxHeight = options.viewBoxHeight,
		id = options.id,
		svgClass = options.id,
		div = options.div,
		aspectRatio = viewBoxWidth/viewBoxHeight;

		// height = $(div).width()*aspectRatio;

		var rid = 'divcontainer_'+Math.floor(Math.random()*10000);
		$(div).append('<div id="'+rid+'"></div>');

		div = '#'+rid;
		$(div).css('margin', 'auto');
		$(div).addClass('vizlibResponsiveDiv');
		$(div).attr('data-aspectRatio', aspectRatio);
		$(div).css('overflow','hidden');

		var vx = viewBoxWidth;
		var vy = vx*aspectRatio;

		// append svg to div
		this.svg = d3.select(div)
		.append('svg')
		.attr('id', id)
		.attr('class', svgClass)
		.attr('width', w)
		.attr('viewBox', "0 0 "+(viewBoxWidth)+" "+(viewBoxHeight-00))
		.attr('preserveAspectRatio', "xMinYMin slice")
		.style('-moz-user-select','none')
		.style('-khtml-user-select','none')
		.style('-webkit-user-select','none')
		.style('-ms-user-select','none')
		.style('user-select','none')

		// this.svg.append('style')
		// .attr('type', 'text/css')
		// .text('@font-face { font-family: "Source Sans Pro"; src: url("fonts/SourceSansPro-regular.ttf"); } @font-face { font-family: "Source Sans Pro"; font-weight: bold; src: url("fonts/SourceSansPro-bold.ttf"); }');

		return this.svg;
	};

	//**************************
	// create summary
	//**************************
	this.createSummary = function(){
		Summary.create(svg_summary1,svg_summary2,svg_summary3);
	}

	//**************************
	// create timechart
	//**************************
	this.timeChart = function(options){

		var chartdata = refreshData();

		// container g, and
		var svg = options.appendTo
		.append("svg")
		.attr('id', options.id)
		.attr('class', options.id)
		.style('opacity', options.opacity)
		.attr('x',0+options.offsetX)
		.attr('y',0+options.offsetY)
		.attr('width',options.width)
		.attr('height', timechartSvgHeight)
		.append('g')
		.attr("transform", "translate(0,0)");

		var width_new = options.width - (margin.right + margin.left);
		timechartHeight2 = timechartHeight - (margin.top + margin.bottom);

		maxValue = d3.max(dataByDate, function(d) {
			return d.total_assessments;
		});

		// define maximum date 
		maxDate = new Date(d3.max(data, function(d){
			return d.date;
		}));
		var maxAssessmentDate = maxDate;

		var today = new Date();
		if(maxDate<today){
			maxDate = today;
		};

		if(urlQueryParams.get('maxDate')){
			maxDate = new Date(urlQueryParams.get('maxDate'));
		}	

		maxDate.setHours(0);
		maxDate.setMinutes(0);
		
		// define minimum date 
		minDate = new Date(d3.min(originalData, function(d){
			return d.date;
		}));

		minDateEntries = new Date(d3.min(dataEntries, function(d){
			return d.date;
		}));

		if(urlQueryParams.get('minDate')){
			minDate = new Date(urlQueryParams.get('minDate'));
			minDateEntries = new Date(urlQueryParams.get('minDate'));
		}	

		if(minDateEntries<minDate) minDate = minDateEntries;

		minDate.setHours(0);
		minDate.setMinutes(0);

		if(timechartInit==0){
			if(filters.time=='d'){
				maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth()+1, 1);
				minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
				dateRange[0] = new Date(maxAssessmentDate.getFullYear(), maxAssessmentDate.getMonth(), 1);
				dateRange[1] = maxDate;
			}	
			timechartInit=1;
		} else {
			if(filters.time=='d'){
				minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
				maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth()+1, 1);
				if(dateRange[1]>maxDate)dateRange[1]=maxDate;
				if(dateRange[0]<minDate)dateRange[0]=minDate;
			}				
		}

		if($('#dateRange').data('daterangepicker'))$('#dateRange').data('daterangepicker').remove();
		d3.select('#dateRange').style('cursor', 'default');	

		if(filters.time=='d'){

			var today = new Date();
			today.setHours(0,0,0,1);
			var thisYear = today.getFullYear();

			var md = new Date(today.getFullYear(), today.getMonth()+1, 0);
			if(md>=new Date(maxDate.getFullYear(), maxDate.getMonth()+1, 0)){
				md = new Date(moment(maxDate).subtract(1,'days'));
			}

			var ranges = {};

			if(maxDate>today){
				ranges['Today'] = [moment(), moment()];
			}

			if(maxDate>moment().subtract(1, 'days')){
				ranges['Yesterday'] = [moment().subtract(1, 'days'), moment().subtract(1, 'days')];
			}

			ranges['Last Week'] = [new Date(moment().subtract(7,'days')), moment()],

			ranges['Last 30 Days'] = [moment(new Date()).subtract(29, 'days'), now];

			ranges['Last Month'] = [new Date(today.getFullYear(), today.getMonth()-1, 1), new Date(today.getFullYear(), today.getMonth(), 0)],
			ranges['Last 3 Months'] = [new Date(today.getFullYear(), today.getMonth()-2, 1), md],
			ranges['Last 6 Months'] = [new Date(today.getFullYear(), today.getMonth()-5, 1), md]

			if(md.getFullYear()>=today.getFullYear() ) {
				ranges['This Year'] = [new Date(today.getFullYear(), 0, 1), moment(maxDate).subtract(1,'days')];
			}

			if(minDate.getFullYear()<=(today.getFullYear()-1)){
				var max = new Date(today.getFullYear()-1, 12, 0);
				if(maxDate<=max){
					max = moment(maxDate).subtract(1,'days');
				}
				ranges['Last Year'] = [new Date(today.getFullYear()-1, 0, 1), max];
			}

			var now = moment(); 
			if(maxDate<=now){
				now = moment(maxDate).subtract(1,'days');
			}

			// 1 may 2020
			var thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
			// 1 apr 2020
			var maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
			if( maxMonth > thisMonth) ranges['This Month'] = [new Date(today.getFullYear(), today.getMonth(), 1), moment(maxDate).subtract(1,'days')];

			if(maxDate.getFullYear<=now){
				now = moment(maxDate).subtract(1,'days');
			}

			$('#dateRange').daterangepicker({
				"locale": {
					"format": "DD MMM YYYY",
				},
				showDropdowns: true,
				showCustomRangeLabel: false,
				alwaysShowCalendars: true,
				ranges: ranges,
				autoApply: true,
				maxYear: maxDate.getFullYear(),
				minYear: minDate.getFullYear(),
				minDate: minDate,
				maxDate: maxDate
			});	

			d3.select('#dateRange').style('cursor', 'pointer');

			d3.select('#timeChart').on('click', function(){
				$('#dateRange').data('daterangepicker').hide();
			});

			$('#dateRange').on('click.daterangepicker', function(){
					if(displayCalendar==true) { 
						displayCalendar = false;
						$('#dateRange').data('daterangepicker').hide();
					} else {
						displayCalendar = true;
						$('#dateRange').data('daterangepicker').show();		
					}
			});

			$('#dateRange').on('hide.daterangepicker', function(){
				displayCalendar = false;
			});	

		} 

		if(filters.time=='m'){
			maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth()+1, 1);
			minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
			
			var d1 = dateRange.map(d3.timeDay.round);
			d1[0] = d3.timeMonth.floor(d1[0]);
			d1[1] = d3.timeMonth.ceil(d1[1]);

			dateRange[0] = d1[0];
			dateRange[1] = d1[1];

			if(dateRange[0]<minDate)dateRange[0]=minDate;
			if(dateRange[1]>maxDate)dateRange[1]=maxDate;

			if (dateRange[1] <= dateRange[0]) {
				dateRange[1] = new Date(dateRange[1].getFullYear(), dateRange[1].getMonth() +1, 1);
			} 
		}

		if(filters.time=='y'){
			maxDate = new Date(maxDate.getFullYear()+1, 0, 1);
			minDate = new Date(minDate.getFullYear(), 0, 1);
			var d1 = dateRange.map(d3.timeDay.round);
			// dateRange[0] = d1[0];
			// dateRange[1] = d1[1];
			var d2 = new Date(dateRange[1]);
			d2.setDate(d2.getDate()-1);
			dateRange[0] = new Date(d1[0].getFullYear(), 0, 1);;
			dateRange[1] = new Date(d2.getFullYear()+1, 0, -1);
		}

		// define horizontal scale
		scale.timechart.x = d3.scaleTime()
	    .domain([minDate, maxDate])
	    .range([0, (options.width - (margin.right + margin.left))])

		var svgChartBg2 = svg.append('g').attr('id', 'svgchartbg2').attr('class', 'chartarea2').attr('transform', 'translate('+(margin.left+0)+','+0+')');

		var svgBg = svg.append('g').attr('id', 'svgBg');

		svgBg.append('rect')
		.attr('x',margin.left)
		.attr('y',margin.top)
		.attr('width',width_new)
		.attr('height',timechartHeight2)
		.attr('opacity',0);

		//**************************
		// setup svg layers
		//**************************
		var gridlines = svgBg.append('g').attr('id', 'gridlines').attr('class', 'gridlines').attr('transform', 'translate('+(margin.left+0)+','+margin.top+')');
		var svgChartBg = svg.append('g').attr('id', 'svgchartbg').attr('class', 'chartarea').attr('transform', 'translate('+(margin.left+0)+','+margin.top+')');
		var chartAreaParent = svg.append('g').attr('id', 'chart-area-parent').attr('transform', 'translate('+(margin.left+0)+','+margin.top+')');

		var chartAreaSvg = chartAreaParent
		.append('svg')
		.attr('id', 'chart-area-svg')
		.attr('preserveAspectRatio', 'none')
		.attr('viewBox', '0 0 '+options.width+' '+timechartSvgHeight);

		var svgChart = chartAreaSvg
		.append('g')
		.attr('id', 'chartarea')
		.style('opacity', 1);

		// right chart - white rect masks
		svg
		.append('rect')
		.attr('height', timechartSvgHeight)
		.attr('width', 35)
		.attr('x', options.width-18)
		.attr('y',margin.top)
		.style('fill', '#FFF')
		.style('fill-opacity',1);

		// svg
		// .append('line')
		// .attr('y1',  timechartHeight2+margin.top+1)
		// .attr('y2', margin.top)
		// .attr('stroke-width', 1)
		// .attr('x1', options.width-margin.right)
		// .attr('x2', options.width-margin.right)
		// .style('stroke', '#ebebeb');

		var svgEventDrop = svg.append('g')
		.attr('id', 'eventdrop')
		.attr('transform', 'translate('+(margin.left+0)+','+margin.top+')')
		.style('opacity', 1);

		var topLayer = svg.append('g')
		.attr('id', 'toplayer')
		.attr('transform', 'translate('+(margin.left+0)+','+margin.top+')')
		.style('opacity', 1);

		var svgAxisBtns = svg.append('g').attr('id', 'svgAxisBtns').attr('transform', 'translate('+(margin.left+0)+','+(timechartSvgHeight-38+8)+')');

		// create average svg
		var timechartLegend = this.createSvg({
			id: 'timechart_legend',
			viewBoxWidth: 285,
			viewBoxHeight: 20,
			div: '#timechart-legend',
			width: '100%'
		}).append('g');

		timechartLegend
		.append("text")
		.attr('class','axisLabel')
		.attr('id', 'rightAxisLabel')
		.attr("y", 16)
		.attr("x", 170)
		.style('font-weight','lighter')
		.style('font-size', '15px')
		.text('Number of Entries')

		timechartLegend
		.append("line")
		.attr('id', 'rightAxisLabelLine')
		.attr("y1", 12)
		.attr("y2", 12)
		.attr("x1", 163)
		.attr("x2", 152)
		.style('stroke', colorSecondary[4])
		.style('stroke-width',10)
		.style('stroke-opacity',1)

		timechartLegend
		.append("text")
		.attr('class','axisLabel')
		.attr("y", 16)
		.attr("x", 22)
		.style('font-weight','lighter')
		.style('font-size', '15px')
		.text('Total '+textLabel)

		timechartLegend
		.append("rect")
		.attr('id', 'leftAxisBox')
		.attr("y", 6)
		.attr("x", 5)
		.attr('width', 10)
		.attr('height', 10)
		.style('fill', colorNeutral[3]);

	    //**************************
	    // Y AXIS left
	    //**************************

		svgBg.append('rect')
		.attr('x', -5)
		.attr('y', 0)
		.attr('height', timechartHeight2+25)
		.attr('width', 50)
		.style('fill', 'white');

	    scale.timechart.y1 = d3.scaleLinear()
	    .range([timechartHeight2, 0])
	    .domain([0, rounder(maxValue)]);

	    timechartyAxis = d3.axisLeft()
	    .scale(scale.timechart.y1)
	    .ticks(4)
	    .tickSize(0)
	    .tickPadding(8);

		// y-axis
		var yAxisText = svg.append("g")
		.attr("class", "yAxis axis")
		.attr("id", "timechartyAxis")
		.attr('transform', 'translate('+(margin.left-1)+','+margin.top+')')
		.call(timechartyAxis)
		.style('font-size', options.yAxis.font.values.size);

		// add the Y gridline
		timechartyGrid = d3.axisLeft(scale.timechart.y1)
		.ticks(4)
		.tickSize(-options.width+52)
		.tickFormat("")

		gridlines.append("g")			
		.attr("class", "grid")
		.attr('id', 'timechartyGrid')
		.call(timechartyGrid);

		d3.select('#timechartyGrid')
		.transition()
		.duration(duration)
		.call(timechartyGrid);


		//**************************
		// x-axis
		//**************************

		var xAxis = d3.axisBottom()
		.scale(scale.timechart.x)
		.tickSize(0)
		.tickPadding(6);

		var xAxisTop = d3.axisBottom()
		.scale(scale.timechart.x)
		.tickSize(0)

		var textLength = '6%';
		if(expandActive==true) textLength = '2%';

		if(filters.time=='y'){
			xAxis.ticks(d3.timeYear.every(1))
			.tickFormat(d3.timeFormat("%Y"));
			xAxisTop.ticks(d3.timeYear.every(1))
			.tickFormat(d3.timeFormat("%Y"));
			var textLength = '3%';
			if(expandActive==true) textLength = '2%';
		} else {
			var months = monthDiff(minDate, maxDate);
			if(months<=5){
				xAxis.ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b %Y"));
				xAxisTop.ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b %Y"));
			} else {
				xAxis.ticks(10).tickFormat(d3.timeFormat("%b %Y"));
				xAxisTop.ticks(10).tickFormat(d3.timeFormat("%b %Y"));

			}
		}

		// x-axis top
		var xAxisObjTop = chartAreaSvg.append("g")
		.attr("class", "xAxis2 axis")
		.attr("transform", "translate(" + -0.5 + "," + (timechartHeight2) + ")")
		.call(xAxisTop);

		xAxisObjTop.selectAll(".tick")
		.append('line')
		.attr('class', 'xAxisHorizontalLine')
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', -(timechartSvgHeight-timechartHeight2-margin.top-39))
		.attr('y2', 0)
		.attr('vector-effect', 'non-scaling-stroke');

		xAxisObjTop.selectAll(".tick text")
		.attr("transform", "translate(" + 0 + ", "+-timechartHeight2+")")
		.attr('lengthAdjust', 'spacingAndGlyphs')
		.attr('text-anchor', 'start')
		.attr('text-align', 'left')
		.attr('textLength', textLength)
		.attr('font-variant', 'small-caps')
		.attr('x', '0.3%')

		// x-axis bottom
		var xAxisObj = svgBg.append("g")
		.attr("class", "xAxis axis")
		.attr("transform", "translate(" + margin.left + "," + (timechartSvgHeight-38) + ")")
		.call(xAxis)
		.style('font-weight', 'normal')
		.style('fill', 'green');

		xAxisObj
		.selectAll('path, line')
		.style('opacity', 1 )
		.style('stroke', '#535353' )
		.style('stroke-width', 1);

		xAxisObj.selectAll(".tick line, text")
		.attr("transform", "translate(" + 38 + ", 3)")
		.attr('font-variant', 'small-caps');

		xAxisObj.selectAll(".tick")
		.append('line')
		.attr('class', 'xAxisHorizontalLine')
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', -(timechartSvgHeight-timechartHeight2-margin.top-39))
		.attr('y2', 22);

		xAxisObj
		.append('line')
		.attr('class', 'axisBaseline')
		.attr('x1',0)
		.attr('x2',1250)
		.attr('y1', 0)
		.attr('y2', 0)
		.style('stroke', '#E1E1E1')
		.style('stroke-width', '1px')

		// add the axis buttons
		xAxisObj.selectAll(".tick").each(function(d,i){
			var tick = d3.select(this);
			svgAxisBtns.append('rect')
			.attr('width', 80)
			.attr('height',20)
			.attr('x', 5)
			.attr('y', 0)
			.attr('transform', tick.attr('transform'))
			.style('cursor', 'pointer')
			.style('opacity', 0)
			.on('mouseover', function(){
				if(filters.toggle == 'finalScore'){
					return tick.style('color', colorNeutral[4]);
				} else { 
					return tick.style('color', colorNeutral[4]);
				}
			})
			.on('mouseout', function(){
				return tick.style('color', '#000')
			})
			.on('click', function(){
				if((filters.time == 'm')||(filters.time =='d')){
					dateRange[0] = d;
					dateRange[1] = new Date(d.getFullYear(), d.getMonth()+1, 1);					
				} else {
					dateRange[0] = d;
					dateRange[1] = new Date(d.getFullYear()+1, 0, 1);	
				}
			    // programattically set date range
			    gBrush.call(brush.move, dateRange.map(scale.timechart.x));
			});

		});

		var updatingTopAxis = false;
		var updateTopAxisInterval = 100;
		var axisRange = 'not set';
		updateTopAxis = function(){

			var count = (Math.abs(moment(dateRange[1]).diff(moment(dateRange[0]), 'months', true)));
			var tickFormat = d3.timeFormat("%d %b %Y");
			var tLength = '5.5%';
			if(expandActive==true) tLength = '4%';
			if(filters.time=='d'){
				if((count<=0.4)){
					if(axisRange=='single day') return; // if already 'single month' then break out of fn
					var ticks = d3.timeDay.every(1);
					axisRange = 'single day';
				}

				else if((count>0.4)&&(count<=2)){
					if(axisRange=='single month') return; // if already 'single month' then break out of fn
					var ticks = d3.timeWeek.every(1);
					axisRange = 'single month';
				}

				else if((count>2)&&(count<=10)){
					if(axisRange=='every month') return; // if already 'every month' then break out of fn
					var ticks = d3.timeMonth.every(1);
					axisRange = 'every month';
				}

				else if((count>10)&&(count<=36)){
					if(axisRange=='every 3 months') return; // if already 'every month' then break out of fn
					var ticks = d3.timeMonth.every(3);
					axisRange = 'every 3 months';
				}

				else if((count>36)&&(count<=64)){
					if(axisRange=='every 6 months') return; // if already 'every month' then break out of fn
					var ticks = d3.timeMonth.every(6);
					axisRange = 'every 6 months';
				}

				else if((count>64)){
					if(axisRange=='every 12 months') return; // if already 'every month' then break out of fn
					var ticks = d3.timeMonth.every(12);
					axisRange = 'every 12 months';
				}
			}

			if(filters.time=='m'){

				var tickFormat = d3.timeFormat("%b %Y");
				var tLength = '5%';
				if(expandActive==true) tLength = '3%';

				if((count<=10)){
					if(axisRange=='single month') return; 
					var ticks = d3.timeMonth.every(1);
					axisRange = 'single month';
				}

				else if((count>10)&&(count<=36)){
					if(axisRange=='every 3 months') return; // if already 'every month' then break out of fn
					var ticks = d3.timeMonth.every(3);
					axisRange = 'every 3 months';
				}

				else if((count>36)&&(count<=64)){
					if(axisRange=='every 6 months') return; // if already 'every month' then break out of fn
					var ticks = d3.timeMonth.every(6);
					axisRange = 'every 6 months';
				}

				else if((count>64)){
					if(axisRange=='every 12 months') return; // if already 'every month' then break out of fn
					var ticks = d3.timeMonth.every(12);
					axisRange = 'every 12 months';
				}
			}

			if(filters.time=='y'){
				var tickFormat = d3.timeFormat("%Y");
				var tLength = '3%';
				if(expandActive==true) tLength = '2%';
				var ticks = d3.timeYear.every(1);
				axisRange = 'single year';
			}

			xAxisTop
			.tickFormat(tickFormat)
			.ticks(ticks);
					
			d3.select('.xAxis2')
			.call(xAxisTop);

			xAxisObjTop.selectAll(".tick")
			.append('line')
			.attr('class', 'xAxisHorizontalLine')
			.attr('x1', 0)
			.attr('x2', 0)
			.attr('y1', -(timechartSvgHeight-timechartHeight2-margin.top-39))
			.attr('y2', 0)
			.attr('vector-effect', 'non-scaling-stroke');

			xAxisObjTop.selectAll(".tick text")
			.attr("transform", "translate(" + 0 + ", "+-timechartHeight2+")")
			.attr('lengthAdjust', 'spacingAndGlyphs')
			.attr('text-anchor', 'start')
			.attr('text-align', 'left')
			.attr('textLength', tLength)
			.attr('font-variant', 'small-caps')
			.attr('x', '0.3%');

			updatingTopAxis = false;

		}

		updateTopAxis();

		//**************************
		// Bar/event drop groups (by date)
		//**************************
		// bar groups
		var dateHover = svgChart.append('g');
		var barGroup = svgChart.append('g').attr('id', 'chart-bar-group');
		var bw; 

		var bars = barGroup.selectAll(".barGroup")
		.data(chartdata)
		.enter()
		.append('g')
		.attr('id', function(d,i){
			var dt = new Date(d.date);
			dt.setHours(0,0,0,0);
			return 'date'+dt.getTime();
		})
		.attr("class", "barGroup")
		.attr('data-width', function(d,i) { 
			if(filters.time=='y'){
				var date = new Date(d[options.dataKey]);
				var endYear = new Date(date.getFullYear(), 11, 31);
				bw = scale.timechart.x(endYear) - scale.timechart.x(d.key);   
				return bw;
			}

			if(filters.time=='m'){
				var date = new Date(d[options.dataKey]);
				var endMonth = new Date(date.getFullYear(), date.getMonth()+1, 1);
				bw = scale.timechart.x(endMonth) - scale.timechart.x(d.key);
				return bw;
			}

			if(filters.time=='d'){
				var date = new Date(d[options.dataKey]);
				var endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1);
				bw = scale.timechart.x(endDate) - scale.timechart.x(d.key);
				return bw;
			}	

		})
		.attr("transform", function(d,i) { if(i==1){barWidth+=scale.timechart.x(d.key);} return "translate(" + scale.timechart.x(d.key) + ",0)"; });
		
		var yArray = [];

		// individual bars
		var individualBars = bars.selectAll('.bar')
		.data(function(d,i){ return d.barValues;})
		.enter()
		.append("rect")
		.attr('class', function(d,i){
			return 'bar finalScore'+(i+1);
		})
		.style('stroke', '#fff')
		.style('stroke-opacity',0)
		.attr('data-value', function(d,i){
			return d;
		})	
		.attr('fill', function(d,i){
			return colorPrimary[i];
		})
		.attr("x", function(d,i) { 
			var w = d3.select(this.parentNode).attr('data-width');
			if(filters.time=='d'){
				return w*0.1;
			}
			if(filters.time=='m'){
				return w*0.2
			}
			if(filters.time=='y'){
				return w*0.3
			}
		})
		.attr("width", function(d,i) { 
			var w = d3.select(this.parentNode).attr('data-width');
			w=w*0.8;
			if(filters.time=='m'){
				w=w*0.6;
			}
			if(filters.time=='y'){
				w=w*0.4
			}
			return w;
		})
		.attr("y", function(d,i) { 
			if(i>0){
				yArray[i] = yArray[i-1] + d;
			} else {
				yArray[i] = d;
			}
			return scale.timechart.y1(yArray[i]); 
		})
		.attr("height", function(d,i) { 
			return timechartHeight2-scale.timechart.y1(d); 
		})
		.on('mouseover', function(){
			d3.select(this).style('fill-opacity', options.fillOpacity - 0.05)
		})
		.on('mouseout', function(){
			d3.select(this).style('fill-opacity', options.fillOpacity)
		}).on('click', function(d,i){
			clickTimer = 1;
			Deepviz.filter(filters.toggle,i);
			setTimeout(function(){ clickTimer = 0 }, 2000);
		});

		var placement = 'top';
		if(filters.time=='d') placement = 'top-start';

		tippy('.bar', { 
			// content: setBarName(s),
			theme: 'light-border',
			inertia: false,
			distance: 8,
			allowHTML: true,
			animation: 'shift-away',
			placement: placement,
			delay: [600, 100],
			arrow: true,
			size: 'small',
			onShow(instance) {
		        var v = d3.select(instance.reference).attr('data-value');
		        d3.select(instance.reference).style('stroke', 'grey').style('stroke-opacity', 0.2).attr('vector-effect', 'non-scaling-stroke');
		        // get severity/reliability id
		        var parentId = d3.select(instance.reference.parentNode).attr('id');
		        var date = new Date(parseInt(parentId.slice(4)));
		        var dateFormatter = d3.timeFormat("%d %b %Y");

				if(filters.time=='m'){
					dateFormatter = d3.timeFormat("%b %Y");
				}

				if(filters.time=='y'){
					dateFormatter = d3.timeFormat("%Y");
				}
				date = dateFormatter(date);
		        var s = parseInt(instance.reference.classList[1][instance.reference.classList[1].length-1])-1;
					var color = colorPrimary[s];
					var text = metadata.scorepillar_scale[s].name;
				var html = '<div style="text-align: left; font-weight: bold;">'+date+'</div>';
				html += '<div style="width: 100px; height: 10px; display: inline; background-color: '+ color + '">&nbsp;&nbsp;</div>&nbsp; ' + text + ' <div style="padding-left: 3px; padding-bottom: 2px; display: inline; color: '+ colorNeutral[4] + '; font-size: 9px"><b>' + v + ' '+textLabel+'</b></div>';
	        	instance.setContent(html);
			},
			onHide(instance) {
		        d3.select(instance.reference).style('stroke', 'cyan').style('stroke-opacity', 0);
			}
		});

		//**************************
		// draw entries chart
		//**************************

		var entriesGroup = svgChartBg2
		.append('g')
		.attr('id', 'chart-entries-bar-group')
		.attr('class', 'entries')
		.attr('transform', 'translate('+(0) + ', '+ (timechartHeight2+entriesTopMargin) +')' );

		// entriesGroup.append('text')
		// .attr('y', 5)
		// .attr('x', 0)
		// .text('ENTRIES BY DATE')
		// .style('font-weight', 'bold')
		// .style('font-size', '19px')
		// .style('fill', '#4c4c4c');

		entriesMax = d3.max(dataEntriesByDate, function(d,i){
			return d.total_entries;
		});

		scale.entrieschart.y = d3.scaleLinear()
		.range([entriesChartHeight , 0])
		.domain([0, entriesMax]);

	    entriesAxis = d3.axisLeft()
	    .scale(scale.entrieschart.y)
	    .ticks(2)
	    .tickSize(0)
	    .tickPadding(8);

		// y-axis
		var entriesAxisText = entriesGroup.append("g")
		.attr("class", "yEntriesAxis axis")
		.attr("id", "entriesYAxis")
		.attr('transform', 'translate('+(0)+','+ (0)+')')
		.call(entriesAxis)
		.style('font-size', options.yAxis.font.values.size);

		// add the Y gridline
		var entriesChartyGrid = d3.axisLeft(scale.entrieschart.y)
		.ticks(2)
		.tickSize(-options.width+52)
		.tickFormat("");

		entriesGroup
		.append('line')
		.attr('class', 'axisBaseline')
		.attr('x1',0)
		.attr('x2',1250)
		.attr('y1', entriesChartHeight)
		.attr('y2', entriesChartHeight)
		.style('stroke', '#d5d5d5')
		.style('stroke-width', '1px')

		var entriesGridlines = entriesGroup.append("g")			
		.attr("class", "grid")
		.attr('id', 'entriesChartYGrid')
		.call(entriesChartyGrid);

		var entriesBars = entriesGroup.selectAll(".entriesGroup")
		.data(dataEntriesByDate)
		.enter()
		.append('g')
		.attr('id', function(d,i){
			var dt = new Date(d.date);
			dt.setHours(0,0,0,0);
			return 'date'+dt.getTime();
		})
		.attr("class", "entriesGroup")
		.attr('data-width', function(d,i) { 
			if(filters.time=='y'){
				var date = new Date(d[options.dataKey]);
				var endYear = new Date(date.getFullYear(), 11, 31);
				return scale.timechart.x(endYear) - scale.timechart.x(d.key);   
			}

			if(filters.time=='m'){
				var date = new Date(d[options.dataKey]);
				var endMonth = new Date(date.getFullYear(), date.getMonth()+1, 1);
				return scale.timechart.x(endMonth) - scale.timechart.x(d.key);
			}

			if(filters.time=='d'){
				var date = new Date(d[options.dataKey]);
				var endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1);
				return scale.timechart.x(endDate) - scale.timechart.x(d.key);
			}	

		})
		.attr("transform", function(d,i) { if(i==1){barWidth+=scale.timechart.x(d.key);} return "translate(" + scale.timechart.x(d.key) + ",0)"; });
		
		var yArray = [];

		// individual entries bars
		var individualEntriesBars = entriesBars.selectAll('.entryBar')
		.data(function(d,i){ return d.barValues;})
		.enter()
		.append("rect")
		.attr('class', function(d,i){
			return 'entryBar severity'+(i+1);
		})
		.style('stroke', '#fff')
		.style('stroke-opacity',0)
		.attr('fill', function(d,i){
			return colorSecondary[i];
		})
		.attr("x", function(d,i) { 
			var w = d3.select(this.parentNode).attr('data-width');
			if(filters.time=='d'){
				return w*0.1;
			}
			if(filters.time=='m'){
				return w*0.2
			}
			if(filters.time=='y'){
				return w*0.3
			}
		})
		.attr("width", function(d,i) { 
			var w = d3.select(this.parentNode).attr('data-width');
			if(filters.time=='d'){
				w=w*0.8;
			}
			if(filters.time=='m'){
				w=w*0.6;
			}
			if(filters.time=='y'){
				w=w*0.4
			}
			return w;
		})
		.attr("y", function(d,i) { 
			if(i>0){
				yArray[i] = yArray[i-1] + d;
			} else {
				yArray[i] = d;
			}
			return scale.entrieschart.y(yArray[i]); 
		})
		.attr("height", function(d,i) { 
			return entriesChartHeight-scale.entrieschart.y(d); 
		})
		.on('mouseover', function(){
			d3.select(this).style('fill-opacity', options.fillOpacity - 0.05)
		})
		.on('mouseout', function(){
			d3.select(this).style('fill-opacity', options.fillOpacity)
		});

		// *************************
		// draw contextual rows
		//**************************

		var timechart = d3.select('#timeChart');
		var yPadding = 0;

		var contextualRows = svgChartBg.append('g')
		.attr('id', 'contextualRows')
		// .attr('transform', 'translate(0,'+ (timechartHeight2 + yPadding + entriesChartHeight + entriesTopMargin ) + ')');
		.attr('transform', 'translate(0,'+ (timechartHeightOriginal + yPadding + entriesChartHeight + entriesTopMargin - 36 ) + ')');

		var contextualRowsHeight = timechartSvgHeight - timechartHeight2 - yPadding - 33 - entriesChartHeight - entriesTopMargin ;

		var title = contextualRows.append('text')
		.text('FOCUS')
		.attr('transform', 'rotate(270)')
		.attr('x', -contextualRowsHeight/2 - 20)
		.attr('y', -20)
		.style('font-size', '23px')
		.style('font-weight', '300')
		.style('fill', '#CCCCCC');

		contextualRows.append('rect')
		.attr('height', contextualRowsHeight)
		.attr('width', options.width-60)
		.attr('x', 0)
		.attr('y',0)
		.style('fill', '#FFF')
		.style('fill-opacity',0);

		contextualRows.append('rect')
		.attr('height', contextualRowsHeight+45)
		.attr('width', 10)
		.attr('x', -5)
		.attr('y',1)
		.style('fill', '#FFF')
		.style('fill-opacity',1);

		svg.append('rect')
		.attr('height', contextualRowsHeight+38)
		.attr('width', 35)
		.attr('x', options.width-16)
		.attr('y',timechartHeightOriginal+6)
		.style('fill', '#FFF')
		.style('fill-opacity',1);

		var contextualRowHeight = (contextualRowsHeight)/numContextualRows;

		var rows = contextualRows.selectAll('.contextualRow')
		.data(metadata.focus_array)
		.enter()
		.append('g')
		.attr('class', 'contextualRow')
		.attr('transform', function(d,i){
			return 'translate(0,'+(i*(contextualRowHeight)) + ' )' ;
		});


		rows
		.append('line')
		.attr('class', 'contextualRowLine')
		.attr('x1',0)
		.attr('x2',options.width)
		.attr('y1', 0)
		.attr('y2', 0)
		.attr('opacity', function(d,i){
			return (i>0) ? 1 : 0;
		})

		// row title
		rows.append('text').text(function(d,i){
			return d.name.toUpperCase();
		})
		.attr('class', 'label')
		.attr('y',18)
		.attr('x',4)
		// .style('font-weight', 'bold')
		.style('font-size', '16px');

		// row total value
		rows.append('text')
		.text('0')
		.attr('class', 'total-label')
		.attr('id', function(d,i){
			return 'total-label'+i;
		})
		.attr('x', function(d,i){
			var xoffset = d3.select(this.parentNode).selectAll('.label').node().getBBox().width;
			return xoffset + 10;
		})
		.attr('y',18)
		.style('font-size', '16px')
		.style('font-weight', 'bold')
		.style('fill', colorNeutral[4]);

		//**************************
		// date buttons Y M D
		//**************************
		var dateButtons = d3.selectAll('.time-select')
		.on('mouseover', function(d,i){
			var id = d3.select(this).attr('id');
			var v = id.substr(-1);
			if(filters.time!=v)
				d3.select(this).select('rect').style('fill', colorGrey[3]);
		})
		.on('mouseout', function(d,i){
			d3.selectAll('.time-select rect').style('fill', colorGrey[2]);
			d3.select('#time-select-'+filters.time+ ' rect').style('fill', colorNeutral[4]);
		}).on('click', function(d,i){
			var id = d3.select(this).attr('id');
			var v = id.substr(-1);
			if(v!=filters.time){
				Deepviz.redrawTimeline();
			}
			filters.time = v;
			d3.selectAll('.time-select rect').style('fill', colorGrey[2]);
			d3.select('#time-select-'+filters.time+ ' rect').style('fill', colorNeutral[4]);
		})

		d3.select('#time-select-'+filters.time+ ' rect').style('fill', colorNeutral[4]);

		//**************************
		// create event drops
		//**************************

		maxFocusValue = d3.max(dataByFocus, function(d) {
			var m = d3.max(d.values, function(d) {
				return d.value;
			})
			if(new Date(d.key)<=new Date(maxDate)){
				return m;
			}
		});

		scale.eventdrop = d3.scaleLinear()
		.range([0,12])
		.domain([0,maxFocusValue]);

		var eventDropGroupBg = svgEventDrop.append('g');
		var eventDropGroup = svgEventDrop.append('g').attr('id', 'event-drop-group');

		var eventDrops = eventDropGroup.selectAll(".eventDropGroup")
		.data(dataByFocus)
		.enter()
		.append('g')
		.attr('id', function(d,i){
			var dt = d.key = new Date(d.key);
			dt.setHours(0,0,0,0);
			return 'date'+dt.getTime();
		})
		.attr("class", "eventDropGroup")
		.attr('data-width', function(d,i) { 
			if(filters.time=='y'){
				var date = new Date(d[options.dataKey]);
				var endYear = new Date(date.getFullYear(), 11, 31);
				return scale.timechart.x(endYear) - scale.timechart.x(d.key);   
			}

			if(filters.time=='m'){
				var date = new Date(d[options.dataKey]);
				var endMonth = new Date(date.getFullYear(), date.getMonth()+1, 1);
				return scale.timechart.x(endMonth) - scale.timechart.x(d.key);
			}

			if(filters.time=='d'){
				var date = new Date(d[options.dataKey]);
				var endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1);
				return scale.timechart.x(endDate) - scale.timechart.x(d.key);
			}	

		})
		.attr("transform", function(d,i) { if(i==1){barWidth+=scale.timechart.x(d.key);} return "translate(" + scale.timechart.x(d.key) + ","+ (-25+entriesChartHeight) +")"; });

		var eventDropGroup = eventDrops.append('g');

		var eventDrops = eventDropGroup.selectAll('.eventDrop')
		.data(function(d,i){ return d.values;})
		.enter()
		.append('circle')
		.attr('id', function(d,i){
			var parent = d3.select(this.parentNode).datum();
			var dt = new Date(parent.key);
			dt.setHours(0,0,0,0);
			return 'event-drop-'+(d.key)+'-'+dt.getTime();
		})
		.attr('class', 'eventDrop')
		.attr('r', function(d){
			var t = 0;
			if(d) t = d.value;
			return scale.eventdrop(t);
		})
		.attr('cx', function(d,i){
				var w = d3.select(this.parentNode.parentNode).attr('data-width');
				return (w/2);
			})
		.attr('cy', function(d,i){
			return timechartHeight2 + (contextualRowHeight*(d.key))+19;
		})
		.style('fill', function(d,i){
			if(filters.frameworkToggle == 'average'){
				if(filters.toggle == 'reliability'){
					return colorSecondary[Math.round(d.value.median_r)];
				} else { // primary fallback
					return colorPrimary[Math.round(d.value.median_s)];
				} 
			} else {
				return colorNeutral[3];
			}
		});

		//**************************
		// hover 
		//**************************
		
		dateHover.append('rect')
		.attr('height', timechartHeight2)
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', (options.width - (margin.right + margin.left)))
		.attr('fill', '#FFF');

		var dateHoverRect = dateHover.append('rect')
		.attr('id', 'dateHoverRect')
		.attr('x', 1500)
		.attr('y', 0)
		.attr('height', timechartHeight2)
		.attr('width', bw)
		.attr('fill', hoverColor)
		.attr('opacity', 0);

		var eventDropDateHoverRect = eventDropGroupBg.append('rect')
		.attr('id', 'eventDropDateHoverRect')
		.attr('x', 500)
		.attr('y', timechartHeight2)
		.attr('height', (entriesChartHeight+contextualRowsHeight+12))
		.attr('width', bw)
		.attr('fill', hoverColor)
		.attr('opacity', 0);

		svgChart.on('mouseover', function(d,i){
			dateHoverRect.attr('opacity', 1);
			eventDropDateHoverRect.attr('opacity', 1);
		}).on('mouseout', function(d,i){
			dateHoverRect.attr('opacity', 0);
			eventDropDateHoverRect.attr('opacity', 0);
		})
		.on('mousemove', function(d,i){
			var x = d3.mouse(this)[0];
			var w;
			if(filters.time=='d'){ 
				var x1 = d3.timeDay.floor(scale.timechart.x.invert(x));
				// w = d3.timeDay.ceil(scale.timechart.x.invert(x));
				w = bw;
			}
			if(filters.time=='m'){ 
				var x1 = d3.timeMonth.floor(scale.timechart.x.invert(x));
				w = d3.timeMonth.ceil(scale.timechart.x.invert(x));
				w = scale.timechart.x(w) - scale.timechart.x(x1);
			}
			if(filters.time=='y'){ 
				var x1 = d3.timeYear.floor(scale.timechart.x.invert(x));
				w = d3.timeYear.ceil(scale.timechart.x.invert(x));
				w = scale.timechart.x(w) - scale.timechart.x(x1);				
			}
			dateHoverRect.attr('x', scale.timechart.x(x1))
			.attr('width', w);
			eventDropDateHoverRect.attr('x', scale.timechart.x(x1))
			.attr('width', w);
		});

		topLayer.on('mouseover', function(d,i){
			var x = d3.mouse(this)[0];
			var w;
			if(filters.time=='d'){ 
				var x1 = d3.timeDay.floor(scale.timechart.x.invert(x));
				// w = d3.timeDay.ceil(scale.timechart.x.invert(x));
				w = bw;
			}
			if(filters.time=='m'){ 
				var x1 = d3.timeMonth.floor(scale.timechart.x.invert(x));
				w = d3.timeMonth.ceil(scale.timechart.x.invert(x));
				w = scale.timechart.x(w) - scale.timechart.x(x1);
			}
			if(filters.time=='y'){ 
				var x1 = d3.timeYear.floor(scale.timechart.x.invert(x));
				w = d3.timeYear.ceil(scale.timechart.x.invert(x));
				w = scale.timechart.x(w) - scale.timechart.x(x1);				
			}
			dateHoverRect.attr('x', scale.timechart.x(x1))
			.attr('width', w);
			eventDropDateHoverRect.attr('x', scale.timechart.x(x1))
			.attr('width', w);

			dateHoverRect.attr('opacity', 1);
			eventDropDateHoverRect.attr('opacity', 1);

		}).on('mouseout', function(d,i){
			dateHoverRect.attr('opacity', 0);
			eventDropDateHoverRect.attr('opacity', 0);
		}).on('mousemove', function(d,i){
			var x = d3.mouse(this)[0];
			var w;
			if(filters.time=='d'){ 
				var x1 = d3.timeDay.floor(scale.timechart.x.invert(x));
				// w = d3.timeDay.ceil(scale.timechart.x.invert(x));
				w = bw;
			}
			if(filters.time=='m'){ 
				var x1 = d3.timeMonth.floor(scale.timechart.x.invert(x));
				w = d3.timeMonth.ceil(scale.timechart.x.invert(x));
				w = scale.timechart.x(w) - scale.timechart.x(x1);
			}
			if(filters.time=='y'){ 
				var x1 = d3.timeYear.floor(scale.timechart.x.invert(x));
				w = d3.timeYear.ceil(scale.timechart.x.invert(x));
				w = scale.timechart.x(w) - scale.timechart.x(x1);				
			}
			dateHoverRect.attr('x', scale.timechart.x(x1))
			.attr('width', w);
			eventDropDateHoverRect.attr('x', scale.timechart.x(x1))
			.attr('width', w);

		});

		//**************************
		// date slider brushes
		//**************************
	    // initialise the brush
	    brush = d3.brushX()
	    .extent([[scale.timechart.x(minDate), -margin.top], [scale.timechart.x(maxDate), timechartSvgHeight-(margin.top+margin.bottom)]])
	    .on("start", dragging)
	    .on("brush", dragging)
	    .on("end", dragged);

	    // add the selectors
	    gBrush = topLayer.append("g")
	    .attr('id', 'gBrush')
	    .attr("class", "brush")
	    .attr('transform', 'translate('+(2)+','+(timechartHeight2+18)+')')
	    .call(brush);

		d3.selectAll('.handle rect').attr('fill-opacity', '1').style('visibility', 'visible').attr('width', 2).attr('fill', '#000').style('stroke-opacity', 0);

	    // add the triangle handles (top)
	    var handleTop = gBrush.selectAll(".handle--custom-top")
	    .data([{type: "w"}, {type: "e"}])
	    .enter().append("g")
	    .attr('class', 'handleG');

	    // handleTop.append('path')
	    // .attr("class", "handle--custom-top")
	    // .attr("stroke", "#000")
	    // .attr('stroke-width', 3)
	    // .attr('fill', '#000')
	    // .attr("cursor", "ew-resize")
	    // .attr("d", 'M -8,0 -1,11 6,0 z');

	    handleTop.append('rect')
	    .attr('x',-5)
	    .attr('width', 0)
	    .attr('height', (timechartSvgHeight-timechartHeight2))
	    .attr('y', 0)
    	.style('cursor', 'ew-resize');

	    // add the triangle handles (bottom)
	    var handleBottom = gBrush.selectAll(".handle--custom-bottom")
	    .data([{type: "w"}, {type: "e"}])
	    .enter().append('g').attr('class', 'handleG').append("path")
	    .attr("class", "handle--custom-bottom")
	    .attr("stroke", "#000")
	    .attr('stroke-width', 3)
	    .attr('fill', '#000')
	    .attr("cursor", "ew-resize")
	    .attr("d", 'M -8,0 -1,-11 6,0 z');

		d3.selectAll('#toplayer .handle').attr('transform', 'translate(0,3)');

	    // no data fallback
		if(data.length==0) return false; 

	    handleTop.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", -" + margin.top + ")"; });
	    handleBottom.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", " + ((timechartSvgHeight-timechartHeight2-20) - margin.top) + ")"; });

	    // handle mouseovers
	    d3.selectAll('.handleG')
	    .on('mouseover', function(){
	    	d3.selectAll('.handle--custom-top, .handle--custom-bottom').style('fill', 'silver');
	    })
	    .on('mouseout', function(){
	    	d3.selectAll('.handle--custom-top, .handle--custom-bottom').style('fill', '#000');
	    });

	    topLayer.selectAll('.handle').on('mouseover', function(){
			dateHoverRect.attr('opacity', 0);
			eventDropDateHoverRect.attr('opacity', 0);
		}).on('mousemove', function(){
			dateHoverRect.attr('opacity', 0);
			eventDropDateHoverRect.attr('opacity', 0);
		});


		$('#dateRange').on('apply.daterangepicker', function(ev, picker) {
			dateRange[0] = new Date(picker.startDate._d);
			dateRange[0].setHours(0,0,0,0);

			dateRange[1] = new Date(picker.endDate._d);
			dateRange[1].setHours(0,0,0,0);
			dateRange[1] = moment(dateRange[1].setDate(dateRange[1].getDate())).add(1, 'day');
			gBrush.call(brush.move, dateRange.map(scale.timechart.x));
		});

	    // keyboard pagination
		var k = 0;
		document.body.onkeyup = function(e){

			var unit = 'day';
			if(filters.time=='m') unit = 'month';
			if(filters.time=='y') unit = 'year';

		    if(e.keyCode == 37){ // arrow left
	        	if((dateRange[0]>minDate)||(e.shiftKey)){
	        		if(e.shiftKey){
	        			var d = new Date(moment(dateRange[1]).subtract(1, unit));
	        			if(d>dateRange[0]){
				        	dateRange[1] = d;
				        }
			        } else {
			        	dateRange[0] = new Date(moment(dateRange[0]).subtract(1, unit));
			        	dateRange[1] = new Date(moment(dateRange[1]).subtract(1, unit));
			        }
			    	gBrush.call(brush.move, dateRange.map(scale.timechart.x));	
			    	update();	        		
	        	}
		    }

		    if(e.keyCode == 39){ // arrow right
	        	if(dateRange[1]<maxDate){
	        		if(e.shiftKey){
			        	dateRange[1] = new Date(moment(dateRange[1]).add(1, unit));
	        		} else {
	        			dateRange[0] = new Date(moment(dateRange[0]).add(1, unit));
			        	dateRange[1] = new Date(moment(dateRange[1]).add(1, unit));
	        		}
			    	gBrush.call(brush.move, dateRange.map(scale.timechart.x));	
			    	update();	
	        	}
		    }

		    if(e.keyCode == 77){ // M
		    	dateKey('m');
		    }

		    if(e.keyCode == 68){ // D
		    	dateKey('d');
		    }

		    if(e.keyCode == 89){ // Y
		    	dateKey('y');
		    }

		    if(e.keyCode == 67){ // C
		    	Deepviz.filter('clear', 'clear');
		    }

		    if(e.keyCode == 8){ // BACKSPACE
		    	Deepviz.filter('clear', 'clear');
		    }

		    if(e.keyCode == 27){ // ESC
		    	Deepviz.filter('clear', 'clear');
		    }

		    if(e.keyCode == 49){ // 1
		    	Deepviz.filter(filters.toggle, 1);
		    }

		    if(e.keyCode == 50){ // 2
		    	Deepviz.filter(filters.toggle, 2);
		    }

		    if(e.keyCode == 51){ // 3
		    	Deepviz.filter(filters.toggle, 3);
		    }

		    if(e.keyCode == 52){ // 4
		    	Deepviz.filter(filters.toggle, 4);
		    }

		    if(e.keyCode == 53){ // 5
		    	Deepviz.filter(filters.toggle, 5);
		    }

		    function dateKey(v){
				if(v!=filters.time){
					filters.time = v;
					Deepviz.redrawTimeline();
				}
				d3.selectAll('.time-select rect').style('fill', colorGrey[2]);
				d3.select('#time-select-'+filters.time+ ' rect').style('fill', colorNeutral[4]);
		    }

		    function update(){
		    	// colorBars();
		    	updateDate();
		    	Summary.update(true);
		    	updateRadarCharts();
		    	Map.update();
		    	updateFinalScore('map', 200);
		    	updateSeverity('map', 200);
		    	BarChart.updateStackedBars('affected_groups', dataByAffectedGroups);
		    	BarChart.updateStackedBars('assessment_type', dataByAssessmentType);
		    	BarChart.updateStackedBars('data_collection_technique', dataByDataCollectionTechnique);
		    	BarChart.updateStackedBars('sampling_approach', dataBySamplingApproach);
		    	BarChart.updateBars('methodology_content', dataByMethodologyContent);
		    	BarChart.updateBars('additional_documentation', dataByAdditionalDocumentation);
		    	BarChart.updateStackedBars('unit_of_reporting', dataByUnitOfReporting);
		    	BarChart.updateStackedBars('unit_of_analysis', dataByUnitOfAnalysis);
		    	BarChart.updateStackedBars('language', dataByLanguage);
		    	BarChart.updateStackedBars('sector', dataBySector);
		    	BarChart.updateBars('focus', dataByFocusArray);
		    	BarChart.updateStackedBars('organisation', dataByOrganisation)

		    	handleTop.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", -"+ margin.top +")"; });
				handleBottom.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", " + ((timechartSvgHeight-timechartHeight2-20) - margin.top) + ")"; });
			
		    }
		}

	    // programattically set date range
	    gBrush.call(brush.move, dateRange.map(scale.timechart.x));
	    // function to handle the changes during slider dragging
	    function dragging() {

	    	if($('#dateRange').data('daterangepicker'))
	    	$('#dateRange').data('daterangepicker').hide();
	    	// if not right event then break out of function
	    	// if(d3.event.sourceEvent.type === "start") return;
	    	// if(d3.event.sourceEvent.type === "click") return;
	    	if(d3.event.sourceEvent) if(d3.event.sourceEvent.type === "brush") return;
	    	var d0 = d3.event.selection.map(scale.timechart.x.invert);

			if(filters.time=='d'){
				var count = Math.round(Math.abs((d0[0] - d0[1]) / (24 * 60 * 60 * 1000)));
				if(count<1)count = 1;
				var d1 = d0.map(d3.timeDay.round);
				d1[1] = moment(d1[0]).add(count,'days')
			}
			if(filters.time=='m'){
				var count = Math.round(Math.abs(moment(d0[1]).diff(moment(d0[0]), 'months', true)));
				if(count<1)count = 1;
				var d1 = d0.map(d3.timeMonth.floor);
				d1[1] = moment(d1[0]).add(count,'month');
			}
			if(filters.time=='y'){
				var count = Math.round(Math.abs(moment(d0[1]).diff(moment(d0[0]), 'years', true)));
				if(count<1)count = 1;
				var d1 = d0.map(d3.timeYear.round);
				d1[1] = moment(d1[0]).add(count,'years');
			}

			dateHoverRect.attr('opacity', 0);
			eventDropDateHoverRect.attr('opacity', 0);

			dateRange = d1;

			// colorBars();
			updateDate();

			if(disableSync==false){
				Summary.update(false);
				// updateRadarCharts();
				Map.update();
				updateFinalScore('brush');
				updateSeverity('brush');
			} 
			
			// BarChart.updateStackedBars('affected_groups', dataByAffectedGroups);
			// BarChart.updateStackedBars('assessment_type', dataByAssessmentType);
			// BarChart.updateStackedBars('data_collection_technique', dataByDataCollectionTechnique);
			// BarChart.updateStackedBars('sampling_approach', dataBySamplingApproach);
			// BarChart.updateBars('methodology_content', dataByMethodologyContent);
			// BarChart.updateBars('additional_documentation', dataByAdditionalDocumentation);
			// BarChart.updateStackedBars('unit_of_reporting', dataByUnitOfReporting);
			// BarChart.updateStackedBars('unit_of_analysis', dataByUnitOfAnalysis);
			// BarChart.updateStackedBars('language', dataByLanguage);
			// BarChart.updateStackedBars('sector', dataBySector);
			// BarChart.updateBars('focus', dataByFocusArray);
			// BarChart.updateStackedBars('organisation', dataByOrganisation)

			handleTop.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", -"+ margin.top +")"; });
			handleBottom.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", " + ((timechartSvgHeight-timechartHeight2-20) - margin.top) + ")"; });
			
			if(d3.event.sourceEvent){ 
				d3.select(this).call(d3.event.target.move, dateRange.map(scale.timechart.x));
				$('#location-search').select2('close');
			}

			//**************************
			// update chartArea viewBox
			//**************************
			var margins = (margin.left+margin.right);
			// x position left handle
			var xOffset = scale.timechart.x(d1[0]); // good
			var ratio = (scale.timechart.x(d1[0])/1238) + (1-(scale.timechart.x(d1[1])/1238));
			var marginWeighted = ((margin.left+margin.right)*ratio);
			var xOffset2 = (scale.timechart.x(d1[1]))-(marginWeighted);
			var vWidth = ((xOffset2-xOffset))+(margins);
			var vBox = xOffset +' 0 '+ vWidth +' '+timechartSvgHeight;
			chartAreaSvg.attr('viewBox', vBox);

			updateTopAxis();

		}

		function dragged() {

			if(!d3.event.sourceEvent) return;
			if(d3.event.sourceEvent.type === "brush") return;

			var d0 = d3.event.selection.map(scale.timechart.x.invert);
			if(filters.time=='d'){
				var d1 = d0.map(d3.timeDay.round);
			}
			if(filters.time=='m'){
				var d1 = d0.map(d3.timeMonth.round);
				if (d1[0] >= d1[1]) {
					d1[0] = d3.timeMonth(d0[0]);
					d1[1] = d3.timeMonth.ceil(d0[0]);
				} 

				if (d1[0] >= d1[1]) {
					d1[0] = d3.timeDay.floor(d0[0]);
					d1[1] = d3.timeDay.offset(d1[0]);
				}
			}
			if(filters.time=='y'){
				var d1 = d0.map(d3.timeYear.round);
				if (d1[0] >= d1[1]) {
					d1[0] = d3.timeYear.floor(d0[0]);
					d1[1] = d3.timeYear.offset(d1[0]);
				}
			}
			// If empty when rounded, use floor instead.
			if (d1[0] >= d1[1]) {
				d1[0] = d3.timeDay.floor(d0[0]);
				d1[1] = d3.timeDay.offset(d1[0]);
			}

			dateRange = d1;

			// colorBars();
			updateDate();
			Summary.update(true);
			Map.update();
			updateFinalScore('brush',500);
			updateSeverity('brush', 500);
			updateRadarCharts();
			BarChart.updateStackedBars('affected_groups', dataByAffectedGroups);
			BarChart.updateStackedBars('assessment_type', dataByAssessmentType);
			BarChart.updateStackedBars('data_collection_technique', dataByDataCollectionTechnique);
			BarChart.updateStackedBars('sampling_approach', dataBySamplingApproach);
			BarChart.updateBars('methodology_content', dataByMethodologyContent);
			BarChart.updateBars('additional_documentation', dataByAdditionalDocumentation);
			BarChart.updateStackedBars('unit_of_reporting', dataByUnitOfReporting);
			BarChart.updateStackedBars('unit_of_analysis', dataByUnitOfAnalysis);
			BarChart.updateStackedBars('language', dataByLanguage);
			BarChart.updateStackedBars('sector', dataBySector);
			BarChart.updateBars('focus', dataByFocusArray);
			BarChart.updateStackedBars('organisation', dataByOrganisation)

			// d3.select(this).call(d3.event.target.move, dateRange.map(scale.timechart.x));
			handleTop.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", -"+ margin.top +")"; });
			handleBottom.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", " + ((timechartSvgHeight-timechartHeight2-20) - margin.top) + ")"; });

			$('#location-search').select2('close');
		}

		d3.select('#chartarea').transition().duration(1000).style('opacity', 1);
		d3.select('#avg-line').transition().duration(500).style('opacity', 1);

		// colorBars();
		updateDate();
		Summary.update(true);
		updateEntriesChart();
		updateFinalScore('init', 500);
		updateSeverity('init', 500);
		updateRadarCharts();
		BarChart.updateStackedBars('affected_groups', dataByAffectedGroups);
		BarChart.updateStackedBars('assessment_type', dataByAssessmentType);
		BarChart.updateStackedBars('data_collection_technique', dataByDataCollectionTechnique);
		BarChart.updateStackedBars('sampling_approach', dataBySamplingApproach);
		BarChart.updateBars('methodology_content', dataByMethodologyContent);
		BarChart.updateBars('additional_documentation', dataByAdditionalDocumentation);
		BarChart.updateStackedBars('unit_of_reporting', dataByUnitOfReporting);
		BarChart.updateStackedBars('unit_of_analysis', dataByUnitOfAnalysis);
		BarChart.updateStackedBars('language', dataByLanguage);
		BarChart.updateStackedBars('sector', dataBySector);
		BarChart.updateBars('focus', dataByFocusArray);
		BarChart.updateStackedBars('organisation', dataByOrganisation)

		return bars;
	}


	//**************************
	// finalScore chart
	//**************************
	this.createFinalScoreChart = function(options){

		// create finalScore svg
		var finalScoreSvg = this.createSvg({
			id: 'finalScoreSvg',
			viewBoxWidth: 1000,
			viewBoxHeight: 66,
			div: '#finalScore_bars',
			width: '100%'
		});

		// define x scale
		scale.finalScore.x = d3.scaleLinear()
		.range([0, 995])
		.domain([0,5]);// finalScore/reliability x xcale

		var finalScoreBars = finalScoreSvg.selectAll('.finalScoreBar')
		.data(metadata.scorepillar_scale)
		.enter()
		.append('g')
		.attr('class','top-bar');

		finalScoreBars.append('rect')
		.attr('class', function(d,i){
			return 'finalScoreBar finalScore' + (i);
		})
		.attr('x', function(d,i){
			return (1000/5)*i;
		})
		.attr('width', function(d,i){
			return (1000/5);
		})
		.attr('height', function(d,i){
			return (50);
		})
		.attr('y',2)
		.attr('fill', function(d,i){
			return colorPrimary[i];
		});

		var labels = finalScoreBars.append('g')
		.attr('class', function(d,i){
			return 'fs'+(i+1)+'-text'
		})
		.attr('transform', function(d,i){
			var x = (1000/5)*i + ((1000/5)/2);
			return 'translate('+x+',36)';
		});

		labels
		.append('text')
		.attr('class', function(d,i){
			return 'fs'+(i+1)+'-percent bar-percent'
		})
		.style('fill', function(d,i){
			if(i<3){
				return '#000'
			} else {
				return '#FFF'
			}
		})
		.style('font-size', '25px')
		.style('text-anchor', 'middle')
		.style('opacity', 1)
		.text('00%');

		labels
		.append('text')
		.attr('class', function(d,i){
			return 'fs'+(i+1)+'-value bar-value'
		})
		.style('fill', function(d,i){
			if(i<3){
				return '#000'
			} else {
				return '#FFF'
			}
		})
		.style('font-size', '25px')
		.style('text-anchor', 'middle')
		.style('opacity', 0)
		.text('00');

		finalScoreBars.on('mouseover', function(d,i){
			d3.select(this).select('.bar-percent').style('opacity',0);
			d3.select(this).select('.bar-value').style('opacity',1);
		}).on('mouseout', function(d,i){
	            d3.select(this).select('.bar-percent').style('opacity',1);
	            d3.select(this).select('.bar-value').style('opacity',0);
		})
		.on('click', function(d,i){
			d3.selectAll('.bar').transition("mouseoutReliability").duration(duration).style('opacity', 1);	
			clickTimer = 1;
			Deepviz.filter('finalScore',i);
			setTimeout(function(){ clickTimer = 0 }, 2000);
		});

		finalScoreSvg.append('rect')
		.attr('id', 'finalScoreAvg')
		.attr('x', 0)
		.attr('y', -2)
		.attr('height', 55)
		.attr('width', 5)
		.style('fill', '#000');		

		//**************************
		// finalScore filter remove button
		//**************************
		d3.selectAll('#finalScoreRemoveFilter').on('click', function(){
			d3.select('#finalScoreRemoveFilter').style('display', 'none').style('cursor', 'default');
			d3.selectAll('.finalScoreBar').transition().duration(200).style('fill', function(d,i){
				return colorPrimary[i];
			});	
			return Deepviz.filter('finalScore', 'clear'); 
		});

		updateFinalScore('init', duration);

	}

	//**************************
	// severity chart
	//**************************
	this.createSeverityChart = function(options){

		// create severity svg
		var severitySvg = this.createSvg({
			id: 'severitySvg',
			viewBoxWidth: 1000,
			viewBoxHeight: 66,
			div: '#severity_bars',
			width: '100%'
		});

		// define x scale
		scale.severity.x = d3.scaleLinear()
		.range([0, 995])
		.domain([0,5]);// severity/reliability x xcale

		var severityBars = severitySvg.selectAll('.severityBar')
		.data(metadataEntries.severity_units)
		.enter()
		.append('g')
		.attr('class','top-bar');

		severityBars.append('rect')
		.attr('class', function(d,i){
			return 'severityBar severity' + (i);
		})
		.attr('x', function(d,i){
			return (1000/5)*i;
		})
		.attr('width', function(d,i){
			return (1000/5);
		})
		.attr('height', function(d,i){
			return (53);
		})
		.attr('y',2)
		.attr('fill', function(d,i){
			return colorSecondary[i];
		});

		var labels = severityBars.append('g')
		.attr('class', function(d,i){
			return 's'+(i+1)+'-text'
		})
		.attr('transform', function(d,i){
			var x = (1000/5)*i + ((1000/5)/2);
			return 'translate('+x+',36)';
		});

		labels
		.append('text')
		.attr('class', function(d,i){
			return 's'+(i+1)+'-percent bar-percent'
		})
		.style('fill', function(d,i){
			if(i<3){
				return '#000'
			} else {
				return '#FFF'
			}
		})
		.style('font-size', '25px')
		.style('text-anchor', 'middle')
		.style('opacity', 1)
		.text('00%');

		labels
		.append('text')
		.attr('class', function(d,i){
			return 's'+(i+1)+'-value bar-value'
		})
		.style('fill', function(d,i){
			if(i<3){
				return '#000'
			} else {
				return '#FFF'
			}
		})
		.style('font-size', '25px')
		.style('text-anchor', 'middle')
		.style('opacity', 0)
		.text('00');

		severityBars.on('mouseover', function(d,i){
			d3.select(this).select('.bar-percent').style('opacity',0);
			d3.select(this).select('.bar-value').style('opacity',1);
		}).on('mouseout', function(d,i){
	            d3.select(this).select('.bar-percent').style('opacity',1);
	            d3.select(this).select('.bar-value').style('opacity',0);
		}).on('click', function(d,i){
			d3.selectAll('.bar').transition("mouseoutReliability").duration(500).style('opacity', 1);	
			clickTimer = 1;
			Deepviz.filter('severity',i);
			setTimeout(function(){ clickTimer = 0 }, 2000);
		});

		severitySvg.append('rect')
		.attr('id', 'severityAvg')
		.attr('x', 0)
		.attr('y', -2)
		.attr('height', 55)
		.attr('width', 5)
		.style('fill', '#000');		

		//**************************
		// severity filter remove button
		//**************************
		d3.selectAll('#severityRemoveFilter').on('click', function(){
			d3.select('#severityRemoveFilter').style('display', 'none').style('cursor', 'default');
			d3.selectAll('.severityBar').transition().duration(200).style('fill', function(d,i){
				return colorSecondary[i];
			});	
			return Deepviz.filter('severity', 'clear'); 
		});

		updateSeverity('init', 500);
	}

	//**************************
	// create polar charts
	//**************************
	this.createRadarCharts = function(){

		var quality = document.getElementById('svg_quality_div');
		// remove title tag from map svg
		var title = svg_quality.getElementsByTagName('title')[0];
		svg_quality.documentElement.removeChild(title);

		svg_quality.documentElement.removeAttribute('height');
		svg_quality.documentElement.setAttribute('width', '100%');

		// add svg to map div 
		quality.innerHTML = new XMLSerializer().serializeToString(svg_quality.documentElement);

		// options
		radarMargin = {top: 60, right: 60, bottom: 60, left: 60},
		radarWidth = Math.min(300, window.innerWidth - 10) - radarMargin.left - radarMargin.right,
		radarHeight = Math.min(radarWidth, window.innerHeight - radarMargin.top - radarMargin.bottom - 20);

		radarColor = d3.scaleOrdinal()
		.range([colorNeutral[3]]);

		radarChartOptions = {
		  w: radarWidth,
		  h: radarHeight,
		  margin: radarMargin,
		  maxValue: 5,
		  levels: 5,
		  roundStrokes: true,
		  color: radarColor
		};

		// data filter
		var dc = data.filter(function(d){return ((d.date>=dateRange[0])&&(d.date<dateRange[1])) ;});

		var pillars = ['fit_for_purpose', 'trustworthiness', 'analytical_rigor', 'analytical_writing'];

		pillars.forEach(function(pillar,i){
			var dataQuality = [];
			metadata[pillar+'_array'].forEach(function(d,i){
				var median = d3.median(dc, function(md){
					return md.scores[pillar+'_array'][d.id]
				})
				median = median != null ? median : 0;
				dataQuality[i] = {'axis': d.name, 'value': median }
			});

			var dataQualityTotal = d3.sum(dataQuality, d => d.value );
			d3.select('#quality'+(i+1)+'val tspan').text(Math.round(dataQualityTotal));
			radarChartOptions.maxValue = 5;
			RadarChart("#quality"+(i+1), [dataQuality], radarChartOptions);
		});

		// analytical density radar
		var scores = [];
		var ad_scores = [];

		dc.forEach(function(d,i){
			d.scores.analytical_density.forEach(function(dd,ii){
				scores.push(dd);
			})
		});

		var dataQuality = d3.nest()
		.key(function(d) { return d.name;})
		.rollup(function(v) { return (d3.median(v, function(d) { 
			return d.value; 
		}))})
		.entries(scores);

		dataQuality.forEach(function(d,i){
			d.axis = d.key;
		})

		radarChartOptions.maxValue = 5;
		RadarChart("#quality5", [dataQuality], radarChartOptions);

		// final score
		var dataQuality = [];
		metadata.final_scores_array.score_pillar.forEach(function(d,i){
			var median = d3.median(dc, function(md){
				return md.scores.final_scores.score_pillar[d.id];
			})
			median = median != null ? median : 0;
			dataQuality[i] = {'axis': d.name, 'value': median }
		});

		var median = d3.median(dc, function(md){
			return md.scores.final_scores.score_matrix_pillar[metadata.final_scores_array.score_matrix_pillar[0].id];
		})
		median = median != null ? median : 0;
		dataQuality.push({'axis': metadata.final_scores_array.score_matrix_pillar[0].name, 'value': median });
		d3.select('#quality5val tspan').text(Math.round(median));

		radarChartOptions.maxValue = 25;
		RadarChart("#quality6", [dataQuality], radarChartOptions);

	}

	var updateRadarCharts = function(){

		// data filter
		var dc = data.filter(function(d){return ((d.date>=dateRange[0])&&(d.date<dateRange[1])) ;});

		// first 4 standard pillars
		var pillars = ['fit_for_purpose', 'trustworthiness', 'analytical_rigor', 'analytical_writing'];
		pillars.forEach(function(pillar,i){
			var dataQuality = [];
			metadata[pillar+'_array'].forEach(function(d,i){
				var median = d3.median(dc, function(md){
					return md.scores[pillar+'_array'][d.id]
				})
				median = median != null ? median : 0;
				dataQuality[i] = {'axis': d.name, 'value': median }
			});

			// var dataQualityTotal = d3.sum(dataQuality, d => d.value );
			// d3.select('#quality'+(i+1)+'val tspan').text(Math.round(dataQualityTotal));
			radarChartOptions.maxValue = 5;
			RadarChartUpdate("#quality"+(i+1), [dataQuality], radarChartOptions);
		});

		// analytical density radar
		var scores = [];
		var ad_scores = [];

		dc.forEach(function(d,i){
			d.scores.analytical_density.forEach(function(dd,ii){
				scores.push(dd);
			})
		});

		var dataQuality = d3.nest()
		.key(function(d) { return d.name;})
		.rollup(function(v) { return (d3.median(v, function(d) { 
			return d.value; 
		}))})
		.entries(scores);

		dataQuality.forEach(function(d,i){
			d.axis = d.key;
		})

		dataQuality.sort(function(x,y){
			return d3.descending(y.axis, x.axis);
		});

		radarChartOptions.maxValue = 5;
		RadarChart("#quality5", [dataQuality], radarChartOptions);

		// final score
		var dataQuality = [];
		metadata.final_scores_array.score_pillar.forEach(function(d,i){
			var median = d3.median(dc, function(md){
				return md.scores.final_scores.score_pillar[d.id];
			})
			median = median != null ? median : 0;
			dataQuality[i] = {'axis': d.name, 'value': median };
			median = Math.round(median);
			if(median<10) median = '0' + median;
			d3.select('#quality'+d.id + 'val tspan').text(median);
		});

		var median = d3.median(dc, function(md){
			return md.scores.final_scores.score_matrix_pillar[metadata.final_scores_array.score_matrix_pillar[0].id];
		})
		median = median != null ? median : 0;
		dataQuality.push({'axis': metadata.final_scores_array.score_matrix_pillar[0].name, 'value': median });

		median = Math.round(median);
		if(median<10) median = '0' + median;
		d3.select('#quality5val tspan').text(median);

		var dataQualityTotal = d3.median(dataQuality, d => d.value );
		dataQualityTotal = Math.round(dataQualityTotal);
		if(dataQualityTotal<10) dataQualityTotal = '0' + dataQualityTotal;
		d3.select('#quality6val tspan').text(dataQualityTotal);

		radarChartOptions.maxValue = 25;
		RadarChartUpdate("#quality6", [dataQuality], radarChartOptions);

	}

	//**************************
	// filtering (push values to filter array)
	//**************************
	this.filter = function(filterClass, value){

		if(filterClass=='clear'){
			filters.id = [];
			filters.str = '';
			filters.sector = [];
			filters.sector_count = [];
			filters.finalScore = [];
			filters.severity = [];
			filters.context = [];
			filters.top = [];
			filters.affected_groups = [];
			filters.stakeholder_type = [];
			filters.organisation = [];
			filters.sampling_approach = [];
			filters.geo = [];
			filters.coordination = [];
			filters.language = [];
			filters.additional_documentation = [];
			filters.methodology_content = [];
			filters.unit_of_reporting = [];
			filters.unit_of_analysis = [];
			filters.data_collection_technique = [];
			filters.assessment_type = [];
			filters.focus = [];
		}

		d3.select('#tableRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#frameworkRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#severityRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#focusRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#sectorRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#contextRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#affected_groupsRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#organisationRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#sampling_approachRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#geoRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#languageRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#additional_documentationRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#methodology_contentRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#unit_of_reportingRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#unit_of_analysisRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#data_collection_techniqueRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#assessment_typeRemoveFilter').style('display', 'none').style('cursor', 'default');

		d3.selectAll('.sn').style('opacity', 1);
		d3.selectAll('.affected_groups').style('opacity', 1);
		d3.selectAll('.assessment_type').style('opacity', 1);
		d3.selectAll('.data_collection_technique').style('opacity', 1);
		d3.selectAll('.unit_of_analysis').style('opacity', 1);
		d3.selectAll('.unit_of_reporting').style('opacity', 1);
		d3.selectAll('.methodology_content').style('opacity', 1);
		d3.selectAll('.additional_documentation').style('opacity', 1);
		d3.selectAll('.language').style('opacity', 1);
		d3.selectAll('.sampling_approach').style('opacity', 1);

		d3.selectAll('.organisation').style('opacity', 1);
		d3.selectAll('.focus').style('opacity', 1);
		d3.select('#snRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#affected_groupsRemoveFilter').style('display', 'none').style('cursor', 'default');

		if(value=='clear'){
			filters[filterClass] = [];
			filters['str'] = '';
			d3.selectAll('.top_filter').style('opacity', 0.01);
		} else if(value == 'clearFramework'){
			filters['sector'] = [];
			filters['context'] = [];
		} else {
			if(filterClass=='str'){
				filters['str'] = value;
			} else if(value != 'reset'){
			  addOrRemove(filters[filterClass], value);		
			}
		}

		if((filters['id'].length>0)||(filters['str'].length>0)||(filters['finalScore'].length>0)||(filters['focus'].length>0)||(filters['top'].length>0)||(filters['affected_groups'].length>0)||(filters['organisation'].length>0)||(filters['assessment_type'].length>0)||(filters['data_collection_technique'].length>0)||(filters['unit_of_analysis'].length>0)||(filters['unit_of_reporting'].length>0)||(filters['methodology_content'].length>0)||(filters['additional_documentation'].length>0)||(filters['language'].length>0)||(filters['sampling_approach'].length>0)||(filters['focus'].length>0)||(filters['severity'].length>0)||(filters['sector'].length>0)||(filters['geo'].length>0)||(filters['coordination'].length>0)||(filters['affected_groups'].length>0)){
			d3.select('#globalRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		} else { 
			d3.select('#globalRemoveFilter').style('display', 'none').style('cursor', 'default');
		}
		// reset data using original loaded data
		data = originalData;
		dataNotScore = data;
		dataEntries = originalDataEntries;
		dataEntriesNotSeverity = dataEntries;

		if(filters['id'].length>0){
			data = data.filter(function(d){return  filters['id'].includes(d['pk']);});
			d3.select('#tableRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['str'].length>0){
			filters['str'] = filters['str'].toLowerCase();
			data = data.filter(function(d){return  d.lead.title.toLowerCase().includes(filters['str']) || d.organization_str.toLowerCase().includes(filters['str'])  ;});
			d3.select('#tableRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		d3.select('#finalScoreRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#geoRemoveFilter').style('display', 'none').style('cursor', 'default');

		if(filters['geo'].length==metadata.geo_array.length){
			filters['geo'] = [];
		}

		if(filters['geo'].length>0){
			data = data.filter(function(d){
				return d['geo'].some(r=> filters['geo'].indexOf(r) >= 0);
			});

			dataEntries = dataEntries.filter(function(d){
				return d['geo'].some(r=> filters['geo'].indexOf(r) >= 0);
			});

			d3.select('#geoRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
			$('#location-search').val(filters['geo']); 
			$('#location-search').trigger('change.select2');
			// select2 many location results override default behavior and show number of locations selected in placeholder
			var values = $('#location-search').select2('data');
			var select2Height = $('.select2').height();
			if(select2Height>30){
				$('.select2-selection__choice').hide();
				$('.select2-search__field').attr('placeholder', values.length+' LOCATIONS SELECTED' ).css('width', '100%')
			} else {
				$('.select2-search__field').attr('placeholder', '' );
				$('.select2-selection__choice').show();
			}
		} else {
			$('#location-search').val(filters['geo']); 
			$('#location-search').trigger('change.select2');
		}

		if(filters['sector'].length>=metadata.sector_array.length)filters['sector'] = [];

		if(filters['sector'].length>0){
			// filter data
			data = data.filter(function(d){
				return d['sector'].some(r=> filters['sector'].indexOf(r) >= 0);
				// return filters['sector'].includes(d['sector'][2]);
			});

			// dataEntries = dataEntries.filter(function(d){
			// 	return d['sector'].some(r=> filters['sector'].indexOf(r) >= 0);
			// });

			// bar/text shading
			d3.select('#frameworkRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
			d3.select('#sectorRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		} 

		if(filters['affected_groups'].length>0){
			data = data.filter(function(d){
				return d['affected_groups'].some(r=> filters['affected_groups'].indexOf(r) >= 0);
			});
			d3.select('#affected_groupsRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['top'].length>0){
			data = data.filter(function(d){
				return d['top'].some(r=> filters['top'].indexOf(r) >= 0);
			});
			d3.select('#summaryRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['assessment_type'].length>0){
			data = data.filter(function(d){ return  filters['assessment_type'].includes(d['assessment_type']);});
			d3.select('#assessment_typeRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['focus'].length>0){
			data = data.filter(function(d){
				return d['focus'].some(r=> filters['focus'].indexOf(r) >= 0);
			});
			d3.select('#focusRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['data_collection_technique'].length>0){
			data = data.filter(function(d){
				return d['data_collection_technique'].some(r=> filters['data_collection_technique'].indexOf(r) >= 0);
			});
			d3.select('#data_collection_techniqueRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['unit_of_analysis'].length>0){
			data = data.filter(function(d){
				return d['unit_of_analysis'].some(r=> filters['unit_of_analysis'].indexOf(r) >= 0);
			});
			d3.select('#unit_of_analysisRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['unit_of_reporting'].length>0){
			data = data.filter(function(d){
				return d['unit_of_reporting'].some(r=> filters['unit_of_reporting'].indexOf(r) >= 0);
			});
			d3.select('#unit_of_reportingRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['methodology_content'].length>0){
			data = data.filter(function(d){
				return d['methodology_content'].some(r=> filters['methodology_content'].indexOf(r.id) >= 0);
			});
			d3.select('#methodology_contentRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['additional_documentation'].length>0){
			data = data.filter(function(d){
				return d['additional_documentation'].some(r=> filters['additional_documentation'].indexOf(r.id) >= 0);
			});
			d3.select('#additional_documentationRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['language'].length>0){

			data = data.filter(function(d){
				return d['language'].some(r=> filters['language'].indexOf(r) >= 0);
			});
			d3.select('#languageRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters['sampling_approach'].length>0){

			data = data.filter(function(d){
				return d['sampling_approach'].some(r=> filters['sampling_approach'].indexOf(r) >= 0);
			});
			d3.select('#sampling_approachRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}


		if(filters['organisation'].length>0){
			data = data.filter(function(d){
				return d['organization_and_stakeholder_type'].some(r=> filters['organisation'].indexOf(r[1]) >= 0);
			});
			d3.select('#organisationRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}


		// final score filter (independent to show grey bars)
		dataNotScore = data;

		if(filters['finalScore'].length==6){
			filters['finalScore'] = [];
		}

		if(filters['finalScore'].length>0){
			data = data.filter(function(d){return  filters['finalScore'].includes(d['finalScore']);});
			d3.select('#finalScoreRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters.finalScore.length==0){
			d3.selectAll('.finalScoreBar').style('fill', function(d,i){
				return colorPrimary[i];
			});		
		} else {
			d3.selectAll('.finalScoreBar').style('fill', function(d,i){
				return colorLightgrey[i];
			});	
			filters.finalScore.forEach(function(d,i){
				d3.select('.finalScoreBar.finalScore'+(d))
				.style('fill', colorPrimary[d]);
			});
		}

		// severity data filter
		dataEntriesNotSeverity = dataEntries;
		
		if(filters['severity'].length==6){
			filters['severity'] = [];
		}

		if(filters['severity'].length>0){
			dataEntries = dataEntries.filter(function(d){return  filters['severity'].includes(d['severity']);});
			d3.select('#severityRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		if(filters.severity.length==0){
			d3.selectAll('.severityBar').style('fill', function(d,i){
				return colorSecondary[i];
			});		
		} else {
			d3.selectAll('.severityBar').style('fill', function(d,i){
				return colorLightgrey[i];
			});	
			filters.severity.forEach(function(d,i){
				d3.select('.severityBar.severity'+(d))
				.style('fill', colorSecondary[d]);
			});
		}


		var duration = 500;
		if(filterClass=='reset') {
			duration = 0;
		}
		Deepviz.updateTimeline(filterClass, duration);

		d3.select('#globalRemoveFilter').on('click', function(){ 
	        $('.searchRows').val('');
			Deepviz.filter('clear', 'clear'); 
		});
	}

	//**************************
	// redraw timeline
	//**************************
	this.redrawTimeline = function(){

		data = originalData;

		var w = timechartViewBoxWidth;
		if(expandActive==true){
			w = 2000;
		}

		d3.select('#avg-line').transition().duration(200).style('opacity', 0)
		d3.select('#chartarea').transition().duration(200).style('opacity', 0)
		.on("end", function(){
			d3.select('#timeline .vizlibResponsiveDiv').remove();
			d3.select('#timechart-legend .vizlibResponsiveDiv').remove();		

			// create svg
			var timelineSvg = Deepviz.createSvg({
				id: 'timeline_viz',
				viewBoxWidth: w,
				viewBoxHeight: timechartViewBoxHeight,
				div: '#timeline'
			});

			var timeChart = Deepviz.timeChart({
				appendTo: timelineSvg,
				id: 'timeChart',
				opacity: 1,
				gutter: 0.5,
				width: w,
				color: ['#0033A0'],
				maxValue: 'round', // integerValue (force define the maximum), 'auto' (find the maximum value in the data), 'round' (pretty rounding based on maximum value in the data)
				paddingLeft: 0,
				paddingTop: 0,
				offsetX: 1,
				offsetY: 0,

				yAxis: {
					enabled: true,
					label: '',
					gridlines: {
						enabled: true,
						stroke: '#A7A7A7',
						strokeWidth: 1,
						opacity: 1,
						dotted: true
					},
					font: {
						values: {
							size: '15px',
							weight: 'bold',
							padding: 0
						},
						label: {
							size: '14px',
							weight: 'bold',
							padding: 10
						}
					}
				},
				xAxis: {
					enabled: true,
					label: 'Date',
					gridlines: {
						enabled: true,
						stroke: 'grey',
						strokeWidth: 1,
						opacity: 1
					},
					font: {
						values: {
							size: '14px',
							weight: 'bold',
						},
						label: {
							size: '14px',
							weight: 'bold',
						}
					}
				},
				font: {
					title: {
						size: '20px',
						weight: 'bold'
					},
					subtitle: {
						size: '12px',
						weight: 'normal'
					},
				},
				legend: {
					enabled: false,
					position: 'top'
				},
				dateBrush: true,
				dataValues: 'total_assessments',
				dataKey: 'key',
				// sliderUpdate: function(a,b){
				// 	sliderUpdate(a,b);
				// },
			});

			d3.selectAll('.bar').style('opacity', 0);
			d3.selectAll('#timechartyAxis').style('opacity', 0);

			Deepviz.filter('reset', 'reset');

			Summary.update(true);
			Map.update();
			updateRadarCharts();
			BarChart.updateStackedBars('affected_groups', dataByAffectedGroups);
			BarChart.updateStackedBars('assessment_type', dataByAssessmentType);
			BarChart.updateStackedBars('data_collection_technique', dataByDataCollectionTechnique);
			BarChart.updateStackedBars('sampling_approach', dataBySamplingApproach);
			BarChart.updateBars('methodology_content', dataByMethodologyContent);
			BarChart.updateBars('additional_documentation', dataByAdditionalDocumentation);
			BarChart.updateStackedBars('unit_of_reporting', dataByUnitOfReporting);
			BarChart.updateStackedBars('unit_of_analysis', dataByUnitOfAnalysis);
			BarChart.updateStackedBars('language', dataByLanguage);
			BarChart.updateStackedBars('sector', dataBySector);
			BarChart.updateBars('focus', dataByFocusArray);
			BarChart.updateStackedBars('organisation', dataByOrganisation)
		});
	}

	//**************************
	// get the data
	//**************************
	this.updateTimeline = function(target = null, duration){

		var chartdata = refreshData();
		scale.timechart.y1 = d3.scaleLinear()
		.range([timechartHeight2, 0])
		.domain([0, rounder(maxValue)]);

		//**************************
		// Bar/event drop groups (by date)
		//**************************
		var barGroup = d3.select('#chart-bar-group');

		var bars = barGroup.selectAll(".barGroup")
		.data(chartdata)
		.enter()
		.append('g')
		.attr('id', function(d,i){
			var dt = new Date(d.date);
			dt.setHours(0,0,0,0);
			return 'date'+dt.getTime();
		})
		.attr("class", "barGroup")
		.attr('data-width', function(d,i) { 
			if(filters.time=='y'){
				var date = new Date(d.key);
				var endYear = new Date(date.getFullYear(), 11, 31);
				return scale.timechart.x(endYear) - scale.timechart.x(d.key);   		
			}

			if(filters.time=='m'){
				var date = new Date(d.key);
				var endMonth = new Date(date.getFullYear(), date.getMonth()+1, 1);
				return scale.timechart.x(endMonth) - scale.timechart.x(d.key);   		
			}

			if(filters.time=='d'){
				var date = new Date(d.key);
				var endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1);
				return scale.timechart.x(endDate) - scale.timechart.x(d.key);   		
			}	

		})
		.attr("transform", function(d,i) { if(i==1){barWidth+=scale.timechart.x(d.key);} return "translate(" + scale.timechart.x(d.key) + ",0)"; })
		.exit()
		.remove();
		
		bars = d3.select('#chart-bar-group').selectAll(".barGroup");

		var yArray = [];

		var individualBars = bars.selectAll('.bar')
		.data(function(d,i){ return d.barValues;})
		.enter()
		.append("rect")
		.attr('class', function(d,i){
			return 'bar finalScore'+(i+1);
		})
		.style('stroke', '#fff')
		.style('stroke-opacity',0)
		.attr("x", function(d,i) { 
			var w = d3.select(this.parentNode).attr('data-width');
			if(filters.time=='d'){
				return w*0.1;
			}
			if(filters.time=='m'){
				return w*0.2
			}
			if(filters.time=='y'){
				return w*0.3
			}
		})
		.attr("width", function(d,i) { 
			var w = d3.select(this.parentNode).attr('data-width');
			if(filters.time=='d'){
				w=w*0.8;
			}
			if(filters.time=='m'){
				w=w*0.6;
			}
			if(filters.time=='y'){
				w=w*0.4
			}
			return w-1;
		})
		.on('mouseover', function(){
			d3.select(this).style('fill-opacity', 1 - 0.05)
		})
		.on('mouseout', function(){
			d3.select(this).style('fill-opacity', 1)
		})
		.attr("height", 0)
		.attr("y", timechartHeight2);

		individualBars.transition()
		.duration(duration)
		.attr("y", function(d,i) { 
			if(i>0){
				yArray[i] = yArray[i-1] + d;
			} else {
				yArray[i] = d;
			}
			return scale.timechart.y1(yArray[i]); 
		})
		.attr("height", function(d,i) { 
			return timechartHeight2-scale.timechart.y1(d); 
		});

		timechartyAxis = d3.axisLeft()
		.scale(scale.timechart.y1)
		.ticks(4)
		.tickSize(0)
		.tickPadding(8);

		d3.select("#timechartyAxis")
		.transition()
		.duration(duration)
		.call(timechartyAxis);

		timechartyGrid = d3.axisLeft(scale.timechart.y1)
		.tickSize(-width+52)
		.ticks(4)
		.tickFormat("")

		d3.select('#timechartyGrid')
		.transition()
		.call(timechartyGrid);

		// update bars

		bars = d3.select('#chart-bar-group').selectAll(".barGroup");
		bars.each(function(d,i){

			var timeid = this.id;
			var dD = dataByDate.filter(obj => {
				return 'date'+obj.date.getTime() == timeid;
			})[0];
			var group = d3.select(this);
			var eventDrops = group.selectAll('.eventDrop' );

			if(dD){
				var yArray = [];
				var iBars = group.selectAll('.bar' )
				.style('fill', function(d,i){
					if(filters.toggle=='finalScore'){
						return colorPrimary[i];
					} else {
						return colorSecondary[i];
					}
				})
				.transition().delay(2).duration(duration)
				.attr("height", function(d,i) {
					return timechartHeight2-scale.timechart.y1(dD[filters.toggle][i]); 
				})
				.attr("y", function(d,i) { 
					if(i>0){
						yArray[i] = yArray[i-1] + dD[filters.toggle][i];
					} else {
						yArray[i] = dD[filters.toggle][i];
					}
					return scale.timechart.y1(yArray[i]); 
				});
				eventDrops.transition().duration(duration)
				.attr('r', function(d,i){
					var dx = dD['focus'][i]
					return scale.eventdrop(dx);
				})
			} else {
				group.selectAll('.bar').transition("h").duration(0).attr('height',0);
				group.selectAll('.bar').transition().duration(duration).attr('y',timechartHeight2).attr('height',0);
				eventDrops.transition().duration(duration)
				.attr('r', 0)
			}
		});

		if(duration==0){
			setTimeout(function(){
				d3.selectAll('.bar').style('opacity', 1);
				d3.selectAll('#timechartyAxis').style('opacity', 1);
			}, 50);
		}

		updateFinalScore(target, duration);
		updateSeverity(target, duration);
		updateEntriesChart();
		Map.update();
		colorBars();
	}

	//**************************
	// update date text 
	//**************************
	function updateDate(){
		var dateformatter = d3.timeFormat("%d %b %Y");

		var dx = new Date(dateRange[1]);
		var dateToStr = dx.setDate(dx.getDate()-1);

		if(filters.time=='d'){
			var string = dateformatter(dateRange[0]) + ' - ' + dateformatter(dateToStr);
			$('#dateRange').data('daterangepicker').setStartDate(dateRange[0]);
			$('#dateRange').data('daterangepicker').setEndDate(dx);		
		}

		if(filters.time=='m'){
			var dateformatter = d3.timeFormat("%b %Y");
			if(dateformatter(dateRange[0]) == dateformatter(dateToStr)){
				var string = dateformatter(dateRange[0]);
			} else {
				var string = dateformatter(dateRange[0]) + ' - ' + dateformatter(dateToStr);
			}
		}

		if(filters.time=='y'){
			var dateformatter = d3.timeFormat("%Y");
			if(dateformatter(dateRange[0]) == dateformatter(dateToStr)){
				var string = dateformatter(dateRange[0]);
			} else {
				var string = dateformatter(dateRange[0]) + ' - ' + dateformatter(dateToStr);
			}
		}

		d3.select('#dateRangeText').text(string);

	}

	//**************************
	// update entries chart
	//**************************
	var updateEntriesChart = function(){

		var chartdata = dataEntriesByDate;

		scale.entrieschart.y = d3.scaleLinear()
		.range([entriesChartHeight, 0])
		.domain([0, rounder(entriesMax)]);

		//**************************
		// Bar/event drop groups (by date)
		//**************************
		var barGroup = d3.select('#chart-entries-bar-group');

		var bars = barGroup.selectAll(".entriesGroup")
		.data(chartdata)
		.enter()
		.append('g')
		.attr('id', function(d,i){
			var dt = new Date(d.date);
			dt.setHours(0,0,0,0);
			return 'date'+dt.getTime();
		})
		.attr("class", "entriesGroup")
		.attr('data-width', function(d,i) { 
			if(filters.time=='y'){
				var date = new Date(d.key);
				var endYear = new Date(date.getFullYear(), 11, 31);
				return scale.timechart.x(endYear) - scale.timechart.x(d.key);   		
			}

			if(filters.time=='m'){
				var date = new Date(d.key);
				var endMonth = new Date(date.getFullYear(), date.getMonth()+1, 1);
				return scale.timechart.x(endMonth) - scale.timechart.x(d.key);   		
			}

			if(filters.time=='d'){
				var date = new Date(d.key);
				var endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1);
				return scale.timechart.x(endDate) - scale.timechart.x(d.key);   		
			}	
		})
		.attr("transform", function(d,i) { if(i==1){barWidth+=scale.timechart.x(d.key);} return "translate(" + scale.timechart.x(d.key) + ",0)"; })
		.exit()
		.remove();
		
		bars = d3.select('#chart-entries-bar-group').selectAll(".entriesGroup");

		var yArray = [];

		var individualBars = bars.selectAll('.entryBar')
		.data(function(d,i){ return d.barValues;})
		.enter()
		.append("rect")
		.attr('class', function(d,i){
			return 'entryBar severity'+(i+1);
		})
		.style('stroke', '#fff')
		.style('stroke-opacity',0)
		.attr("x", function(d,i) { 
			var w = d3.select(this.parentNode).attr('data-width');
			barWidth = w;
			if(filters.time=='m'){
				return w*0.2
			}
			if(filters.time=='y'){
				return w*0.3
			}
		})
		.attr("width", function(d,i) { 
			var w = d3.select(this.parentNode).attr('data-width');
			if(filters.time=='m'){
				w=w*0.6;
			}
			if(filters.time=='y'){
				w=w*0.4
			}
			return w-1;
		})
		.on('mouseover', function(){
			d3.select(this).style('fill-opacity', 1 - 0.05)
		})
		.on('mouseout', function(){
			d3.select(this).style('fill-opacity', 1)
		})
		.attr("height", 0)
		.attr("y", entriesChartHeight);

		individualBars.transition()
		.duration(500)
		.attr("y", function(d,i) { 
			if(i>0){
				yArray[i] = yArray[i-1] + d;
			} else {
				yArray[i] = d;
			}
			return scale.timechart.y1(yArray[i]); 
		})
		.attr("height", function(d,i) { 
			return entriesChartHeight-scale.entrieschart.y(d); 
		});

		timechartyAxis = d3.axisLeft()
		.scale(scale.entrieschart.y)
		.ticks(4)
		.tickSize(0)
		.tickPadding(8);

		d3.select("#entriesYAxis")
		.transition()
		.call(timechartyAxis);

		timechartyGrid = d3.axisLeft(scale.entrieschart.y)
		.tickSize(-width+52)
		.ticks(4)
		.tickFormat("")

		d3.select('#entriesChartYGrid')
		.transition()
		.call(timechartyGrid);

		var entriesGridlines = d3.select('#entriesChartYGrid').selectAll('line')
		.attr('opacity', function(d,i){
			return (i>0) ? 1 : 0;
		})

		// update bars
		bars = d3.select('#chart-entries-bar-group').selectAll(".entriesGroup");
		bars.each(function(d,i){

			var timeid = this.id;
			var dD = dataEntriesByDate.filter(obj => {
				return 'date'+obj.date.getTime() == timeid;
			})[0];
			var group = d3.select(this);
			var eventDrops = group.selectAll('.eventDrop' );

			if(dD){
				var yArray = [];
				var iBars = group.selectAll('.entryBar' )
				.style('fill', function(d,i){
					if(filters.toggle=='severity'){
						return colorPrimary[i];
					} else {
						return colorSecondary[i];
					}
				})
				.transition().duration(500)
				.attr("height", function(d,i) {
					return entriesChartHeight-scale.entrieschart.y(dD['severity'][i]); 
				})
				.attr("y", function(d,i) { 
					if(i>0){
						yArray[i] = yArray[i-1] + dD['severity'][i];
					} else {
						yArray[i] = dD['severity'][i];
					}
					return scale.entrieschart.y(yArray[i]); 
				});
				
			} else {
				group.selectAll('.entryBar').transition("h").duration(0).attr('height',0);
				group.selectAll('.entryBar').transition().duration(500).attr('y',entriesChartHeight).attr('height',0);
			}
		});

		if(duration==0){
			setTimeout(function(){
				d3.selectAll('.bar').style('opacity', 1);
				d3.selectAll('#timechartyAxis').style('opacity', 1);
			}, 50);
		}

	}

	function smoothAverage(v = 4){
		smoothingVal = Math.ceil(v);
		var dataAvg = movingAvg(tp, v);
		d3.select('#avg-line')
		.datum(dataAvg)
		.attr('d', curvedLine)
		.style('stroke-width',2)
		.style('stroke-opacity',1);
		d3.select('#chartarea').style('opacity', 0.2);
		d3.select('#n-days').text('( n days = '+(Math.round(v))+' )');
	}

	//**************************
	// update finalScore bars
	//**************************
	function updateFinalScore(target=null, duration = 0){

		if(target == 'brush') duration = 0;

		var final_score_total = 0;
		var final_score_total_filtered = 0;
		var final_score_total_not_null = 0;
		var finalScore = [0,0,0,0,0];
		var finalScoreFiltered = [0,0,0,0,0];
		var finalScoreRolling = [0,0,0,0,0];
		var finalScoreCount = 0;

		d3.selectAll('.finalScoreBar')
		.attr('fill', function(d,i){
			tippy(this.parentNode, { 
				content: '<div style="width: 100px; height: 10px; display: inline; background-color: '+ colorPrimary[i] + '">&nbsp;&nbsp;</div>&nbsp;&nbsp;' + d.name,
				theme: 'light-border',
				delay: [250,100],
				inertia: false,
				distance: 8,
				allowHTML: true,
				animation: 'shift-away',
				arrow: true,
				size: 'small'
			});
			return colorPrimary[i];
		});

		var dateByFinalScore = d3.nest()
		.key(function(d) { return d.date;})
		.key(function(d) { return d.finalScore; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(dataNotScore);

		dateByFinalScore.forEach(function(d,i){
			var dt = new Date(d.key);
			dt.setHours(0,0,0,0);
			d.key = dt;
			d.date = d.key;
			d.finalScore = [0,0,0,0,0,0];
			var count = 0;
			d.values.forEach(function(dx){
				d.finalScore[dx.key] = dx.value;
				count += dx.value;
			});

			d.total_assessments = count;
			d.finalScore_avg = ( (1*d.finalScore[5]) + (2*d.finalScore[1]) + (3*d.finalScore[2]) + (4*d.finalScore[3]) + (5*d.finalScore[4]) ) / count;

			if((d.date>=dateRange[0])&&(d.date<dateRange[1])){
				for (i = 0; i < finalScore.length; i++) { 
					finalScore[i] += d.finalScore[i];
					if((filters.finalScore.includes(i))||(filters.finalScore.length==0)){
						finalScoreFiltered[i] += d.finalScore[i];
					}
				}
				final_score_total += d.total_assessments;
				final_score_total_filtered += d.total_assessments;
			}
			delete d.values;
		});

		if(final_score_total>0){

			for (i = 0; i < finalScore.length; i++) { 
				finalScoreCount += finalScore[i];
				finalScoreRolling[i] = finalScoreCount;
			}

			if((target=='init')||(target=='methodology_content')||(target=='additional_documentation')||(target=='language')||(target=='sampling_approach')||(target=='context')||(target=='unit_of_reporting')||(target=='unit_of_analysis')||(target=='data_collection_technique')||(target=='assessment_type')||(target=='organisation')||(target=='focus')||(target=='geo')||(target=='top')||(target=='affected_groups')||(target=='brush')||(target=='sector')||(target=='clear')||(target=='map')||((target=='finalScore')&&(filters.finalScore.length == 0))){
				
				d3.selectAll('.finalScoreBar')
				.transition()
				.duration(duration)
				.attr('opacity', 1)
				.attr('x', function(d,i){
					if(i==0){
						var s = 0;
					} else {
						var s = finalScoreRolling[i-1];
					}
					var v = (s/final_score_total)*1000;
					var w = (finalScore[i]/final_score_total)*1000;
					// hide show percent label
					d3.select('.fs'+(i+1)+'-text')
					.style('opacity', function(){
						if(w<=20){ return  0 } else { return 1};
					});

					if(duration>0){
						d3.select('.fs'+(i+1)+'-text')
						.transition()
						.duration(duration)
						.attr('transform', function(d,i){
							return 'translate('+(v+(w/2))+',32)';
						});
					} else {
						d3.select('.fs'+(i+1)+'-text')
						.attr('transform', function(d,i){
							return 'translate('+(v+(w/2))+',32)';
						});
					}
					d3.select('.fs'+(i+1)+'-percent')
					.text(function(){
						var v = (finalScore[i]/final_score_total)*100;
						return Math.round(v)+'%';
					});
					d3.select('.fs'+(i+1)+'-value')
					.text(function(){
						return finalScore[i];
					});
					return v;
				})
				.attr('width', function(d,i){
					var v = (finalScore[i]/final_score_total)*1000;
					return v;
				});				
			};

			// median
			final_score_total += -finalScore[0];
			finalScore[0] = 0;
			final_score_total_filtered = d3.sum(finalScoreFiltered);
			var s = 0;
			var final_score_median = 0;
			finalScoreFiltered.every(function(d,i){
				s += finalScoreFiltered[i];
				if (s > final_score_total_filtered / 2){
					final_score_median = i;
					return false;	
				} else { 
					return true;
				}
			});

			var finalScoreAverage = ( (1*finalScore[5]) + (2*finalScore[1]) + (3*finalScore[2]) + (4*finalScore[3]) + (5*finalScore[4]) ) / final_score_total;
			d3.select('#finalScore_value').text(metadata.scorepillar_scale[(Math.round(finalScoreAverage))] + ' ('+ finalScoreAverage.toFixed(1) +')' )
			d3.select('#finalScore_value').text("("+metadata.scorepillar_scale[final_score_median].name+")").style('color', colorPrimary[final_score_median]);
			d3.select('#finalScoreAvg').attr('x',function(d){
				return 500
			})
			.attr('opacity',function(d){
				if(filters.finalScore.length>0) { return 0; } else { return 1;}
			});


			d3.select('#finalScoreSvg').style('visibility', 'visible');

		} else {
			d3.select('#finalScoreSvg').style('visibility', 'hidden');
			d3.select('#finalScore_value').text('');
			d3.selectAll('.finalScoreBar').attr('fill', '#CDCDCD');
		}
	}

	//**************************
	// update severity bars
	//**************************
	function updateSeverity(target=null, duration = 0){
		if(target == 'brush') duration = 0;

		var s_total = 0;
		var s_total_filtered = 0;
		var s_total_not_null = 0;
		var severity = [0,0,0,0,0,0];
		var severityFiltered = [0,0,0,0,0,0];
		var severityRolling = [0,0,0,0,0,0];
		var severityCount = 0;
		var severityData = dataEntriesNotSeverity;

		d3.selectAll('.severityBar')
		.attr('fill', function(d,i){
			tippy(this.parentNode, { 
				content: '<div style="width: 100px; height: 10px; display: inline; background-color: '+ colorSecondary[i] + '">&nbsp;&nbsp;</div>&nbsp;&nbsp;' + d.name,
				theme: 'light-border',
				delay: [250,100],
				inertia: false,
				distance: 8,
				allowHTML: true,
				animation: 'shift-away',
				arrow: true,
				size: 'small'
			});
			return colorSecondary[i];
		});

		var dateBySeverity = d3.nest()
		.key(function(d) { return d.date;})
		.key(function(d) { return d.severity; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(severityData);

		dateBySeverity.forEach(function(d,i){
			var dt = new Date(d.key);
			dt.setHours(0,0,0,0);
			d.key = dt;
			d.date = d.key;
			d.severity = [0,0,0,0,0,0];
			var count = 0;
			d.values.forEach(function(dx){
				d.severity[dx.key] = dx.value;
				count += dx.value;
			});

			d.total_entries = count;
			d.severity_avg = ( (1*d.severity[5]) + (2*d.severity[1]) + (3*d.severity[2]) + (4*d.severity[3]) + (5*d.severity[4]) ) / count;

			if((d.date>=dateRange[0])&&(d.date<dateRange[1])){
				for (i = 0; i < severity.length; i++) { 
					severity[i] += d.severity[i];
					if((filters.severity.includes(i))||(filters.severity.length==0)){
						severityFiltered[i] += d.severity[i];
					}
				}
				s_total += d.total_entries;
				s_total_filtered += d.total_entries;
			}
			delete d.values;
		});

		if((s_total>0)){
			for (i = 0; i < severity.length; i++) { 
				severityCount += severity[i];
				severityRolling[i] = severityCount;
			}

			if((target=='reliability')||(target=='init')||(target=='context')||(target=='geo')||(target=='specificNeeds')||(target=='affectedGroups')||(target=='brush')||(target=='sector')||(target=='clear')||(target=='map')||((target=='severity')&&(filters.severity.length == 0))){
				d3.selectAll('.severityBar')
				.transition()
				.duration(duration)
				.attr('opacity', 1)
				.attr('x', function(d,i){
					if(i==0){
						var s = 0;
					} else {
						var s = severityRolling[i-1];
					}
					var v = (s/s_total)*1000;
					var w = (severity[i]/s_total)*1000;
					// hide show percent label
					d3.select('.s'+(i+1)+'-text')
					.style('opacity', function(){
						if(w<=20){ return  0 } else { return 1};
					});

					if(duration>0){
						d3.select('.s'+(i+1)+'-text')
						.transition()
						.duration(duration)
						.attr('transform', function(d,i){
							return 'translate('+(v+(w/2))+',36)';
						});
					} else {
						d3.select('.s'+(i+1)+'-text')
						.attr('transform', function(d,i){
							return 'translate('+(v+(w/2))+',36)';
						});
					}
					d3.select('.s'+(i+1)+'-percent')
					.text(function(){
						var v = (severity[i]/s_total)*100;
						return Math.round(v)+'%';
					});
					d3.select('.s'+(i+1)+'-value')
					.text(function(){
						return severity[i];
					});

					return v;
				})
				.attr('width', function(d,i){
					var v = (severity[i]/s_total)*1000;
					return v;
				});				
			};

			// severity median
			s_total += -severityFiltered[0];
			s_total_filtered = d3.sum(severityFiltered);
			s_total_filtered += -severityFiltered[0];
			var severityNull = severityFiltered[0];
			severityFiltered[0] = 0;
			var s = 0;
			var s_median = 0;
			severityFiltered.every(function(d,i){
				s += severityFiltered[i];
				if (s > s_total_filtered / 2){
					s_median = i;
					return false;	
				} else { 
					return true;
				}
			});

			var severityAverage = ( (1*severity[5]) + (2*severity[1]) + (3*severity[2]) + (4*severity[3]) + (5*severity[4]) ) / s_total;
			d3.select('#severity_value').text(metadataEntries.severity_units[(Math.round(severityAverage))] + ' ('+ severityAverage.toFixed(1) +')' )
			d3.select('#severity_value').text("("+metadataEntries.severity_units[s_median].name+")").style('color', colorSecondary[s_median]);
			d3.select('#severityAvg').attr('x',function(d){
				var nullP = (1 - (s_total_filtered / (s_total_filtered+severityNull)))*1000;
				return (1000-nullP)/2+nullP;
			})
			.attr('opacity',function(d){
				if(filters.severity.length>0) { return 0; } else { return 1;}
			});
			
			d3.select('#severitySvg').style('visibility', 'visible');

		} else {
			d3.select('#severitySvg').style('visibility', 'hidden');
			d3.select('#severity_value').text('');
			d3.selectAll('.severityBar').attr('fill', '#CDCDCD');
		}
	}

	function colorBars(){
		d3.selectAll('.barGroup').each(function(d,i){
			var idate = parseInt(d3.select(this).attr('id').slice(4));
			// if(((new Date(idate)) >= (dateRange[0]))&&((new Date(idate))< (dateRange[1]))){
				d3.select(this).selectAll('.bar').style('fill', function(d,i){
					return colorPrimary[i];
				}).style('fill-opacity', 1);

				d3.select(this).selectAll('.eventDrop').style('fill', function(d,i){
					return colorNeutral[3];
				});
			// } else {
			// 	d3.select(this).selectAll('.bar').style('fill', function(d,i){
			// 		return colorLightgrey[i];
			// 	}).style('fill-opacity', 1);
			// 	d3.select(this).selectAll('.eventDrop').style('fill', function(d,i){
			// 		return colorLightgrey[1];
			// 	});
			// }
		});

		// d3.selectAll('.entriesGroup').each(function(d,i){
		// 	var idate = parseInt(d3.select(this).attr('id').slice(4));
		// 	if(((new Date(idate)) >= (dateRange[0]))&&((new Date(idate))< (dateRange[1]))){
		// 		d3.select(this).selectAll('.entryBar').style('fill', function(d,i){
		// 			return colorSecondary[i];
		// 		}).style('fill-opacity', 1);
		// 	} else {
		// 		d3.select(this).selectAll('.entryBar').style('fill', function(d,i){
		// 			return colorLightgrey[i];
		// 		}).style('fill-opacity', 1);
		// 	}
		// });

	}

	//**************************
	// resizing
	//**************************
	var scrollable = false;
	window.onresize = function(){
		setTimeout(Deepviz.resizeDevice, 50);
	}
	this.resizeDevice = function() {
		// set map height
		var map = document.getElementById("map");
		if(expandActive==true){

		} else {
			map.setAttribute("style","height:"+(map.offsetWidth*mapAspectRatio)+"px");
		}

		$('.vizlibResponsiveDiv').each(function(){
			var rDiv = this;
			if($(rDiv).hasClass('vizlibResponsiveDiv')){
				$(rDiv).width('100%');
				var ar = $(rDiv).attr('data-aspectRatio');
				var cWidth = $(rDiv).width();
				var cHeight = $(rDiv).height();
				$(rDiv).height(cWidth/ar);
				if(scrollable == false){
					$(rDiv).height('100%');
					cWidth = $(rDiv).width();
					cHeight = $(rDiv).height();
					if((cWidth/ar)>cHeight){
						$(rDiv).width($(rDiv).height()*ar);
					} else {
						$(rDiv).width('100%');
						$(rDiv).height($(rDiv).width()/ar);
					}
				} else {
					$(rDiv).width('100%');
					var cWidth = $(rDiv).width();
					var cHeight = $(rDiv).height();
					if((cWidth/ar)>cHeight){
						$(rDiv).height($(rDiv).width()/ar);
					} 
				}
			} 
		});
		mapbox.resize();

		if(collapsed==true){

			d3.select('#svg_summary2_div')
			.style('margin-top', -$('#svg_summary1_div').height()+'px')

			d3.select('#summary_row')
			.style('margin-top', function(){
				var h = $('#svg_summary1_div').height()+$('#svg_summary3_div').height()+10;
				return h+'px';
			});

		} else {

			d3.select('#svg_summary2_div')
			.style('margin-top', '0px')

			d3.select('#summary_row')
			.style('margin-top', function(){
				var h = $('#svg_summary1_div').height()*2+$('#svg_summary3_div').height()+10;
				return h+'px';
			});
		}

		d3.select('#summary_row').style('margin-top', function(){
			var h = $('#top_row').height()+10;
			return h+'px';
		});
	}

	// rounding function
	var rounder = function(value){
		var v = Math.abs(value);
		if(v<100){
			return Math.ceil(value/10)*10;
		};
		if(v<500){
			return Math.ceil(value/50)*50;
		};
		if(v<1000) {
			return Math.ceil(value/100)*100;
		}
		if(v<10000){
			return Math.ceil(value/1000)*1000;
		}
		if(v<100000){
			return Math.ceil(value/10000)*10000;
		}
		if(v<1000000){
			return Math.ceil(value/100000)*100000;
		}
		if(v<10000000){
			return Math.ceil(value/1000000)*1000000;
		}
		if(v<100000000){
			return Math.ceil(value/10000000)*10000000;
		}
	}

	// add or remove values from an array if exists
	function addOrRemove(array, value) {
		var index = array.indexOf(value);
		if (index === -1) {
			array.push(value);
		} else {
			array.splice(index, 1);
		}
	}

	var removeFromArray = function(array, elem) {  
		var index = array.indexOf(elem);
		while (index > -1) {
			array.splice(index, 1);
			index = array.indexOf(elem);
		}
	}

	function monthDiff(dateFrom, dateTo) {
		return dateTo.getMonth() - dateFrom.getMonth() + 
		(12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
	}
}

function addCommas(nStr){
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

$(document).ready(function(){

$('#print').click(function(){

	if(printing) return false;
	printing = true;
	map.resize();
	d3.select('#print-icon').style('display', 'none');
	d3.select('#print-loading').style('display', 'block');
	// $('#top_row').css('position', 'inherit');
	$('#print-date').html('<b>PDF Export</b> &nbsp;&nbsp;&nbsp;'+new Date());
	$('#svg_summary2_div').css('display', 'block');

	setTimeout(function(){
		// page 1
		html2canvas(document.querySelector("#page1"),{
	        allowTaint: true,
	        onclone: function(doc){
				$(doc).find('#summary_row').attr('style', 'margin-top: 10px');
				$(doc).find('#svg_summary2_div').attr('style', '');
				$(doc).find('#top_row').attr('style', 'position: relative');
				$(doc).find('.container2').css('position', 'unset');
				$(doc).find('.main-content').css('padding-bottom', '4px');
				$(doc).find('.main-content').css('margin', 'unset');
				$(doc).find('#print-header').css('display', 'block')
				$(doc).find('br-header').css('line-height', 0.7);
				$(doc).find('#svg_summary3_div').css('display', 'none');
				$(doc).find('#page2').css('display', 'none');
				$(doc).find('.removeFilterBtn').html('FILTERED');
	        },
	        useCORS: false,
	        foreignObjectRendering: true,
	        ignoreElements: function(element){
	        	if(element.id=='print') return true;
	        	if(element.id=='printImage') return true;
	        	if(element.id=='copyImage') return true;
	        	if(element.id=='lasso') return true;
	        	if(element.id=='expand') return true;
	        	if(element.id=='map-toggle') return true;
	        	if(element.id=='map-bg-toggle') return true;
	        	if(element.id=='heatmap-radius-slider-div') return true;
	        	if(element.id=='adm-toggle') return true;
	        	if(element.id=='dateRangeContainer_img') return true;
	        	if($(element).hasClass('select2')) return true;
	        	if(element.id=='page2') return true;
	        	if($(element).hasClass('removeFilterBtn')) return true;
	        	if($(element).hasClass('selectRows')) return true;
	    		return false;
	        },
	        scale: 1.2,
	        height: $('#page1').height()+100,
	        windowWidth: 1300,
	        windowHeight: 2800,
	        logging: false
	    }).then(canvas => {

	    var img = canvas.toDataURL("image/png");
	    var pdf = new jsPDF("p", "mm", "a4");
	    var imgProps= pdf.getImageProperties(img);
	    var pdfWidth = pdf.internal.pageSize.getWidth();
	    var pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

	    pdf.addImage(img, 'JPEG', 10, 5, pdfWidth-20, pdfHeight-30);
	    pdf.save('deep-pdf-export.pdf');
		d3.select('#print-icon').style('display', 'block');
		d3.select('#print-loading').style('display', 'none');
		printing = false;
		});
	},200);
});

$('#printImage').click(function(){

	if(printing) return false;
	printing = true;
	map.resize();
	d3.select('#printImage-icon').style('display', 'none');
	d3.select('#printImage-loading').style('display', 'block');
	// $('#top_row').css('position', 'inherit');
	$('#print-date').html('<b>Image Export</b> &nbsp;&nbsp;&nbsp;'+new Date());
	$('#svg_summary2_div').css('display', 'block');

	setTimeout(function(){
		html2canvas(document.querySelector("#page1"),{
	        allowTaint: true,
	        onclone: function(doc){
				$(doc).find('#summary_row').attr('style', 'margin-top: 10px');
				$(doc).find('#svg_summary2_div').attr('style', '');
				$(doc).find('#top_row').attr('style', 'position: relative');
				$(doc).find('.container2').css('position', 'unset');
				$(doc).find('.main-content').css('padding-bottom', '4px');
				$(doc).find('.main-content').css('margin', 'unset');
				$(doc).find('#print-header').css('display', 'block')
				$(doc).find('br-header').css('line-height', 0.7);
				$(doc).find('#svg_summary3_div').css('display', 'none');
				$(doc).find('#page2').css('display', 'none');
				$(doc).find('.removeFilterBtn').html('FILTERED');
	        },
	        useCORS: false,
	        foreignObjectRendering: true,
	        ignoreElements: function(element){
	        	if(element.id=='print') return true;
	        	if(element.id=='printImage') return true;
	        	if(element.id=='copyImage') return true;
	        	if(element.id=='lasso') return true;
	        	if(element.id=='expand') return true;
	        	if(element.id=='map-toggle') return true;
	        	if(element.id=='map-bg-toggle') return true;
	        	if(element.id=='heatmap-radius-slider-div') return true;
	        	if(element.id=='adm-toggle') return true;
	        	if(element.id=='dateRangeContainer_img') return true;
	        	if(element.id=='page2') return true;
	        	if($(element).hasClass('select2')) return true;
	        	if($(element).hasClass('removeFilterBtn')) return true;
	        	if($(element).hasClass('selectRows')) return true;
	    		return false;
	        },
	        scale: 1.2,
	        height: $('#page1').height()+100,
	        windowWidth: 1300,
	        windowHeight: 2800,
	        logging: false
	    }).then(canvas => {

		var img = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
		var link = document.createElement('a');
		link.download = 'deep-export.png';
		link.href = img;
		link.click();
		link.delete;
		d3.select('#printImage-icon').style('display', 'block');
		d3.select('#printImage-loading').style('display', 'none');
		printing = false;
		});
	},200);
});

$('#copyImage').click(function(){

	if(printing) return false;
	printing = true;
	map.resize();

	d3.select('#copyImage-icon').style('display', 'none');
	d3.select('#copyImage-loading').style('display', 'block');
	// $('#top_row').css('position', 'inherit');
	$('#print-date').html('<b>Image Export</b> &nbsp;&nbsp;&nbsp;'+new Date());
	$('#svg_summary2_div').css('display', 'block');

	setTimeout(function(){
		html2canvas(document.querySelector("#page1"),{
	        allowTaint: true,
	        onclone: function(doc){
				$(doc).find('#summary_row').attr('style', 'margin-top: 10px');
				$(doc).find('#svg_summary2_div').attr('style', '');
				$(doc).find('#top_row').attr('style', 'position: relative');
				$(doc).find('.container2').css('position', 'unset');
				$(doc).find('.main-content').css('padding-bottom', '4px');
				$(doc).find('.main-content').css('margin', 'unset');
				$(doc).find('#print-header').css('display', 'block')
				$(doc).find('br-header').css('line-height', 0.7);
				$(doc).find('#svg_summary3_div').css('display', 'none');
				$(doc).find('#page2').css('display', 'none');
				$(doc).find('.removeFilterBtn').html('FILTERED');
	        },
	        useCORS: false,
	        foreignObjectRendering: true,
	        ignoreElements: function(element){
	        	if(element.id=='print') return true;
	        	if(element.id=='printImage') return true;
	        	if(element.id=='copyImage') return true;
	        	if(element.id=='lasso') return true;
	        	if(element.id=='expand') return true;
	        	if(element.id=='map-toggle') return true;
	        	if(element.id=='map-bg-toggle') return true;
	        	if(element.id=='heatmap-radius-slider-div') return true;
	        	if(element.id=='adm-toggle') return true;
	        	if(element.id=='dateRangeContainer_img') return true;
	        	if(element.id=='page2') return true;
	        	if($(element).hasClass('select2')) return true;
	        	if($(element).hasClass('removeFilterBtn')) return true;
	        	if($(element).hasClass('selectRows')) return true;
	    		return false;
	        },
	        scale: 1.2,
	        height: $('#page1').height()+100,
	        windowWidth: 1300,
	        windowHeight: 2800,
	        logging: false
	    }).then(canvas => {
	    	canvas.toBlob(blob => {
			    navigator.clipboard.write([
			      new ClipboardItem({
			        [blob.type]: blob
			      })
			    ]).then(() => {
					// copied to clipboard
			    })
			  })
			d3.select('#copyImage-icon').style('display', 'block');
			d3.select('#copyImage-loading').style('display', 'none');
			printing = false;
		});
	},200);

});

	tippy('#print', {
		content: 'Export to PDF',
		theme: 'light-border',
		delay: [250,100],
		inertia: false,
		distance: 8,
		allowHTML: true,
		animation: 'shift-away',
		arrow: true,
		size: 'small'
	});

	tippy('#printImage', {
		content: 'Export to PNG',
		theme: 'light-border',
		delay: [250,100],
		inertia: false,
		distance: 8,
		allowHTML: true,
		animation: 'shift-away',
		arrow: true,
		size: 'small'
	});

	tippy('#copyImage', {
		content: 'Copy to clipboard',
		theme: 'light-border',
		delay: [250,100],
		inertia: false,
		distance: 8,
		allowHTML: true,
		animation: 'shift-away',
		arrow: true,
		size: 'small'
	});
});
