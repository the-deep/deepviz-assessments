const urlQueryParams = new URLSearchParams(window.location.search);
var sources = [urlQueryParams.get('assessmentsDataUrl'), urlQueryParams.get('entriesDataUrl'), 'images/summary.svg'];

var Deepviz = new Deepviz(sources, function(data){

	//**************************
	// summary section
	//**************************
	var summary = Deepviz.createSummary();

	// //**************************
	// // sector chart
	// //**************************
	// var sectorChart = Deepviz.createSectorChart();

	//**************************
	// affected groups chart
	//**************************
	// var affectedGroupsChart = Deepviz.createAffectedGroupsChart();

	//**************************
	// finalScore chart
	//**************************
	var finalScoreChart = Deepviz.createFinalScoreChart();


	//**************************
	// time chart
	//**************************

	// create svg
	var timelineSvg = Deepviz.createSvg({
		id: 'timeline_viz',
		viewBoxWidth: 1300,
		viewBoxHeight: 1100,
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

	var map = Deepviz.createMap({ });

	d3.select('#toggle1').style('opacity', 0);
	d3.select('#toggle0').style('fill', '#008974');
	d3.select('#framework-toggle-text tspan').text('average severity');

});
