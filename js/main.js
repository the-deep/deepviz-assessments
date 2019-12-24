const urlQueryParams = new URLSearchParams(window.location.search);
var sources = [urlQueryParams.get('assessmentsDataUrl'), urlQueryParams.get('entriesDataUrl'), 'images/summary_1.svg', 'images/summary_2.svg', 'images/summary_3.svg', 'images/quality.svg'];

var Deepviz = new Deepviz(sources, function(data){

	//**************************
	// summary section
	//**************************
	var summary = Deepviz.createSummary();

	//**************************
	// sector chart
	//**************************
	var sectorChart = BarChart.createStackedBarChart({
		title: 'ASSESSMENTS BY SECTOR AND ANALYITICAL SCORE',
		rows: 'sector_array',
		width: 500,
		height: 500,
		filter: 'sector',
		classname: 'sector',
		div: 'sector-svg'
	});

	//**************************
	// focus chart
	//**************************
	var focusChart = BarChart.createBarChart({
		title: 'ASSESSMENTS BY FOCUS',
		rows: 'focus_array',
		width: 500,
		height: 500,
		filter: 'focus',
		classname: 'focus',
		div: 'focus-svg'
	});

	// **************************
	// affected groups chart
	// **************************
	var affectedGroupsChart = BarChart.createStackedBarChart({
		title: 'ASSESSMENTS BY AFFECTED GROUPS',
		rows: 'affected_groups_array',
		classname: 'affected_groups',
		width: 500,
		height: 500,
		filter: 'affected_groups',
		div: 'affected-groups-svg'
	});

	//**************************
	// top stakeholders chart
	//**************************
	var topStakeholdersChart = BarChart.createStackedBarChart({
		title: 'TOP 10 STAKEHOLDERS',
		rows: 'organization',
		classname: 'organisation',
		width: 500,
		height: 500,
		filter: 'organisation',
		div: 'top-stakeholders-svg',
		limit: 10
	});

	//**************************
	// finalScore chart
	//**************************
	var finalScoreChart = Deepviz.createFinalScoreChart();

	//**************************
	// severity chart
	//**************************
	var severityChart = Deepviz.createSeverityChart();


	//**************************
	// assessment type chart
	//**************************
	var typeOfApproachChart = BarChart.createStackedBarChart({
		title: 'TYPE OF APPROACH',
		rows: 'assessment_type',
		classname: 'assessment_type',
		width: 500,
		height: 420,
		filter: 'assessment_type',
		div: 'assessment-type-svg'
	});

	//**************************
	// data collection technique chart
	//**************************
	var dataCollectionTechniqueChart = BarChart.createStackedBarChart({
		title: 'DATA COLLECTION TECHNIQUE',
		rows: 'data_collection_technique',
		classname: 'data_collection_technique',
		width: 500,
		height: 420,
		filter: 'data_collection_technique',
		div: 'data-collection-technique-svg'
	});

	//**************************
	// unit of analysis chart
	//**************************
	var unitOfAnalysisChart = BarChart.createStackedBarChart({
		title: 'UNIT OF ANALYSIS',
		rows: 'type_of_unit_of_analysis',
		classname: 'unit_of_analysis',
		width: 500,
		height: 420,
		filter: 'unit_of_analysis',
		div: 'unit-of-analysis-svg'
	});

	//**************************
	// unit of reporting chart
	//**************************
	var unitOfReportingChart = BarChart.createStackedBarChart({
		title: 'UNIT OF REPORTING',
		rows: 'type_of_unit_of_analysis',
		classname: 'unit_of_reporting',
		width: 500,
		height: 420,
		filter: 'unit_of_reporting',
		div: 'unit-of-reporting-svg'
	});

	//**************************
	// description of methodology chart
	//**************************
	var descriptionOfMethodologyChart = BarChart.createBarChart({
		title: 'DESCRIPTION OF METHODOLOGY AND LIMITATIONS',
		rows: 'methodology_content',
		classname: 'methodology_content',
		width: 500,
		height: 190,
		filter: 'methodology_content',
		div: 'methodology-content-svg'
	});

	//**************************
	// documentation chart
	//**************************
	var documentationChart = BarChart.createBarChart({
		title: 'ADDITIONAL DOCUMENTATION AVAILABLE',
		rows: 'additional_documentation_array',
		classname: 'additional_documentation',
		width: 500,
		height: 190,
		filter: 'additional_documentation',
		div: 'additional-documentation-svg'
	});

	//**************************
	// language chart
	//**************************
	var languageChart = BarChart.createStackedBarChart({
		title: 'ASSESSMENTS BY LANGUAGE',
		rows: 'language',
		classname: 'language',
		width: 500,
		height: 190,
		filter: 'language',
		div: 'language-svg'
	});

	//**************************
	// sampling approach chart
	//**************************
	var samplingApproachChart = BarChart.createStackedBarChart({
		title: 'SAMPLING APPROACH',
		rows: 'sampling_approach',
		classname: 'sampling_approach',
		width: 500,
		height: 190,
		filter: 'sampling_approach',
		div: 'sampling-approach-svg'
	});


	//**************************
	// polar charts
	//**************************
	var radarChart = Deepviz.createRadarCharts();

	//**************************
	// time chart
	//**************************

	// create svg
	var timelineSvg = Deepviz.createSvg({
		id: 'timeline_viz',
		viewBoxWidth: 1300,
		viewBoxHeight: 1050,
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
		dataLabels: {
			enabled: false,
			font: {
				size: '12px',
				weight: 'normal',
				padding: 6
			}
		},
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
		dataValues: 'total_entries',
		dataKey: 'key'
	});

	var map = Map.create();
	var table = DeepvizTable.create();
	
	d3.select('#toggle1').style('opacity', 0);
	d3.select('#toggle0').style('fill', '#008974');
	d3.select('#framework-toggle-text tspan').text('average severity');

});
