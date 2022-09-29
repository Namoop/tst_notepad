const quill = new Quill("#editor", {
	modules: {
		toolbar: [
			"back",
			{ size: ["small", false, "large", "huge"] },
			"bold",
			"italic",
			"underline",
			{ list: "bullet" },
			{ list: "ordered" },
			"blockquote",
			"code-block",
		],
	},
	theme: "snow",
	scrollingContainer: "#scrolling-container",
	placeholder: "Nothing here yet...",
});
function $(input) {
	switch (input.constructor) {
		case String:
			const all = document.querySelectorAll(input);
			return all.length - 1 ? [...all] : all[0];
	}
}

const editor = $("#editorpage");
const notespage = $("#mainpage");
const notes = $("#notes");
const PLACEHOLDER = "<span>No notes yet! Press the <strong>+</strong> button to create a new one.</span>"

function hideEditor() {
	editor.style.display = "none";
	notespage.style.display = "";
}
function showEditor() {
	editor.style.display = "";
	notespage.style.display = "none";
}
hideEditor();

function addBackButton() {
	const el = $(".ql-back"); //document.createElement("button")
	el.style.backgroundColor = "#bbbbbb";
	el.style.borderRadius = "10px";
	el.innerHTML = `<svg viewBox="0 0 512 512"><path d="M14.114 191.386 185.993 42.963c15.045-12.993 38.757-2.445 38.757 17.738v78.177C381.614 140.674 506 172.113 506 320.771c0 60.001-38.653 119.442-81.38 150.52-13.333 9.698-32.335-2.474-27.419-18.194 44.281-141.613-21.003-179.209-172.451-181.389v85.855c0 20.215-23.73 30.716-38.757 17.738L14.114 226.863c-10.811-9.338-10.826-26.126 0-35.477z"/></svg>`;
	el.onclick = () => {
		if (retrieve(storekey).preview.length == 1) remove(storekey);
		hideEditor();
		showNoteCards();
	};
	const toolbar = $(".ql-toolbar")[1];
	//toolbar.innerHTML = el.outerHTML + toolbar.innerHTML;
	//$(".ql-toolbar")[1].appendChild(el)
}
addBackButton();

$("#newnote").onclick = function () {
	const key = newKey();
	store(key, { ops: [], preview: "New Note" });
	loadNote(key);
};

let theme = true;
$("#darkmode").onclick = function () {
	if (theme) $("html").style.filter = "invert(100%)";
	else $("html").style.filter = "";
	theme = !theme;
};

$("#removeall").onclick = async function () {
	const ok = await modalResponse("Are you sure? This removes <strong>ALL</strong> of your notes.");
	if (ok) {
		removeAll();
		notes.innerHTML = PLACEHOLDER
	}
};

$("#searchlabel").onclick = function () {
	$("#searchbar").focus();
}

$("#searchbar").oninput = function (e) {
	[...notes.children].forEach(
		(a) =>
			(a.style.display =
				e.target.value.length == 0 ||
				[
					...fuzzySearch(
						e.target.value,
						a.firstElementChild.children[1].innerText,
						2
					),
				].length > 0
					? ""
					: "none")
	);
};

// Storage-specific wrapper functions
function store(key, value) {
	localStorage.setItem(key, JSON.stringify(value).replace(/\\n/g, "\\n"));
}
function retrieve(key) {
	return JSON.parse(localStorage.getItem(key));
}
function storageLength() {
	return localStorage.length;
}
function allKeys() {
	return Object.keys(localStorage);
}
function newKey() {
	return storageLength();
}
function remove(key) {
	const len = storageLength();
	for (let i = key; i < len - 1; i++) {
		store(i, retrieve(+i + 1));
	}
	localStorage.removeItem(len - 1);
}
function removeAll() {
	localStorage.clear();
}
// end

function newCard(key) {
	const el = document.createElement("div");
	el.className = "card";

	const note_content = retrieve(key).preview;
	const note_title = note_content.split("\n")[0].substring(0, 16);
	const note_preview = note_content;

	el.innerHTML = `
	<div class="card-front">
		<div class="card-close-container">
			<span class="card-close-after">+</span>
			<span class="card-close-before"></span>
		</div>
		<h1 style="color:white">${note_title}</h1>
		
	</div>
	<div class="card-back">
		<div class="card-close-container">
			<span class="card-close-after">+</span>
			<span class="card-close-before"></span>
		</div>
		<code>${note_preview.replaceAll("\n", "<br>")}</code>
	</div>
	`;
	notes.appendChild(el);
	let deleting = false;
	$(".card-close-container").at(-1).onclick = async function () {
		deleting = true;
		const ok = await modalResponse("Are you sure you want to delete this note?")
		if (ok) {
			remove(key);
			el.remove(); //if numbering notes remember to refresh them
			if (notes.innerHTML == "") notes.innerHTML = PLACEHOLDER
		}
	};
	el.onclick = () => {
		if (!deleting) {
			loadNote(key);
			deleting = false;
		}
	};
}
function modalResponse (text) {
	const html = $("#confirm")
	html.showModal();
	html.firstElementChild.innerHTML = text;
	return new Promise (resolve => html.onclose = ()=> resolve($("#confirm").returnValue != "cancel"))
}


function showNoteCards() {
	const len = storageLength();
	notes.innerHTML = len ? "" : PLACEHOLDER;
	for (let i of allKeys()) {
		newCard(i);
	}
}
showNoteCards();

function loadNote(key) {
	showEditor();
	storekey = key;
	loadingNewNote = true;
	quill.setContents(retrieve(key));
}

let storekey;
let loadingNewNote = false;
quill.on("text-change", function (delta, oldDelta, source) {
	if (loadingNewNote) {
		loadingNewNote = false;
		return;
	}
	const contents = quill.getContents();
	contents.preview = quill.getText(0, 300);
	store(storekey, contents);
});

// change store/retrieve to work with browser storage
// depending on how often local/sync storage can be edited, maybe store to temporary var somewhere until can be written?
// rewrite save to periodically save, use change.compose delta
