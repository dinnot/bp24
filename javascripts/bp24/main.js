function data_validation() {
    for (var i = 1; i <= 30; i++) team_data_validation(i);
}

function team_data_validation(team_nr) {
    var data = bp_teams[team_nr]["Competitors"][0];
    if (data["CompetitorNumber"] != team_nr) console.log("Data error: team number doesn't match", data["CompetitorNumber"], team_nr);
    var laps = data["Laps"];
    for (var i = 0; i < laps.length; i++) {
        if (laps[i]["LapTime"] === undefined) {
            if (i > 0) {
                laps[i]["LapTime"] = laps[i-1]["LapTime"];
                laps[i]["Split1Time"] = laps[i-1]["Split1Time"];
                laps[i]["Split2Time"] = laps[i-1]["Split2Time"];
                laps[i]["Split3Time"] = laps[i-1]["Split3Time"];
            } else if (i < laps.length - 1) {
                laps[i]["LapTime"] = laps[i+1]["LapTime"];
                laps[i]["Split1Time"] = laps[i+1]["Split1Time"];
                laps[i]["Split2Time"] = laps[i+1]["Split2Time"];
                laps[i]["Split3Time"] = laps[i+1]["Split3Time"];
            }
            if (laps[i]["LapTime"] === undefined) console.log ("Data error: invalid lap", team_nr, i);
        }
        if (laps[i]["Position"] === undefined) {
            if (i > 0) laps[i]["Position"] = laps[i-1]["Position"];
            else if(i < laps.length - 1) laps[i]["Position"] = laps[i+1]["Position"];
            if (laps[i]["Position"] === undefined) console.log ("Data error: invalid lap", team_nr, i);
        }
        if (laps[i]["Split1Time"] === undefined) {
            if (laps[i]["Split2Time"] !== undefined && laps[i]["Split3Time"] !== undefined) {
                laps[i]["Split1Time"] = laps[i]["LapTime"] - laps[i]["Split2Time"] - laps[i]["Split3Time"];
            } else if (i > 0) {
                laps[i]["Split1Time"] = laps[i-1]["Split1Time"];
            } else if (i < laps.length - 1) {
                laps[i]["Split1Time"] = laps[i+1]["Split1Time"];
            }
            if (laps[i]["Split1Time"] === undefined) console.log ("Data error: invalid lap", team_nr, i);
        }
        if (laps[i]["Split2Time"] === undefined) {
            if (laps[i]["Split3Time"] !== undefined) {
                laps[i]["Split2Time"] = laps[i]["LapTime"] - laps[i]["Split1Time"] - laps[i]["Split3Time"];
            } else if (i > 0) {
                laps[i]["Split2Time"] = laps[i-1]["Split2Time"];
            } else if (i < laps.length - 1) {
                laps[i]["Split2Time"] = laps[i+1]["Split2Time"];
            }
            if (laps[i]["Split2Time"] === undefined) console.log ("Data error: invalid lap", team_nr, i);
        }
        if (laps[i]["Split3Time"] === undefined) {
            laps[i]["Split3Time"] = laps[i]["LapTime"] - laps[i]["Split1Time"] - laps[i]["Split2Time"];
        }
    }
}

function format_notification_text(type) {
    switch (type) {
    case 1:
        return "Cone warning";
    case 2:
        return "Kerb warning";
    case 3:
        return "Contact warning";
    case 4:
        return "Warning";
    case 5:
        return "Black flag";
    case 6:
        return "Cone Penalty";
    case 9:
        return "Penalty";
    case 10:
        return "Mechanical flag";
    case 27:
        return "Knob warning";
    case 28:
        return "Visor warning";
    case 36:
        return "Drive through penalty";
    case 37:
        return "Track limit warning";
    case 101:
        return "Red Flag";
    case 102:
        return "Restart";
    case 103:
        return "Race Start";
    case 104:
        return "False Start";
    case 105:
        return "Chequered Flag";
    case 107:
        return "Full Course Yellow";
    case 108:
        return "Full Course Yellow END"
    }
}

function paceAround(laps, idx) {
    var start = idx - 2;
    var end = idx + 3; 
    if (start < 0) {
        start = 0;
        end += 2;
    }
    if (end >= laps.length)  {
        end = laps.length - 1;
        start = end - 5;
        if (start < 0) start = 0;
    }
    var min = laps[start]["LapTime"];
    for (var i = start + 1; i <= end; i++) {
        if (min > laps[i]["LapTime"]) min = laps[i]["LapTime"];
    }
    return min;
}

function paceAroundType(laps, idx, type) {
    var start = idx - 2;
    var end = idx + 3; 
    if (start < 0) {
        start = 0;
        end += 2;
    }
    if (end >= laps.length)  {
        end = laps.length - 1;
        start = end - 5;
        if (start < 0) start = 0;
    }
    var min = laps[start][type];
    for (var i = start + 1; i <= end; i++) {
        if (min > laps[i][type]) min = laps[i][type];
    }
    return min;
}

function paceS3Around(laps, idx) {
    var start = idx - 2;
    var end = idx + 3; 
    if (start < 0) {
        start = 0;
        end += 2;
    }
    if (end >= laps.length)  {
        end = laps.length - 1;
        start = end - 5;
        if (start < 0) start = 0;
    }
    var min = laps[start]["Split3Time"];
    for (var i = start + 1; i <= end; i++) {
        if (min > laps[i]["Split3Time"]) min = laps[i]["Split3Time"];
    }
    return min;
}

function prettyTime(time) {
    var sign = "";
    if (time < 0) {
        time = -time;
        sign='-';
    }
    var minutes = parseInt(time / 60_000);
    var seconds = parseInt((time - minutes * 60_000) / 1000);
    var ms = time % 1000;
    if (ms < 10) ms = `00${ms}`;
    else if (ms < 100) ms = `0${ms}`;
    if (minutes > 0) return `${sign}${minutes}m${seconds}.${ms}`;
    else return `${sign}${seconds}.${ms}`;
}

function prettyTimeline(time) {
    var hours = parseInt(time / 3600_000);
    var minutes = parseInt((time - hours * 3600_000) / 60_000);
    return `${hours}h${minutes}m`;
}

function build_events() {
    bp_events = [];
    // notifications
    for (var i = 0; i < bp_notifications.m.length; i++) {
        var notif = bp_notifications.m[i];
        var kart = notif.cnu === undefined ? undefined : parseInt(notif.cnu);
        var value = format_notification_text(notif.nt);
        if (kart !== undefined && kart !== NaN && value !== undefined) {
            if (notif.t !== undefined && notif.t !== "") value = `${value} (${notif.t})`;
            var event_time = (new Date(notif.tc) - new Date("2024-04-27T13:29:54.275041Z"));
            bp_events.push({type: 'race_directive', kart: kart, time: event_time, value: value});
        }
    }

    // laps
    for (var i = 1; i <= 30; i++) {
        var data = bp_teams[i]["Competitors"][0];
        var laps = data["Laps"];
        var lapse = 0;
        for (var j = 0; j < laps.length; j++) {
            var lt = laps[j]["LapTime"];
            lapse += lt;
            if (j < 2) continue;
            var pace = paceAround(laps, j);
            var diff = lt - pace;
            var s3Pace = paceS3Around(laps, j);
            var diffS3 = laps[j]["Split3Time"] - s3Pace;
            if (diffS3 > 5 * 60_000) {
                bp_events.push({type: 'lap_event', kart: i, time: lapse, value: `Service stop (+${prettyTime(diffS3)})`});
            } else if (diffS3 > 10_000) {
                bp_events.push({type: 'lap_event', kart: i, time: lapse, value: `Pit stop (+${prettyTime(diffS3)})`});
            } else if (diff > 4_000) {
                bp_events.push({type: 'lap_event', kart: i, time: lapse, value: `Slow lap (+${prettyTime(diff)})`});
            }
        }
    }

    // sort
    bp_events.sort((a, b) => a.time - b.time);
}

function teamSelected(team) {
    var html = `
        <table class="table">
            <thead>
                <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Event</th>
                </tr>
            </thead>
            <tbody>`;
    var events = bp_events.filter (e => e.kart == team);
    for (var i = 0; i < events.length; i++) {
        html += `<tr><td>${prettyTimeline(events[i].time)}</td><td>${events[i].value}</td></tr>`;
    }
    html += `</tbody></table>`;
    $('#team-events').html(html);
}

function minIdxFromArray(array) {
    var min = 1;
    for (var i = 2; i <= 30; i++) if (array[i] < array[min]) min = i;
    return min;
}

function medianFromArray(array) {
    var cpy = [...array];
    cpy.sort();
    return (cpy[14] + cpy[15]) / 2;
}

function getCompetitorOverall(kart) {
    return bp_overall["Competitors"].filter(c => c["CompetitorNumber"] == kart)[0];
}

function computePerfectPace() {
    var lapTimes = [];
    var totalTime = [];
    var indexes = [];
    var result = { ideal: {}, median: {}};
    for (var i = 1; i <= 30; i++) {
        indexes[i] = 0;
    }
    const fLaps = (i) => bp_teams[i]["Competitors"][0]["Laps"];
    for (var i = 1; i <= 30; i++) {
        indexes[i] = 0;
        lapTimes[i] = fLaps(i)[0]["LapTime"];
        totalTime[i] = lapTimes[i];
    }
    var done = false;
    while (!done) {
        var idealPace = lapTimes[minIdxFromArray(lapTimes)];
        var medianPace = medianFromArray(lapTimes);
        var next = minIdxFromArray(totalTime);
        if (totalTime[next] == Infinity) {
            done = true;
            break;
        }
        result.ideal[totalTime[next]] = idealPace;
        result.median[totalTime[next]] = medianPace;
        indexes[next]++;
        if (fLaps(next).length <= indexes[next]) {
            totalTime[next] = Infinity;
        } else {
            lapTimes[next] = fLaps(next)[indexes[next]]["LapTime"];
            totalTime[next] += lapTimes[next];
        }
    }
    return result;
}

function buildStintsTimeline() {
    const idealPace = computePerfectPace();
    var sPerPx = 5_000;
    var html = '';
    html += `<div style='width:${parseInt(24 * 3600_000 / sPerPx) + 351}px;border: 1px solid black;height: 102px; margin: 0px; padding: 0px;'>
        <div style='width: 250px; max-width: 250px; display: inline-block; overflow: hidden;'>Team</div>`
        for (var i = 1; i <= 24; i++) {
            html += `<div style='width: ${parseInt(3600_000 / sPerPx) - 1}px; max-width: ${parseInt(3600_000 / sPerPx) - 1}px; display: inline-block; overflow: hidden; min-height: 100px; margin: 0px; padding: 0px; border-left: 1px solid black'>Hour ${i}</div>`;
        }
    html += `</div>`
    for (var i = 1; i <= 30; i++) {
        if (!$(`#stl-team-${i}`)[0].checked) continue;
        const overall = getCompetitorOverall(i);
        var data = bp_teams[i]["Competitors"][0];
        html += `<div style='width:${parseInt(24 * 3600_000 / sPerPx) + 351}px;border: 1px solid black;height: 102px; margin: 0px; padding: 0px;'><div style='width: 250px; max-width: 250px; display: inline-block; overflow: hidden;'>${data["CompetitorName"]}<br />${overall["GridPosition"]} -> ${overall["Position"]}</div>`;
        var laps = data["Laps"];
        var lapse = 0;
        var no_laps = 0;
        var lost = 0;
        var totalTime = 0;
        var totalIdeal = 0;
        var totalMedian = 0;
        var startPos = -1;
        for (var j = 0; j < laps.length; j++) {
            var lt = laps[j]["LapTime"];
            totalTime += lt;
            lapse += lt;
            no_laps++;
            if (startPos == -1) startPos = laps[j]["Position"];
            totalIdeal += idealPace.ideal[totalTime];
            totalMedian += idealPace.median[totalTime];
            if (j < 2) continue;
            var pace = paceAround(laps, j);
            var diff = lt - pace;
            var s3Pace = paceS3Around(laps, j);
            var diffS3 = laps[j]["Split3Time"] - s3Pace;
            if (diffS3 > 10_000) {
                // stop stint
                lapse -= diffS3;
                var px = parseInt((lapse + lost ) / sPerPx);
                var sPace = parseInt(lapse / no_laps);
                var overallPace = parseInt((lapse + lost) / no_laps);
                var iPace = parseInt(totalIdeal / no_laps);
                var mPace = parseInt(totalMedian / no_laps);
                var endPos = laps[j-1]["Position"];
                html += `<div style='width: ${px}px; max-width: ${px}px; display: inline-block; overflow: hidden; background-color: cornsilk;min-height: 100px;max-height:100px; margin: 0px; padding: 0px;'>${data["CompetitorName"]}<br />Stint ${prettyTimeline(lapse)} (${startPos} -> ${endPos})<br />${no_laps} laps @ ${prettyTime(overallPace)}<br />${prettyTime(overallPace - iPace)} from perfect pace / ${prettyTime(overallPace - mPace)} from median pace</div>`;
                if (diffS3 > 5 * 60_000) {
                    // service stop
                    var ppx = parseInt(diffS3 / sPerPx);
                    html += `<div style='width: ${ppx}px; max-width: ${ppx}px; display: inline-block; overflow: hidden; background-color: coral; min-height: 100px; margin: 0px; padding: 0px;'>SS</div>`;
                } else {
                    // pit stop
                    const wasBlackFlag = bp_events.filter(e => e.type == 'race_directive' && e.kart == i && e.value.indexOf("Black flag") > -1 && e.time < totalTime && e.time > totalTime - 5 * 60_000).length > 0;
                    var ppx = parseInt(diffS3 / sPerPx);
                    html += `<div style='width: ${ppx}px; max-width: ${ppx}px; display: inline-block; overflow: hidden;background-color: ${wasBlackFlag ? "black" : "aquamarine"}; min-height: 100px; margin: 0px; padding: 0px;'>PS</div>`;
                }
                no_laps = 0;
                totalIdeal = 0;
                totalMedian = 0;
                lapse = 0;
                lost = 0;
                startPos = -1;
            } else if (diff >= 4_000) {
                // slow lap
                lapse -= diff;
                lost += diff;
            }
        }
        if (no_laps > 0) {
            var px = parseInt((lapse + lost ) / sPerPx);
            var sPace = parseInt(lapse / no_laps);
            var overallPace = parseInt((lapse + lost) / no_laps);
            var iPace = parseInt(totalIdeal / no_laps);
            var mPace = parseInt(totalMedian / no_laps);
            var endPos = overall["Position"];
            html += `<div style='width: ${px}px; max-width: ${px}px; display: inline-block; overflow: hidden; background-color: cornsilk;min-height: 100px;max-height:100px; margin: 0px; padding: 0px;'>${data["CompetitorName"]}<br />Stint ${prettyTimeline(lapse)} (${startPos} -> ${endPos})<br />${no_laps} laps @ ${prettyTime(overallPace)}<br />${prettyTime(overallPace - iPace)} from perfect pace / ${prettyTime(overallPace - mPace)} from median pace</div>`;
        }
        html += `</div>`;
    }
    $('#stint-timeline').html(html);
}

var chart = null;

function setupChart() {
    const ctx = document.getElementById('myChart');
    chart =
        new Chart(ctx, {
            type: 'line',
            data: {
                datasets: []
            },
            options: {
                scales: {
                    x: {
                        type: 'linear',
                        ticks: {
                            // Include a dollar sign in the ticks
                            callback: function(value, index, ticks) {
                                return prettyTimeline(value);
                            }
                        }
                    },
                    y: {
                        min: 48,
                        max: 80,
                    }
                },
                plugins: {
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: false
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                    }
                },
                transitions: {
                    zoom: {
                        animation: {
                            duration: 0
                        }
                    },
                }
            }
        });
        var html = '';
        for (var i = 0; i < 24 * 3600_000; i += 15 * 60_000) {
            html += `<option ${i === 0 ? 'selected' : ''} value='${i}'>${prettyTimeline(i)}</option>`;
        }
        $('#pace-chart-start').html(html);
        html = '';
        for (var i = 15 * 60_000; i <= 24 * 3600_000; i += 15 * 60_000) {
            html += `<option ${i === 2 * 3600_000 ? 'selected' : ''} value='${i}'>${prettyTimeline(i)}</option>`;
        }
        $('#pace-chart-end').html(html);
        html = `<div class="col" style="white-space: nowrap"><label for="pace-chart-team-median">MEDIAN PACE</label> <input id="pace-chart-team-median" type="checkbox" checked /></div>`
        for (var i = 1; i <= 30; i++) {
            html += `<div class="col" style="white-space: nowrap"><label for="pace-chart-team-${i}">${bp_teams[i]["Competitors"][0]["CompetitorName"]}</label> <input id="pace-chart-team-${i}" type="checkbox" checked /></div>`
        }
        $('#pace-chart-teams').html(html);
        buildChartData(0, 2 * 3600_000, "LapTime");
}

function buildChartData(startTime, endTime, type) {
    const elite_color = '49, 157, 173';
    const pro_color = '191, 21, 66';
    const academy_color = '28, 28, 26'; 
    const colors = ['230, 149, 245', '245, 149, 199', '168, 149, 245', '149, 163, 245', '149, 245, 176', '210, 245, 149', '240, 245, 149', '245, 216, 149', '245, 184, 149', '245, 160, 149']
    chart.data.datasets = [];
    var minLt = Infinity;
    var maxLt = 0;
    var includeTrs = type === "LapTime" ? 5000 : 3000;
    if ($('#pace-chart-team-median')[0].checked) {
        var pace = computePerfectPace();
        var median = [];
        for(var t in pace.median) median.push({ time: parseInt(t), lap: pace.median[t]});
        median.sort((a, b) => a.time - b.time);
        var points = [];
        for(var i = 0; i < median.length; i+= 90) {
            var sumTime = 0, sumLap = 0, count = 0;
            for (var j = i; j < i + 90 && j < median.length; j++) {
                sumTime += median[j].time;
                sumLap += median[j].lap;
                count++;
            }
            var totalTime = parseInt(sumTime / count);
            if (totalTime > endTime) break;
            if (totalTime < startTime) continue;
            points.push({
                x: totalTime,
                y: sumLap / count / 1000,
            });
        }
        chart.data.datasets.push({
            label: `MEDIAN`,
            data: points,
            borderColor: `rgb(61, 82, 70)`,
            backgroundColor: `rgba(61, 82, 70, 0.5)`,
            pointStyle: 'rect',
        });
    }
    for (var i = 1; i <= 30; i++) {
        if (!$(`#pace-chart-team-${i}`)[0].checked) continue;
        const overall = getCompetitorOverall(i);
        var data = bp_teams[i]["Competitors"][0];
        var name = data["CompetitorName"];
        var driverClass = overall["CompetitorSubClass"];
        var pos = overall["Position"];
        var laps = data["Laps"];
        var points = [];
        var totalTime = 0;
        // var color = driverClass === "Pro" ? "230, 149, 245" : "255, 205, 86";
        var color = colors[(pos - 1) % 10];
        if (i == 2) color = elite_color; // elite
        if (i == 6) color = pro_color; // pro
        if (i == 18) color = academy_color; // academy
        for (var j = 0; j < laps.length; j++) {
            var lt = laps[j]["LapTime"];
            var tt = laps[j][type];
            totalTime += lt;
            if (totalTime > endTime) break;
            if (totalTime < startTime) continue;
            if (tt < minLt) minLt = tt;
            var pace = paceAroundType(laps, j, type);

            if (tt - pace <= includeTrs) {
                if (tt > maxLt) maxLt = tt;
            }
            points.push({
                x: totalTime,
                y: tt / 1000
            });
        }
        chart.data.datasets.push({
            label: `P${pos}:${name}`,
            data: points,
            borderColor: `rgb(${color})`,
            backgroundColor: `rgba(${color}, 0.5)`,
            pointStyle: (i === 2 || i === 6 || i === 18) ? 'circle' : 'cross',
        });
    }
    chart.options.scales.y.min = parseInt(minLt/1000);
    chart.options.scales.y.max = parseInt(maxLt/1000);
    chart.update('none');
    chart.resetZoom();
}

function init() {
    build_events();
    var html = '<option selected value="0">Select team</option>';
    for (var i = 1; i <= 30; i++) {
        html += `<option value="${i}">${bp_teams[i]["Competitors"][0]["CompetitorName"]}</option>`;
    }
    $('#team-select').html(html);

    html = '';
    for (var i = 1; i <= 30; i++) {
        html += `<div class="col" style="white-space: nowrap"><label for="stl-team-${i}">${bp_teams[i]["Competitors"][0]["CompetitorName"]}</label> <input id="stl-team-${i}" type="checkbox" checked onchange='buildStintsTimeline()' /></div>`
    }
    $('#stint-timeline-inputs').html(html);

    buildStintsTimeline();
    setupChart();
}

data_validation();
init();