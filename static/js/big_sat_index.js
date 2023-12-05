var intervalId;  // Declare intervalId at the top of your script

$(document).ready(function () {
    var animationDelay = 600;
    var dateIndex = 0;
    var dataByDate = [];
    var topChart;
    var updated_bm_date = ''
    var bottomChart;
    $("#charts").hide()

    function getData() {
        $("#satTable tbody").html("<tr id='loading'><th colspan='100%'><span class='loadanim'>Loading...</span></th></tr>")
        $.ajax({
            url: base_url() + '/api/big_sat',
            type: 'GET',
            dataType: 'json',
            success: function (res) {
                $("#charts").show()
                let rawData = res.df;
                let dates = [...new Set(rawData.map(item => item.date))];
                dates.sort((a, b) => new Date(a) - new Date(b)); // Sort dates in ascending order
                updated_bm_date = new Date(res.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                // Transform the data to a format that suits our purposes
                for (let date of dates) {
                    dataByDate.push(rawData.filter(item => item.date === date));
                }

                // Display the latest data initially
                updateCharts(dataByDate.length - 1);
            },
            error: function (xhr, status, error) {
                console.log('Error: ' + error);
                console.log('Status: ' + status);
                console.dir(xhr);
            }
        });
    }



    function updateCharts(index) {
        // if dataByDate is not defined, then return
        if (dataByDate.length === 0) {
            return;
        }

        let df = dataByDate[index];

        // Update currentDate element
        if (df.length > 0) {
            df.sort((a, b) => b.big_sats - a.big_sats);
            update_date = new Date(df[0].date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            $('#currentDateTop').html("Latest FX Updates: " + update_date + "<br>Latest Big Mac Data: " + updated_bm_date);
            $('#currentDate').html(update_date);

        }

        // Clear Table
        $("#satTable tbody").html("");

        let dataTop = [];
        let dataBottom = [];

        for (let i = 0; i < df.length; i++) {
            let row = `<tr>
                        <td><span class='numberCircle'>${i + 1}</span>&nbsp;${df[i].name}</td>
                        <td class='text-end'><span class='text-small text-muted'>&nbsp;${df[i].symbol}</span>&nbsp;${formatNumber(df[i].local_price, df[i].decimal_digits)}</td>
                        <td class='text-end'>$${formatNumber(df[i].price_usd, 2)}</td>
                        <td class='text-end text-strong text-brown'>${formatNumber(df[i].price_sats, 0)}</td>
                        <td class='text-end text-strong text-brown'>${formatNumber(df[i].big_sats, 2)}</td>
                    </tr>`;

            $("#satTable tbody").append(row);

            if (i < 10) {
                dataTop.push({ name: df[i].name, y: df[i].big_sats });
            }
            if (i >= df.length - 10) {
                dataBottom.push({ name: df[i].name, y: df[i].big_sats });
            }
        }

        // Sort and animate the table
        sortTable($("#satTable tbody"));



        let max = Math.max(...dataTop.map(item => item.y), ...dataBottom.map(item => item.y));

        if (!topChart) {

            // Create the chart for top 10
            topChart = Highcharts.chart('big_sat_chart_top', getChartConfig(dataTop, 'Top-10 Cheapest Burgers', 'How many burgers 100k sats will get you'));

            // Create the chart for bottom 10
            bottomChart = Highcharts.chart('big_sat_chart_bottom', getChartConfig(dataBottom, 'Bottom-10', 'These are the most expensive burgers'));


            updateChart(bottomChart, dataBottom, max);

        } else {
            // Update charts if they exist
            updateChart(topChart, dataTop, max);
            updateChart(bottomChart, dataBottom, max);
        }
    }

    // Your getChartConfig, updateChart and other functions go here...

    // Get initial data
    getData();

    // Update - go to last
    dateIndex = dataByDate.length - 1;
    updateCharts(dateIndex);

    // Play button
    $('#play').click(function () {
        clearInterval(intervalId); // Clear any existing interval
        intervalId = setInterval(function () {
            dateIndex++;
            if (dateIndex >= dataByDate.length) {
                clearInterval(intervalId);
                dateIndex = dataByDate.length - 1; // Prevent dateIndex from exceeding the array length
            } else {
                updateCharts(dateIndex);
            }
        }, animationDelay);
    });

    // Pause button
    $('#pause').click(function () {
        clearInterval(intervalId);
    });

    // Forward button
    $('#forward').click(function () {
        dateIndex++;
        if (dateIndex < dataByDate.length) {
            updateCharts(dateIndex);
        } else {
            dateIndex = dataByDate.length - 1; // Prevent dateIndex from exceeding the array length
        }
    });

    // Reverse button
    $('#reverse').click(function () {
        dateIndex--;
        if (dateIndex >= 0) {
            updateCharts(dateIndex);
        } else {
            dateIndex = 0; // Prevent dateIndex from going negative
        }
    });

    // First button
    $('#first').click(function () {
        dateIndex = 0;
        updateCharts(dateIndex);
    });

    // Last button
    $('#last').click(function () {
        dateIndex = dataByDate.length - 1;
        updateCharts(dateIndex);
    });

});

function updateChart(chart, data, max) {
    chart.series[0].setData(data.map(item => item.y)); // Update series data
    chart.xAxis[0].setCategories(data.map(item => item.name)); // Update categories (names)
    chart.yAxis[0].update({ max: max }); // Update maximum value of y-axis
}



function getChartConfig(data, titleText, subtitleText) {
    const max = Math.max(...data.map(item => item.y));
    return {
        chart: {
            type: 'bar',
            backgroundColor: 'rgba(0,0,0,0)',
            style: {
                fontFamily: "'Open Sans', sans-serif"
            },
            events: {
                load: function () {
                    this.renderer.image('/static/images/swan-icon-snow.png',
                        this.chartWidth / 2 - 120,
                        this.chartHeight / 2 - 120,
                        240, 240
                    ).css({
                        opacity: 0.05
                    }).add();
                }
            }
        },
        title: {
            text: titleText,
            style: {
                color: 'white'
            }
        },
        subtitle: {
            text: subtitleText,
            style: {
                color: 'white'
            }
        },
        credits: {
            enabled: false
        },
        xAxis: {
            categories: data.map(item => item.name),
            title: {
                text: null
            },
            labels: {
                style: {
                    color: 'white'
                }
            }
        },
        yAxis: {
            min: 0,
            max: max,
            title: {
                text: 'Burgers',
                align: 'high'
            },
            labels: {
                overflow: 'justify',
                style: {
                    color: 'white'
                }
            }
        },
        tooltip: {
            valueSuffix: ' burgers'
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    color: 'white',
                    formatter: function () {
                        return this.y.toFixed(2) + 'x 🍔';
                    },
                    style: {
                        fontSize: '20px'
                    }
                }
            }
        },
        legend: {
            enabled: false
        },
        series: [{
            name: 'Burgers',
            data: data.map(item => item.y),
            color: '#f7a35c'
        }]
    };
}
