const TST_ID = 'treestyletab@piro.sakura.ne.jp';

async function registerToTST() {
  try {
    await browser.runtime.sendMessage(TST_ID, {
      type: 'register-self',
      name: browser.i18n.getMessage('TST Notepad'),
      icons: browser.runtime.getManifest().icons,
      subPanel: {
        title: 'TST Notepad',
        url:   `moz-extension://${location.host}/panel/panel.html`,
      },
      listeningTypes: ['wait-for-shutdown'],
    });
  }
  catch(_error) {
    // TST is not available
  }
}

// This is required to remove the subpanel you added on uninstalled.
const promisedShutdown = new Promise((resolve, reject) => {
  window.addEventListener('beforeunload', () => resolve(true));
});

browser.runtime.onMessageExternal.addListener((message, sender) => {
  switch (sender.id) {
    case TST_ID:
      switch (message.type) {
        // TST is initialized after your addon.
        case 'ready':
          registerToTST();
          break;

        // This is required to remove the subpanel you added on uninstalled.
        case 'wait-for-shutdown':
          return promisedShutdown;
      }
      break;
  }
});

registerToTST(); // Your addon is initialized after TST.