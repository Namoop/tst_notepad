const TST_ID = "treestyletab@piro.sakura.ne.jp";

async function registerToTST() {
	try {
		await browser.runtime.sendMessage(TST_ID, {
			type: "register-self",
			name: browser.i18n.getMessage("TST Notepad"),
			icons: browser.runtime.getManifest().icons,
			subPanel: {
				title: "TST Notepad",
				url: `moz-extension://${location.host}/panel/panel.html`,
			},
			listeningTypes: ["wait-for-shutdown"],
		});
	} catch (_error) {
		// TST is not available
	}
}

// This is required to remove the subpanel you added on uninstalled.
const promisedShutdown = new Promise((resolve, reject) => {
	window.addEventListener("beforeunload", () => resolve(true));
});

browser.runtime.onInstalled.addListener(()=> {
	browser.storage.local.set({
		"keys": ["a01"],
		"a01": {"ops":[{"insert":"Example Note\n^the first line is the title by default\n\nThis is content in an example note.\nThere can be bullet points"},{"attributes":{"list":"bullet"},"insert":"\n"},{"insert":"and much more"},{"attributes":{"list":"bullet"},"insert":"\n"},{"insert":"\n\"Famous quote from an article\""},{"attributes":{"blockquote":true},"insert":"\n"},{"insert":"\n"}],"preview":"Example Note\n^the first line is the title by default\n\nThis is content in an example note.\nThere can be bullet points\nand much more\n\n\"Famous quote from an article\"\n\n"}
	})
})

browser.runtime.onMessageExternal.addListener((message, sender) => {
	switch (sender.id) {
		case TST_ID:
			switch (message.type) {
				// TST is initialized after your addon.
				case "ready":
					registerToTST();
					break;

				// This is required to remove the subpanel you added on uninstalled.
				case "wait-for-shutdown":
					return promisedShutdown;
			}
			break;
	}
});

registerToTST(); // Your addon is initialized after TST.

browser.runtime.onMessage.addListener(async function (message) {
	const keys = (await browser.storage.local.get("keys")).keys ?? [];
	switch (message.type) {
		case "store":
			const obj = {};
			obj[message.key] = message.value;
			await browser.storage.local.set(obj);

			if (!keys.includes(message.key)) {
				keys.push(message.key);
				await browser.storage.local.set({ keys: keys });
			}
			return;
		case "retrieve":
			const res = (await browser.storage.local.get(message.key))[message.key];
			return res;
		case "length":
			return keys.length;
		case "keys":
			return keys;
		case "remove":
			browser.storage.local.remove(message.key);
			keys.splice(keys.indexOf(message.key), 1);
			await browser.storage.local.set({ keys: keys });
			return;
		case "removeAll":
			browser.storage.local.clear();
			await browser.storage.local.set({ keys: [] });
			return;
	}
});
