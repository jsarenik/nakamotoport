const sources = [
    'yahoo'
];

let ajaxRequests = []; // Keep track of all requests

$(document).ready(function () {
    const $search_Field = $('#search_Field');
    const $searchResults = $('#searchResults');
    let searchTimeout;
    $("#searchResults").hide();
    $("#customized_inputs").hide();
    $("#mc_inputs").hide();

    $('#submit').on('click', function (e) {
        e.preventDefault();

        let ticker = $search_Field.val();
        let quantile = $('#quantile').val();
        if (quantile.includes('%')) {
            quantile = parseFloat(quantile) / 100;
        }
        let distribution = $('#distribution').val();
        let n = $('#n').val();

        get_return_data(ticker, quantile = quantile, distribution = distribution, n = n);
    });

    $('#submit_mc').on('click', function (e) {
        e.preventDefault();

        let ticker = $search_Field.val();

        let n_sims = $('#n_sims').val();
        let n_days = $('#n_days').val();
        let distribution = $('#distribution').val();

        get_return_data(ticker, distribution = distribution, n_sims = n_sims, n_days = n_days);
    });


    $search_Field.on('input', function () {
        const query = $(this).val().trim();

        if (!query) {
            $searchResults.hide();
            return;
        }

        // Cancel any ongoing requests
        for (let ajaxReq of ajaxRequests) {
            ajaxReq.abort();
        }
        ajaxRequests = []; // Clear requests array

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(() => {
            $("#spinner").show();
            $('#spinner-text').html('')
            $searchResults.hide(); // Hide the dropdown when a new search starts
            search(query, function (results) {
                $("#spinner").hide();
                $searchResults.html(renderResults(results));
                $searchResults.show();
            });
        }, 1000); // Adjust the delay as needed
    });

    $searchResults.on('click', '.search-result-item', function () {
        const symbol = $('#search_Field').val()
        $searchResults.hide();
        $search_Field.val(symbol); // Set the input field value as the selected symbol
        $('#spinner-text').html('<i class="fa-solid fa-square-check fa-lg text-green"></i>')
        $('#message').html("<span class='text-green loadanim'>Loading Data for " + symbol + "</span><br><span class='text-yellow text-small'>This can take some time.<br>Please wait...</span>");
        get_return_data(symbol);
    });

    $('#function-select').change(function () {
        const symbol = $('#search_Field').val()
        console.log("Changed function to: ", $(this).val())
        console.log("Symbol: ", symbol)
        if (symbol) {
            $('#spinner-text').html('<i class="fa-solid fa-square-check fa-lg text-green"></i>')
            $('#message').html("<span class='text-green loadanim'>Loading Data for " + symbol + "</span><br><span class='text-yellow text-small'>This can take some time.<br>Please wait...</span>");
            get_return_data(symbol);
        }
    });



});

function search(query, callback) {
    if (query.length < 3) {
        $("#spinner").hide();
        $("#results").hide();
        $('#spinner-text').html('<i class="fa-solid fa-search"></i>')
        return;
    }

    // Show spinner
    $("#spinner").show();

    let results = [];
    let sourcesCompleted = 0;

    sources.forEach(src => {
        let ajaxReq = $.ajax({
            url: `/api/search?query=${query}&src=${src}`,
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response && response.results) {
                    results = results.concat(response.results);
                } else {
                    console.error('Error: Invalid response format');
                }
            },
            error: function (error) {
                if (error.statusText != 'abort') { // Ignore abort errors
                    console.error('Error:', error);
                }
            },
            complete: function () {
                sourcesCompleted++;
                if (sourcesCompleted === sources.length) {
                    // Hide spinner
                    $("#spinner").hide();
                    $('#spinner-text').html('<i class="fa-solid fa-search"></i>')
                    callback(results);
                }
            }
        });
        ajaxRequests.push(ajaxReq); // Keep track of this request
    });
}
function renderResults(results) {
    if (!Array.isArray(results)) {
        console.error('Error: results is not an array');
        return '';
    }

    // Empty results
    if (results.length === 0) {
        return '<div class="search-result-item">No results found</div>';
    } else {

        return results.map(result => `
    <div class="search-result-item" data-symbol="${result.symbol}" data-name="${result.name}">
    ${result.symbol} | ${result.name} | ${result.fx} | ${result.notes} | ${result.provider}
    </div>
  `).join('');
    }

}





function get_return_data(ticker, quantile = 0.025, distribution = 'best_fit', n = 1,
    start_date = '2000-01-01', end_date = '2099-12-31', n_sims = 1000, n_days = 365) {
    $('#output').html("");
    $("#customized_inputs").hide();
    $("#mc_inputs").hide();

    if ($('#function-select').val() == 'distribution') {
        $('#message').html("<span class='text-green loadanim'>Loading Data for " + ticker + "</span><br><span class='text-yellow text-small'>This can take some time while we test the historical returns against several distributions to find the best fit.<br>Please wait...</span>");
        // Send an AJAX request to the server
        $.ajax({
            url: '/apps/return_analysis',
            type: 'GET',
            data: {
                ticker: ticker,
                quantile: quantile,
                dist: distribution,
                n: n
            },
            success: function (response) {
                // Update the output div with the response from the server
                $('#message').html("");
                $('#output').html(response);
                $("#customized_inputs").show();
            },
            error: function (error) {
                $('#message').html("");
                $("#customized_inputs").hide();
                $('#output').html("<span class='text-red'> An error occured: " + error);
            }
        });
    } else if ($('#function-select').val() == 'montecarlo') {
        $('#message').html("<span class='text-green loadanim'>Loading Data for " + ticker + "</span><br><span class='text-yellow text-small'>This can take some time while we run all the simulations.<br>Please wait...</span>");
        // Send an AJAX request to the server
        $.ajax({
            url: '/apps/monte_carlo',
            type: 'GET',
            data: {
                ticker: ticker,
                n: 1,
                dist: $('#dist_mc').val(),
                n_sims: $('#n_sims').val(),
                n_days: $('#n_days').val()
            },
            success: function (response) {
                // Update the output div with the response from the server
                $('#message').html("");
                $('#output').html(response);
                $("#mc_inputs").show();
            },
            error: function (error) {
                $('#message').html("");
                $('#output').html("<span class='text-red'> An error occured: " + error);
            }
        });

    };
}