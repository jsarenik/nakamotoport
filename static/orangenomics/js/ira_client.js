$(document).ready(function () {

    window.btcPrice = 30000;
    process_args();


    // Bitcoin Scenarios
    window.scenarios = {
        'Bearish': {
            sixtyfourty_rate: 0.025,
            bitcoin_rate: 0.05,
        },
        'Base': {
            sixtyfourty_rate: 0.07,
            bitcoin_rate: 0.15,
        },
        'Bullish': {
            sixtyfourty_rate: 0.10,
            bitcoin_rate: 0.20,
        },
    }


    // Set initial scenario to 'Base'
    updateScenario('Base');

    // Hide Table
    $('#other-options').toggle();
    $('.hamburger').toggleClass('flipped');

    $('#toggle-button').on('click', function () {
        $('#other-options').toggle();
        $('.hamburger').toggleClass('flipped');
    });

    //  Update allocation slider text
    $("#allocation-slider").on("input", function () {
        window.allocation = parseInt($(this).val());
        $("#allocation-value").text($(this).val() + "%");
        calculate(window.btcPrice);
    });

    // Update Bitcoin and 60/40 slider text
    $("#bitcoin-slider, #sixtyfourty-slider").on("input", function () {
        window.sixtyfourtyReturn = parseInt($("#sixtyfourty-slider").val());
        window.bitcoinReturn = parseInt($("#bitcoin-slider").val());
        $("#bitcoin-return").text(window.bitcoinReturn + "%");
        $("#sixtyfourty-return").text(window.sixtyfourtyReturn + "%");
        calculate(window.btcPrice);
    });
    $("#bitcoin-slider, #sixtyfourty-slider, #allocation-slider").trigger("input");

    // Automatically adjust the width of the input fields to fit their content
    $('.ira-input, .ira-dropdown').each(function () {
        adjustInputWidth($(this));
    }).on('input change', function () {
        adjustInputWidth($(this));
    });

    // Update the maximum contribution amount when age or income input changes
    $('#age, #income').on('input change', function () {
        const age = parseInt($('#age').val());
        const income = parseFloat($('#income').val().replace(/[$,]/g, ''));
        updateMaxContribution(age, income);
        calculate(window.btcPrice);
    });

    // Run the calculations on initial page load
    calculate(window.btcPrice);


    // Run the calculations when input values change
    $('.ira-input, .ira-dropdown').on('input change', function () {
        calculate(window.btcPrice);
    });


    getBTCPrice();

    // get price every 60 seconds
    setInterval(function () {
        getBTCPrice();
    }, 60000);


    // Create buttons for each scenario
    const buttonGroup = $('<div class="btn-group d-flex mb-3" role="group" aria-label="Scenarios"></div>');
    for (const scenario in scenarios) {
        const button = $(`<button type="button" class="btn btn-outline-light w-100" id="${scenario.toLowerCase()}-btn">${scenario}</button>`);
        button.on('click', () => {
            updateScenario(scenario);
        });
        buttonGroup.append(button);
    }
    $('#scenario_buttons').append(buttonGroup); // Replace 'body' with the selector for the container you want to insert the buttons into
    updateScenario(window.scenario)

    $('.select_ira').on('click', onIraSelected);


});

// Function to execute when a dropdown item is selected
function onIraSelected() {
    // Get the selected IRA name from the clicked dropdown item
    const selectedIraName = $(this).text();

    let ira = selectedIraName;
    let cash = 0;
    let btc = parseFloat($('#savings').val().replace(/,/g, '')) / window.btcPrice;
    const retirementAge = parseInt($('#retirementAge').val());
    const age = parseInt($('#age').val());
    let years = retirementAge - age;
    btc_chg = window.bitcoinReturn;
    contribution = parseFloat($('#annualContribution').val().replace(/,/g, ''));
    url = base_url() +
        "ira/comparison?ira=" + encodeURIComponent(ira) +
        "&cash=" + encodeURIComponent(cash) +
        "&btc=" + encodeURIComponent(btc) +
        "&btc_chg=" + encodeURIComponent(btc_chg) +
        "&years=" + encodeURIComponent(years) +
        "&contribution=" + encodeURIComponent(contribution);
    window.location.href = url;



}


// Fetch Latest BTC_Price
function getBTCPrice() {
    fetch("/realtime_btc")
        .then((response) => response.json())
        .then((data) => {
            window.btcPrice = data.btc_usd;
            calculate(window.btcPrice);
            // kick off simulations
            createSimulationCharts(window.btcPrice);
        });
};


function updateScenario(scenario) {
    window.scenario = scenario
    // Update button styles
    $('.btn-outline-dark').removeClass('selected-scenario');
    $(`#${scenario.toLowerCase()}-btn`).addClass('selected-scenario');

    // Retrieve scenario data
    const { sixtyfourty_rate, bitcoin_rate } = window.scenarios[window.scenario];

    // Update slider values and text
    window.sixtyfourtyReturn = parseInt(sixtyfourty_rate * 100);
    window.bitcoinReturn = parseInt(bitcoin_rate * 100);
    $("#bitcoin-return").text(window.bitcoinReturn + "%");
    $("#sixtyfourty-return").text(window.sixtyfourtyReturn + "%");
    $("#bitcoin-slider").val(window.bitcoinReturn);
    $("#sixtyfourty-slider").val(window.sixtyfourtyReturn);


    calculate(window.btcPrice);

}


function calculate(btcPrice) {
    // Retrieve input values
    const age = parseInt($('#age').val());
    const income = parseFloat($('#income').val().replace(/[$,]/g, ''));
    const savings = parseFloat($('#savings').val().replace(/,/g, ''));
    const retirementAge = parseInt($('#retirementAge').val());
    const annualContribution = parseFloat($('#annualContribution').val().replace(/,/g, ''));
    const taxStatus = $('#taxStatus').val()

    // Update the maximum contribution amount
    updateMaxContribution(age, income);

    // Calculate tax savings
    const effectiveTaxRate = calculateEffectiveTaxRate(taxStatus, income);

    // Display the effective tax rate
    $('#effectiveTaxRate').text((effectiveTaxRate * 100).toFixed(2));

    let iraValue = savings;

    // Generate table data
    const tableBody = $('#comparison-table tbody');
    tableBody.empty();

    let taxableValue = savings;

    // Define starting Bitcoin price and expected annual growth rate
    startingBitcoinPrice = btcPrice;

    let years = ['NOW'];
    let bitcoinPrices = [startingBitcoinPrice];
    let btcNormalizedList = [startingBitcoinPrice];
    let iraValues = [savings];
    let fullIra = [savings];
    let iraPrices = [100]
    let iraPrice = 100;
    let fullIraValue = savings
    let sixtyfourtyValues = [100];
    let taxableValues = [savings * (1 - effectiveTaxRate)];
    let difference = 0;

    for (let year = age + 1; year <= retirementAge; year++) {
        // Save the previous year's IRA value
        ira_previous = iraPrice;
        fIrra_previous = fullIraValue;
        fullIraValue += annualContribution;
        iraValue += annualContribution;
        // Calculate bitcoin Price this year
        btcPrice = startingBitcoinPrice * (1 + window.bitcoinReturn / 100) ** (year - age);
        // Calculate 60/40 Price this year
        sixtyfourtyPrice = 100 * (1 + window.sixtyfourtyReturn / 100) ** (year - age);
        // Calculate Normalized Bitcoin Price this year
        btcNormalized = btcPrice / startingBitcoinPrice * 100;
        // Calculate IRA normalized Price this year
        iraPrice = btcNormalized * window.allocation / 100 + sixtyfourtyPrice * (100 - window.allocation) / 100;
        // Calculate IRA Value this year
        iraValue = iraPrice / ira_previous * iraValue;

        // Calculate Full IRA Value this year
        fullIraValue = (1 + (window.sixtyfourtyReturn / 100)) * fullIraValue;

        // Calculate taxable values
        taxableDisplayValue = iraValue * (1 - effectiveTaxRate);

        // Save arrays for chart
        years.push(year);
        bitcoinPrices.push(btcPrice);
        btcNormalizedList.push(btcNormalized);
        iraValues.push(iraValue);
        fullIra.push(fullIraValue);
        taxableValues.push(taxableDisplayValue);


        difference = iraValue - taxableDisplayValue;
        bitcoindiff = iraValue - fullIraValue;

        const tableRow = $('<tr></tr>');
        tableRow.append(`<td>${year}</td>`);
        tableRow.append(`<td>${formatNumber(btcPrice, 0)}</td>`);
        tableRow.append(`<td>${formatNumber(iraValue, 0)}</td>`);
        tableRow.append(`<td>${formatNumber(taxableDisplayValue, 0)}</td>`);
        tableRow.append(`<td>${formatNumber(difference, 0)}</td>`);

        tableBody.append(tableRow);


    }

    // Display calculated values
    $('#ira-balance').text(formatNumber(iraValue, 0));
    $('#taxable-balance').text(formatNumber(taxableDisplayValue, 0));
    $('#savings-balance').html("<i class='fa-solid fa-caret-up fa-sm text-muted'></i>&nbsp;$ " + formatNumber(difference, 0)).removeClass('positive negative').addClass(difference >= 0 ? 'positive' : 'negative');

    $('#ira-bitcoin').text(formatNumber(iraValue, 0));
    $('#ira-no-bitcoin').text(formatNumber(fullIraValue, 0));
    $('#bitcoin-savings').html("<i class='fa-solid fa-caret-up fa-sm text-muted'></i>&nbsp;$ " + formatNumber(bitcoindiff, 0)).removeClass('positive negative').addClass(difference >= 0 ? 'positive' : 'negative');

    // Update Max Contribution
    updateMaxContribution(age, income);
    createChart(years, bitcoinPrices, iraValues, taxableValues, fullIra);

    // Update simulations
    createSimulationCharts(startingBitcoinPrice);
}



function adjustInputWidth(input) {
    const tempSpan = $('<span></span>');
    tempSpan.text(input.val());
    tempSpan.css('font-size', input.css('font-size'));
    tempSpan.css('font-family', input.css('font-family'));
    tempSpan.css('visibility', 'hidden');
    $('body').append(tempSpan);

    input.css('width', (tempSpan.outerWidth() + 40) + 'px');

    tempSpan.remove();
}

function calculateEffectiveTaxRate(taxStatus, income) {
    const brackets = taxBrackets[taxStatus];
    let tax = 0;
    let prevThreshold = 0;

    for (const bracket of brackets) {
        const taxableIncomeInBracket = Math.min(income, bracket.threshold) - prevThreshold;
        tax += taxableIncomeInBracket * bracket.rate;
        prevThreshold = bracket.threshold;
        if (income <= bracket.threshold) {
            break;
        }
    }

    return tax / income;
}



function updateMaxContribution(age, income) {
    const baseMaxContribution = age >= 50 ? 7500 : 6500;

    $('#annual_cont_max').text(formatNumber(baseMaxContribution, 0));
}




function createChart(years, bitcoinPrices, iraValues, taxableValues, fullIra) {
    Highcharts.chart('chart-BTC', {
        chart: {
            type: 'line',
            backgroundColor: null,
            events: {
                load: function () {
                    this.renderer.image('/static/images/swan-icon-snow.png',
                        this.chartWidth / 2 - 100, // Center the image horizontally
                        this.chartHeight / 2 - 95, // Center the image vertically
                        240, 240 // Maintain original aspect ratio
                    ).css({
                        opacity: 0.1 // Increase opacity for visibility in dark mode
                    }).add();
                }
            }
        },
        title: {
            text: ''
        },
        credits: {
            enabled: false
        },
        xAxis: {
            categories: years,
            labels: {
                formatter: function () {
                    return this.value === years[0] ? 'NOW' : Highcharts.numberFormat(this.value, 0, '.', '');
                },
                style: {
                    fontSize: '14px',
                    color: '#C0C0C0'
                }
            }
        },
        yAxis: {
            title: {
                text: 'Price ($)'
            },
            labels: {
                formatter: function () {
                    return this.value >= 1000000 ? (this.value / 1000000) + 'M' : (this.value / 1000) + 'K';
                },
                style: {
                    fontSize: '14px',
                    color: '#C0C0C0'
                }
            },
        },
        tooltip: {
            shared: true,
            pointFormat: '<span style="color:{series.color}">{series.name}: </span><b>${point.y:,.0f}</b><br/>'
        },
        plotOptions: {
            series: {
                animation: false
            },
            line: {
                stacking: false,
                marker: {
                    enabled: false
                },
                lineWidth: 1
            }
        },
        series: [{
            name: 'Bitcoin Price',
            data: bitcoinPrices,
            color: '#fd7e14',
            lineWidth: 3,
            zIndex: 10,
        }],
        legend: {
            enabled: false
        },
    });

    Highcharts.chart('ira-container', {
        chart: {
            type: 'line',
            backgroundColor: null,
            events: {
                load: function () {
                    this.renderer.image('/static/images/swan-icon-snow.png',
                        this.chartWidth / 2 - 100, // Center the image horizontally
                        this.chartHeight / 2 - 95, // Center the image vertically
                        240, 240 // Maintain original aspect ratio
                    ).css({
                        opacity: 0.1 // Increase opacity for visibility in dark mode
                    }).add();
                }
            }
        },
        title: {
            text: ''
        },
        credits: {
            enabled: false
        },
        xAxis: {
            categories: years,
            labels: {
                formatter: function () {
                    return this.value === years[0] ? 'NOW' : Highcharts.numberFormat(this.value, 0, '.', '');
                },
                style: {
                    fontSize: '14px',
                    color: '#C0C0C0'
                }
            }
        },
        yAxis: {
            title: {
                text: 'Balance'
            },
            labels: {
                formatter: function () {
                    return this.value >= 1000000 ? (this.value / 1000000) + 'M' : (this.value / 1000) + 'K';
                },
                style: {
                    fontSize: '14px',
                    color: '#C0C0C0'
                }
            },
        },
        tooltip: {
            shared: true,
            pointFormat: '<span style="color:{series.color}">{series.name}: </span><b>${point.y:,.0f}</b><br/>'
        },
        plotOptions: {
            series: {
                animation: false
            },
            line: {
                stacking: false,
                marker: {
                    enabled: false
                },
                lineWidth: 1
            }
        },
        series: [{
            name: 'IRA with ₿ Value',
            data: iraValues,
            color: '#FCC800',
            // set width of line to 4px
            lineWidth: 4,
            marker: {
                enabled: false,
            },
            dataLabels: {
                enabled: true,
                formatter: function () {
                    if (this.point.index === this.series.data.length - 1) {
                        return ` IRA with ${formatNumber(window.allocation, 0)}% ₿: $${formatNumber(this.y, 0)} ►&nbsp;&nbsp;&nbsp;`;
                    }
                    return null;
                },
                style: {
                    font: 'normal 18px "Roboto", arial',
                    fontWeight: 'strong',
                    fontSize: '18px',
                    color: 'white',
                },
                y: 20,
                backgroundColor: 'transparent',
                padding: 5
            },
        }, {
            name: 'IRA without ₿ Value',
            data: fullIra,
            color: '#D9D9D9',
            lineWidth: 4,
            marker: {
                enabled: false,
            },
            dataLabels: {
                enabled: true,
                formatter: function () {
                    if (this.point.index === this.series.data.length - 1) {
                        return `Without ₿: $${formatNumber(this.y, 0)} ►&nbsp;&nbsp;&nbsp;`;
                    }
                    return null;
                },
                style: {
                    font: 'normal 18px "Roboto", arial',
                    fontWeight: 'strong',
                    fontSize: '18px',
                    color: 'white',
                },
                y: 20,
                backgroundColor: 'transparent',
                padding: 5
            },

        }
        ],
        legend: {
            enabled: false,
        },
    });

}



const taxBrackets = {
    single: [
        { threshold: 9950, rate: 0.10 },
        { threshold: 40525, rate: 0.12 },
        { threshold: 86375, rate: 0.22 },
        { threshold: 164925, rate: 0.24 },
        { threshold: 209425, rate: 0.32 },
        { threshold: 523600, rate: 0.35 },
        { threshold: Infinity, rate: 0.37 },
    ],
    married_filing_separately: [
        { threshold: 9950, rate: 0.10 },
        { threshold: 40525, rate: 0.12 },
        { threshold: 86375, rate: 0.22 },
        { threshold: 164925, rate: 0.24 },
        { threshold: 209425, rate: 0.32 },
        { threshold: 314150, rate: 0.35 },
        { threshold: Infinity, rate: 0.37 },
    ],
    married_filing_jointly: [
        { threshold: 19900, rate: 0.10 },
        { threshold: 81050, rate: 0.12 },
        { threshold: 172750, rate: 0.22 },
        { threshold: 329850, rate: 0.24 },
        { threshold: 418850, rate: 0.32 },
        { threshold: 628300, rate: 0.35 },
        { threshold: Infinity, rate: 0.37 },
    ],
    head_of_household: [
        { threshold: 14100, rate: 0.10 },
        { threshold: 53700, rate: 0.12 },
        { threshold: 85525, rate: 0.22 },
        { threshold: 163300, rate: 0.24 },
        { threshold: 207350, rate: 0.32 },
        { threshold: 518400, rate: 0.35 },
        { threshold: Infinity, rate: 0.37 },
    ],
};



function process_args() {
    // Get the query parameters
    var queryParams = getUrlVars();

    // Fill the input fields with the parsed query parameters if they exist and have valid values
    if (queryParams['age'] && !isNaN(queryParams['age'])) {
        $("#age").val(queryParams['age']);
    }

    if (queryParams['savings'] && !isNaN(queryParams['savings'].replace('%2C', ''))) {
        let saved = parseFloat(queryParams['savings'].replace('%2C', ''.replace("'", "")))
        $("#savings").val(formatNumber(saved, 0));
    }

    if (queryParams['annualContribution'] && !isNaN(queryParams['annualContribution'].replace('%2C', ''))) {
        $("#annualContribution").val(queryParams['annualContribution'].replace('%2C', ','));
    }

    if (queryParams['allocation'] && !isNaN(queryParams['allocation'])) {
        $("#allocation-slider").val(queryParams['allocation']);
        $("#allocation-value").text(queryParams['allocation'] + "%");
    }

    if (queryParams['income'] && !isNaN(queryParams['income'].replace('%2C', ''))) {
        let income = parseFloat(queryParams['income'].replace('%2C', ','))
        $("#income").val(formatNumber(income, 0));

    }

    if (queryParams['retirementAge'] && !isNaN(queryParams['retirementAge'])) {
        $("#retirementAge").val(queryParams['retirementAge']);
    }

    if (queryParams['taxStatus']) {
        var validTaxStatuses = ["single", "married_filing_separately", "married_filing_jointly", "head_of_household"];
        if (validTaxStatuses.includes(queryParams['taxStatus'])) {
            $("#taxStatus").val(queryParams['taxStatus']);
        }
    }
}

// SIMULATIONS

function derivative(simulationData) {
    let sumOfQuotients = 0;
    let numberOfQuotients = simulationData.length - 1;

    for (let i = 1; i < simulationData.length; i++) {
        let expectedReturnDifference = simulationData[i][0] - simulationData[i - 1][0];
        let finalBalanceDifference = simulationData[i][1] - simulationData[i - 1][1];
        let quotient = finalBalanceDifference / expectedReturnDifference;
        sumOfQuotients += quotient;
    }

    let averageChange = sumOfQuotients / numberOfQuotients;
    return averageChange;
}


// Simulation functions
function bitcoinExpectedReturnSimulation(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees) {
    simulationData = [];

    // Define the range of Bitcoin expected returns for the simulation
    let bitcoinReturnRange = [...Array(20).keys()].map(x => 0.01 * (x + 1)); // Range from 0.01 to 0.50

    for (let expectedReturn of bitcoinReturnRange) {
        // Recalculate final IRA balance with Bitcoin using the updated expected return
        const finalBalance = calculateFinalIraBalanceWithFees(btcPrice, age, savings, annualContribution, allocation, retirementAge, expectedReturn * 100, annualFees);
        simulationData.push([expectedReturn * 100, finalBalance]);
    }

    $('#sim-1-label').html('On average, a <span class="text-success">1% increase</span> in the expected return of Bitcoin will result in a <span class="text-success">$ ' + formatNumber(derivative(simulationData), 0) + '</span> increase in the final IRA balance.');

    return simulationData;
}

function bitcoinAllocationSimulation(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees) {
    simulationData = [];

    // Define the range of Bitcoin allocations for the simulation
    allocationRange = [...Array(101).keys()]; // Range from 0 to 100

    for (let allocat of allocationRange) {
        // Recalculate final IRA balance with Bitcoin using the updated allocation
        const finalBalance = calculateFinalIraBalanceWithFees(btcPrice, age, savings, annualContribution, allocat, retirementAge, bitcoinReturn, annualFees);
        simulationData.push([allocat, finalBalance]);
    }

    $('#sim-2-label').html('On average, a <span class="text-success">1% increase</span> in Bitcoin allocation will result in a <span class="text-success">$ ' + formatNumber(derivative(simulationData), 0) + '</span> increase in the final IRA balance.');

    return simulationData;
}

function yearsToRetirementSimulation(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees) {
    simulationData = [];

    // Define the range of years to retirement for the simulation
    AgeRange = [...Array(30).keys()].map(x => (x + age - 10));

    for (let age of AgeRange) {
        const finalBalance = calculateFinalIraBalanceWithFees(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees);
        simulationData.push([age, finalBalance]);
    }

    $('#sim-3-label').html('On average, every <span class="text-danger">1 year</span> you wait to start an IRA results in a <span class="text-danger">$ ' + formatNumber(derivative(simulationData) * -1, 0) + '</span> decrease in the final IRA balance.');

    return simulationData;
}

function contributionSimulation(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees) {
    simulationData = [];

    // Define the range of annual contributions for the simulation
    annualContributionRange = [...Array(66).keys()].map(x => 100 * x); // Range from 0 to 50,000 in steps of 1,000
    for (let annualContribution_s of annualContributionRange) {
        // Recalculate final IRA balance with Bitcoin using the updated annual contribution
        const finalBalance = calculateFinalIraBalanceWithFees(btcPrice, age, savings, annualContribution_s, allocation, retirementAge, bitcoinReturn, annualFees);
        simulationData.push([annualContribution_s, finalBalance]);
    }

    $('#sim-4-label').html('On average, every <span class="text-success">$1 in annual contribution</span> will result in <span class="text-success">$ ' + formatNumber(derivative(simulationData), 0) + '</span> increase in the final IRA balance.');
    return simulationData;
}

function annualFeesSimulation(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees) {
    simulationData = [];

    // Define the range of annual fees for the simulation
    annualFeesRange = [...Array(31).keys()].map(x => 0.001 * x); // Range from 0% to 3% in steps of 0.1%

    for (let annualFees_s of annualFeesRange) {
        // Recalculate final IRA balance with Bitcoin using the updated annual fees
        const finalBalance = calculateFinalIraBalanceWithFees(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees_s);
        simulationData.push([annualFees_s * 100, finalBalance]);
    }

    $('#sim-5-label').html('On average, every <span class="text-danger">1% increase</span> in fees results in a <span class="text-danger">$ ' + formatNumber(derivative(simulationData) * -1, 0) + '</span> decrease in the final IRA balance.');

    return simulationData;
}

function calculateFinalIraBalanceWithFees(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees) {
    let iraValue = savings;
    // Define starting Bitcoin price and expected annual growth rate
    let startingBTCPrice = btcPrice;
    let ira_previous = 0;
    let iraPrice = 100;
    let btcNormalized = 100;
    let sixtyfourtyPrice = 100;

    for (let year = age + 1; year <= retirementAge; year++) {
        // Save the previous year's IRA value
        ira_previous = iraPrice;
        iraValue = iraValue * (1 - annualFees)
        iraValue += annualContribution;
        // Calculate bitcoin Price this year
        btcPrice = startingBTCPrice * (1 + bitcoinReturn / 100) ** (year - age);
        // Calculate Normalized Bitcoin Price this year
        btcNormalized = btcPrice / startingBTCPrice * 100;
        // Calculate 60/40 Price this year
        sixtyfourtyPrice = 100 * (1 + window.sixtyfourtyReturn / 100) ** (year - age);
        // Calculate IRA normalized Price this year
        iraPrice = btcNormalized * allocation / 100 + sixtyfourtyPrice * (100 - allocation) / 100;
        // Calculate IRA Value this year
        iraValue = iraPrice / ira_previous * iraValue;
    }
    return iraValue;
}



// Create Highcharts for each simulation
function createSimulationCharts(btcPrice) {
    let age = parseInt($("#age").val());
    let savings = parseFloat($("#savings").val().replace(',', ''));
    let annualContribution = parseFloat($("#annualContribution").val().replace(',', ''));
    let allocation = parseInt($("#allocation-slider").val());

    let retirementAge = parseInt($("#retirementAge").val());
    let annualFees = 0

    let bitcoinReturn = window.bitcoinReturn;

    simulation1Data = bitcoinExpectedReturnSimulation(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees);
    simulation2Data = bitcoinAllocationSimulation(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees);
    simulation3Data = yearsToRetirementSimulation(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees);
    simulation4Data = contributionSimulation(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees);
    simulation5Data = annualFeesSimulation(btcPrice, age, savings, annualContribution, allocation, retirementAge, bitcoinReturn, annualFees);

    // Create Highcharts for each simulation using the respective data
    createSimChart('chart-simulation-1', 'Bitcoin Expected Return p.a. (%)', 'Final IRA Balance ($)', simulation1Data);
    createSimChart('chart-simulation-2', 'Bitcoin Allocation (%)', 'Final IRA Balance ($)', simulation2Data);
    createSimChart('chart-simulation-3', 'Starting Age (yrs)', 'Final IRA Balance ($)', simulation3Data);
    createSimChart('chart-simulation-4', 'Contribution ($)', 'Final IRA Balance ($)', simulation4Data);
    createSimChart('chart-simulation-5', 'Annual Fees (%)', 'Final IRA Balance ($)', simulation5Data);

}

// Highchart configuration for simulations
function createSimChart(container, xAxisTitle, yAxisTitle, data) {
    Highcharts.chart(container, {
        chart: {
            type: 'line',
            backgroundColor: null,
            events: {
                load: function () {
                    this.renderer.image('/static/images/swan-icon-snow.png',
                        this.chartWidth / 2 - 100, // Center the image horizontally
                        this.chartHeight / 2 - 95, // Center the image vertically
                        240, 240 // Maintain original aspect ratio
                    ).css({
                        opacity: 0.1 // Increase opacity for visibility in dark mode
                    }).add();
                }
            }
        },
        title: {
            text: ''
        },
        xAxis: {
            title: {
                text: xAxisTitle
            },
            labels: {
                style: {
                    fontSize: '14px',
                    color: '#C0C0C0'
                }
            }
        },
        legend: {
            enabled: false
        },
        yAxis: {
            title: {
                text: yAxisTitle
            },
            labels: {
                formatter: function () {
                    return this.value >= 1000000 ? (this.value / 1000000) + 'M' : (this.value / 1000) + 'K';
                },
                style: {
                    fontSize: '12px',
                    color: 'white'
                }
            }
        },
        tooltip: {
            formatter: function () {
                return xAxisTitle + ': <b>' + this.x + '</b><br>' + yAxisTitle + ': <b>' + Highcharts.numberFormat(this.y, 0) + '</b>';
            },
            style: {
                fontSize: '14px',
                color: '#C0C0C0'
            },
            shared: true
        },
        plotOptions: {
            series: {
                animation: false,
                marker: {
                    enabled: false
                },
                lineWidth: 2
            }
        },
        series: [{
            name: yAxisTitle,
            data: data,
            color: '#FCC800',
            negativeColor: '#FFFFFF',
            dashStyle: 'shortDot',
            lineWidth: 4
        }],
        credits: {
            enabled: false
        }
    });
}

