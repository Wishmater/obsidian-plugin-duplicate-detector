import {Plugin} from 'obsidian';
import {DuplicateDetectorPluginSettings, DEFAULT_SETTINGS, DuplicateDetectorSettingTab} from "./settings";
import {editorExtension} from "./editor_extension";


// declaring settings global, because I found no other way to pass them into the Editor Extension
export let duplicateDetectorPluginSettings: DuplicateDetectorPluginSettings;


// @ts-ignore
export default class DuplicateDetectorPlugin extends Plugin {

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new DuplicateDetectorSettingTab(this.app, this));
		this.registerEditorExtension(editorExtension);
		// TODO 1 also show highlighting in view mode (requires a completely different approach, using  the markdown to html pipeline)
	}

	onunload() { }

	async loadSettings() {
		duplicateDetectorPluginSettings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(duplicateDetectorPluginSettings);
		// this.app.workspace.activeEditor?.editor?.refresh();
	}

}


