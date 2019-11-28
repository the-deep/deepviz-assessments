var Deepviz = function(sources, callback){

	//**************************
	// define variables
	//**************************
	var dateRange  = [new Date(2019, 4, 15), new Date(2019, 7, 31)]; // selected dateRange on load
	// var minDate = new Date('2019-08-05');

	// use url parameters
	var url = new URL(window.location.href);
	// minDate = new Date(url.searchParams.get("min_date"));

	var maxDate;
	var dateIndex;
	var scale = {
		'timechart': {x: '', y1: '', y2: ''},
		'entrieschart': {x: '', y: ''},
		'map': '',
		'eventdrop': '',
		'finalScore': {x: '', y: ''},
		'sector': {x: '', y: ''},
		'reliability': {x: '', y: ''},
		'affected_groups': {x: '', y: ''},
		'organisation': {x: '', y: ''},
	};

	var mapbox;
	var lassoActive = false;
	// data related
	var metadata;
	var originalData; // full original dataset without filters (used to refresh/clear filters)
	var originalDataEntries; // full original dataset without filters (used to refresh/clear filters)
	var data; // active dataset after filters applied
	var dataEntries;
	var dataByDate;
	var dataByMonth;
	var dataByYear;
	var dataByLocation;
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
	var monitoringId;
	var coordinatedJointId;
	var coordinatedHarmonizedId;
	var uncoordinatedId;
	var stakeholder_type_keys = {};
	var total = 0;
	var maxValue; // max value on a given date
	var maxFocusValue;
	var tp_finalScore = [];
	var tp_reliability = [];
	var duration = 700;
	// timechart variables
	var timechartInit = 0;
	var timechartyAxis;
	var timechartyGrids;
	var entriesAxis;
	var entriesMax;
	var width = 1300;
	var margin = {top: 18, right: 17, bottom: 0, left: 45};
	var timechartViewBoxHeight = 1100;
	var timechartViewBoxWidth = 1300;
	var timechartSvgHeight = 1050;
	var timechartHeight = 346;
	var timechartHeight2 = timechartHeight;
	var timechartHeightOriginal = timechartHeight;
	var entriesChartHeight = 100;
	var entriesTopMargin = 34;
	var brush;
	var gBrush; 
	var barWidth;
	var numContextualRows;
	var numCategories;
	var frameworkToggleImg;
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
	var mapAspectRatio = 1.63;
	var geoBounds = {'lat': [], 'lon': []};
	// radar
	var radarChartOptions;
	var radarMargin;
	var radarHeight;
	var radarWidth;
	var radarColor; 

	// filters
	var filters = {
		sector: [],
		sampling_approach: [],
		language: [],
		additional_documentation: [],
		methodology_content: [],
		unit_of_reporting: [],
		unit_of_analysis: [],
		data_collection_technique: [],
		assessment_type: [],
		finalScore: [],
		reliability: [],
		affected_groups: [],
		specific_needs: [],
		context: [],
		focus: [],
		organisation: [],
		geo: [],
		toggle: 'finalScore',
		frameworkToggle: 'entries',
		time: 'd'
	};

	var svg_summary;
	var svg_quality;

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
		data = values[0].data;
		dataEntries = values[1].data;
		svg_summary = values[2];
		svg_quality = values[3];

		metadata = values[0].meta;
		frameworkToggleImg = values[1];

		// remove unsed locations
		var locationArray = [];
		data.forEach(function(d,i){
			d.geo.forEach(function(dd,ii){
				if(!locationArray.includes(parseInt(dd))){
					locationArray.push(parseInt(dd));
				}
			})
		});

		dataEntries.forEach(function(d,i){
			d.geo.forEach(function(dd,ii){
				if(!locationArray.includes(parseInt(dd))){
					locationArray.push(parseInt(dd));
				}
			})
		});

		var newGeoArray = [];
		metadata.geo_array.forEach(function(d,i,obj){
			if(locationArray.includes(parseInt(d.id))){
				newGeoArray.push(d);
			}	
		})

		metadata.geo_array = newGeoArray;

		// parse meta data, create integer id column from string ids and programattically attempt to shorten label names
		metadata.focus_array.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.focus_array.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.data_collection_technique.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.type_of_unit_of_analysis.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.methodology_content.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.additional_documentation_array.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.language.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.assessment_type.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.sampling_approach.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.coordination.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
			if(d.name=='Coordinated - Joint') coordinatedJointId = d.id;
			if(d.name=='Coordinated - Harmonized') coordinatedHarmonizedId = d.id;
			if(d.name=='Uncoordinated') uncoordinatedId = d.id;
		});

		metadata.affected_groups_array.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.sector_array.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.organization.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
			d.name = d.short_name;
		});

		metadata.organisation_type.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
			if(d.name=='Donor') stakeholder_type_keys.donor = d.id;
			if(d.name=='International Organization') stakeholder_type_keys.ingo = d.id;
			if(d.name=='Non-governmental Organization') stakeholder_type_keys.ngo = d.id;
			if(d.name=='Government') stakeholder_type_keys.government = d.id;
			if(d.name=='UN Agency') stakeholder_type_keys.unagency = d.id;
			if(d.name=='UN Agencies') stakeholder_type_keys.unagency = d.id;
			if(d.name=='Red Cross/Red Crescent Movement') stakeholder_type_keys.rcrc = d.id;
			if(d.name=='Cluster') stakeholder_type_keys.cluster = d.id;
		});

		metadata.scorepillar_scale.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		metadata.geo_array.sort(function(x, y){
		   return d3.ascending(x.name, y.name);
		});

		metadata.geo_array.forEach(function(d,i){
			d._id = d.id;
			d.id = i+1;
		});

		// PARSE ASSESSMENT DATA IDS
		data.forEach(function(d,i){
			d.date = new Date(d.date);
			d.date.setHours(0,0,0,0);
			d.month = new Date(d.date);
			d.month.setHours(0,0,0,0);
			d.month.setDate(1);
			d.year = new Date(d.date);
			d.year.setHours(0,0,0,0);
			d.year.setDate(1);
			d.year.setMonth(0);

			// PARSE STRING IDS TO INTEGERS
			// parse context array
			d._focus = d.focus;
			d.focus = [];
			d._focus.forEach(function(dd,ii){
				metadata.focus_array.forEach(function(ddd,ii){
					if(dd==ddd._id){
						d.focus.push(ddd.id);
					}
				});
			});

			// parse affected groups array
			d._affected_groups = d.affected_groups;
			d.affected_groups = [];
			d._affected_groups.forEach(function(dd,ii){
				metadata.affected_groups_array.forEach(function(ddd,ii){
					if(dd==ddd._id){
						d.affected_groups.push(ddd.id);
					}
				});
			});

			// parse assessment type
			d._assessment_type = d.assessment_type;
			metadata.assessment_type.forEach(function(ddd,ii){
				if(parseInt(d._assessment_type)==parseInt(ddd._id)){
					d.assessment_type = parseInt(ddd.id);
				}
			});

			// parse coordination 
			d._coordination = d.coordination;
			metadata.coordination.forEach(function(ddd,ii){
				if(d._coordination==ddd._id){
					d.coordination = ddd.id;
				}
			});

			// parse language array
			d._language = d.language;
			d.language = [];
			if(d._language){
				d._language.forEach(function(dd,ii){
					metadata.language.forEach(function(ddd,ii){
						if(dd==ddd._id){
							d.language.push(ddd.id);
						}
					});
				});		
			}

			// parse sampling_approach array
			d._sampling_approach = d.sampling_approach;
			d.sampling_approach = [];
			var sa = [];
			d._sampling_approach.forEach(function(dd,ii){
				metadata.sampling_approach.forEach(function(ddd,ii){
					if((dd==ddd._id)&&(!d.sampling_approach.includes(ddd.id))){
						d.sampling_approach.push(ddd.id);
					}
				});
			});

			// parse sector array
			d._sector = d.sector;
			d.sector = [];
			d._sector.forEach(function(dd,ii){
				metadata.sector_array.forEach(function(ddd,ii){
					if(dd==ddd._id){
						d.sector.push(ddd.id);
					}
				});
			});

			// parse data collection technique 
			d._data_collection_technique = d.data_collection_technique;
			d.data_collection_technique = [];
			d._data_collection_technique.forEach(function(dd,ii){
				metadata.data_collection_technique.forEach(function(ddd,ii){
					if(dd==ddd._id){
						d.data_collection_technique.push(ddd.id);
					}
				});
			});

			// parse unit of analysis
			d._unit_of_analysis = d.unit_of_analysis;
			d.unit_of_analysis = [];
			d._unit_of_analysis.forEach(function(dd,ii){
				metadata.type_of_unit_of_analysis.forEach(function(ddd,ii){
					if(dd==ddd._id){
						d.unit_of_analysis.push(ddd.id);
					}
				});
			});

			// parse unit of reporting
			d._unit_of_reporting = d.unit_of_reporting;
			d.unit_of_reporting = [];
			d._unit_of_reporting.forEach(function(dd,ii){
				metadata.type_of_unit_of_analysis.forEach(function(ddd,ii){
					if(dd==ddd._id){
						d.unit_of_reporting.push(ddd.id);
					}
				});
			});

			// parse methodology content
			d._methodology_content = d.methodology_content;
			d.methodology_content = [];
			d._methodology_content.forEach(function(dd,ii){
				if(dd==1){
					d.methodology_content.push(metadata.methodology_content[ii])
				}
			});

			// parse additional documentation available 
			d._additional_documentation = d.additional_documentation;
			d.additional_documentation = [];
			d._additional_documentation.forEach(function(dd,ii){
				if(dd>=1){
					var doc = {'id': metadata.additional_documentation_array[ii].id, name: metadata.additional_documentation_array[ii].name, value: dd };
					d.additional_documentation.push(doc)
				}
			});

			// parse analytical density sector keys
			d.scores._analytical_density = d.scores.analytical_density;
			d.scores.analytical_density = [];

			Object.entries(d.scores._analytical_density).forEach(function(dd,ii){
				var sector = dd[0];
				var value = dd[1];
				metadata.sector_array.forEach(function(ddd,ii){
					if(sector==ddd._id){
						var obj = {};
						obj.sector = ddd.id;
						obj.name = ddd.name;
						obj.value = value;
						d.scores.analytical_density.push(obj);
					}
				});
			});

			// parse organisations array
			d._organisation_and_stakeholder_type = d.organisation_and_stakeholder_type;
			d.organisation_and_stakeholder_type = [];
			d._organisation_and_stakeholder_type.forEach(function(dd,ii){
				var orgId;
				var orgTypeId;
				metadata.organization.forEach(function(ddd,ii){
					if(dd[1]==ddd._id){
						orgId = ddd.id;
					}
				});
				metadata.organisation_type.forEach(function(ddd,ii){
					if(dd[0]==ddd._id){
						orgTypeId = ddd.id;
					}
				});
				d.organisation_and_stakeholder_type.push([orgTypeId, orgId]);
			});

			// parse scorepillar scale id
			d._scorepillar_scale = d.scorepillar_scale;
			metadata.scorepillar_scale.forEach(function(ddd,ii){
				if(d._scorepillar_scale==ddd._id){
					d.scorepillar_scale = ddd.id;
				}
				// parse null values
				if(d._scorepillar_scale===null){
					d.scorepillar_scale = 0;
				}
			});

			// parse geo id
			d._geo = d.geo;
			d.geo = [];
			d._geo.forEach(function(dd,ii){
				metadata.geo_array.forEach(function(ddd,ii){
					if(dd==ddd._id){
						d.geo.push(ddd.id);
						geoBounds.lat.push(ddd.bounds[0][0]);
						geoBounds.lat.push(ddd.bounds[1][0]);
						geoBounds.lon.push(ddd.bounds[0][1]);
						geoBounds.lon.push(ddd.bounds[1][1]);
					}
				});
			});

			var finalScore = d.scores.final_scores.score_matrix_pillar['1'];
			if(finalScore<=5){
				d.finalScore = 1;
			} else if(finalScore<=10){
				d.finalScore = 2;
			} else if(finalScore<=15){
				d.finalScore = 3;
			} else if(finalScore<=20){
				d.finalScore = 4;
			} else if (finalScore<=25){
				d.finalScore = 5;
			};

		});

		// set the data again for reset purposes
		originalData = data;

		// ENTIRES DATA convert date strings into js date objects
		dataEntries.forEach(function(d,i){
			d.date = new Date(d.date);
			d.date.setHours(0,0,0,0);
			d.month = new Date(d.date);
			d.month.setHours(0,0,0,0);
			d.month.setDate(1);
			d.year = new Date(d.date);
			d.year.setHours(0,0,0,0);
			d.year.setDate(1);
			d.year.setMonth(0);

			// PARSE STRING IDS TO INTEGERS

			// parse affected groups array
			d._affected_groups = d.affected_groups;
			d.affected_groups = [];
			d._affected_groups.forEach(function(dd,ii){
				metadata.affected_groups_array.forEach(function(ddd,ii){
					if(dd==ddd._id){
						d.affected_groups.push(ddd.id);
					}
				});
			});

			// parse affected groups array
			d._sector = d.sector;
			d.sector = [];
			d._sector.forEach(function(dd,ii){
				metadata.sector_array.forEach(function(ddd,ii){
					if(dd==ddd._id){
						d.sector.push(ddd.id);
					}
				});
			});

			// parse geo id
			d._geo = d.geo;
			d.geo = [];

			d._geo.forEach(function(dd,ii){
				metadata.geo_array.forEach(function(ddd,ii){
					if(dd==ddd._id){
						d.geo.push(ddd.id);
						geoBounds.lat.push(ddd.bounds[0][0]);
						geoBounds.lat.push(ddd.bounds[1][0]);
						geoBounds.lon.push(ddd.bounds[0][1]);
						geoBounds.lon.push(ddd.bounds[1][1]);
					}
				});
			});

		});

		originalDataEntries = dataEntries;

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
		d3.select('#finalScoreToggle').style('fill',colorPrimary[3]);
		d3.select('#reliabilityToggle').style('fill',colorSecondary[3]);
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

		dataByMethodologyContent = [];
		dataByAdditionalDocumentation = [];

		data.forEach(function(d,i){
			var frameworks = [];
			var contexts = [];
			var sectors = [];

			d.sector.forEach(function(dd,ii){
				// unique entries by sector
				var sectorRow = {"date": d.date, "sector": dd, 's': d.finalScore };
				if(!sectors.includes(dd)){
					dataBySector.push(sectorRow);
					sectors.push(dd);
				}
			});

			d.geo.forEach(function(dd,ii){
				dataByLocationArray.push({"date": d.date, "month": d.month, "year": d.year, "geo": dd, 's': d.finalScore, 'r': d.reliability });
			});

			d.focus.forEach(function(dd,ii){
				dataByFocusArray.push({"date": d.date, "month": d.month, "year": d.year, "focus": dd, 's': d.finalScore})
			});

			d.affected_groups.forEach(function(dd,ii){
				dataByAffectedGroups.push({"date": d.date, "affected_groups": dd, 's': d.finalScore });
			});

			d.unit_of_analysis.forEach(function(dd,ii){
				dataByUnitOfAnalysis.push({"date": d.date, "unit_of_analysis": dd, 's': d.finalScore });
			});

			d.unit_of_reporting.forEach(function(dd,ii){
				dataByUnitOfReporting.push({"date": d.date, "unit_of_reporting": dd, 's': d.finalScore });
			});

			d.language.forEach(function(dd,ii){
				dataByLanguage.push({"date": d.date, "language": dd, 's': d.finalScore });
			});

			d.sampling_approach.forEach(function(dd,ii){
				dataBySamplingApproach.push({"date": d.date, "sampling_approach": dd, 's': d.finalScore });
			});

			d.methodology_content.forEach(function(dd,ii){
				dataByMethodologyContent.push({"date": d.date, "methodology_content": dd.id, 's': d.finalScore });
			});

			d.additional_documentation.forEach(function(dd,ii){
				for (i = 0; i < dd.value; i++) {
					dataByAdditionalDocumentation.push({"date": d.date, "additional_documentation": dd.id, 's': d.finalScore });
				}
			})

			dataByAssessmentType.push({"date": d.date, 'assessment_type': parseInt(d.assessment_type)});

			d.organisation_and_stakeholder_type.forEach(function(dd,ii){
				var name;
				metadata.organization.forEach(function(ddd,ii){
					if(parseInt(ddd.id)==parseInt(dd[1])){
						name = ddd.name;
						dataByOrganisation.push({"date": d.date,  "stakeholder_type": dd[0], "organisation": dd[1], 'name': name, 's': d.finalScore });
					}
				});
			});

			d.data_collection_technique.forEach(function(dd,ii){
				if(dd!==null)
				dataByDataCollectionTechnique.push({"date": d.date,  "data_collection_technique": dd });
			});

		});

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

		rightAlignTotals();
		updateTotals();
		updateRadarCharts();
		updateBars('affected_groups', dataByAffectedGroups);
		updateBars('assessment_type', dataByAssessmentType);
		updateBars('data_collection_technique', dataByDataCollectionTechnique);
		updateBars('sampling_approach', dataBySamplingApproach);
		updateBars('methodology_content', dataByMethodologyContent);
		updateBars('additional_documentation', dataByAdditionalDocumentation);
		updateBars('unit_of_reporting', dataByUnitOfReporting);
		updateBars('unit_of_analysis', dataByUnitOfAnalysis);
		updateBars('language', dataByLanguage);
		updateStackedBars('sector', dataBySector);
		updateBars('focus', dataByFocusArray);
		updateStackedBars('organisation', dataByOrganisation)
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
		.style('cursor','default');

		return this.svg;
	};

	//**************************
	// create summary
	//**************************
	this.createSummary = function(){

		var summary = document.getElementById('svg_summary_div');
		// remove title tag from map svg
		var title = svg_summary.getElementsByTagName('title')[0];
		svg_summary.documentElement.removeChild(title);

		svg_summary.documentElement.removeAttribute('height');
		svg_summary.documentElement.setAttribute('width', '100%');

		// add svg to map div 
		summary.innerHTML = new XMLSerializer().serializeToString(svg_summary.documentElement);

	};

	//**************************
	// create map
	//**************************
	this.createMap = function(){

		// set map height
		var map = document.getElementById("map");

		map.setAttribute("style","height:"+(map.offsetWidth*mapAspectRatio)+"px");

		mapboxgl.accessToken = 'pk.eyJ1Ijoic2hpbWl6dSIsImEiOiJjam95MDBhamYxMjA1M2tyemk2aHMwenp5In0.i2kMIJulhyPLwp3jiLlpsA'

		// no data fallback
		if(data.length==0) return false; 

		var bounds = new mapboxgl.LngLatBounds([d3.min(geoBounds.lat),d3.min(geoBounds.lon)], [d3.max(geoBounds.lat),d3.max(geoBounds.lon)] );

	    //Setup mapbox-gl map
	    var map = new mapboxgl.Map({
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
	    map.fitBounds(bounds, {
	    	padding: 20
	    });

	    var container = map.getCanvasContainer()

	    var mapsvg = d3.select(container).append("svg")
	    .attr('id','map-bubble-svg')
	    .style('position', 'absolute')
	    .style('width', '100%')
	    .style('height', '100%');

	    var transform = d3.geoTransform({point: projectPoint});
	    var path = d3.geoPath().projection(transform);

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
			p = projectPoint(metadata.geo_array[i].centroid[0], metadata.geo_array[i].centroid[1]);
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
			filter('geo',geo.id);
			updateFinalScore('map', 500);
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
		.style('fill', '#FFF')

		function update() {
			featureElement.attr('transform', function(d,i){
				p = projectPoint(metadata.geo_array[i].centroid[0], metadata.geo_array[i].centroid[1]);
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

		function projectPoint(lon, lat) {
			var point = map.project(new mapboxgl.LngLat(lon, lat));
			return point;
		}

		function unprojectPoint(x, y) {
			var point = map.unproject([x,y]);
			return point;
		}

		d3.selectAll('#geoRemoveFilter').on('click', function(){
			d3.select('#geoRemoveFilter').style('display', 'none').style('cursor', 'default');
			$('#location-search').val(); 
			$('#location-search').trigger('change.select2');
			return filter('geo', 'clear'); 
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
			bounds[0] = unprojectPoint(bbox.x, bbox.y);
			bounds[1] = unprojectPoint((bbox.x+bbox.width), (bbox.y+bbox.height));
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
				filter('geo', 'clear');
			} else {
				filters.geo = geoArray;
				filter('geo', 0);
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

		updateBubbles();

	}

	//**************************
	// create select2 location search
	//**************************
	this.createSearch = function(){

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
		    	filter('geo', parseInt(e.params.data.id));
			});


			$('#location-search').on('select2:unselect', function (e) {
				filter('geo', parseInt(e.params.data.id));
				if(!e.params.originalEvent) {
					return;
				}
				e.params.originalEvent.stopPropagation();
			});

			d3.selectAll('.main-content').transition().duration(1500).style('opacity', 1);

		});
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
		.attr('width',width)
		.attr('height', timechartSvgHeight)
		.append('g')
		.attr("transform", "translate(0,0)");


		var width_new = width - (margin.right + margin.left);
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

		maxDate.setHours(0);
		maxDate.setMinutes(0);
		
		// define minimum date 
		minDate = new Date(d3.min(originalData, function(d){
			return d.date;
		}));

		minDateEntries = new Date(d3.min(dataEntries, function(d){
			return d.date;
		}));

		if(minDateEntries<minDate) minDate = minDateEntries;

		minDate.setHours(0);
		minDate.setMinutes(0);

		if(timechartInit==0){
			if(filters.time=='d'){
				maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth()+1, 1);
				minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
				dateRange[0] = new Date(maxAssessmentDate.getFullYear(), maxAssessmentDate.getMonth()-1, 1);
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

			$('#dateRange').daterangepicker({
				"locale": {
					"format": "DD MMM YYYY",
				},
				showDropdowns: true,
				showCustomRangeLabel: false,
				alwaysShowCalendars: true,
				ranges: {
					'Today': [moment(), moment()],
					'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
					'This Year': [new Date(today.getFullYear(), 0, 1), moment(maxDate).subtract(1,'days')],
					'Last Year': [new Date(dateRange[0].getFullYear()-1, 0, 1), new Date(dateRange[0].getFullYear()-1, 12, 0)],
					'Last 30 Days': [moment(new Date()).subtract(29, 'days'), moment()],
					'This Month': [new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth()+1, 0)],
					'Last Month': [new Date(today.getFullYear(), today.getMonth()-1, 1), new Date(today.getFullYear(), today.getMonth(), 0)],
					'Last 3 Months': [new Date(today.getFullYear(), today.getMonth()-2, 1), new Date(today.getFullYear(), today.getMonth()+1, 0)],
					'Last 6 Months': [new Date(today.getFullYear(), today.getMonth()-5, 1), new Date(today.getFullYear(), today.getMonth()+1, 0)]
				},
				maxYear: maxDate.getFullYear(),
				minYear: minDate.getFullYear(),
				minDate: minDate,
				maxDate: maxDate
			});		

			d3.select('#dateRange').style('cursor', 'pointer');

			d3.select('#timeChart').on('click', function(){
				// $('#dateRange').trigger('cancel.daterangepicker');
				$('#dateRange').data('daterangepicker').hide();
			})	
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
			maxDate = new Date(maxDate.getFullYear(),12, -1);
			minDate = new Date(minDate.getFullYear(), 0, 1);
			var d1 = dateRange.map(d3.timeDay.round);
			// dateRange[0] = d1[0];
			// dateRange[1] = d1[1];
			var d2 = new Date(dateRange[1]);
			d2.setDate(d2.getDate()-1);
			dateRange[0] = new Date(d1[0].getFullYear(), 0, 1);;
			dateRange[1] = new Date(d2.getFullYear()+1, 0, -1);
		}

		scale.timechart.x = d3.scaleTime()
	    .domain([minDate, maxDate])
	    .range([0, (width - (margin.right + margin.left))])

		var svgChartBg2 = svg.append('g').attr('id', 'svgchartbg2').attr('class', 'chartarea2').attr('transform', 'translate('+(margin.left+0)+','+margin.top+')');

		var svgBg = svg.append('g');

		svgBg.append('rect')
		.attr('x',margin.left)
		.attr('y',margin.top)
		.attr('width',width_new)
		.attr('height',timechartHeight2)
		.attr('opacity',0);

		var gridlines = svg.append('g').attr('id', 'gridlines').attr('class', 'gridlines').attr('transform', 'translate('+(margin.left+0)+','+margin.top+')');
		var svgChartBg = svg.append('g').attr('id', 'svgchartbg').attr('class', 'chartarea').attr('transform', 'translate('+(margin.left+0)+','+margin.top+')');
		var svgChart = svg.append('g')
		.attr('id', 'chartarea')
		.attr('transform', 'translate('+(margin.left+0)+','+margin.top+')')
		.style('opacity', 0);

		var svgAxisBtns = svg.append('g').attr('id', 'svgAxisBtns').attr('transform', 'translate('+(margin.left+0)+','+(timechartHeight2+margin.top+5)+')');

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
		.text('Total Assessments')

		timechartLegend
		.append("rect")
		.attr('id', 'leftAxisBox')
		.attr("y", 6)
		.attr("x", 5)
		.attr('width', 10)
		.attr('height', 10)
		.style('fill', colorNeutral[3]);

		var xAxis = d3.axisBottom()
		.scale(scale.timechart.x)
		.tickSize(0)
		.tickPadding(10);

		if(filters.time=='y'){
			xAxis.ticks(d3.timeYear.every(1))
			.tickFormat(d3.timeFormat("%Y"));

		} else {
			var months = monthDiff(minDate, maxDate);
			if(months<=5){
				xAxis.ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b %Y"));
			} else {
				xAxis.ticks(10).tickFormat(d3.timeFormat("%b %Y"));
			}
		}

	    //**************************
	    // Y AXIS left
	    //**************************

		svgBg.append('rect')
		.attr('x', -5)
		.attr('y', 0)
		.attr('height', timechartHeight2+35)
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
		var yAxisText = svgBg.append("g")
		.attr("class", "yAxis axis")
		.attr("id", "timechartyAxis")
		.attr('transform', 'translate('+(margin.left-1)+','+margin.top+')')
		.call(timechartyAxis)
		.style('font-size', options.yAxis.font.values.size);

		// add the Y gridline
		timechartyGrid = d3.axisLeft(scale.timechart.y1)
		.ticks(4)
		.tickSize(-width+52)
		.tickFormat("")

		gridlines.append("g")			
		.attr("class", "grid")
		.attr('id', 'timechartyGrid')
		.call(timechartyGrid);

		d3.select('#timechartyGrid')
		.transition()
		.duration(duration)
		.call(timechartyGrid);

		// x-axis 
		var xAxisObj = svgBg.append("g")
		.attr("class", "xAxis axis")
		.attr("transform", "translate(" + margin.left + "," + (timechartHeight2 + margin.top +0) + ")")
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
		.append('line')
		.attr('class', 'xAxisHorizontalLine')
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', 0)
		.attr('y2', timechartHeight2+margin.top+1);

		xAxisObj.selectAll(".tick")
		.append('line')
		.attr('class', 'xAxisHorizontalLine')
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', -timechartHeight2)
		.attr('y2', timechartSvgHeight-timechartHeight2-35)

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

		//**************************
		// Bar/event drop groups (by date)
		//**************************
		// bar groups
		var barGroup = svgChart.append('g').attr('id', 'chart-bar-group');

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
		.attr('fill', function(d,i){
			return colorPrimary[i];
		})
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
		});

		//**************************
		// draw entries chart
		//**************************

		var entriesGroup = svgChartBg2
		.append('g')
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
			return d.value;
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
		.tickSize(-width+52)
		.tickFormat("")

		entriesGroup
		.append('line')
		.attr('class', 'axisBaseline')
		.attr('x1',0)
		.attr('x2',1250)
		.attr('y1', entriesChartHeight)
		.attr('y2', entriesChartHeight)
		.style('stroke', '#ECECEC')
		.style('stroke-width', '1px')

		entriesGroup.append("g")			
		.attr("class", "grid")
		.attr('id', 'entriesChartYGrid')
		.call(entriesChartyGrid);

		var entriesBars = entriesGroup.selectAll('.entriesBar')
		.data(dataEntriesByDate)
		.enter()
		.append('g')
		.attr("transform", function(d,i) { return "translate(" + scale.timechart.x(d.key) + ",0)"; })
		.append('rect')
		.attr("class", "entriesBar")
		.attr('id', function(d,i){
			var dt = new Date(d.key);
			dt.setHours(0,0,0,0);
			d.date = dt;
			return 'entriesDate'+dt.getTime();
		})
		.attr('x', function(d,i){
			if(filters.time=='y'){
				var date = new Date(d.key);
				var endYear = new Date(date.getFullYear(), 11, 31);
				return scale.timechart.x(d.key) *.3;
			}

			if(filters.time=='m'){
				var date = new Date(d.key);
				var endMonth = new Date(date.getFullYear(), date.getMonth()+1, 1);
				return (scale.timechart.x(endMonth) - scale.timechart.x(d.key))*.2;
			}

			if(filters.time=='d'){
				var date = new Date(d.date);
				var endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
				return (scale.timechart.x(endDate) - scale.timechart.x(d.key))
			}	
		})
		.attr('width', function(d,i) { 
			if(filters.time=='y'){
				var date = new Date(d.key);
				var endYear = new Date(date.getFullYear(), 11, 31);
				return scale.timechart.x(d.key) *.4;
			}

			if(filters.time=='m'){
				var date = new Date(d.key);
				var endMonth = new Date(date.getFullYear(), date.getMonth()+1, 1);
				return (scale.timechart.x(endMonth) - scale.timechart.x(d.key))*.6;
			}

			if(filters.time=='d'){
				var date = new Date(d.key);
				var endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1);
				return (scale.timechart.x(endDate) - scale.timechart.x(d.key));
			}	
		})
		.attr('height', function(d,i){
			return entriesChartHeight - scale.entrieschart.y(d.value);
		})
		.attr('y', function(d,i){
			return  scale.entrieschart.y(d.value);
		})
		.style('fill', colorSecondary[4]);

		// *************************
		// draw contextual rows
		//**************************

		var timechart = d3.select('#timeChart');
		var yPadding = 0;

		var contextualRows = svgChartBg.append('g')
		.attr('id', 'contextualRows')
		.attr('transform', 'translate(0,'+ (timechartHeight2 + yPadding + entriesChartHeight + entriesTopMargin ) + ')');

		var contextualRowsHeight = timechartSvgHeight - timechartHeight2 - yPadding - 36 - entriesChartHeight - entriesTopMargin ;

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
		.attr('width', 1240)
		.attr('x', 0)
		.attr('y',0)
		.style('fill', '#FFF')
		.style('fill-opacity',0);

		contextualRows.append('rect')
		.attr('height', contextualRowsHeight+45)
		.attr('width', 10)
		.attr('x', -5)
		.attr('y',-30)
		.style('fill', '#FFF')
		.style('fill-opacity',1);

		svg.append('rect')
		.attr('height', contextualRowsHeight+38)
		.attr('width', 35)
		.attr('x', 1284)
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
		.attr('x2',1250)
		.attr('y1', 0)
		.attr('y2', 0);

		contextualRows
		.append('line')
		.attr('class', 'contextualRowLine')
		.attr('x1',0)
		.attr('x2',1250)
		.attr('y1', contextualRowsHeight)
		.attr('y2', contextualRowsHeight);

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
				redrawTimeline();
			}
			filters.time = v;
			d3.selectAll('.time-select rect').style('fill', colorGrey[2]);
			d3.select('#time-select-'+filters.time+ ' rect').style('fill', colorNeutral[4]);
		})

		d3.select('#time-select-'+filters.time+ ' rect').style('fill', colorNeutral[4]);

		//**************************
		// event drops
		//**************************

		maxFocusValue = d3.max(dataByFocus, function(d) {
			var m = d3.max(d.values, function(d) {
				return d.value;
			})
			return m;
		});

		scale.eventdrop = d3.scaleLinear()
		.range([0,12])
			.domain([0,maxFocusValue]);// 

		// event mask groups (to be used for event drop grey brush mask)
		var eventDropGroup = bars.append('g')
		.attr("class", "eventDropGroup");

		var eventDrops = eventDropGroup.selectAll('.eventDrop')
		.data(function(d,i){ return d.focus;})
		.enter()
		.append('circle')
		.attr('class', 'eventDrop')
		.attr('r', function(d){
			return scale.eventdrop(d);
		})
		.attr('cx', function(d,i){
				var w = d3.select(this.parentNode.parentNode).attr('data-width');
				return (w/2);
			})
		.attr('cy', function(d,i){
			return timechartHeight2 + (contextualRowHeight*(i))+ (contextualRowHeight/2)+ entriesChartHeight + entriesTopMargin;
		})
		.style('fill', colorNeutral[3]);

		//**************************
		// date slider brushes
		//**************************
	    // initialise the brush
	    brush = d3.brushX()
	    .extent([[scale.timechart.x(minDate), -margin.top], [scale.timechart.x(maxDate), timechartSvgHeight-(margin.top+margin.bottom)]])
	    .on("brush", dragging)
	    .on("start", dragged);

	    // add the selectors
	    gBrush = svgChart.append("g")
	    .attr('id', 'gBrush')
	    .attr("class", "brush")
	    .attr('transform', 'translate('+(2)+',0)')
	    .call(brush);

		d3.selectAll('.handle rect').attr('fill-opacity', '1').style('visibility', 'visible').attr('width', 2).attr('fill', '#000').style('stroke-opacity', 0);

	    // add the triangle handles (top)
	    var handleTop = gBrush.selectAll(".handle--custom-top")
	    .data([{type: "w"}, {type: "e"}])
	    .enter().append("g")
	    .attr('class', 'handleG')

	    handleTop.append('path')
	    .attr("class", "handle--custom-top")
	    .attr("stroke", "#000")
	    .attr('stroke-width', 3)
	    .attr('fill', '#000')
	    .attr("cursor", "ew-resize")
	    .attr("d", 'M -8,0 -1,11 6,0 z');

	    handleTop.append('rect')
	    .attr('x',-5)
	    .attr('width', 10)
	    .attr('height', timechartSvgHeight)
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

	    // no data fallback
		if(data.length==0) return false; 

	    handleTop.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", -" + margin.top + ")"; });
	    handleBottom.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", " + (timechartSvgHeight - margin.top) + ")"; });

	    // handle mouseovers
	    d3.selectAll('.handleG')
	    .on('mouseover', function(){
	    	d3.selectAll('.handle--custom-top, .handle--custom-bottom').style('fill', 'silver');
	    })
	    .on('mouseout', function(){
	    	d3.selectAll('.handle--custom-top, .handle--custom-bottom').style('fill', '#000');
	    })

	    $('#dateRange').on('apply.daterangepicker', function(ev, picker) {
	    	dateRange[0] = new Date(picker.startDate._d);
	    	dateRange[0].setHours(0,0,0,0);

	    	dateRange[1] = new Date(picker.endDate._d);
	    	dateRange[1].setHours(0,0,0,0);
	    	dateRange[1] = moment(dateRange[1].setDate(dateRange[1].getDate())).add(1, 'day');
	    	gBrush.call(brush.move, dateRange.map(scale.timechart.x));

	    	colorBars();
	    	updateDate();
	    	updateBubbles();
	    	updateFinalScore('map', 500);
	    	updateBars('affected_groups', dataByAffectedGroups);
	    	updateBars('assessment_type', dataByAssessmentType);
	    	updateBars('data_collection_technique', dataByDataCollectionTechnique);
	    	updateBars('sampling_approach', dataBySamplingApproach);
	    	updateBars('methodology_content', dataByMethodologyContent);
	    	updateBars('additional_documentation', dataByAdditionalDocumentation);
	    	updateBars('unit_of_reporting', dataByUnitOfReporting);
	    	updateBars('unit_of_analysis', dataByUnitOfAnalysis);
	    	updateBars('language', dataByLanguage);
	    	updateStackedBars('sector', dataBySector);
	    	updateBars('focus', dataByFocusArray);
	    	updateStackedBars('organisation', dataByOrganisation)

	    	handleTop.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", -"+ margin.top +")"; });
	    	handleBottom.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", " + (timechartSvgHeight - margin.top) + ")"; });

	    	updateTotals();
	    	updateRadarCharts();
	    });

	    // keyboard pagination
		var k = 0;
		document.body.onkeyup = function(e){

			var unit = 'day';
			if(filters.time=='m') unit = 'month';
			if(filters.time=='y') unit = 'year';

		    if(e.keyCode == 37){ // arrow left
	        	if(dateRange[0]>minDate){
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
		    	filter('clear', 'clear');
		    }

		    if(e.keyCode == 8){ // BACKSPACE
		    	filter('clear', 'clear');
		    }

		    if(e.keyCode == 27){ // ESC
		    	filter('clear', 'clear');
		    }

		    if(e.keyCode == 49){ // 1
		    	filter(filters.toggle, 1);
		    }

		    if(e.keyCode == 50){ // 2
		    	filter(filters.toggle, 2);
		    }

		    if(e.keyCode == 51){ // 3
		    	filter(filters.toggle, 3);
		    }

		    if(e.keyCode == 52){ // 4
		    	filter(filters.toggle, 4);
		    }

		    if(e.keyCode == 53){ // 5
		    	filter(filters.toggle, 5);
		    }

		    function dateKey(v){
				if(v!=filters.time){
					filters.time = v;
					redrawTimeline();
				}
				d3.selectAll('.time-select rect').style('fill', colorGrey[2]);
				d3.select('#time-select-'+filters.time+ ' rect').style('fill', colorNeutral[4]);
		    }

		    function update(){
		    	colorBars();
		    	updateDate();
		    	updateBubbles();
		    	updateFinalScore('map', 200);
		    	updateBars('affected_groups', dataByAffectedGroups);
		    	updateBars('assessment_type', dataByAssessmentType);
		    	updateBars('data_collection_technique', dataByDataCollectionTechnique);
		    	updateBars('sampling_approach', dataBySamplingApproach);
		    	updateBars('methodology_content', dataByMethodologyContent);
		    	updateBars('additional_documentation', dataByAdditionalDocumentation);
		    	updateBars('unit_of_reporting', dataByUnitOfReporting);
		    	updateBars('unit_of_analysis', dataByUnitOfAnalysis);
		    	updateBars('language', dataByLanguage);
		    	updateStackedBars('sector', dataBySector);
		    	updateBars('focus', dataByFocusArray);
		    	updateStackedBars('organisation', dataByOrganisation)

		    	handleTop.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", -"+ margin.top +")"; });
		    	handleBottom.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", " + (timechartSvgHeight - margin.top) + ")"; });

		    	updateTotals();
		    	updateRadarCharts();
		    }
		}

	    // programattically set date range
	    gBrush.call(brush.move, dateRange.map(scale.timechart.x));
	    // function to handle the changes during slider dragging
	    function dragging() {

	    	if($('#dateRange').data('daterangepicker'))
	    	$('#dateRange').data('daterangepicker').hide();
	    	// if not right event then break out of function
	    	if(!d3.event.sourceEvent) return;
	    	if(d3.event.sourceEvent.type === "start") return;
	    	if(d3.event.sourceEvent.type === "click") return;
	    	if(d3.event.sourceEvent.type === "brush") return;

	    	var d0 = d3.event.selection.map(scale.timechart.x.invert);
			var d1 = [];

			if(filters.time=='d'){
				var a = d3.timeDay.floor(d0[1]).getTime() - d3.timeDay.floor(d0[0]).getTime(); 
		    	var days = Math.round(a / (1000 * 3600 * 24) );
		    	if(days==0) days=1;
				d0[0] = d3.timeDay.floor(d0[0]);
				d0[1] = d3.timeDay.offset(d0[0], days);

				d1[0] = d0[0];
				d1[1] = d0[1];
			}
			if(filters.time=='m'){
				d0[0] = d3.timeDay.floor(d0[0]);

				var a = d3.timeDay.floor(d0[1]).getTime() - d3.timeDay.floor(d0[0]).getTime(); 
		    	var days = Math.round(a / (1000 * 3600 * 24) );

				var diff = Math.abs(d0[1].getTime() - d0[0].getTime()) / 1000;
				diff /= (60 * 60 * 24 * 7 * 4)
				var months = Math.abs(Math.round(diff));

		    	var months = d0[1].getMonth() - d0[0].getMonth() + (12 * (d0[1].getFullYear() - d0[0].getFullYear()));

		    	if(months<1)months=1;

				d1[0] = d3.timeMonth.round(d0[0]);
				d1[1] = d3.timeMonth.round(d3.timeDay.offset(d1[0], days));

				if(d1[0]>=d1[1]){
					d1[0] = d3.timeMonth.floor(d0[0]);

					d1[1] = d3.timeMonth.offset(d1[0],1);
				}
			}
			if(filters.time=='y'){
				var d1 = d0.map(d3.timeYear.round);
				// d1[0] = d3.timeYear.round(d0[0]);
				// d1[1] = d3.timeYear.round(d0[1]);
				if (d1[0] >= d1[1]) {
					d1[0] = d3.timeYear(d0[0]);
					d1[1] = d3.timeYear.ceil(d0[0]);
				} 
			}

			dateRange = d1;

			colorBars();
			updateDate();
			updateBubbles();
			updateFinalScore('brush');
			updateBars('affected_groups', dataByAffectedGroups);
			updateBars('assessment_type', dataByAssessmentType);
			updateBars('data_collection_technique', dataByDataCollectionTechnique);
			updateBars('sampling_approach', dataBySamplingApproach);
			updateBars('methodology_content', dataByMethodologyContent);
			updateBars('additional_documentation', dataByAdditionalDocumentation);
			updateBars('unit_of_reporting', dataByUnitOfReporting);
			updateBars('unit_of_analysis', dataByUnitOfAnalysis);
			updateBars('language', dataByLanguage);
			updateStackedBars('sector', dataBySector);
			updateBars('focus', dataByFocusArray);
			updateStackedBars('organisation', dataByOrganisation)

			d3.select(this).call(d3.event.target.move, dateRange.map(scale.timechart.x));
			handleTop.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", -"+ margin.top +")"; });
			handleBottom.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", " + (timechartSvgHeight - margin.top) + ")"; });

			$('#location-search').select2('close');

			updateTotals();
			updateRadarCharts();
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

			colorBars();
			updateDate();
			updateBubbles();
			updateFinalScore('brush',500);
			updateBars('affected_groups', dataByAffectedGroups);
			updateBars('assessment_type', dataByAssessmentType);
			updateBars('data_collection_technique', dataByDataCollectionTechnique);
			updateBars('sampling_approach', dataBySamplingApproach);
			updateBars('methodology_content', dataByMethodologyContent);
			updateBars('additional_documentation', dataByAdditionalDocumentation);
			updateBars('unit_of_reporting', dataByUnitOfReporting);
			updateBars('unit_of_analysis', dataByUnitOfAnalysis);
			updateBars('language', dataByLanguage);
			updateStackedBars('sector', dataBySector);
			updateBars('focus', dataByFocusArray);
			updateStackedBars('organisation', dataByOrganisation)

			d3.select(this).call(d3.event.target.move, dateRange.map(scale.timechart.x));
			handleTop.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", -"+ margin.top +")"; });
			handleBottom.attr("transform", function(d, i) { return "translate(" + (dateRange.map(scale.timechart.x)[i]-1) + ", " + (timechartSvgHeight - margin.top) + ")"; });

			$('#location-search').select2('close');

			updateTotals();
			updateRadarCharts();
		}


		d3.select('#chartarea').transition().duration(1000).style('opacity', 1);
		d3.select('#avg-line').transition().duration(500).style('opacity', 1);

		colorBars();
		updateDate();
		updateEntriesChart();
		updateBubbles();
		updateFinalScore('init', 500);
		updateTotals();
		updateRadarCharts();
		updateBars('affected_groups', dataByAffectedGroups);
		updateBars('assessment_type', dataByAssessmentType);
		updateBars('data_collection_technique', dataByDataCollectionTechnique);
		updateBars('sampling_approach', dataBySamplingApproach);
		updateBars('methodology_content', dataByMethodologyContent);
		updateBars('additional_documentation', dataByAdditionalDocumentation);
		updateBars('unit_of_reporting', dataByUnitOfReporting);
		updateBars('unit_of_analysis', dataByUnitOfAnalysis);
		updateBars('language', dataByLanguage);
		// updateStackedBars('sc', dataBySector);

		updateStackedBars('sector', dataBySector);
		updateBars('focus', dataByFocusArray);
		updateStackedBars('organisation', dataByOrganisation)

		return bars;
	}


	//**************************
	// finalScore chart
	//**************************
	this.createFinalScoreChart = function(options){

		// set toggle button listener
		d3.selectAll('.finalScoreToggle').on('click', function(){
			toggle('finalScore');
		});

		// create finalScore svg
		var finalScoreSvg = this.createSvg({
			id: 'finalScoreSvg',
			viewBoxWidth: 1000,
			viewBoxHeight: 70,
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

		finalScoreBars.on('mouseover', function(d,i){
			d3.select(this).select('.bar-percent').style('opacity',0);
			d3.select(this).select('.bar-value').style('opacity',1);
		}).on('mouseout', function(d,i){
	            d3.select(this).select('.bar-percent').style('opacity',1);
	            d3.select(this).select('.bar-value').style('opacity',0);
		}).on('click', function(d,i){
			d3.selectAll('.bar').transition("mouseoutReliability").duration(duration).style('opacity', 1);	
			clickTimer = 1;
			filter('finalScore',i);
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
			return filter('finalScore', 'clear'); 
		});

		updateFinalScore('init', duration);
	}

	//**************************
	// bar chart
	//**************************
	this.createBarChart = function(a){

		var padding = {left: 20, right: 25, top: 35, bar: {y: 5}};

		// create svg
		var svg = this.createSvg({
			id: a.div+'-svg',
			viewBoxWidth: a.width,
			viewBoxHeight: a.height,
			div: '#'+a.div,
			width: '100%'
		});

		var height = a.height - padding.top;

		a.rows = metadata[a.rows];

		if((a.limit)&&(a.rows.length>a.limit)) {
			var rowHeight = height/a.limit;
			a.rows = a.rows.splice(0,10);
		} else {
			var rowHeight = height/a.rows.length;
		}

		// add title
		var title = svg.append('g')
		.attr('transform', 'translate(0,0)');

		title
		.append('text')
		.attr('x', 0)
		.attr('y', 20)
		.style('font-weight', 'bold')
		.text(a.title);

		// add filter icon
		title.append('image')
		.attr('id', a.classname+'RemoveFilter')
		.attr('class', 'removeFilterBtn')
		.attr('xlink:href', 'images/filter.png')
		.attr('title', 'Reset filter')
		.attr('y', 1)
		.attr('x', title.node().getBBox().width +5 )
		.attr('height', '22px')
		.attr('width', '22px');

		var chartarea = svg.append('g');

		var rows = chartarea.selectAll('.bar-row')
		.data(a.rows)
		.enter()
		.append('g')
		.attr('class', function(d,i) { return 'bar-row '+ a.classname+'-row ' + a.classname+'-bar-row'+i; })
		.attr('transform', function(d,i){
			return 'translate(0,' + ((i*rowHeight) + padding.top) + ')';
		});

		var label = rows.append('text')
		.attr('y', rowHeight/2 )
		.attr('class', function(d,i){ return a.classname + ' ' + a.classname+'-'+i })
		.style('alignment-baseline', 'middle')
		.text(function(d,i){
			var name = d.name.substr(0,labelCharLimit);
			if(name.length==labelCharLimit) name += '.';
			return name;
		}).style('text-anchor', 'end');

		var labelWidth = chartarea.node().getBBox().width + padding.left;
		label.attr('x', labelWidth-20);
		labelWidth = labelWidth + 16;

		// title.attr('transform', function(d,i){
		// 	var offset = d3.select(this).node().getBBox().width +35;
		// 	return 'translate('+(labelWidth-offset)+',0)';
		// })

		var width = a.width - labelWidth - padding.right; 

		// adjust title and filter button spacing
		d3.select('#'+a.classname+'Title').style('text-align', 'left').style('display', 'inline');

		var rowBg = rows.append('rect')
		.attr('y', 1)
		.attr('x', 0)
		.attr('width', labelWidth-30)
		.attr('height', rowHeight-2)
		.style('opacity', 0)
		.style('cursor', 'pointer')
		.attr('class', function(d,i){ return a.classname +'-bg ' + a.classname+'-bg-'+i })
		.on('mouseover', function(){
			d3.select(this).style('opacity', 0.03)
		})
		.on('mouseout', function(){
			d3.select(this).style('opacity', 0)
		})
		.on('click', function(d,i){
			return filter (a.filter, i+1);
		});

		// define x scale
		scale[a.classname] = {};
		scale[a.classname].x = d3.scaleLinear()
		.range([labelWidth, a.width - padding.right])
		.domain([1, 5]);// finalScore/reliability x xcale

		scale[a.classname].paddingLeft = labelWidth;

		for(var s=0; s >= 0; s--) {
			var val = s;
			var bar = rows.append('rect')
			.attr('id', function(d,i){
				return a.classname+d.id+'s'+(s);
			})
			.attr('class', a.classname+'-bar s'+(s))
			.attr('x', function(d,i){
				return scale[a.classname].x(s);
			})
			.attr('width', width/5)
			.attr('data-width', width)
			.attr('data-id', s)
			.attr('data-percent', 0)
			.attr('y', padding.bar.y)
			.attr('height', rowHeight-(padding.bar.y*2))
			.style('fill', colorPrimary[s])
		}

		var dataLabel = rows.append('text')
		.text(999)
		.attr('id', function(d,i){
			return a.classname+d.id+'label';
		})
		.attr('class', a.classname+'-label')
		.attr('y', rowHeight/2)
		.style('alignment-baseline', 'middle')
		.style('text-anchor', 'middle')
		.attr('x', labelWidth -20 )
		.style('fill', colorPrimary[4])
		.style('font-weight', 'bold')
		.style('font-size', '16px');

		d3.select('#'+a.classname+'RemoveFilter').on('click', function(){ filter(a.filter, 'clear'); });

	}

	//**************************
	// stacked bar chart
	//**************************
	this.createStackedBarChart = function(a){

		var padding = {left: 20, right: 25, top: 35, bar: {y: 5}};

		// create svg
		var svg = this.createSvg({
			id: a.div+'-svg',
			viewBoxWidth: a.width,
			viewBoxHeight: a.height,
			div: '#'+a.div,
			width: '100%'
		});

		a.rows = metadata[a.rows];

		if(a.classname=='organisation'){
			a.rows = a.rows.splice(0,10);
		}

		var height = a.height - padding.top;
		var rowHeight = height/a.rows.length;

		// add title
		var title = svg.append('g')
		.attr('transform', 'translate(0,0)');

		title
		.append('text')
		.attr('x', 0)
		.attr('y', 20)
		.style('font-weight', 'bold')
		.text(a.title);

		// add filter icon
		title.append('image')
		.attr('id', a.classname+'RemoveFilter')
		.attr('class', 'removeFilterBtn')
		.attr('xlink:href', 'images/filter.png')
		.attr('title', 'Reset filter')
		.attr('y', 1)
		.attr('x', title.node().getBBox().width +5 )
		.attr('height', '22px')
		.attr('width', '22px');

		var chartarea = svg.append('g');

		var rows = chartarea.selectAll('.stacked-bar-row')
		.data(a.rows)
		.enter()
		.append('g')
		.attr('class', 'stacked-bar-row '+a.clasname+'-row')
		.attr('transform', function(d,i){
			return 'translate(0,' + ((i*rowHeight) + padding.top) + ')';
		});

		var label = rows.append('text')
		.attr('y', rowHeight/2 )
		.attr('class', function(d,i){ return a.classname + ' ' + a.classname+'-'+i })
		.style('alignment-baseline', 'middle')
		.text(function(d,i){
			var name = d.name.substr(0,labelCharLimit-7);
			if(name.length==labelCharLimit-7) name += '.';
			return name;
		}).style('text-anchor', 'end');

		var labelWidth = chartarea.node().getBBox().width + padding.left;
		label.attr('x', labelWidth-20);
		labelWidth = labelWidth + 16;

		if(a.classname == 'sector'){
			var icon = rows.append('image')
			.attr('class', function(d,i){
				return 'sector-icon sector-icon-'+d.id;
			})
			.attr('xlink:href', function(d,i){
				return 'images/sector-icons/'+(d.name.toLowerCase())+'.svg'; 
			})
			.attr('height', 23)
			.attr('width', 23)
			.attr('y', rowHeight/2 - 12)
			.attr('x', labelWidth-30);

			labelWidth = labelWidth + 30;
		}

		var width = a.width - labelWidth - padding.right; 

		// adjust title and filter button spacing
		d3.select('#'+a.classname+'Title').style('text-align', 'left').style('display', 'inline');

		var rowBg = rows.append('rect')
		.attr('y', 1)
		.attr('x', 0)
		.attr('width', labelWidth-30)
		.attr('height', rowHeight-2)
		.style('opacity', 0)
		.style('cursor', 'pointer')
		.attr('class', function(d,i){ return a.classname +'-bg ' + a.classname+'-bg-'+i })
		.on('mouseover', function(){
			d3.select(this).style('opacity', 0.03)
		})
		.on('mouseout', function(){
			d3.select(this).style('opacity', 0)
		})
		.on('click', function(d,i){
			if(a.classname=='sector'){
				return filter('sector',i+1);
			}
		});

		// define x scale
		scale[a.classname] = {};
		scale[a.classname].x = d3.scaleLinear()
		.range([labelWidth, a.width - padding.right])
		.domain([1, 5]);// finalScore/reliability x xcale

		scale[a.classname].paddingLeft = labelWidth;

		for(var s=5; s >= 0; s--) {
			var val = s;
			var bar = rows.append('rect')
			.attr('id', function(d,i){
				return a.classname+d.id+'s'+(s);
			})
			.attr('class', a.classname+'-bar s'+(s))
			.attr('x', function(d,i){
				return scale[a.classname].x(s);
			})
			.attr('width', width/5)
			.attr('data-width', width)
			.attr('data-id', s)
			.attr('data-percent', 0)
			.attr('y', padding.bar.y)
			.attr('height', rowHeight-(padding.bar.y*2))
			.style('fill', colorPrimary[s])
			.on('click', function(d,i){
				var val = parseInt(d3.select(this).attr('data-id'));
				if(filters.toggle=='finalScore'){
					filter('finalScore',val);
				} else {
					filter('reliability',val);
				}
			})
		}

		var dataLabel = rows.append('text')
		.text(999)
		.attr('id', function(d,i){
			return a.classname+d.id+'label';
		})
		.attr('class', a.classname+'-label')
		.attr('y', rowHeight/2)
		.style('alignment-baseline', 'middle')
		.style('text-anchor', 'middle')
		.attr('x', labelWidth -20 )
		.style('fill', colorPrimary[4])
		.style('font-weight', 'bold')
		.style('font-size', '16px');

		d3.select('#'+a.classname+'RemoveFilter').on('click', function(){ filter(a.filter, 'clear'); });

	}

	//**************************
	// create type of approach chart
	//**************************
	// this.createTypeOfApproachChart = function(options){

	// 	var typeOfApproachChart = this.createBarChart({
	// 		title: 'ASSESSMENTS BY AFFECTED GROUPS',
	// 		rows: metadata.affected_groups_array,
	// 		classname: 'affected_groups',
	// 		width: 500,
	// 		height: 500,
	// 		filter: 'type',
	// 		div: 'affected-groups-svg'
	// 	});
	// 	d3.select('#affected_groupsRemoveFilter').on('click', function(){ filter('type', 'clear'); });
	// }

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
	var filter = function(filterClass, value){

		if(filterClass=='clear'){
			filters.sector = [];
			filters.finalScore = [];
			filters.context = [];
			filters.affected_groups = [];
			filters.organisation = [];
			filters.sampling_approach = [];
			filters.geo = [];
			filters.language = [];
			filters.additional_documentation = [];
			filters.methodology_content = [];
			filters.unit_of_reporting = [];
			filters.unit_of_analysis = [];
			filters.data_collection_technique = [];
			filters.assessment_type = [];
			filters.focus = [];
		}

		d3.select('#frameworkRemoveFilter').style('display', 'none').style('cursor', 'default');
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
		} else if(value == 'clearFramework'){
			filters['sector'] = [];
			filters['context'] = [];
		} else {
		  addOrRemove(filters[filterClass], value);		
		}

		if((filters['finalScore'].length>0)||(filters['context'].length>0)||(filters['reliability'].length>0)||(filters['sector'].length>0)||(filters['geo'].length>0)||(filters['specific_needs'].length>0)||(filters['affected_groups'].length>0)){
			d3.select('#globalRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		} else { 
			d3.select('#globalRemoveFilter').style('display', 'none').style('cursor', 'default');
		}
		// reset data using original loaded data
		data = originalData;
		dataEntries = originalDataEntries;

		d3.select('#finalScoreRemoveFilter').style('display', 'none').style('cursor', 'default');
		d3.select('#geoRemoveFilter').style('display', 'none').style('cursor', 'default');

		// apply filters to data array
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
				return d['organisation_and_stakeholder_type'].some(r=> filters['organisation'].indexOf(r[1]) >= 0);
			});
			d3.select('#organisationRemoveFilter').style('display', 'inline').style('cursor', 'pointer');
		}

		updateTimeline(filterClass);
		d3.select('#globalRemoveFilter').on('click', function(){ filter('clear', 'clear'); });
	}

	//**************************
	// redraw timeline
	//**************************
	var redrawTimeline = function(){

		d3.select('#avg-line').transition().duration(200).style('opacity', 0)
		d3.select('#chartarea').transition().duration(200).style('opacity', 0)
		.on("end", function(){
			d3.select('#timeline .vizlibResponsiveDiv').remove();
			d3.select('#timechart-legend .vizlibResponsiveDiv').remove();		

			// create svg
			var timelineSvg = Deepviz.createSvg({
				id: 'timeline_viz',
				viewBoxWidth: timechartViewBoxWidth,
				viewBoxHeight: timechartViewBoxHeight,
				div: '#timeline'
			});

			var timeChart = Deepviz.timeChart({
				appendTo: timelineSvg,
				id: 'timeChart',
				opacity: 1,
				gutter: 0.5,
				width: 1300,
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

			updateBubbles();
			updateTotals();
			updateRadarCharts();
			updateBars('affected_groups', dataByAffectedGroups);
			updateBars('assessment_type', dataByAssessmentType);
			updateBars('data_collection_technique', dataByDataCollectionTechnique);
			updateBars('sampling_approach', dataBySamplingApproach);
			updateBars('methodology_content', dataByMethodologyContent);
			updateBars('additional_documentation', dataByAdditionalDocumentation);
			updateBars('unit_of_reporting', dataByUnitOfReporting);
			updateBars('unit_of_analysis', dataByUnitOfAnalysis);
			updateBars('language', dataByLanguage);
			updateStackedBars('sector', dataBySector);
			updateBars('focus', dataByFocusArray);
			updateStackedBars('organisation', dataByOrganisation)
		});
	}

	//**************************
	// get the data
	//**************************
	var updateTimeline = function(target = null){

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
					if(dD.key<dateRange[0]){
						return colorLightgrey[i];
					} else {
						if(filters.toggle=='finalScore'){
							return colorPrimary[i];
						} else {
							return colorSecondary[i];
						}
					}
				})
				.transition().duration(duration)
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
		updateFinalScore(target, duration);
		updateEntriesChart();
		updateBubbles();
		colorBars();
	}

	//**************************
	// update map bubbles
	//**************************
	function updateBubbles(){

		d3.selectAll('.map-bubble')
		.style('opacity', 0);

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

		var bubbles = d3.selectAll('.map-bubble')
		.attr('transform', function(d,i){
			var size = scale.map(dataByLocationSum[i]);
			return 'scale('+size+')';
		});

		bubbles.select('.map-bubble-value')
		.text(function(d,i){
			return dataByLocationSum[i];
		});

		bubbles.selectAll('.innerCircle').style('fill', colorNeutral[2]);

		// color bubbles accoring to finalScore/reliability
		var locationByfinalScoreReliability = dataByLocationArray.filter(function(d){
			if(filters.toggle=='finalScore'){
				return ((new Date(d.date)>=dateRange[0])&&(new Date(d.date)<dateRange[1])&&(d.s>0));
			} else {
				return ((new Date(d.date)>=dateRange[0])&&(new Date(d.date)<dateRange[1])&&(d.r>0));
			}
		});

		var sev = d3.nest()
		.key(function(d) {  return d.geo;})
		.rollup(function(v) { return Math.round(d3.median(v, function(d) { 
			if(filters.toggle=='finalScore'){
				return d.s; 
			} else {
				return d.r;
			}
		}))})
		.entries(locationByfinalScoreReliability);

		sev.forEach(function(d,i){
			if(filters.toggle=='finalScore'){
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

		var map = document.getElementById("map");
		map.setAttribute("style","height:"+(map.offsetWidth*mapAspectRatio)+"px");
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

	function updateTotals(){

		var dc = data.filter(function(d){return ((d.date>=dateRange[0])&&(d.date<dateRange[1])) ;});
		var context = [];

		dc.forEach(function(d,i){
			d.focus.forEach(function(dd,ii){
				context.push(dd);
			});
			d.sector_count = d.sector.length;
		});

		var individuals = d3.sum(dc, d => d.individuals);
		var households = d3.sum(dc, d => d.households);

		// define maximum context value
		var contextualRowTotals = d3.nest()
		.key(function(d) { return d;})
		.rollup(function(leaves) { return leaves.length; })
		.entries(context);

		d3.selectAll('.total-label').text(0);
		
		contextualRowTotals.forEach(function(d,i){
			d3.select('#total-label'+(d.key-1)).text(d.value);
		})

		total = dc.length;

		var mutli_sector_5 = d3.sum(dc, function(d){
			if(d.sector_count>=5)
				return 1;
		});

		var mutli_sector_2 = d3.sum(dc, function(d){
			if(d.sector_count>=2)
				return 1;
		});

		var single_sector = d3.sum(dc, function(d){
			if(d.sector_count==1)
				return 1;
		});

		// coordinated totals
		var coordinated_5 = d3.sum(dc, function(d){
			if((d.sector_count>=5)&&((d.coordination==coordinatedJointId)||(d.coordination==coordinatedHarmonizedId)))
				return 1;
		});

		var coordinated_2 = d3.sum(dc, function(d){
			if((d.sector_count>=2)&&((d.coordination==coordinatedJointId)||(d.coordination==coordinatedHarmonizedId)))
				return 1;
		});

		var coordinated_1 = d3.sum(dc, function(d){
			if((d.sector_count==1)&&((d.coordination==coordinatedJointId)||(d.coordination==coordinatedHarmonizedId)))
				return 1;
		});

		// harmonized total
		var harmonized = d3.sum(dc, function(d){
			if(d.coordination==coordinatedHarmonizedId)
				return 1;
		});

		// uncoordianted total
		var uncoordinated = d3.sum(dc, function(d){
			if(d.coordination==uncoordinatedId)
				return 1;
		});

		// sector monitoring totals
		var sector_monitoring_5 = d3.sum(dc, function(d){
			if((d.sector_count>=5)&&(d.assessment_type==monitoringId))
				return 1;
		});

		var sector_monitoring_2 = d3.sum(dc, function(d){
			if((d.sector_count>=2)&&(d.assessment_type==monitoringId))
				return 1;
		});

		var sector_monitoring_1 = d3.sum(dc, function(d){
			if((d.sector_count==1)&&(d.assessment_type==monitoringId))
				return 1;
		});


		d3.select('#total_assessments tspan').text(addCommas(total));
		d3.select('#coordinated_5_sector tspan').text(addCommas(coordinated_5));
		d3.select('#coordinated_2_sector tspan').text(addCommas(coordinated_2));
		d3.select('#coordinated_1_sector tspan').text(addCommas(coordinated_1));
		d3.select('#harmonized tspan').text(addCommas(harmonized));
		d3.select('#uncoordinated tspan').text(addCommas(uncoordinated));
		
		d3.select('#total_stakeholders tspan').text(0);
		d3.select('#lngos tspan').text(0);
		d3.select('#ingos tspan').text(0);
		d3.select('#un_agencies tspan').text(0);
		d3.select('#clusters tspan').text(0);
		d3.select('#donors tspan').text(0);
		d3.select('#rcrc tspan').text(0);
		d3.select('#government tspan').text(0);

		d3.select('#mutli_sector_5 tspan').text(addCommas(mutli_sector_5));
		d3.select('#multi_sector_2 tspan').text(addCommas(mutli_sector_2));
		d3.select('#single_sector tspan').text(addCommas(single_sector));
		d3.select('#sector_monitoring_5 tspan').text(addCommas(sector_monitoring_5));
		d3.select('#sector_monitoring_2 tspan').text(addCommas(sector_monitoring_2));
		d3.select('#sector_monitoring_1 tspan').text(addCommas(sector_monitoring_1));
		d3.select('#total_initial tspan').text(0);
		d3.select('#total_rapid tspan').text(0);
		d3.select('#total_indepth tspan').text(0);

		d3.select('#individuals tspan').text(addCommas(individuals));
		d3.select('#households tspan').text(addCommas(households));
		d3.select('#key_informants tspan').text(0);
		d3.select('#focus_group_discussions tspan').text(0);
		d3.select('#community_group_discussions tspan').text(0);

		// assessment types row
		var assessmentTypes = dataByAssessmentType.filter(function(d){return ((d.date>=dateRange[0])&&(d.date<dateRange[1])) ;});
		assessmentTypes = d3.nest()
		.key(function(d){ return d.assessment_type; })
		.rollup(function(leaves){ 
			return leaves.length;
		})
		.entries(assessmentTypes);

		var atype_keys = {};
		metadata.assessment_type.forEach(function(md){
			if(md.name=='Initial') atype_keys.initial = md.id;
			if(md.name=='Rapid') atype_keys.rapid = md.id;
			if(md.name=='In-depth') atype_keys.indepth = md.id;
		});

		assessmentTypes.forEach(function(d,i){
			d.key = parseInt(d.key);

			// initial assessments
			if(d.key==atype_keys.initial){
				d3.select('#total_initial tspan').text(addCommas(d.value));
			} 

			// rapid assessments
			if(d.key==atype_keys.rapid){
				d3.select('#total_rapid tspan').text(addCommas(d.value));
			} 

			// in-depth assessments
			if(d.key==atype_keys.indepth){
				d3.select('#total_indepth tspan').text(addCommas(d.value));
			} 
		});

		// stakeholder row
		var organisations = dataByOrganisation.filter(function(d){return ((d.date>=dateRange[0])&&(d.date<dateRange[1])) ;});
		var uniqueOrganisations = [];
		var stakeholderTypes = [];

		organisations.forEach(function(d,i){
			if(!uniqueOrganisations.includes(d.organisation)){
				uniqueOrganisations.push(d.organisation);
				if(d.stakeholder_type!=null) stakeholderTypes.push(d.stakeholder_type);
			}
		});

		d3.select('#total_stakeholders tspan').text(addCommas(uniqueOrganisations.length));

		stakeholderTypes = d3.nest()
		.key(function(d){ return d })
		.rollup(function(leaves){ 
			return leaves.length;
		})
		.entries(stakeholderTypes);

		stakeholderTypes.forEach(function(d,i){
			d.key = parseInt(d.key);

			if(d.key==stakeholder_type_keys.donor){
				d3.select('#donors tspan').text(addCommas(d.value));
			} 

			if(d.key==stakeholder_type_keys.ingo){
				d3.select('#ingos tspan').text(addCommas(d.value));
			} 

			if(d.key==stakeholder_type_keys.ngo){
				d3.select('#lngos tspan').text(addCommas(d.value));
			} 

			if(d.key==stakeholder_type_keys.government){
				d3.select('#government tspan').text(addCommas(d.value));
			} 

			if(d.key==stakeholder_type_keys.unagency){
				d3.select('#un_agencies tspan').text(addCommas(d.value));
			} 

			if(d.key==stakeholder_type_keys.rcrc){
				d3.select('#rcrc tspan').text(addCommas(d.value));
			} 

			if(d.key==stakeholder_type_keys.cluster){
				d3.select('#clusters tspan').text(addCommas(d.value));
			} 
		});

		// data collection technique row
		var dataCollectionTechniques = dataByDataCollectionTechnique.filter(function(d){return ((d.date>=dateRange[0])&&(d.date<dateRange[1])) ;});
		dataCollectionTechniques = d3.nest()
		.key(function(d){ return d.data_collection_technique; })
		.rollup(function(leaves){ 
			return leaves.length;
		})
		.entries(dataCollectionTechniques);

		var data_collection_keys = {};
		metadata.data_collection_technique.forEach(function(row){
			if(row.name=='Key Informant Interview') data_collection_keys.key_informant = row.id;
			if(row.name=='Focus Group Discussion') data_collection_keys.focus_group_discussion = row.id;
			if(row.name=='Community Group Discussion') data_collection_keys.community_group_discussion = row.id;
		});

		dataCollectionTechniques.forEach(function(d,i){
			d.key = parseInt(d.key);
			if(d.key==data_collection_keys.key_informant){
				d3.select('#key_informants tspan').text(addCommas(d.value));
			} 

			if(d.key==data_collection_keys.focus_group_discussion){
				d3.select('#focus_group_discussions tspan').text(addCommas(d.value));
			} 

			if(d.key==data_collection_keys.community_group_discussion){
				d3.select('#community_group_discussions tspan').text(addCommas(d.value));
			} 
		});


	}

	//**************************
	// update entries chart
	//**************************
	var updateEntriesChart = function(){
		setTimeout(function(){

			entriesMax = d3.max(dataEntriesByDate, function(d,i){
				return d.value;
			});

			scale.entrieschart.y = d3.scaleLinear()
			.range([entriesChartHeight , 0])
			.domain([0, entriesMax]);

		    entriesAxis = d3.axisLeft()
		    .scale(scale.entrieschart.y)
		    .ticks(2)
		    .tickSize(0)
		    .tickPadding(8);

			var entriesAxisText = d3.select(".yEntriesAxis")
			.transition()
			.duration(duration)
			.call(entriesAxis);

			var entriesChartyGrid = d3.axisLeft(scale.entrieschart.y)
			.ticks(2)
			.tickSize(-width+52)
			.tickFormat("")

			d3.select('#entriesChartYGrid')
			.transition()
			.duration(duration)
			.call(entriesChartyGrid);

		d3.select("#timechartyAxis")
		.transition()
		.call(timechartyAxis);

			var entriesBars = d3.selectAll('.entriesBar')
			.transition()
			.duration(duration)
			.attr('height', function(d,i){
				return 0;
			})
			.attr('y', function(d,i){
				return  entriesChartHeight;
			});

			dataEntriesByDate.forEach(function(d,i){
				var dt = new Date(d.key);
				dt.setHours(0,0,0,0);
				d3.select('#entriesDate'+dt.getTime())
				.transition()
				.duration(duration)
				.attr('height', function(dd,ii){
					return entriesChartHeight - scale.entrieschart.y(d.value);
				})
				.attr('y', function(dd,ii){
					return  scale.entrieschart.y(d.value);
				});	
			});
		}, 20);


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
		var final_score_total_not_null = 0;
		var finalScore = [0,0,0,0,0];
		var finalScoreRolling = [0,0,0,0,0];
		var finalScoreCount = 0;
		var timedata = data;

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

		var finalScoreData = timedata;
		if(filters['finalScore'].length>0){
			finalScoreData = timedata.filter(function(d){return  filters['finalScore'].includes(d['finalScore']);});
		}

		var dateByFinalScore = d3.nest()
		.key(function(d) { return d.date;})
		.key(function(d) { return d.finalScore; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(finalScoreData);

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
				}
				final_score_total += d.total_assessments;
			}
			delete d.values;
		});

		if(final_score_total>0){

			for (i = 0; i < finalScore.length; i++) { 
				finalScoreCount += finalScore[i];
				finalScoreRolling[i] = finalScoreCount;
			}

			if((target=='init')||(target=='context')||(target=='geo')||(target=='specific_needs')||(target=='affected_groups')||(target=='brush')||(target=='sector')||(target=='clear')||(target=='map')||((target=='finalScore')&&(filters.finalScore.length == 0))){
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
					d3.select('.s'+(i+1)+'-text')
					.style('opacity', function(){
						if(w<=20){ return  0 } else { return 1};
					});

					if(duration>0){
						d3.select('.s'+(i+1)+'-text')
						.transition()
						.duration(duration)
						.attr('transform', function(d,i){
							return 'translate('+(v+(w/2))+',32)';
						});
					} else {
						d3.select('.s'+(i+1)+'-text')
						.attr('transform', function(d,i){
							return 'translate('+(v+(w/2))+',32)';
						});
					}
					d3.select('.s'+(i+1)+'-percent')
					.text(function(){
						var v = (finalScore[i]/final_score_total)*100;
						return Math.round(v)+'%';
					});
					d3.select('.s'+(i+1)+'-value')
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
			var s = 0;
			var final_score_median = 0;
			finalScore.every(function(d,i){
				s += finalScore[i];
				if (s > final_score_total / 2){
					final_score_median = i;
					return false;	
				} else { 
					return true;
				}
			});

			var finalScoreAverage = ( (1*finalScore[5]) + (2*finalScore[1]) + (3*finalScore[2]) + (4*finalScore[3]) + (5*finalScore[4]) ) / final_score_total;
			d3.select('#finalScore_value').text(metadata.scorepillar_scale[(Math.round(finalScoreAverage))] + ' ('+ finalScoreAverage.toFixed(1) +')' )
			d3.select('#finalScore_value').text(metadata.scorepillar_scale[final_score_median].name ).style('color', colorPrimary[final_score_median]);
			d3.select('#finalScoreAvg').attr('x',function(d){
				return scale.finalScore.x(final_score_median);
			});

			d3.select('#finalScoreSvg').style('visibility', 'visible');

		} else {
			d3.select('#finalScoreSvg').style('visibility', 'hidden');
			d3.select('#finalScore_value').text('');
			d3.selectAll('.finalScoreBar').attr('fill', '#CDCDCD');
		}
	}

	//**************************
	// update stacked bars
	//**************************
	var updateStackedBars = function(group, dataset, duration = 0){

		var sort = true;

		var data_group = group;
		if(data_group=='organisation') data_group = 'organization';
		if(data_group=='sector') data_group = 'sector_array';

		// affected groups
		var dat = dataset.filter(function(d){
			return (((d.date)>=dateRange[0])&&((d.date)<dateRange[1]));
		});

		var nest = d3.nest()
		.key(function(d) { return d[group]; })
		.key(function(d) { return d.s }).sortKeys(d3.ascending)
		.rollup(function(leaves) { return leaves.length; })		
		.entries(dat);	

		nest.forEach(function(d,i){
			d.value = d3.sum(d.values, function(d){
				return d.value;
			})
		});

		if(sort==true){
			nest = nest.sort(function(x,y){
				return d3.ascending(y.value, x.value);
			});
		}

		if(group=='organisation'){
			nest = nest.splice(0,10);
		}

		var d = [];
		metadata[data_group].forEach(function(mt,ii){
			var name = mt.name.substr(0,labelCharLimit-7);
			if(name.length==labelCharLimit-7) name += '.';
			var key = mt.id;
			var value = 0;
			var values = [];
			nest.forEach(function(dd,ii){
				if(mt.id==dd.key){
					value = dd.value;
					values = dd.values;
				}
			});
			d.push({'key': key, 'value': value, 'values': values, 'name': name});
		});

		if(sort==true){
			d = d.sort(function(x,y){
				return d3.ascending(y.value, x.value);
			});
		}

		if(group=='organisation'){
			d = d.splice(0,10);
		}

		var rowMax = d3.max(d, function(d,i){
			return d.value
		});

		scale[group].x.domain([0, rowMax]);// finalScore/reliability x xcale

	    // reset all bars to zero width
	    d3.selectAll('.'+group+'-bar').attr('width', 0);

		var rows = d3.selectAll('.'+group+'-row')
		.data(d)
		.attr('class', function(d,i){
			return 'bar-row '+group+'-row '+group+'-bar-row'+d.key;
		});

		var labels =d3.selectAll('text.'+group)
		.data(d)
		.text(function(d,ii){
			return d.name;
		})
		.attr('class', function(d,i){
			return group + ' ' +group +'-'+d.key;``
		})
		.style('opacity', 1);

		d3.selectAll('.'+group+'-bg')
		.data(d)
		.attr('class', function(d,i) { 
			return group+'-bg ' + group + '-bg-'+d.key;
		}).on('click', function(d,i){
			return filter (group, d.key);
		});


		d.forEach(function(d,i){
			var key = d.key;
			var wcount = scale[group].paddingLeft;
			var xcount = scale[group].paddingLeft;
			var value = d.value; 
			var name = d.name;

			d3.select('#'+group+(i+1)+'label').text(function(d,i){
				if(value>0){ return value; } else { return ''};
			});

			if(group=='sector'){
				d3.select('.'+group+'-icon-'+(i+1))
				.attr('href', function(d,i){
					return 'images/sector-icons/'+name.toLowerCase()+'.svg'
				})
				.style('opacity', function(d,i){
					if(filters['sector'].includes(key)){
						return 1;
					} else {
						return 0.2;
					}
				})				
			}

			d.values.forEach(function(dd,ii){
				var s = dd.key;
				var id = group+(i+1)+'s'+(s);
				var w = scale[group].x(dd.value)-wcount;
				d3.select('#'+id )
				.attr('x', xcount)
				.attr('width', w)
				.attr('data-value', dd.value)
				.style('fill', function(){
					if(filters.toggle == 'finalScore'){
						return colorPrimary[s];
					} else {
						return colorSecondary[s];
					}
				});
				var rect = document.querySelector('#'+id)
				tippy(rect, { 
					content: setBarName(s),
					theme: 'light-border',
					delay: [250,100],
					inertia: false,
					distance: 8,
					allowHTML: true,
					animation: 'shift-away',
					arrow: true,
					size: 'small',
					onShow(instance) {
				        // instance.popper.hidden = instance.reference.dataset.tippy ? false : true;
				        var v = d3.select('#'+id).attr('data-value');
				        if(s>=0)
				        	instance.setContent(setBarName(s, v));
				    }
				});
				xcount = xcount + w;
			});
		});

		if(filters[group].length>0){
			d3.selectAll('.'+group).style('opacity', 0.2);
			d3.selectAll('.'+group+'-bg').style('opacity', 0);
		}
		filters[group].forEach(function(d,i){
			d3.selectAll('.'+group+'-'+(d)).style('opacity', 1);
		});

	}

	var setBarName = function(s,v){
			var color = colorPrimary[s];
			var text = metadata.scorepillar_scale[s].name;
		return '<div style="width: 100px; height: 10px; display: inline; background-color: '+ color + '">&nbsp;&nbsp;</div>&nbsp;&nbsp; ' + text + ' <div style="padding-left: 3px; padding-bottom: 2px; display: inline; font-weight: bold; color: '+ colorNeutral[4] + '; font-size: 9px">' + v + ' entries</div>';
	}


	//**************************
	// update bar charts
	//**************************
	var updateBars = function(group, dataset, duration = 0){

		var sort = true;

		// affected groups
		var dat = dataset.filter(function(d){
			return (((d.date)>=dateRange[0])&&((d.date)<dateRange[1]));
		});

		var nest = d3.nest()
		.key(function(d) {  return d[group]; })
		.rollup(function(leaves) { return leaves.length; })		
		.entries(dat);	

		var labels = d3.nest().key(function(d) {
			return d[group];
		}).sortKeys(d3.ascending)
		.rollup(function(leaves) {
			return d3.sum(leaves, function(d) {
				return 1;
			});
		}).entries(dat);

		var data_group = group;
		if(data_group=='focus') data_group = 'focus_array';
		if(data_group=='affected_groups') data_group = 'affected_groups_array';
		if(data_group=='additional_documentation') data_group = 'additional_documentation_array';
		if(data_group=='unit_of_reporting') data_group = 'type_of_unit_of_analysis';
		if(data_group=='unit_of_analysis') data_group = 'type_of_unit_of_analysis';
		if(data_group=='organisation') data_group = 'organization';

		var d = [];
		metadata[data_group].forEach(function(mt,ii){
			var name = mt.name;
			var key = mt.id;
			var value = 0;
			nest.forEach(function(dd,ii){
				if(mt.id==dd.key){
					value = dd.value;
				}
			});
			d.push({'key': key, 'value': value, 'name': name});
		});

		if(sort==true){
			d = d.sort(function(x,y){
				return d3.ascending(y.value, x.value);
			});
		}

		if(group=='organisation'){
			d = d.splice(0,10);
		}

		var rowMax = d3.max(labels, function(d,i){
			return d.value
		});

		scale[group].x.domain([0, rowMax]);// finalScore/reliability x xcale

	    // reset all bars to zero width
	    d3.selectAll('.'+group+'-bar').attr('width', 0);

		var rows = d3.selectAll('.'+group+'-row')
		.data(d)
		.attr('class', function(d,i){
			return 'bar-row '+group+'-row '+group+'-bar-row'+d.key;
		});

		var labels =d3.selectAll('text.'+group)
		.data(d)
		.text(function(d,ii){
			return d.name;
		})
		.attr('class', function(d,i){
			return group + ' ' +group +'-'+d.key;``
		})

		rows.select('.'+group+'-bg')
		.attr('class', function(d,i) { 
			return group+'-bg ' + group + '-bg-'+d.key;
		}).on('click', function(d,i){
			return filter (group, d.key);
		});

		rows.select('.'+group+'-bar')
		.attr('width', function(d,i){
			if(d.value>0){
				return scale[group].x(d.value)-scale[group].paddingLeft;
			} else {
				return 0;
			}
		})
		.attr('x', function(d,i){
			return scale[group].paddingLeft;
		})
		.style('fill', colorPrimary[3])
		.attr('data-value', function(d,i){
			return d.value;
		});

		rows.select('.'+group+'-label').text(function(d,i){
			if(d.value>0){ return d.value; } else { return ''}
		});

		if(filters[group].length>0){
			d3.selectAll('.'+group).style('opacity', 0.2);
			d3.selectAll('.'+group+'-bg').style('opacity', 0);
		}
		filters[group].forEach(function(d,i){
			d3.selectAll('.'+group+'-'+(d)).style('opacity', 1);
		});

		// labels.forEach(function(dd,ii){

		// 	d3.select('#'+group+dd.key+'label').text(dd.value).style('opacity', 1)
		// 	.style('fill', function(){
		// 		if(filters.toggle == 'finalScore'){
		// 			return colorNeutral[4];
		// 		} else {
		// 			return colorNeutral[4];
		// 		}
		// 	});
		// 	var row = dd.key;
		// });

		// d.forEach(function(d,i){
		// 	var key = d.key;
		// 	var wcount = scale[group].paddingLeft;
		// 	var xcount = scale[group].paddingLeft;
		// 		var s = d.key;
		// 		var id = group+(key)+'s0';
		// 		var w = scale[group].x(d.value)-wcount;
		// 		d3.select('#'+id )
		// 		.attr('x', xcount)
		// 		.attr('width', w)
		// 		.attr('data-value', d.value)
		// 		.style('fill', function(){
		// 			if(filters.toggle == 'finalScore'){
		// 				return colorPrimary[3];
		// 			} else {
		// 				return colorSecondary[s];
		// 			}
		// 		});
		// 		var rect = document.querySelector('#'+id)
		// 		tippy(rect, { 
		// 			content: '1',
		// 			theme: 'light-border',
		// 			delay: [250,100],
		// 			inertia: false,
		// 			distance: 8,
		// 			allowHTML: true,
		// 			animation: 'shift-away',
		// 			arrow: true,
		// 			size: 'small',
		// 			onShow(instance) {
		// 		        var v = d3.select('#'+id).attr('data-value');
		// 				return '<div style="width: 100px; height: 10px; display: inline; background-color: '+ colorPrimary[2] + '">&nbsp;&nbsp;</div>&nbsp;&nbsp;<div style="padding-left: 3px; padding-bottom: 2px; display: inline; font-weight: bold; color: '+ colorNeutral[4] + '; font-size: 9px">' + v + ' entries</div>';
		// 			}
		// 		});
		// });
	}

	//**************************
	// toggle between finalScore and reliability
	//**************************
	var toggle = function(d){
		d3.select('#framework-toggle').style('fill', colorNeutral[3]);
		if(d != 'finalScore'){
			// switch to Reliability
			d3.select('#reliabilityToggle').style('opacity', 1);
			d3.select('#finalScoreToggle').style('opacity', 0);
			filters.toggle = 'reliability';
			d3.select('#total_assessments').style('color',colorNeutral[3]);
			d3.select('#timechartTitle').text('ENTRIES BY DATE AND BY RELIABILITY');
			d3.selectAll('.eventDrop').style('fill', colorNeutral[3]);
			d3.select('#rightAxisLabel').text('Avg. Reliability');
			d3.select('#rightAxisLabelLine').style('stroke', colorSecondary[3]);
			d3.select('#leftAxisBox').style('fill', colorNeutral[3]);
			d3.select('.selection').style('fill', colorNeutral[3]);
			// d3.selectAll('.outerCircle').style('stroke', colorNeutral[3]);
			// d3.selectAll('.innerCircle').style('fill', colorNeutral[3]);
			if(filters.frameworkToggle == 'average'){
				d3.select('#framework-toggle').style('fill', colorSecondary[3])
			}
			// update colors of contextual row total values
			d3.selectAll('.total-label').style('fill', colorNeutral[4]);
			d3.select('#dateRange').style('color', colorNeutral[4]);
			d3.select('#avg-line').style('stroke', colorSecondary[3]);
			d3.select('#framework-toggle-text').text('median reliability');
		} else {
			// switch to finalScore
			d3.select('#reliabilityToggle').style('opacity', 0);
			d3.select('#finalScoreToggle').style('opacity', 1);	
			filters.toggle = 'finalScore';
			d3.select('#total_assessments').style('color',colorNeutral[3]);
			if(filters.frameworkToggle == 'average'){
				d3.select('#framework-toggle').style('fill', colorPrimary[3]);
			}
			d3.select('#timechartTitle').text('ENTRIES BY DATE AND BY finalScore');
			d3.selectAll('.eventDrop').style('fill', colorNeutral[3]);
			d3.select('#rightAxisLabel').text('Avg. finalScore');
			d3.select('#rightAxisLabelLine').style('stroke', colorPrimary[3]);
			d3.select('#leftAxisBox').style('fill', colorNeutral[3]);
			d3.select('.selection').style('fill', colorNeutral[3]);
			// d3.selectAll('.outerCircle').style('stroke', colorNeutral[3]);
			// d3.selectAll('.innerCircle').style('fill', colorNeutral[3]);
			// update colors of contextual row total values
			d3.selectAll('.total-label').style('fill', colorNeutral[4]);
			d3.select('#dateRange').style('color', colorNeutral[4]);
			d3.select('#avg-line').style('stroke', colorPrimary[3]);
			d3.select('#framework-toggle-text').text('median finalScore');
		}
		updateTimeline();
	}

	function colorBars(){
		d3.selectAll('.barGroup').each(function(d,i){
			var idate = parseInt(d3.select(this).attr('id').slice(4));
			if(((new Date(idate)) >= (dateRange[0]))&&((new Date(idate))< (dateRange[1]))){
				d3.select(this).selectAll('.bar').style('fill', function(d,i){
					return colorPrimary[i];
				}).style('fill-opacity', 1);

				d3.select(this).selectAll('.eventDrop').style('fill', function(d,i){
					return colorNeutral[3];
				});
			} else {
				d3.select(this).selectAll('.bar').style('fill', function(d,i){
					return colorLightgrey[i];
				}).style('fill-opacity', 1);
				d3.select(this).selectAll('.eventDrop').style('fill', function(d,i){
					return colorLightgrey[1];
				});
			}
		});

		d3.selectAll('.entriesBar')
		.style('fill', function(d,i){
			var edate = parseInt(d3.select(this).attr('id').slice(11));
			if(((new Date(edate)) >= (dateRange[0]))&&((new Date(edate))< (dateRange[1]))){
				return colorSecondary[4];
			} else {
				return colorLightgrey[3];
			}
		});

	}

	//**************************
	// resizing
	//**************************
	var scrollable = false;
	window.onresize = function(){
		setTimeout(resizeDevice, 50);
	}
	var resizeDevice = function() {
		// set map height
		var map = document.getElementById("map");
		map.setAttribute("style","height:"+(map.offsetWidth*mapAspectRatio)+"px");
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

	function rightAlignTotals(){

		d3.select('#coordinated_5_sector tspan').attr('text-anchor', 'end');
		d3.select('#coordinated_2_sector tspan').attr('text-anchor', 'end');
		d3.select('#coordinated_1_sector tspan').attr('text-anchor', 'end');
		d3.select('#harmonized tspan').attr('text-anchor', 'end');
		d3.select('#uncoordinated tspan').attr('text-anchor', 'end');
		
		d3.select('#lngos tspan').attr('text-anchor', 'end');
		d3.select('#ingos tspan').attr('text-anchor', 'end');
		d3.select('#un_agencies tspan').attr('text-anchor', 'end');
		d3.select('#clusters tspan').attr('text-anchor', 'end');
		d3.select('#donors tspan').attr('text-anchor', 'end');
		d3.select('#rcrc tspan').attr('text-anchor', 'end');
		d3.select('#government tspan').attr('text-anchor', 'end');

		d3.select('#mutli_sector_5 tspan').attr('text-anchor', 'end');
		d3.select('#multi_sector_2 tspan').attr('text-anchor', 'end');
		d3.select('#single_sector tspan').attr('text-anchor', 'end');
		d3.select('#sector_monitoring_5 tspan').attr('text-anchor', 'end');
		d3.select('#sector_monitoring_2 tspan').attr('text-anchor', 'end');
		d3.select('#sector_monitoring_1 tspan').attr('text-anchor', 'end');
		d3.select('#total_initial tspan').attr('text-anchor', 'end');
		d3.select('#total_rapid tspan').attr('text-anchor', 'end');
		d3.select('#total_indepth tspan').attr('text-anchor', 'end');

		d3.select('#individuals').attr('text-anchor', 'end');
		d3.select('#households').attr('text-anchor', 'end');
		d3.select('#key_informants').attr('text-anchor', 'end');
		d3.select('#focus_group_discussions').attr('text-anchor', 'end');
		d3.select('#community_group_discussions').attr('text-anchor', 'end');

		d3.select('#totals_right_align').attr('transform', 'translate(150,19)');


	}

}
