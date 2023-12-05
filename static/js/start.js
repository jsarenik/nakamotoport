$(document).ready(function () {
    console.log("00000080   01 04 45 54 68 65 20 54  69 6D 65 73 20 30 33 2F   ..EThe Times 03/");
    console.log("00000090   4A 61 6E 2F 32 30 30 39  20 43 68 61 6E 63 65 6C   Jan/2009 Chancel");
    console.log("000000A0   6C 6F 72 20 6F 6E 20 62  72 69 6E 6B 20 6F 66 20   lor on brink of ");
    console.log("000000B0   73 65 63 6F 6E 64 20 62  61 69 6C 6F 75 74 20 66   second bailout f");
    console.log("000000C0   6F 72 20 62 61 6E 6B 73  FF FF FF FF 01 00 F2 05   or banksÿÿÿÿ..ò.");

    satoshi_refresh();
    halving_countdown()
    estimatedNetworkFees()
    dificultyAdjustment()
    getCurrentHashrate()
    BTC_price();
    mempool_refresh();
    // Updates BTC Price every 20 seconds
    window.setInterval(function () {
        BTC_price();

    }, 60000);
    // Refresh Mempool every 1 minutes
    window.setInterval(function () {
        mempool_refresh();
        dificultyAdjustment()
        estimatedNetworkFees()
        getCurrentHashrate()
    }, 60000);


    // Principal Action
    const icon = $('#icon');
    const hi_principal = $('#hi_principal');
    let hoverTimeout;
    icon.on('mouseenter', () => {
        hoverTimeout = setTimeout(() => {
            hi_principal.addClass('visible');
        }, 10000); // 10 seconds
    });
    icon.on('mouseleave', () => {
        clearTimeout(hoverTimeout);
        if (hi_principal.hasClass('visible')) {
            hi_principal.removeClass('visible');
        }
    });
    $(document).on('mousemove', () => {
        if (hi_principal.hasClass('visible')) {
            hi_principal.removeClass('visible');
        }
    });
    // End Principal Action

});

function describeArc(x, y, radius, startAngle, endAngle) {
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
  
    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
    var d = [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  
    return d;
  }
  
  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
  
  function halving_countdown() {
    $.ajax({
      type: "GET",
      dataType: 'json',
      url: "/api/time-to-halving",
      success: function (data) {
        let { days, hours, minutes, seconds } = data;
  
        // Function to update the HTML element with the countdown
        function updateCountdown() {
          $('#halving_countdown').html(`
            <div class='countdown-wrapper'>
              <div class="countdown-item">
                ${days}
                <span>
                  days
                </span>
                <svg class='countdown-svg'>
                  <path fill="none" stroke="#FBFBFB" stroke-width="2" d="${describeArc(50, 50, 42, 0, (days / 365) * 360)}" />
                </svg>
              </div>
              <div class="countdown-item">
                ${hours}
                <span>
                  hours
                </span>
                <svg class='countdown-svg'>
                  <path fill="none" stroke="#FBFBFB" stroke-width="2" d="${describeArc(50, 50, 42, 0, (hours / 24) * 360)}" />
                </svg>
              </div>
              <div class="countdown-item">
                ${minutes}
                <span>
                  minutes
                </span>
                <svg class='countdown-svg'>
                  <path fill="none" stroke="#FBFBFB" stroke-width="2" d="${describeArc(50, 50, 42, 0, (minutes / 60) * 360)}" />
                </svg>
              </div>
              <div class="countdown-item">
                ${seconds}
                <span>
                  seconds
                </span>
                <svg class='countdown-svg'>
                  <path fill="none" stroke="#FBFBFB" stroke-width="2" d="${describeArc(50, 50, 42, 0, (seconds / 60) * 360)}" />
                </svg>
              </div>
            </div>
          `);
  
          // Decreases the counter at each interval
          seconds = (seconds - 1 + 60) % 60;
          minutes = (minutes - (seconds === 59 ? 1 : 0) + 60) % 60;
          hours = (hours - (minutes === 59 && seconds === 59 ? 1 : 0) + 24) % 24;
          days = (days - (hours === 23 && minutes === 59 && seconds === 59 ? 1 : 0));
        }
  
        setInterval(updateCountdown, 1000);
      },
      error: function (xhr, status, error) {
        $('#alerts').html("<div class='small alert alert-danger alert-dismissible fade show' role='alert'>An error occurred while refreshing data." +
          "<button type='button' class='close' data-bs-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button></div>");
        console.log(status);
      }
    });
  }
  
  

function mempool_refresh() {
    $.ajax({
        type: "GET",
        dataType: 'json',
        url: "https://mempool.space/api/blocks/tip/height",
        success: function (data) {
            $('#block_height').html("<span class='text-white nolink'>" + data.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 0, minimumFractionDigits: 0 }) + "</span>").fadeTo(100, 0.3, function () { $(this).fadeTo(500, 1.0); });
            halving = 840000
            blk = parseInt(data)
            blks = halving - blk
            days_left = parseInt(((blks) * 10 / 60 / 24))
            // find date that is days_left from now
            var d = new Date();
            d.setDate(d.getDate() + days_left);
            // Shorten date to MMM/DD/YY format
            d = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            $('#halving').html("<span class='text-green'>" + blks.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 0, minimumFractionDigits: 0 }) + " blocks left</span>").fadeTo(100, 0.3, function () { $(this).fadeTo(500, 1.0); });
            $('#days_to_halving').html("(~" + days_left.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 0, minimumFractionDigits: 0 }) + " days to go)").fadeTo(100, 0.3, function () { $(this).fadeTo(500, 1.0); });
            $('#time_halving').html("<span class='text-green'>" + d + "</span>").fadeTo(100, 0.3, function () { $(this).fadeTo(500, 1.0); });
        },
        error: function (xhr, status, error) {
            console.log("Error on fx request")
        }
    });
};


function BTC_price() {
    $.ajax({
        type: "GET",
        dataType: 'json',
        url: "/realtime_btc",
        success: function (data) {
          const arrow  =  getArrowSymbol(data['btc_24h_percentage_change']);
            if ('cross' in data) {
                sats_price = 100000000 / parseFloat(data['btc_usd']);
                $('#sats_price').html("<span class='text-green'>" + sats_price.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 0, minimumFractionDigits: 0 }) + " sats/$</span>").fadeTo(100, 0.3, function () { $(this).fadeTo(500, 1.0); });
                $('#btc_price').html(`<span class='text-green'>$  ${data['btc_usd'].toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 0, minimumFractionDigits: 0 })}  </span>`).fadeTo(100, 0.3, function () { $(this).fadeTo(500, 1.0); });
                $('#btc_variation').html(`<span class='text-green'>${arrow} ${data['btc_24h_percentage_change']}%</<span>`).fadeTo(100, 0.3, function () { $(this).fadeTo(500, 1.0); });
            } else {
                console.log("Error on FX request -- missing info")
            }

        },
        error: function (xhr, status, error) {
            console.log("Error on fx request")
        }
    });
};

function dificultyAdjustment() {
  $.ajax({
    type: "GET",
    dataType: "json",
    url: "https://mempool.space/api/v1/difficulty-adjustment",
    success: function (data) {
      const {
        previousRetarget,
        progressPercent,
        difficultyChange,
        estimatedRetargetDate,
      } = data;
      
      // Calculate the number of days remaining between the estimatedRetargetDate and the current date.
      const daysRemaining = calculateDaysRemaining(estimatedRetargetDate);

      // Determine arrow direction based on the value of difficultyChange and previousRetarget.
      const arrowDifficultyChange = getArrowSymbol(difficultyChange);
      const arrowPreviousRetarget = getArrowSymbol(previousRetarget);

      updateElement("#next_adjustments", `${Math.floor(daysRemaining)} days`);
      updateElement("#previous_adjustment", `${arrowPreviousRetarget} ${previousRetarget.toFixed(2)}%`);
      updateElement("#estimated_adjustment", `${arrowDifficultyChange} ${difficultyChange.toFixed(2)}%`);
      $("#dificulty_change").html(`
        <span class='text-green nolink float-end'>
          ${progressPercent.toFixed(2)}%
        </span>
        <div class="task-progress">
          <progress class="progress" max="100" value="${progressPercent.toFixed(2)}"></progress>
        </div>
      `).fadeTo(100, 0.3, function () { $(this).fadeTo(500, 1.0); });
    },
    error: function (error) {
      console.error("Error on request:", error);
    },
  });
}

function getCurrentHashrate() {
  $.ajax({
    type: "GET",
    dataType: "json",
    url: "https://mempool.space/api/v1/mining/hashrate/3d",
    success: function (data) {
      const { currentHashrate } = data

      // Convert currentHashrate from exahashes to a smaller unit
      const hashrateToEH = currentHashrate / 10 ** 18;
      const hasrateFixedTo2 = hashrateToEH.toFixed(2);

      updateElement("#current_hashrate", `${hasrateFixedTo2} EH/s`);
    },
    error: function (error) {
      console.error("Error on request:", error);
    },
  });
}

function estimatedNetworkFees() {
  $.ajax({
    type: "GET",
    dataType: "json",
    url: "https://mempool.space/api/v1/fees/recommended",
    success: function (data) {
      // Update the displayed fee values using the updateElement function
      updateElement("#fastest_fee", `${data.fastestFee} sat/vB`);
      updateElement("#one_hour_fee", `${data.hourFee} sat/vB`);
      updateElement("#half_hour_fee", `${data.halfHourFee} sat/vB`);
      updateElement("#minimum_fee", `${data.minimumFee} sat/vB`);
    },
    error: function (xhr, status, error) {
      console.error("Error on fx request");
    },
  });
}


function satoshi_refresh() {
    $.ajax({
        type: 'GET',
        url: '/api/satoshi_quotes_json',
        dataType: 'json',
        success: function (data) {
            // Parse data
            $('#satoshi_loading').hide();
            $('#quote_section').show();
            $('#load_quote').html(data['text']);
            $('#load_source').html(data['medium']);
            $('#load_date').html(data['date']);
            $('#subject').html(data['category']);
            $('#refresh_button').html('Refresh');
            $('#refresh_button').prop('disabled', false);

        },
        error: function (xhr, status, error) {
            console.log(status);
            console.log(error);
            $('#alerts').html("<div class='small alert alert-danger alert-dismissible fade show' role='alert'>An error occured while refreshing data." +
                "<button type='button' class='close' data-bs-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button></div>")
            $('#refresh_button').html('Refresh Error. Try Again.');
            $('#refresh_button').prop('disabled', false);
        }

    });

}

function getArrowSymbol(value) {
  return value >= 0 ? '<i class="fa-solid fa-arrow-up text-green"></i>' : '<i class="fa-solid fa-arrow-down text-red"></i>';
}

// Function to calculate the number of days remaining between estimatedRetargetDate and the current date
function calculateDaysRemaining(estimatedRetargetDate) {
  const timestamp = estimatedRetargetDate / 1000;
  const dataTimestamp = new Date(timestamp * 1000);
  const currentData = new Date();
  const difference = dataTimestamp - currentData;
  return Math.floor(difference / (1000 * 60 * 60 * 24));
}

// Function to update an HTML element's content based on a selector with specified content
function updateElement(selector, content) {
  $(selector).html(`
    <span class='text-green nolink'>
      ${content}
    </span>
  `).fadeTo(100, 0.3, function () { $(this).fadeTo(500, 1.0); });
}
