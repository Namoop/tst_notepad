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

	const obj = {};
	switch (message.type) {
		case "store":
			obj[message.key] = message.value;
			await browser.storage.local.set(obj);

			if (!keys.includes(message.key)) {
				keys.push(message.key);
				await browser.storage.local.set({ keys: keys });
			}
			return;
		case "retrieve":
			//on get use results object?
			const res = (await browser.storage.local.get(message.key))[message.key];
			const bytes = new TextEncoder().encode(
				Object.entries(res)
					.map(([key, value]) => key + JSON.stringify(value))
					.join("")
			).length;
			res.bytes = bytes;
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
