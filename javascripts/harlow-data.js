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
    const aliases_predefined = {
        'bradley philpot': ['brad philpot'],
        'keira mcewan': ['keira']
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
        aliases.push(`${splits[0]} ${splits[splits.length-1][0]}`);
        aliases.push(`${splits[0]}.${splits[splits.length-1][0]}`);
        aliases.push(`${splits[0][0]} ${splits[splits.length-1]}`);
        aliases.push(`${splits[0][0]}.${splits[splits.length-1]}`);
    }
    return aliases;
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

function getSessionDriverWithName(session, aliases) {
    return session.drivers.find(driver => {
            for (var i = 0; i < aliases.length; i++) {
                if (isNameMatch(driver.name, aliases[i])) return true;
            }
            return false;
        });
}

function sessionsWithDriver(sessions, name) {
    const aliases = getAliases(name);
    return sessions.filter(session => getSessionDriverWithName(session, aliases) !== undefined);
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
    result.best_time = result.no_sessions > 0 ? driverSessions.map(s => getSessionDriverWithName(s, getAliases(result.name)).best_time).reduce((a,b) => Math.min(a,b)) : 0;
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

function getKartStats(lapType, sessionType, timeCutoff) {
    const kartsMap = {};
    timeCutoff = parseInt(timeCutoff) * 1000;
    for(var i = 0; i < sessions.length; i++) {
        const st = getSessionType(sessions[i].name);
        if (sessionType === 'members' && st !== 'members') continue;
        else if (sessionType === 'adult' && st === 'family') continue;
        var laps = [];
        if (lapType === 'all') laps = sessions[i].drivers.map(d => d.laps).flatMap(d => d);
        else laps = sessions[i].drivers.map(d => d.laps.reduce((a,b) => a.time < b.time ? a : b));
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
    const karts = [];
    for(var k in kartsMap) {
        if (k === null || k === 'null') continue;
        karts.push({
            kart: k,
            count: kartsMap[k].count,
            avg: parseInt(kartsMap[k].sum / kartsMap[k].count),
            best: kartsMap[k].best,
        });
    }
    karts.sort((a, b) => a.avg - b.avg);
    return karts;
}

var sessions = buildSessions(lapData);
var driversMap = buildDriversMap(driversData);
var driverArray = obj2Array(driversMap);
var cadets = driverArray.filter(d => validDriver(d.value, 'cadet')).map(d => buildDriver(d, sessions));
var juniors = driverArray.filter(d => validDriver(d.value, 'junior')).map(d => buildDriver(d, sessions));
var lightweights = driverArray.filter(d => validDriver(d.value, 'lightweight')).map(d => buildDriver(d, sessions));
var middleweights = driverArray.filter(d => validDriver(d.value, 'middleweight')).map(d => buildDriver(d, sessions));
var heavyweights = driverArray.filter(d => validDriver(d.value, 'heavyweight')).map(d => buildDriver(d, sessions));
