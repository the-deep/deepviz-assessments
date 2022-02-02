var DeepvizTable = {};
var DeepvizDataTable;
var DeepvizTableDataset = [];
var DeepvizRowsToDisplay = 25;

DeepvizTable.search = function(d){
    Deepviz.filter('str', d)
}

DeepvizTable.update = function(d){

    DeepvizTableDataset = [];
    d.forEach(function(d,i){
        DeepvizTableDataset.push({'id': d.pk, 'lead': d.lead.title, 'url': d.lead.url, 'confidentiality': d.lead.confidentiality, 'type': d.assessment_type_str, 'author': d.organization_str, 'coordination': d.coordination_str, 'date': d.date_str, 'analyticalDensity': d.scores.final_scores.score_matrix_pillar['1'], 'finalScore': d.final_score })
    });

    if(DeepvizDataTable)
    DeepvizDataTable.setData(DeepvizTableDataset);

}

DeepvizTable.setRowsToDisplay = function(n){
    DeepvizRowsToDisplay = n;
    DeepvizTable.create();
}

DeepvizTable.create = function(){

    Tabulator.prototype.extendModule("format", "formatters", {
        bold:function(cell, formatterParams){
            return "<strong>" + cell.getValue() + "</strong>"; //make the contents of the cell bold
        },
        bolder:function(cell, formatterParams){
            return "<strong style='color: #5061E4'>" + cell.getValue() + "</strong>"; //make the contents of the cell bold
        },
        uppercase:function(cell, formatterParams){
            return cell.getValue().toUpperCase(); //make the contents of the cell uppercase
        },
        //clickable anchor tag
        linkFormatter: function(cell, formatterParams){
        var value = this.sanitizeHTML(cell.getValue()),
        urlPrefix = formatterParams.urlPrefix || "",
        label = this.emptyToSpace(value),
        data;

        if(formatterParams.labelField){
            data = cell.getData();
            label = data[formatterParams.labelField];
        }

        if(formatterParams.label){
            switch(typeof formatterParams.label){
                case "string":
                label = formatterParams.label;
                break;

                case "function":
                label = formatterParams.label(cell);
                break;
            }
        }

        if(formatterParams.urlField){
            data = cell.getData();
            value = data[formatterParams.urlField];
        }

        if(formatterParams.url){
            switch(typeof formatterParams.url){
                case "string":
                value = formatterParams.url;
                break;

                case "function":
                value = formatterParams.url(cell);
                break;
            }
        }
        if(typeof value !== 'undefined'){
            return "<a href='" + urlPrefix + value + "' target='_blank'><div class='downloadReport'></div></a>";
        } else {
            return '';
        }
        }
    });

   DeepvizDataTable = new Tabulator("#data-table", {
        data:DeepvizTableDataset,           //load row data from array
        layout:"fitColumns",      //fit columns to width of table
        responsiveLayout:true,  //hide columns that dont fit on the table
        tooltips:false,            //show tool tips on cells
        history:true,             //allow undo and redo actions on the table
        pagination:"local",       //paginate the data
        paginationSize:DeepvizRowsToDisplay, //allow 10 rows per page of data
        movableColumns:false,      //allow column order to be changed
        resizableRows:false,       //allow row order to be changed
        initialSort:[             //set the initial sort order of the data
            {column:"date", dir:"desc"},
        ],
        columns:[                 //define the table columns
            {title:"ID", field:"id", visible:false},
            {title:"TITLE", field:"lead", formatter:"bold", minWidth:300},
            {title:"TYPE", field:"type", align:"left", minWidth: 70 },
            {title:"COORDINATION", field:"coordination", align:"left", minWidth: 120},
            {title:"ANALYTICAL DENSITY", field:"analyticalDensity", align:"right", minWidth: 150, formatter:"bolder"},
            {title:"QUALITY SCORE", field:"finalScore", align:"right", minWidth: 120, formatter:"bolder"},
            {title:"AUTHOR", field:"author", align:"left", minWidth: 90 },
            {title:"PUBLICATION DATE", field:"date", align:"left", sorter:"date", sorterParams:{format:"DD-MM-YYYY"}, minWidth: 140, resizable: false},
            {title:"", field:"url", align: "center", formatter:"linkFormatter", headerSort:false, width: 1, resizable:false}
        ],
        rowClick:function(e, row){
            if(e.srcElement.className!='downloadReport'){
                var id = row.getIndex();
                Deepviz.filter('id', id);        
            }
        },
    });

    d3.select('#tableRemoveFilter').on('click', function(){ 
        $('.searchRows').val('');
        Deepviz.filter('id', 'clear'); 
    arginargarargin});
 }
