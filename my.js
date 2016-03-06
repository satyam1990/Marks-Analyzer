// globals
var row_id = 2;
var current_row_id = 1;
var student_data = [];
var jPM = null;

$(document).ready( function () 
{
	// init JPanel Menu
	jPM = $.jPanelMenu({
    			menu: '#menu',
    			trigger: '.menu-trigger',
    			duration: 300
			});
	jPM.on();

	// Hide the student details table initially
	$("#student_detail_panel").hide();

	// Hide the report card and student details div initially
	$("#student_detail_tab").hide();
	$("#report_card_tab").hide();

	// add event listners
	$("#add_button").click(add_button_clicked);

	$("#remove_button").click(remove_button_clicked);

	$("#submit_button").click(submit_button_clicked);

	$("[name=max_marks]").keyup(calculate_percentage);

	$("[name=marks_obtained]").keyup(calculate_percentage);

});

function add_button_clicked()
{
	// Add one row for new subject
	$("#input_table tbody").append('<tr id=' + row_id + '> <div class="form-group">' +
		'<td><input class="form-control" onfocus="set_current_row(this)" type="text" name="subject" /></td>' +
		'<td><input class="form-control" onfocus="set_current_row(this)" type="text" name="marks_obtained" /></td>' +
		'<td><input class="form-control" onfocus="set_current_row(this)" type="text" name="max_marks" /></td>' +
		'<td><input class="form-control" onfocus="set_current_row(this)" type="text" name="percentage" readonly="true" /></td>' +
		'</div></tr>');

	// increment row count
	row_id++;
}

function remove_button_clicked()
{
	var rows = $("#input_table tbody tr");

	// remove last row from the input table except first
	if (rows.length > 1)
	{
		rows.last().remove();
		// decrement row_id
		row_id--;
	}
}

function calculate_percentage()
{
	var marks_obtained = $("#input_table tbody tr:nth-child(" + current_row_id + ") [name=marks_obtained]").val();
	var max_marks = $("#input_table tbody tr:nth-child(" + current_row_id + ") [name=max_marks]").val();

	var percentage = (marks_obtained / max_marks) * 100;

	// update the percentage field
	$("#input_table tbody tr:nth-child(" + current_row_id + ") [name=percentage]").val(percentage.toFixed(2));
}

function set_current_row(obj)
{
	// store the row number of the selected input type
	current_row_id = obj.parentElement.parentElement.id;

	// update calculate percentage action listener
	$("#input_table tbody tr:nth-child(" + current_row_id + ") [name=max_marks]").keyup(calculate_percentage);
	$("#input_table tbody tr:nth-child(" + current_row_id + ") [name=marks_obtained]").keyup(calculate_percentage);
}

function submit_button_clicked()
{
	var data = $("#entry_form").serializeArray();

	var full_name = data[0].value + " " + data[1].value;

	// select only subject rows
	var subject_rows = data.slice(2);

	// stores data for single row
	var row = [full_name];

	// keeps track of column
	var column = 0;

	for (var i = 0; i < subject_rows.length; i++)
	{
		row.push(subject_rows[i].value);

		// update column count
		column++;

		if (column == 4)
		{
			// update main student data array
			student_data.push(row);

			// reset column as we got one complete row
			column = 0;

			// reset row
			row = [full_name];
		}
	}

	populate_table();
}

function populate_table()
{
	$('#table_id').DataTable( {
	destroy: true,
        data: student_data,
        columns: [
            { title: "Name" },
            { title: "Subject" },
            { title: "Marks Obtained" },
            { title: "Max Marks" },
            { title: "Percentage" }
        ]
    } );

	// display the student details panel
	$("#student_detail_panel").show();
}

function student_detail_clicked()
{
	// hide other two divs and show student details div
	$("#home").hide();
	$("#report_card_tab").hide();

	$("#student_detail_tab").show();

	// close the jpanelmenu
	jPM.close();
}

function report_card_clicked()
{
	// hide other two divs and show report card div
	$("#home").hide();
	$("#student_detail_tab").hide();

	$("#report_card_tab").show();

	// close the jpanelmenu
	jPM.close();

	// make charts
	make_charts();	
}

function load_project_home()
{
	// hide other two divs and show home div
	$("#report_card_tab").hide();
	$("#student_detail_tab").hide();
	
	$("#home").show();
}

function make_charts()
{
	// no data entered yet show message
	if (student_data.length == 0)
	{
		$("#empty").show();
		return;
	}
	else
	{
		$("#empty").hide();
	}

	// make subject wise average marks column chart
	draw_subject_wise_average_marks_chart();

	// make student distribution per subject pie chart
	draw_student_ratio_per_subject_chart();
}

function draw_subject_wise_average_marks_chart()
{
	var subject_column = 1;

	// get all unique subjects
	var subjects = get_unique_column(subject_column);
	var average = get_average_marks_subject_wise();
	console.log(subjects);
	console.log(average);

	$('#average_marks_bar').highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: 'Subject Wise Average'
        },
        xAxis: {
            categories: subjects,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Marks'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: [{
            data: average
        }]
    });
}

function draw_student_ratio_per_subject_chart()
{
	// get student per subject in a dict
	var student_per_subject = get_student_per_subject();

	// convert to pie chart data format
	var pie_data = [];
	var subject_keys = Object.keys(student_per_subject);
	
	for (var i = 0; i < subject_keys.length; i++)
	{
		temp = {sliced: true};

		// make dict for each subject
		temp["name"] = subject_keys[i];
		temp["y"] = student_per_subject[subject_keys[i]];

		// add to array
		pie_data.push(temp);
	}
	console.log(pie_data);

	$('#student_per_subject_pie').highcharts({
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: 'Student Ratio Per Subject'
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true
                }
            },
            series: [{
                name: "Subject",
                colorByPoint: true,
                data: pie_data
            }]
        });

}

// return unique list of subjects
function get_unique_column(column_no)
{
	var column_data = [];

	// get subject list from student_data
	for (var i = 0; i < student_data.length; i++)
	{
		if ($.inArray(student_data[i][column_no], column_data) < 0)
		{
			column_data.push(student_data[i][column_no]);
		}
	}

	return column_data.sort();
}

// return average marks in each subject in a list
function get_average_marks_subject_wise()
{
	var subject_column = 1;
	var marks_obtained_column = 2;
	var marks_data = {};
	var average = [];

	// collect subject wise data in a dictionery
	for (var i = 0; i < student_data.length; i++)
	{
		if (marks_data[student_data[i][subject_column]] == null)
		{
			marks_data[student_data[i][subject_column]] = [student_data[i][marks_obtained_column]];
		}
		else
		{
			marks_data[student_data[i][subject_column]].push(student_data[i][marks_obtained_column]);
		}
	}

	// subject list
	subject_list = get_unique_column(subject_column);

	// calculate average
	for (var i = 0; i < subject_list.length; i++)
	{
		average.push(get_array_sum(marks_data[ subject_list[i] ]) / marks_data[ subject_list[i] ].length)
	}

	return average;
}

function get_array_sum(arr)
{
	var sum = 0;

	for (var i = 0; i < arr.length; i++)
	{
		sum += parseInt(arr[i]);
	}

	return sum;
}

// returns a dictionery containing student per subject data
function get_student_per_subject()
{
	var data = {}
	var subject_column = 1;

	// iterate over subject column and process accordingly
	for (var i = 0; i < student_data.length; i++)
	{
		if (data[student_data[i][subject_column]] == null)
		{
			data[student_data[i][subject_column]] = 1;
		}
		else
		{
			data[student_data[i][subject_column]] = data[student_data[i][subject_column]] + 1;
		}
	}
	console.log(data);
	return data;
}
