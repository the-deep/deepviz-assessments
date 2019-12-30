var DeepvizTable = {};
var DeepvizDataTable;
var DeepvizTableDataset = [];

// DeepvizDataTable = $('#data-table').DataTable( {
//     data: DeepvizTableDataset,
//     columns: [
//         { title: "Lead" },
//         { title: "Type" },
//         { title: "Coordination" },
//         { title: "Date" }
//     ],
//     columnDefs: [
//         { className: 'dt-body-left', targets: [0,1,2,3] },
//         { className: 'dt-head-left', targets: [0,1,2,3] },
//         { "width": "100%", "targets": 0 }
//     ]
// });

DeepvizTable.update = function(d){



    // DeepvizDataTable.clear();
    // DeepvizDataTable.rows.add(DeepvizTableDataset);
    // DeepvizDataTable.draw();

    DeepvizTableDataset = [];
    d.forEach(function(d,i){
        DeepvizTableDataset.push({'lead': d.lead, 'type': d.assessment_type_str, 'author': '', 'coordination': d.coordination_str, 'date': d.date_str, 'analyiticalDensity': d.scores.final_scores.score_matrix_pillar['1'], 'finalScore': d.final_score })
    });

    if(DeepvizDataTable)
    DeepvizDataTable.setData(DeepvizTableDataset);


}

DeepvizTable.create = function(){
   DeepvizTableDataset = [];


    Tabulator.prototype.extendModule("format", "formatters", {
        bold:function(cell, formatterParams){
            return "<strong>" + cell.getValue() + "</strong>"; //make the contents of the cell bold
        },
        uppercase:function(cell, formatterParams){
            return cell.getValue().toUpperCase(); //make the contents of the cell uppercase
        }
    });

   DeepvizDataTable = new Tabulator("#data-table", {
        data:DeepvizTableDataset,           //load row data from array
        layout:"fitColumns",      //fit columns to width of table
        responsiveLayout:"hide",  //hide columns that dont fit on the table
        tooltips:false,            //show tool tips on cells
        history:true,             //allow undo and redo actions on the table
        pagination:"local",       //paginate the data
        paginationSize:10,         //allow 7 rows per page of data
        movableColumns:false,      //allow column order to be changed
        resizableRows:false,       //allow row order to be changed
        initialSort:[             //set the initial sort order of the data
            {column:"lead", dir:"asc"},
        ],
        columns:[                 //define the table columns
            {title:"TITLE", field:"lead", width:'40%', formatter:"bold"},
            {title:"TYPE", field:"type", align:"left" },
            {title:"COORDINATION", field:"coordination", align:"left" },
            {title:"ANALITCAL DENSITY", field:"analyiticalDensity", align:"left" },
            {title:"FINAL SCORE", field:"finalScore", align:"left" },
            {title:"AUTHOR", field:"author", align:"left" },
            {title:"PUBLICATION DATE", field:"date", align:"left" }
        ],
    });

 }


