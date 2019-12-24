var DeepvizTable = {};
var DeepvizDataTable;
var DeepvizTableDataset = [];

DeepvizDataTable = $('#data-table').DataTable( {
    data: DeepvizTableDataset,
    columns: [
        { title: "Lead" },
        { title: "Type" },
        { title: "Coordination" },
        { title: "Date" }
    ],
    columnDefs: [
        { className: 'dt-body-left', targets: [0,1,2,3] },
        { className: 'dt-head-left', targets: [0,1,2,3] },
        { "width": "100%", "targets": 0 }
    ]
});

DeepvizTable.update = function(d){

    DeepvizTableDataset = [];
    d.forEach(function(d,i){
        DeepvizTableDataset.push([d.lead, d.assessment_type_str, d.coordination_str, d.date_str])
    })

    DeepvizDataTable.clear();
    DeepvizDataTable.rows.add(DeepvizTableDataset);
    DeepvizDataTable.draw();

}

DeepvizTable.create = function(){
   DeepvizTableDataset = [];
 }


