'use strict';

// Bindings on load.
window.addEventListener('load', function() {
	setupFirebase();
	startWatchingDatabase();
	document.getElementById('fileinput').addEventListener('change', readSingleFile, false);
	$('.dropify').dropify();
}, false);

/**
 * Reacts to a file upload.
 * Credit: http://www.htmlgoodies.com/beyond/javascript/
 * 		read-text-files-using-the-javascript-filereader.html#fbid=eftoPzO5Kyr
 */
function readSingleFile(evt) {
	//Retrieve the first (and only!) File from the FileList object
	var f = evt.target.files[0]; 
	if (f) {
		var r = new FileReader();
		r.onload = function(e) { 
			var contents = e.target.result;
			loadFromJsonText(contents)
		}
		r.readAsText(f);
	} else { 
		alert("Failed to load file");
	}
}

/**
 * Sets the database's value to uploaded Json values.
 * @param fileContents	The text contents of an uploaded file
 */
function loadFromJsonText(fileContents) {
	var updates = {};
	try {
		updates[newDataBaseKey] = JSON.parse(fileContents);
		firebase.database().ref().update(updates);
	} catch (err) {
		alert(err);
	}
}

/**
 * Sets up Firebase config information.
 */
function setupFirebase() {
	var config = {
		apiKey: "AIzaSyDFnteNkblzj9H0i4r8Gf7k-XPIw0LmkBw",
		authDomain: "relational-to-json.firebaseapp.com",
		databaseURL: "https://relational-to-json.firebaseio.com",
		storageBucket: "relational-to-json.appspot.com",
	};
	firebase.initializeApp(config);
}

/**
 * Begins listening for database updates. On an update,
 * the page is updated to reflect the changes.
 * @return	the database key being watched
 */
var newDataBaseKey;
function startWatchingDatabase() {
	// Create new db branch to watch on
	newDataBaseKey = firebase.database().ref().push().key;
	var data = {}
	data[newDataBaseKey] = {"Test Table" : {
		"Row1": {
			"age": 20,
			"name": "Mark"
		},
		"Row2": {
			"age": 22,
			"name": "Cindy"
		}
	}};
	firebase.database().ref().update(data);

	firebase.database().ref().child(newDataBaseKey).on('value', function(snapshot) {
		clearCurrentTable();
		snapshot.forEach(function(childSnapshot) {
			var table = createTableForSnapshot(childSnapshot);
			var tableHeader = document.createElement("h2");
			tableHeader.innerHTML = camelCaseToWords(childSnapshot.key);
			$('#main-content').append(tableHeader);
			$('#main-content').append(table);
		});
	});

	return newDataBaseKey;
}

/**
 * Clears the current table.
 * TODO: Make more efficient with proper queries
 */
function clearCurrentTable() {
	var node = document.getElementById("main-content");
	while (node.hasChildNodes()) {
    	node.removeChild(node.lastChild);
	}
}

/**
 * Converts a camelCase string into a spaced out string.
 */
function camelCaseToWords(str) {
	return str.replace(/([A-Z])/g, ' $1')
    		.replace(/^./, function(str){ return str.toUpperCase(); })
}

/**
 * Finds the first child of a snapshot.
 * @param snapshot	the parent snapshot
 * @return	the child snapshot
 */
function getFirstElementOfSnapshot(snapshot) {
	var keys = getKeysFromSnapshot(snapshot);
	return snapshot.child(keys[0]);
}

/**
 * Returns the keys from a snapshot
 * @return	An array of keys (strings)
 */
function getKeysFromSnapshot(snapshot) {
	var keys = [];
	snapshot.forEach(function(childSnapshot) {
		keys.push(childSnapshot.key);
	});
	return keys;
}

/**
 * Creates a table out of a snapshot.
 * @param snapshot	A firebase snapshot
 * @return	A HTML table element
 */
function createTableForSnapshot(snapshot) {
	var table = document.createElement("table");
	var head = document.createElement("thead");
	var body = document.createElement("tbody");
	var headRow = document.createElement("tr");

	table.setAttribute("class", "striped centered responsive-table");

	// Set table column names
	var keys = getKeysFromSnapshot(getFirstElementOfSnapshot(snapshot));
	$.each(keys, function(index, columnTitle){
		var columnHeading = document.createElement("th");
		columnHeading.innerHTML = columnTitle;
		columnHeading.setAttribute("data-field", columnTitle);
		headRow.appendChild(columnHeading);
	});

	// Add rows to table
	snapshot.forEach(function(rowValueSnapshot) {
		var row = createRowForSnapshot(rowValueSnapshot);
		body.appendChild(row);
	});

	head.appendChild(headRow);
	table.appendChild(head);
	table.appendChild(body);

	return table;
}

/**
 * Creates a row (tr) element out of a snapshot.
 * @param snapshot	A firebase snapshot
 * @return	An HTML tr element
 */
function createRowForSnapshot(snapshot) {
	var row = document.createElement("tr");
	row.onclick = function() {
		createAndShowModalForSnapshot(snapshot, createFormForSnapshot);
	}
	snapshot.forEach(function(valueSnapshot) {
		row.appendChild(createCellForSnapshot(valueSnapshot));
	});
	return row;
}

/**
 * Creates a form for editing a snapshot.
 * @param snapshot	A firebase snapshot for a row
 * @return	An HTML div element containing a form
 */
function createFormForSnapshot(snapshot) {
	var outerDiv = document.createElement("div");
	var form = document.createElement("form");

	outerDiv.setAttribute("class", "row");
	form.setAttribute("class", "col s12");

	snapshot.forEach(function(keyValuePairSnapshot) {
		if (!keyValuePairSnapshot.hasChildren()) {
			var formItem = document.createElement("div");
			var inputField = document.createElement("div");
			var input = document.createElement("input");
			var label = document.createElement("label");
	
			formItem.setAttribute("class", "row");
			inputField.setAttribute("class", "input-field col s12");
			input.setAttribute("type", "text");
			input.setAttribute("id", keyValuePairSnapshot.key);
			input.setAttribute("value", keyValuePairSnapshot.val());
			label.setAttribute("for", keyValuePairSnapshot.key);
			label.setAttribute("class", "active");
	
			label.innerHTML = keyValuePairSnapshot.key;
	
			var updateFunction = function() {
				keyValuePairSnapshot.ref.set(input.value);
			}
			input.onkeydown = updateFunction;
			input.oncut = updateFunction;
			input.onpaste = updateFunction;
	
			inputField.appendChild(input);
			inputField.appendChild(label);
			formItem.appendChild(inputField);
			form.appendChild(formItem);
		}
	});

	outerDiv.appendChild(form);
	return outerDiv;
}

/**
 * Displays Json text to the screen.
 */
function displayJson() {
	$.ajax({
		url: "https://relational-to-json.firebaseio.com/" + newDataBaseKey + 
			".json?print=pretty",
		cache: false,
		success: function(result) {
			console.log(result);

			var modalId = "json-Output" + new Date().getTime();
		
			var modal = document.createElement("div");
			var modalContent = document.createElement("div");
			var jsonContent = document.createElement("pre");
		
			modal.setAttribute("class", "modal");
			modal.setAttribute("id", modalId);
			modalContent.setAttribute("class", "modal-content");

			jsonContent.innerHTML = JSON.stringify(result, null, 2);
		
			modalContent.appendChild(jsonContent);
			modal.appendChild(modalContent);
			document.getElementsByTagName('body')[0].appendChild(modal);
		
			$("#" + modalId).openModal();
		}
	});
}

/**
 * Creates a modal form for editing a row from snapshot data.
 * Then displays the modal to the window.
 * @param snapshot	A firebase snapshot
 */
function createAndShowModalForSnapshot(snapshot, functionName) {
	var modalId = snapshot.key

	var modal = document.createElement("div");
	var modalContent = document.createElement("div");

	modal.setAttribute("class", "modal");
	modal.setAttribute("id", modalId);
	modalContent.setAttribute("class", "modal-content");

	modalContent.appendChild(functionName(snapshot));
	modal.appendChild(modalContent);
	document.getElementsByTagName('body')[0].appendChild(modal);

	$("#" + modalId).openModal();
}

/**
 * Creates a table cell out of a snapshot.
 * @param snapshot	A firebase snapshot
 * @return An HTML td element
 */
function createCellForSnapshot(snapshot) {
	var cell = document.createElement("td");
	if (snapshot.hasChildren()) {
		cell.innerHTML = "View in Modal";
		cell.setAttribute("class", "thin");
		cell.onclick = function(e) {
			e.stopPropagation();
			createAndShowModalForSnapshot(snapshot, createFormForSnapshot);
		};
	} else {
		cell.innerHTML = snapshot.val();
	}

	return cell;
}
