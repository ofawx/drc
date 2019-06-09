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
      var contents = e.target.result;
      parseJSON(contents);
    };
    reader.readAsText(file);
  }
}

function parseJSON(contents) {
  //var element = document.getElementById('file-content');
  //element.textContent = contents;
  console.log(JSON.parse(contents).results)
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

  setResultsTable();
}

function setResultsTable() {
  processedResults = [];

  for (let results of raw_results.results) {
    for (let raceName of Object.keys(results)) {
      for (let participant of results[raceName].participants) {
        let resultentry = participantResult(participant);
        if (resultentry) {
          processedResults = processedResults.concat([resultentry]);
        } else {
          continue;
        }
      }
    }
  }
  processedResults.sort((a,b) => a["Total Time"] - b["Total Time"]);

  let elementResults = document.getElementById("results_table")
  if (table) {
    table.parentNode.removeChild(table);
  }
  table = buildHtmlTable(processedResults);
  elementResults.appendChild(table);
}

function participantResult(participant) {
  var modified = {};

  modified["Name"] = participant.participant;

  modified["Class"] = participant.class;

  modified["Split Avg"] = participant.avg_pace;

  // Format splits nicely and find total time
  modified["Total Time"] = 0;
  if (participant.splits) {
    for (var i = 0; i < participant.splits.length; i++) {
      modified["Split "+String(i+1)] = decisecondFormatter(participant.splits[i].split_time);
      modified["Total Time"] += participant.splits[i].split_time/10;
    }
    delete(modified.splits);
  } else {
    return;
  }
  modified["Total Time"] = modified["Total Time"].toFixed(1);

  modified["SPM Avg"] = participant.spm;



  return modified;
}

function decisecondFormatter(deci) {
  let secs = deci/10;
  let mins = Math.floor(secs/60);
  let rsecs = Math.floor(secs%60);
  let rdeci = deci%10;
  return ""+mins+":"+rsecs+"."+rdeci;
}

document.getElementById('file-input').addEventListener('change', readSingleFile, false);
