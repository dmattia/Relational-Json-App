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
	//newDataBaseKey = firebase.database().ref().push().key;
	newDataBaseKey = "-KMBMufXJTmH-lQ6Zfmd";
	/*
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
	*/

	firebase.database().ref().child(newDataBaseKey).on('value', function(snapshot) {
		clearCurrentTable();
		snapshot.forEach(function(childSnapshot) {
			var tableDiv = document.createElement("div");
			var table = createTableForSnapshot(childSnapshot.child("Objects"));
			var tableHeader = document.createElement("h2");
			var buttonGroup = createButtonGroupForTable(childSnapshot.key);

			tableHeader.style.display = "inline";
			tableDiv.style.margin = "20px";
			tableDiv.style.position = "relative";

			tableHeader.innerHTML = camelCaseToWords(childSnapshot.key);

			tableDiv.appendChild(tableHeader);
			tableDiv.appendChild(buttonGroup);
			tableDiv.appendChild(table);
			$('#main-content').append(tableDiv);
		});
	});

	//firebase.database().ref().child(newDataBaseKey).onDisconnect().remove();

	return newDataBaseKey;
}

/**
 * Creates a button group for editing a table.
 * @return	An HTML div element
 */
function createButtonGroupForTable(tableName) {
	var outerDiv = document.createElement("div");
	var mainButton = document.createElement("a");
	var mainButtonIcon = document.createElement("i");
	var popOutLinks = document.createElement("ul");
	
	outerDiv.setAttribute("class", "fixed-action-btn horizontal");
	mainButton.setAttribute("class", "btn-floating btn-large red");
	mainButtonIcon.setAttribute("class", "large material-icons");

	outerDiv.style.float = "right";
	outerDiv.style.display = "inline";
	
	mainButtonIcon.innerHTML = "menu";
	var addObjectButton = createButtonForIcon("add", "green");
	var editObjectButton = createButtonForIcon("edit", "yellow darken-2");
	var removeObjectButton = createButtonForIcon("remove", "red");
	var addParameterButton = createButtonForIcon("view_column", "blue");
	var deleteTableButton = createButtonForIcon("delete", "red");

	addObjectButton.onclick = function() {
		addObjectForTable(tableName);
	}

	popOutLinks.appendChild(wrapWithli(addObjectButton));
	popOutLinks.appendChild(wrapWithli(editObjectButton));
	popOutLinks.appendChild(wrapWithli(removeObjectButton));
	popOutLinks.appendChild(wrapWithli(addParameterButton));
	popOutLinks.appendChild(wrapWithli(deleteTableButton));

	mainButton.appendChild(mainButtonIcon);
	outerDiv.appendChild(mainButton);
	outerDiv.appendChild(popOutLinks);

	return outerDiv;
}

/**
 * Wraps an element with <li></li>
 * @param element	The element to wrap
 * @return	An HTML li element
 */
function wrapWithli(element) {
	var listItem = document.createElement("li");
	listItem.appendChild(element);
	return listItem;
}

/**
 * Creates a button with a material icon.
 * @param iconName	The name of the icon in the Materialize fontbook
 * @param buttonColor	The Materialize color class for the button background
 * @return	An HTML a element
 */
function createButtonForIcon(iconName, buttonColor) {
	var outerLink = document.createElement("a");
	var icon = document.createElement("i");

	outerLink.setAttribute("class", "btn-floating " + buttonColor);
	icon.setAttribute("class", "material-icons");

	icon.innerHTML = iconName;
	
	outerLink.appendChild(icon);

	return outerLink;
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
 * Displays a form for adding a child object to a table.
 * @param tableName	The name of the table to add an object to
 */
function addObjectForTable(tableName) {
	var tableRef = firebase.database().ref().child(newDataBaseKey).child(tableName);
	tableRef.child("Parameters").once('value', function(snapshot) {
		// An array of keys this object can have
		var keys = getKeysFromSnapshot(snapshot);

		var form = createFormWithKeys(keys);

		form.onsubmit = function() {
			alert("hello");
			return false;
		}

		createModalForHTMLElement(form);
	});
}

/**
 * Creates a button with specified text and icon
 * @param text	The main text of the button
 * @param icon	The name of the material icon
 * @param type	The type of button ie) submit
 * @return the button HTML element
 */
function createButtonWithIconAndType(text, icon, type) {
	var button = document.createElement("button");
	var iconElement = document.createElement("i");

	button.setAttribute("class", "btn waves-effect waves-light");
	button.setAttribute("type", type);
	iconElement.setAttribute("class", "material-icons right");

	button.innerHTML = text;
	iconElement.innerHTML = icon;

	button.appendChild(iconElement);

	return button;
}

/**
 * Creates a form with textfields for each of the given keys.
 * @param keys	The keys that need to be filled with values
 * @return	The div element containing the form
 */
function createFormWithKeys(keys) {
	var form = document.createElement("form");

	form.setAttribute("class", "col s12");

	for (var keyIndex in keys) {
		var key = keys[keyIndex];

		var formItem = document.createElement("div");
		var inputField = document.createElement("div");
		var input = document.createElement("input");
		var label = document.createElement("label");

		formItem.setAttribute("class", "row");
		inputField.setAttribute("class", "input-field col s12");
		input.setAttribute("type", "text");
		input.setAttribute("id", key);
		label.setAttribute("for", key);
		label.innerHTML = key;

		inputField.appendChild(input);
		inputField.appendChild(label);
		formItem.appendChild(inputField);
		form.appendChild(formItem);
	}
	form.appendChild(createButtonWithIconAndType("Submit", "send", "submit"));

	return form;
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
				keyValuePairSnapshot.ref.set(
					parseFloat(input.value)
					|| input.value
				);
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
			var modalId = "json-Output" + new Date().getTime();
		
			var modal = document.createElement("div");
			var modalContent = document.createElement("div");
			var jsonContent = document.createElement("pre");
			var codeContent = document.createElement("code");
		
			modal.setAttribute("class", "modal");
			modal.setAttribute("id", modalId);
			modalContent.setAttribute("class", "modal-content");
			modalContent.style.backgroundColor = "#3f3f3f";
			codeContent.style.fontFamily = "Cutive Mono, monospace";

			codeContent.innerHTML = JSON.stringify(result, null, 2);
		
			jsonContent.appendChild(codeContent);
			modalContent.appendChild(jsonContent);
			modal.appendChild(modalContent);
			document.getElementsByTagName('body')[0].appendChild(modal);
		
			// Enable Syntax highlighting
			$(document).ready(function() {
				$('pre code').each(function(i, block) {
					hljs.highlightBlock(block);
				});
			});

			$("#" + modalId).openModal({
				dismissible: true,
				opacity: 0.5,
				in_duration: 300,
				out_duration: 200,
				ready: function() {},
				complete: function() {
					document.getElementById("container").style.webkitFilter = "none"; 
					document.getElementsByClassName('navbar-fixed')[0].style.webkitFilter = "none"; 
				}
			});
			document.getElementById("container").style.webkitFilter = "url('#blur')"; 
			document.getElementsByClassName('navbar-fixed')[0].style.webkitFilter = "url('#blur')"; 
		}
	});
}

/**
 * Creates a modal with its main content being variable.
 * @param content	The HTML content to fill the modal with
 * @param id	The id to give this modal
 */
function createModalForHTMLElement(content, id) {
	var modalId = id

	var modal = document.createElement("div");
	var modalContent = document.createElement("div");

	modal.setAttribute("class", "modal");
	modal.setAttribute("id", modalId);
	modalContent.setAttribute("class", "modal-content row");

	modalContent.appendChild(content);
	modal.appendChild(modalContent);
	document.getElementsByTagName('body')[0].appendChild(modal);

	$("#" + modalId).openModal();
}

/**
 * Creates a modal form for editing a row from snapshot data.
 * Then displays the modal to the window.
 * @param snapshot	A firebase snapshot
 */
function createAndShowModalForSnapshot(snapshot, functionName) {
	createModalForHTMLElement(functionName(snapshot), snapshot.key);
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
		var value = snapshot.val();
		if (typeof value === 'string' && value.match(/\.(jpeg|jpg|gif|png)$/) != null) {
			var image = document.createElement("img");
			image.setAttribute("src", value);
			image.style.display = "block";
			image.style.width = "100%";
			cell.appendChild(image);
		} else {
			cell.innerHTML = value;
		}
	}

	return cell;
}
