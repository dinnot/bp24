function obj2Array(obj) {
    const arr=[]; 
    for(var i in obj) arr.push({
        key:i, 
        value:obj[i]
    }); 
    return arr;
}

function isHarlowRegionalTrack(track) {
    return track.toLowerCase() === 'dunstable'
        || track.toLowerCase() === 'brighton'
        || track.toLowerCase() === 'crawley'
        || track.toLowerCase() === 'edmonton';
}

function isLocal2025(entry) {
    return entry.year === 2025 && entry.stage === 'locals';
}

function validDriver(entries, category) {
    return entries.filter(e => isHarlowRegionalTrack(e.track) && isLocal2025(e) && e.category.toLowerCase() === category).length > 0;
}

function buildDriversMap(data) {
    const drivers = {}; 
    for(var i = 0; i < data.length; i++) { 
        var r = data[i]; 
        var split=r.name.split(' '); 
        var alias=`${split[0]} ${split[split.length-1]}`.toLowerCase(); 
        if(drivers[alias] === undefined) drivers[alias] = [];
        drivers[alias].push(r);
    }
    return drivers;
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function find_kart(laps) {
    var karts = {};
    for(var i = 0; i < laps.length; i++) {
        if (karts[laps[i].kart] === undefined) karts[laps[i].kart] = 0;
        karts[laps[i].kart]++;
    }
    var max = 0, maxK = 0;
    for (var k in karts) {
        if (karts[k] > max) {
            max = karts[k];
            maxK = k;
        }
    }
    return maxK;
}

function best_lap(laps) {
    return laps.map(l => l.time).reduce((a,b) => Math.min(a,b));
}

function avg_lap(laps) {
    var sum = laps.map(l => l.time).reduce((a,b) => a+b);
    return parseInt(sum / laps.length);
}

function buildSessions(data) {
    const sessions = {};
    for(var i = 0; i < data.length; i++) {
        const lap = data[i];
        const date = formatDateTime(parseInt(lap.heat_start)*1000);
        const key = `${date} ${lap.heat_name}`;
        if (sessions[key] === undefined) {
            sessions[key] = {
                date: date,
                name: lap.heat_name,
                type: lap.heat_mode == 1 ? 'best time' : 'race',
                timestamp: parseInt(lap.heat_start),
                drivers: {}
            };
        }
        const session = sessions[key];
        if (session.drivers[lap.driver_name] === undefined) {
            session.drivers[lap.driver_name] = {
                name: lap.driver_name,
                laps: [],
            };
        }
        const driver = session.drivers[lap.driver_name];
        if (driver.laps.find(l => l.lap === lap.lap) !== undefined) continue;
        driver.laps.push({
            lap: lap.lap,
            kart: lap.kart,
            time: lap.lap_time,
            position: lap.position,
            gap: lap.gap
        });
    }

    const result = [];
    for (var s in sessions) {
        const session = sessions[s];
        const drivers = [];
        for(var d in session.drivers) {
            const driver = session.drivers[d];
            driver.no_laps = driver.laps.length;
            driver.kart = find_kart(driver.laps);
            driver.best_time = best_lap(driver.laps);
            driver.avg_time = avg_lap(driver.laps);
            driver.laps.sort((a, b) => a.lap - b.lap);
            drivers.push(driver);
        }
        session.drivers = drivers;
        result.push(session);
    }
    return result.sort((a,b)=>b.timestamp-a.timestamp);
}

function getAliases(name) {
    name = name.toLowerCase();
    const aliases_predefined = {
        'bradley philpot': ['brad philpot'],
        'keira mcewan': ['keira'],
        'lucas vintu-onac': ['lucas.v-o'],
        'george gorzynski': ['mr prolaps'],
        'ollie j': ['oliver.j'],
        'nari tiwari': ['nari'],
        'kaylam beddoe': ['kaylam'],
        'tim love': ['tim 🎸'],
        'anthony anderson': ['anthony'],
        'sophia l': ['sophia🏎️ l'],
        'max mottram': ["max"],
        'william hunddleston': ['595'],
        'taylor barnes': ['barnzeejnr'],
        'arniush o': ['آرنیوش'],
        'william a': ['will'],
        'oliver c': ['olsy bo (knr)'],
        'khilesh raudhay': ['theduckwhoknocks', 'i love aladin <3'],
        'charlie jackson': ['(h) charlie.j [ecr]'],
        'adam tomory': ['can i go faster????'],
    };
    const aliases = [];
    if (aliases_predefined[name] !== undefined) {
        for(var i = 0; i < aliases_predefined[name].length; i++) {
            aliases.push(aliases_predefined[name][i]);
        }
    }
    aliases.push(name);
    var splits = name.split(' ');
    if (splits.length == 1) {
        aliases.push(splits[0]);
    } else {
        if (splits[splits.length-1].length === 1) {
            aliases.push(`${splits[0]} ${splits[splits.length-1]}%`);
        }
        aliases.push(`${splits[0]} ${splits[splits.length-1]}`);
        aliases.push(`${splits[0]}.${splits[splits.length-1]}`);
        if (!name.includes('mottram') && !name.includes("archie cole")) {
            aliases.push(`${splits[0]} ${splits[splits.length-1][0]}`);
            aliases.push(`${splits[0]}.${splits[splits.length-1][0]}`);
        }
        if (splits[splits.length-1].length > 1) {
            aliases.push(`${splits[0][0]} ${splits[splits.length-1]}`);
            aliases.push(`${splits[0][0]}.${splits[splits.length-1]}`);
        }
    }
    return aliases;
}

function getTag(name) {
    switch(name.toLowerCase()) {
        case "maxwell":
        case "noah***": 
            return "local-J";
        case "robo":
            return "local-L";
        case "theduckwhoknocks":
        case "can i go faster????":
        case "آرنیوش":
            return "edmonton-?";
        case "not the track manager":
        case "bb-viper":
        case "kyleimfinnagone":
        case "r1":
        case "simsimma 🏎️💨":
        case "marmoush𓅱𓅓𓄿𓂋𓐍𓅂𓃭𓋴𓉔𓅂𓂋𓇋𓆑":
        case "nas da third":
        case "z1959":
        case "sheikh rayman of rizzland**":
        case "theblackone":
        case "vimto nas still":
        case "grid girls galore":
        case "loski's loosest":
        case "the legal illegal one":
        case "":
        case "":
        case "":
            return "staff";
        default:
            return "";
    }
}

function isNameMatch(name, search) {
    name = name.toLowerCase();
    search = search.toLowerCase();
    if (search.endsWith('%')) {
        search = search.substring(0, search.length - 1);
        if (name.includes(search)) return true;
    }
    if (name === search) return true;
    if (name.endsWith(search)) return true;
    if (name.includes(search + " ")) return true;
    return false;
}

function isNameMatchWithAliases(name, search) {
    const aliases = getAliases(search);
    for (var i = 0; i < aliases.length; i++) {
        if (isNameMatch(name, aliases[i])) return true;
    }
    return false;
}

function getSessionDriverWithName(session, name) {
    return session.drivers.find(driver => isNameMatchWithAliases(driver.name, name));
}

function getSessionDriverWithExactName(session, name) {
    return session.drivers.find(driver => driver.name === name);
}

function sessionsWithDriver(sessions, name) {
    return sessions.filter(session => getSessionDriverWithName(session, name) !== undefined);
}

function sessionsWithExactDriver(sessions, name) {
    return sessions.filter(session => getSessionDriverWithExactName(session, name) !== undefined);
}

function getPosition(number){ 
    if (number === 1) return '1st';
    else if (number === 2) return '2nd';
    else if (number === 3) return '3rd';
    else return `${number}th`;
}

function getBikcTag(entry) {
    return `${entry.year} ${entry.stage} ${getPosition(entry.place)} (${entry.track}, ${entry.category})`;
}

function getRoundPoints(entry) {
    var points = 10 - entry.place;
    if (entry.stage === 'regionals') points*= 3;
    else if (entry.stage === 'nationals') points*= 9;
    return points;
}

function buildDriver(driver, sessions) {
    var result = {
        name: driver.value[0].name
    };
    var driverSessions = sessionsWithDriver(sessions, result.name);
    result.no_sessions = driverSessions.length;
    result.best_time = result.no_sessions > 0 ? driverSessions.map(s => getSessionDriverWithName(s, result.name).best_time).reduce((a,b) => Math.min(a,b)) : 0;
    result.rounds = driver.value.map(v => getBikcTag(v));
    result.round_points = driver.value.map(v => getRoundPoints(v)).reduce((a,b) => a+b);
    return result;
}

function getSessionType(sessionName) {
    sessionName = sessionName.toLowerCase();
    if (sessionName.includes('adult')) return 'adult';
    else if (sessionName.includes('family')) return 'family';
    else if (sessionName.includes('kids')) return 'family';
    else if (sessionName.includes('academy')) return 'family';
    else return 'members';
}

function buildKartPace(driverType, dateCutoff) {
    var drivers = getDriversByType(driverType, dateCutoff);
    var simTimes = buildSimulatedKartTimes(drivers);
    var results = undefined;
    for (var i in simTimes) {
        if (results === undefined) results = simTimes[i];
        var good = true;
        for (var j in simTimes) {
            if (simTimes[i][j] > 0) good = false;
        }
        if (good) results = simTimes[i];
    }
    for (var i in results) {
        results[i] = parseInt(Math.round(0 - results[i]));
    }
    return results;
}

function getKartStats(lapType, sessionType, timeCutoff, dateCutoff, driverType) {
    const kartsMap = {};
    timeCutoff = parseInt(timeCutoff) * 1000;
    for(var i = 0; i < sessions.length; i++) {
        const st = getSessionType(sessions[i].name);
        if (sessionType === 'members' && st !== 'members') continue;
        else if (sessionType === 'adult' && st === 'family') continue;
        if (dateCutoff > sessions[i].timestamp) continue;
        var validDrivers = sessions[i].drivers;
        if (driverType !== "all") {
            var expectedDrivers = all_drivers;
            if (driverType === "juniors") expectedDrivers = juniors;
            else if (driverType === "lightweights") expectedDrivers = lightweights;
            else if (driverType === "middleweights") expectedDrivers = middleweights;
            else if (driverType === "heavyweights") expectedDrivers = heavyweights;
            validDrivers = validDrivers.filter(d => expectedDrivers.find(ed => isNameMatchWithAliases(d.name, ed.name)) !== undefined)
        }
        var laps = [];
        if (lapType === 'all') laps = validDrivers.map(d => d.laps).flatMap(d => d);
        else laps = validDrivers.map(d => d.laps.reduce((a,b) => a.time < b.time ? a : b));
        for (var j = 0; j < laps.length; j++) {
            if (timeCutoff > 0 && laps[j].time >= timeCutoff) continue;
            if (isNaN(laps[j].kart)) continue;
            if (kartsMap[laps[j].kart] === undefined) {
                kartsMap[laps[j].kart] = {
                    count: 0,
                    sum: 0,
                    best: Infinity,
                }
            }
            kartsMap[laps[j].kart].count++;
            kartsMap[laps[j].kart].sum += laps[j].time;
            kartsMap[laps[j].kart].best = Math.min(kartsMap[laps[j].kart].best, laps[j].time);
        }
    }
    var simPace = buildKartPace(driverType, dateCutoff);
    const karts = [];
    for(var k in kartsMap) {
        if (k === null || k === 'null') continue;
        karts.push({
            kart: k,
            count: kartsMap[k].count,
            avg: parseInt(kartsMap[k].sum / kartsMap[k].count),
            best: kartsMap[k].best,
            simPace: simPace[k]
        });
    }
    karts.sort((a, b) => a.avg - b.avg);
    return karts;
}

function median(array) {
    array.sort((a,b) => a-b);
    var half = Math.floor(array.length / 2);
    if (array.length % 2 === 1) return array[half];
    return (array[half - 1] + array[half]) / 2;
}

function buildNonBikcDrivers(bikc_drivers, lapData) {
    var fastDrivers = Array.from(new Set(lapData.filter(l => l.lap_time < 33500).map(l => l.driver_name)));
    var nonBikc = [];
    for(var i = 0; i < fastDrivers.length; i++) {
        //exclude bikc
        if (bikc_drivers.find(b => isNameMatchWithAliases(fastDrivers[i], b.name)) !== undefined) continue;
        var result = {
            name: fastDrivers[i]
        };
        var driverSessions = sessionsWithExactDriver(sessions, result.name);
        result.no_sessions = driverSessions.length;
        result.best_time = result.no_sessions > 0 ? driverSessions.map(s => getSessionDriverWithExactName(s, result.name).best_time).reduce((a,b) => Math.min(a,b)) : 0;
        result.rounds = [];
        result.round_points = 0;
        nonBikc.push(result);
    }
    return nonBikc;
}

function bestLapInKarts(name, exact, dateCutoff) {
    var sessionsAfterDate = sessions.filter(s => s.timestamp >= dateCutoff);
    var s = exact ? sessionsWithExactDriver(sessionsAfterDate, name) : sessionsWithDriver(sessionsAfterDate, name);
    s = s.map(s => exact ? getSessionDriverWithExactName(s, name) : getSessionDriverWithName(s, name));
    s = s.map(l => l.laps)
        .flatMap(x => x)
        .reduce((r, v) => { 
            if (v.kart != null) {
                var x = r.find(t => t.kart === v.kart); 
                if(x === undefined) r.push({ kart: v.kart, time: v.time }); 
                else x.time=Math.min(x.time, v.time); 
            }
            return r; 
        }, []);
    return { 
        name: (exact && getTag(name) !== "") ? `[${getTag(name)}] ${name}` : name,
        times: s
    };
}

function getDriversByType(type, dateCutoff) {
    var drivers = [];
    if (type === "cadets") {
        drivers = [...drivers, ...cadets.map(d => bestLapInKarts(d.name, false, dateCutoff))];
    }
    if (type === "all" || type === "juniors") {
        drivers = [...drivers, ...juniors.map(d => bestLapInKarts(d.name, false, dateCutoff))];
    }
    if (type === "all" || type === "lightweights") {
        drivers = [...drivers, ...lightweights.map(d => bestLapInKarts(d.name, false, dateCutoff))];
    }
    if (type === "all" || type === "middleweights") {
        drivers = [...drivers, ...middleweights.map(d => bestLapInKarts(d.name, false, dateCutoff))];
    }
    if (type === "all" || type === "heavyweights") {
        drivers = [...drivers, ...heavyweights.map(d => bestLapInKarts(d.name, false, dateCutoff))];
    }
    if (type === "all") {
        drivers = [...drivers, ...non_bikc_drivers.map(d => bestLapInKarts(d.name, true, dateCutoff))];
    }
    drivers = drivers.filter(d => d.times.length > 0);
    return drivers;
}

function buildSimulatedKartTimes(drivers) {
    var simulatedPace = {}
    for(var i = 0; i < drivers.length; i++) {
        for(var j = 0; j < drivers[i].times.length; j++) {
            var entry1 = drivers[i].times[j];
            if (entry1.time > 35000) continue;
            if (simulatedPace[entry1.kart] === undefined) {
                simulatedPace[entry1.kart] = {};
            }
            for (var k = 0; k < drivers[i].times.length; k++) {
                if (j === k) continue;
                var entry2 = drivers[i].times[k];
                if (entry2.time > 35000) continue;
                if (simulatedPace[entry1.kart][entry2.kart] === undefined) {
                    simulatedPace[entry1.kart][entry2.kart] = [];
                }
                simulatedPace[entry1.kart][entry2.kart].push(entry1.time - entry2.time);
            }
        }
    }
    var medians = {};
    for (var i in simulatedPace) {
        medians[i] = {};
        for (var j in simulatedPace[i]) {
            medians[i][j] = median(simulatedPace[i][j]);
        }
    }
    var potential = {};
    for (var i in medians) {
        var sum = 0, count = 0;
        for (var j in medians[i]) {
            count++;
            sum += medians[i][j];
        }
        if (count > 0) {
            potential[i] = sum / count;
        }
    }
    var result = {};
    for (var i in potential) {
        result[i] = {};
        for(var j in potential) {
            result[i][j] = potential[i] - potential[j];
        }
    }
    return result;
}

function buildDriverRank(type, dateCutoff) {
    var drivers = getDriversByType(type, dateCutoff);
    var simTimes = buildSimulatedKartTimes(drivers);

    var kartTimes = {};
    for (var i = 0; i < drivers.length; i++) {
        for (var j = 0; j < drivers[i].times.length; j++) {
            var kart = drivers[i].times[j].kart;
            var time = drivers[i].times[j].time;
            if (kartTimes[kart] === undefined) kartTimes[kart] = [];
            kartTimes[kart].push(time);
        }
    }
    for(var kart in kartTimes) kartTimes[kart].sort((a,b) => a-b);

    for (var i = 0; i < drivers.length; i++) {
        var driverSim = [], count = 0, sum = 0;
        for(var k in kartTimes) {
            var possibleTimes = [];
            for(var j = 0; j < drivers[i].times.length; j++) {
                var kart = drivers[i].times[j].kart;
                var time = drivers[i].times[j].time;
                if (simTimes[k] !== undefined && simTimes[k][kart] !== undefined && time <= 35000) {
                    possibleTimes.push(simTimes[k][kart] + time);
                }
            }
            if (possibleTimes.length > 0) {
                var simTime = median(possibleTimes);
                driverSim.push({
                    kart: k,
                    time: simTime
                });
                count++;
                sum += simTime;
            }
        }
        drivers[i].simTimes = driverSim;
        drivers[i].avgSimTime = sum / count;
    }

    for (var i = 0; i < drivers.length; i++) {
        var sumPos = 0, sumTime = 0, sumPoints = 0;
        for (var j = 0; j < drivers[i].times.length; j++) {
            var kart = drivers[i].times[j].kart;
            var time = drivers[i].times[j].time;
            drivers[i].times[j].pos = kartTimes[kart].indexOf(time) + 1;
            drivers[i].times[j].points = (kartTimes[kart].length - 1) / 2 - drivers[i].times[j].pos + 1;
            sumPos += drivers[i].times[j].pos;
            sumTime += drivers[i].times[j].time;
            sumPoints += drivers[i].times[j].points;
        }
        drivers[i].avgTime = parseInt(sumTime / drivers[i].times.length);
        drivers[i].avgPos = sumPos / drivers[i].times.length;
        drivers[i].avgPoints = sumPoints / drivers[i].times.length;
    }
    var karts = [];
    for(var i in kartTimes)karts.push(i);
    karts.sort((a,b) => a-b);
    return  {
        karts: karts,
        drivers: drivers
    }
}
lapData = lapData.filter(l => l.lap_time >= 31400);
var sessions = buildSessions(lapData);
var driversMap = buildDriversMap(driversData);
var driverArray = obj2Array(driversMap);
var cadets = driverArray.filter(d => validDriver(d.value, 'cadet')).map(d => buildDriver(d, sessions));
var juniors = driverArray.filter(d => validDriver(d.value, 'junior')).map(d => buildDriver(d, sessions));
var lightweights = driverArray.filter(d => validDriver(d.value, 'lightweight')).map(d => buildDriver(d, sessions));
var middleweights = driverArray.filter(d => validDriver(d.value, 'middleweight')).map(d => buildDriver(d, sessions));
var heavyweights = driverArray.filter(d => validDriver(d.value, 'heavyweight')).map(d => buildDriver(d, sessions));
var bikc_drivers = [...cadets, ...juniors, ...lightweights, ...middleweights, ...heavyweights];
var non_bikc_drivers = buildNonBikcDrivers(bikc_drivers, lapData);
var all_drivers = [...bikc_drivers, ...non_bikc_drivers];