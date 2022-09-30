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
const saveicon = $("#saveicon");
let interval;
const PLACEHOLDER =
	"<span>No notes yet! Press the <strong>+</strong> button to create a new one.</span>";

function hideEditor() {
	editor.style.display = "none";
	notespage.style.display = "";
	endSaveLoop();
}
function showEditor() {
	editor.style.display = "";
	notespage.style.display = "none";
	beginSaveLoop();
}
hideEditor();

async function addBackButton() {
	const el = $(".ql-back"); //document.createElement("button")
	el.style.backgroundColor = "#bbbbbb";
	el.style.borderRadius = "10px";
	el.innerHTML = `<svg viewBox="0 0 512 512"><path d="M14.114 191.386 185.993 42.963c15.045-12.993 38.757-2.445 38.757 17.738v78.177C381.614 140.674 506 172.113 506 320.771c0 60.001-38.653 119.442-81.38 150.52-13.333 9.698-32.335-2.474-27.419-18.194 44.281-141.613-21.003-179.209-172.451-181.389v85.855c0 20.215-23.73 30.716-38.757 17.738L14.114 226.863c-10.811-9.338-10.826-26.126 0-35.477z"/></svg>`;
	el.onclick = async function () {
		if (quill.getText().length == 1) await remove(storekey);
		hideEditor();
		showNoteCards();
		save();
	};
	const toolbar = $(".ql-toolbar")[1];
	//toolbar.innerHTML = el.outerHTML + toolbar.innerHTML;
	//$(".ql-toolbar")[1].appendChild(el)
}
addBackButton();

$("#newnote").onclick = async function () {
	const key = newKey();
	const note = new Delta();
	note.preview = "New Note";
	await store(key, note);
	loadNote(key);
};

let theme = true;
$("#darkmode").onclick = function () {
	if (theme) $("html").style.filter = "invert(100%)";
	else $("html").style.filter = "";
	theme = !theme;
};

$("#removeall").onclick = async function () {
	const ok = await modalResponse(
		"Are you sure? This removes <strong>ALL</strong> of your notes."
	);
	if (ok) {
		await removeAll();
		notes.innerHTML = PLACEHOLDER;
	}
};

$("#searchlabel").onclick = function () {
	$("#searchbar").focus();
};

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
const msg = browser.runtime.sendMessage
const MODE = "firefox";
async function store(key, value) {
	if (MODE == "localstorage")
		localStorage.setItem(key, JSON.stringify(value).replace(/\\n/g, "\\n"));
	else if (MODE == "firefox") {
		await msg({type: "store", key: key, value: value})
	}
}
async function retrieve(key) {
	if (MODE == "localstorage") return JSON.parse(localStorage.getItem(key));
	else if (MODE == "firefox") {
		return await msg({type: "retrieve", key: key})
	}
}
async function storageLength() {
	if (MODE == "localstorage") return localStorage.length;
	else if (MODE == "firefox") {
		return await msg({type: "length"})
	}
}
async function allKeys() {
	if (MODE == "localstorage") return Object.keys(localStorage);
	else if (MODE == "firefox") {
		return await msg({type: "keys"})
	}
}
function newKey() {
	if (MODE == "localstorage") return storageLength();
	else if (MODE == "firefox") {
		return "n"+Date.now();
	}
}
async function remove(key) {
	if (MODE == "localstorage") {
		const len = storageLength();
		for (let i = key; i < len - 1; i++) {
			store(i, retrieve(+i + 1));
		}
		localStorage.removeItem(len - 1);
	}
	else if (MODE == "firefox") {
		await msg({type: "remove", key: key})
	}
}
async function removeAll() {
	if (MODE == "localstorage")
	localStorage.clear();
	else if (MODE == "firefox") {
		await msg({type: "removeAll"})
	}
}
// end

async function newCard(key) {
	const el = document.createElement("div");
	el.className = "card";
	el.innerHTML = `
	<div class="card-front">
		<div class="card-close-container">
			<span class="card-close-after">+</span>
			<span class="card-close-before"></span>
		</div>
		<h1 style="color:white"></h1>
		
	</div>
	<div class="card-back">
		<div class="card-close-container">
			<span class="card-close-after">+</span>
			<span class="card-close-before"></span>
		</div>
		<code></code>
	</div>
	`;

	const note_content = (await retrieve(key)).preview;
	const note_title = note_content.split("\n")[0].substring(0, 16);
	const note_preview = note_content;
	el.querySelector("h1").innerText = note_title
	el.querySelector("code").innerText = note_preview

	notes.appendChild(el);
	let deleting = false;
	$(".card-close-container").at(-1).onclick = async function () {
		deleting = true;
		const ok = await modalResponse(
			"Are you sure you want to delete this note?"
		);
		if (ok) {
			await remove(key);
			el.remove(); //if numbering notes remember to refresh them
			if (notes.innerHTML == "") notes.innerHTML = PLACEHOLDER;
		}
	};
	el.onclick = () => {
		if (!deleting) {
			loadNote(key);
			deleting = false;
		}
	};
}
function modalResponse(text) {
	const html = $("#confirm");
	html.showModal();
	html.firstElementChild.innerHTML = text;
	return new Promise(
		(resolve) =>
			(html.onclose = () =>
				resolve($("#confirm").returnValue != "cancel"))
	);
}

async function showNoteCards() {
	const len = await storageLength();
	notes.innerHTML = len ? "" : PLACEHOLDER;
	for (let i of (await allKeys())) {
		newCard(i);
	}
}
showNoteCards();

async function loadNote(key) {
	showEditor();
	storekey = key;
	loadingNewNote = true;
	quill.setContents(await retrieve(key));
}

let storekey;
let loadingNewNote = false;
const Delta = Quill.import("delta");
let changes = new Delta();

quill.on("text-change", function (delta) {
	if (loadingNewNote) return (loadingNewNote = false);
	changes = changes.compose(delta);
	saveicon.style.display = "block";
});

async function save() {
	if (changes.length() > 1) {
		const contents = changes.compose(await retrieve(storekey));
		contents.preview = quill.getText(0, 300);
		await store(storekey, contents);
		saveicon.style.display = "";
		changes = new Delta();
	}
}

function beginSaveLoop() {
	interval = setInterval(save, 5000);
}
function endSaveLoop() {
	clearInterval(interval);
}

// change store/retrieve to work with browser storage
