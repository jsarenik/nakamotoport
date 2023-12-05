$(document).ready(function () {
    get_zip_data();
    $("#zipcode").on("input", function () {
        get_zip_data();
    });
});

function get_zip_data() {
    var delayTimer;
    clearTimeout(delayTimer);
    delayTimer = setTimeout(function () {
        var zipcode = $("#zipcode").val();
        if (zipcode == '') {
            zipcode = '00000';
        };
        $.ajax({
            url: '/api/find_zip_code/' + zipcode,
            type: 'GET',
            success: function (response) {
                var data = response[0];  // we only want the first item in the returned array
                var distance = response[1];
                var table = '<span class="text-purple">' + data.name + '</span>&nbsp;<span class="float-end text-small text-muted">(' + data.ticker + ')</span><br>';
                table += '<span class="text-small">' + data.description + '</span>';
                if (distance < 99999999999998) {
                    table += '<br><span class="text-small"><i class="fa-solid fa-location-dot text-yellow"></i>&nbsp;' + formatNumber(distance, 0) + ' miles from your ZIP Code</span>';
                };

                $('#zip_code_info').html(table);
                $('#property_tax').val(formatNumber(data.property_tax * 100, 2));
            },
            error: function (error) {
                console.log(error);
                $('#zip_code_info').html('<p>An error occurred while fetching data.</p>');
            }
        });

    }, 1000);  // wait for 1 sec delay before making ajax request
}