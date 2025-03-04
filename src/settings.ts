import { App, PluginSettingTab, Setting } from "obsidian";
import DuplicateDetectorPlugin, {
	duplicateDetectorPluginSettings,
} from "./main";
import {EditorExtensionPlugin} from "./editor_extension";

// TODO 2 implement a way to refresh editor decorators when settings are changed, maybe with a ChangeNotifier pattern
export interface DuplicateDetectorPluginSettings {
	enableHighlighting: boolean;
	enableNotices: boolean;
	highlightColor: string;
}

export const DEFAULT_SETTINGS: Partial<DuplicateDetectorPluginSettings> = {
	enableHighlighting: true,
	enableNotices: true,
	highlightColor: "#505000",
};

export class DuplicateDetectorSettingTab extends PluginSettingTab {
	plugin: DuplicateDetectorPlugin;

	constructor(app: App, plugin: DuplicateDetectorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Enable highlighting")
			.setDesc("Enable highlighting of duplicate lines in editor")
			.addToggle((component) =>
				component
					.setValue(
						duplicateDetectorPluginSettings.enableHighlighting
					)
					.onChange(async (value) => {
						duplicateDetectorPluginSettings.enableHighlighting =
							value;
						await this.plugin.saveSettings();
						EditorExtensionPlugin.instance?.refresh();
					})
			);

		new Setting(containerEl)
			.setName("Enable notices")
			.setDesc("Show a notice when pasting a duplicated line")
			.addToggle((component) =>
				component
					.setValue(duplicateDetectorPluginSettings.enableNotices)
					.onChange(async (value) => {
						duplicateDetectorPluginSettings.enableNotices = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Highlight color")
			.setDesc("Change the highlight color for duplicated lines")
			.addColorPicker((component) =>
				component
					.setValue(duplicateDetectorPluginSettings.highlightColor)
					.onChange(async (value) => {
						duplicateDetectorPluginSettings.highlightColor = value;
						await this.plugin.saveSettings();
						EditorExtensionPlugin.instance?.refresh();
					})
			);
	}
}
