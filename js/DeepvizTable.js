var DeepvizTable = {};
var DeepvizDataTable;
var DeepvizTableDataset = [];
var DeepvizRowsToDisplay = 10;

DeepvizTable.update = function(d){

    DeepvizTableDataset = [];
    d.forEach(function(d,i){
        DeepvizTableDataset.push({'lead': d.lead.title, 'url': d.lead.url, 'type': d.assessment_type_str, 'author': d.organization_str, 'coordination': d.coordination_str, 'date': d.date_str, 'analyticalDensity': d.scores.final_scores.score_matrix_pillar['1'], 'finalScore': d.final_score })
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
        return "<a href='" + urlPrefix + value + "' target='_blank'><div class='downloadReport'></div></a>";
        }
    });

   DeepvizDataTable = new Tabulator("#data-table", {
        data:DeepvizTableDataset,           //load row data from array
        layout:"fitColumns",      //fit columns to width of table
        responsiveLayout:"hide",  //hide columns that dont fit on the table
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
            {title:"TITLE", field:"lead", width:'40%', formatter:"bold"},
            {title:"TYPE", field:"type", align:"left" },
            {title:"COORDINATION", field:"coordination", align:"left" },
            {title:"ANALYTICAL DENSITY", field:"analyticalDensity", align:"right" },
            {title:"FINAL SCORE", field:"finalScore", align:"right" },
            {title:"AUTHOR", field:"author", align:"left" },
            {title:"PUBLICATION DATE", field:"date", align:"left", sorter:"date", sorterParams:{format:"DD-MM-YYYY"}},
            {title:"URL", field:"url", align: "right", formatter:"linkFormatter" }
        ],
    });

 }
