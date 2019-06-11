let unfilterString = "All";

let classSelect = document.getElementById("class-select");
let distSelect = document.getElementById("dist-select");
classSelect.addEventListener('change', setResultsTable);
distSelect.addEventListener('change', setResultsTable);

var raw_results = {"results":[]};
var processedResults = [];
var table;



var _table_ = document.createElement('table'),
  _tr_ = document.createElement('tr'),
  _th_ = document.createElement('th'),
  _td_ = document.createElement('td');

_table_.border = "1px solid #000";

function buildHtmlTable(arr) {
  var table = _table_.cloneNode(false),
    columns = addAllColumnHeaders(arr, table);
  for (var i = 0, maxi = arr.length; i < maxi; ++i) {
    var tr = _tr_.cloneNode(false);
    for (var j = 0, maxj = columns.length; j < maxj; ++j) {
      var td = _td_.cloneNode(false);
      cellValue = arr[i][columns[j]];
      td.appendChild(document.createTextNode(arr[i][columns[j]] || ''));
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  return table;
}

function addAllColumnHeaders(arr, table) {
  var columnSet = [],
    tr = _tr_.cloneNode(false);
  for (var i = 0, l = arr.length; i < l; i++) {
    for (var key in arr[i]) {
      if (arr[i].hasOwnProperty(key) && columnSet.indexOf(key) === -1) {
        columnSet.push(key);
        var th = _th_.cloneNode(false);
        th.appendChild(document.createTextNode(key));
        tr.appendChild(th);
      }
    }
  }
  table.appendChild(tr);
  return columnSet;
}

function readSingleFile(e) {
  for (var i = 0; i < e.target.files.length; i++) {
    var file = e.target.files[i];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      newJSON(e.target.result);
    };
    reader.readAsText(file);
  }
}

function newJSON(contents) {
  parseJSON(contents);
  setResultsTable();
  updateFilters();
}

function parseJSON(contents) {
  var newresults = JSON.parse(contents).results;
  for (var i = 0; i < newresults.length; i++) {
    var willAdd = true;
    let newJSON = JSON.stringify(newresults[i]);
    for (var j = 0; j < raw_results.results.length; j++) {
      if (JSON.stringify(raw_results.results[j]) == newJSON) {
        willAdd = false;
      }
    }
    if (willAdd) {
      raw_results.results = raw_results.results.concat(JSON.parse(newJSON));
    }
  }
}

function setResultsTable() {
  processedResults = [];

  for (let results of raw_results.results) {
    for (let raceName of Object.keys(results)) {
      for (let participant of results[raceName].participants) {
        let result = JSON.parse(JSON.stringify(participant));
        if (checkResultMatch(result)) {
          processedResults = processedResults.concat([processResult(result)]);
        } else {
          continue;
        }
      }
    }
  }


  processedResults.sort((a,b) => a.timeTotal - b.timeTotal);
  var lastTime = 0, lastPlace = 0;
  for (var i = 0; i < processedResults.length; i++) {
    var result = processedResults[i];
    if (result.timeTotal > lastTime) {
      lastPlace = i+1;
      result.overallPlace = lastPlace;
      lastTime = result.timeTotal;
    } else {
      result.overallPlace = lastPlace;
    }
    processedResults[i] = formatResult(result);
  }

  let elementResults = document.getElementById("results_table")
  if (table) {
    table.parentNode.removeChild(table);
  }
  table = buildHtmlTable(processedResults);
  elementResults.appendChild(table);
}

function processResult(result) {
  // Find total time from sum of splits
  result.timeTotal = 0;
  for (var i = 0; i < result.splits.length; i++) {
    result.timeTotal += result.splits[i].split_time;
  }

  return result;
}

function checkResultMatch(result) {
  if (result.splits) {
  } else {
    return false;
  }

  let classSelected = classSelect.options[classSelect.selectedIndex].text
  if (classSelected == result.class || classSelected == unfilterString) {
  } else {
    return false;
  }

  let distSelected = distSelect.options[distSelect.selectedIndex].text
  if (distSelected == result.score || distSelected == unfilterString) {
  } else {
    return false;
  }

  // Check result against filters
  return true;
}

function formatResult(participant) {
  var modified = {};

  modified["Place"] = participant.overallPlace;

  modified["Name"] = participant.participant;

  modified["Time"] = decisecondFormatter(participant.timeTotal);

  modified["Distance"] = participant.score;

  modified["Class"] = participant.class;

  modified["Split Avg"] = participant.avg_pace;

  modified["SPM Avg"] = participant.spm;

  // Format splits nicely and find total time
  for (var i = 0; i < participant.splits.length; i++) {
    let split = participant.splits[i];
    modified["Split "+String(i+1)] = decisecondFormatter(split.split_time) + " @ " + split.split_stroke_rate;
  }








  return modified;
}

function updateFilters() {
  updateFilter(distSelect, "score");
  updateFilter(classSelect, "class");
}

function updateFilter(selector, key) {
  var arr = [];
  for (let results of raw_results.results) {
    for (let raceName of Object.keys(results)) {
      for (let participant of results[raceName].participants) {
        arr = arr.concat([participant[key]]);
      }
    }
  }
  arr = arr
  arr = [unfilterString].concat([...new Set(arr)].sort(function (a, b) {
    return ('' + a.attr).localeCompare(b.attr);
  }));
  for (var i = 0; i < selector.options.length; i++) {
    selector.options.remove(selector.options[i]);
  }
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == "") continue;
    var opt = document.createElement("option");
    opt.text = opt.value = arr[i];
    selector.options.add(opt);
  }
}

function decisecondFormatter(deci) {
  let secs = deci/10;
  let mins = Math.floor(secs/60);
  let rsecs = Math.floor(secs%60);
  let rdeci = deci%10;
  return ""+mins+":"+(rsecs<10?"0":"")+rsecs+"."+rdeci;
}

document.getElementById('file-input').addEventListener('change', readSingleFile, false);
