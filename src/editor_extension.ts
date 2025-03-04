import {
	Decoration,
	DecorationSet,
	EditorView,
	PluginSpec,
	PluginValue,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";
import { Line, RangeSetBuilder } from "@codemirror/state";
import { Notice } from "obsidian";
import { duplicateDetectorPluginSettings } from "./main";

class EditorExtensionPlugin implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = this._buildDecorations(view, null);
	}

	update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged) {
			this.decorations = this._buildDecorations(update.view, update);
		}
	}

	destroy() {}

	_buildDecorations(
		view: EditorView,
		update: ViewUpdate | null
	): DecorationSet {
		// TODO PERFORMANCE we could check only updated lines with a ViewUpdate
		// TODO PERFORMANCE we could not make this n squared by not looping through previously-seen elements
		const builder = new RangeSetBuilder<Decoration>();
		if (
			!duplicateDetectorPluginSettings.enableHighlighting &&
			!duplicateDetectorPluginSettings.enableNotices
		) {
			return builder.finish();
		}
		for (let i = 1; i <= view.state.doc.lines; i++) {
			const line = view.state.doc.line(i);
			if (line.text == "") continue;
			const isInViewport = this._isInViewport(line, view);
			if (isInViewport) {
				const duplicate = this._getDuplicate(line, view);
				if (duplicate) {
					if (duplicateDetectorPluginSettings.enableHighlighting) {
						builder.add(
							line.from,
							line.to,
							this._buildDecoration(duplicate)
						);
					}
					if (duplicateDetectorPluginSettings.enableNotices) {
						if (this._wasChanged(line, update)) {
							// TODO 2 condense all duplications into one single notice to not spam with a lot of notices if several duplicated lines are pasted
							this._showDuplicationNotice(line, duplicate);
						}
					}
				}
			}
		}
		return builder.finish();
	}

	_isInViewport(line: Line, view: EditorView) {
		for (let { from, to } of view.visibleRanges) {
			const overlaps = this._overlapsIncluding(
				line.from,
				line.to,
				from,
				to
			);
			if (overlaps) return true;
		}
		return false;
	}

	/// returns whether segment A B have overlap (including if one is contained in the other)
	_overlapsIncluding(fromA: number, toA: number, fromB: number, toB: number) {
		if (fromA >= fromB && fromA <= toB) return true;
		if (toA >= fromB && toA <= toB) return true;
		if (fromA < fromB && toA > toB) return true;
		if (fromB < fromA && toB > toA) return true;
		return false;
	}
	_overlapsExcluding(fromA: number, toA: number, fromB: number, toB: number) {
		if (fromA > fromB && fromA < toB) return true;
		if (toA > fromB && toA < toB) return true;
		if (fromA <= fromB && toA >= toB) return true;
		if (fromB <= fromA && toB >= toA) return true;
		return false;
	}

	_getDuplicate(line: Line, view: EditorView) {
		for (let i = 1; i <= view.state.doc.lines; i++) {
			const otherLine = view.state.doc.line(i);
			if (otherLine.number == line.number) continue;
			if (line.text == otherLine.text) return otherLine;
		}
		return null;
	}

	_wasChanged(line: Line, update: ViewUpdate | null) {
		if (!update) return false;
		//// apparently, this returns whether the specified lines in the ORIGINAL document changed, which is not what we want
		// const result = update.changes.touchesRange(line.from, line.to);
		let result = false;
		update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
			const overlaps = this._overlapsExcluding(
				line.from,
				line.to,
				fromB,
				toB
			);
			if (overlaps && inserted.toString().contains(line.text)) {
				result = true;
			}
		});
		return result;
	}

	_buildDecoration(duplicate: Line) {
		// TODO 2 support light mode
		return Decoration.mark({
			attributes: {
				style: `background-color: ${duplicateDetectorPluginSettings.highlightColor};`,
				// TODO 2 show ALL duplicate occurrences, not just first line
				title: `Duplicated on line ${duplicate.number}`,
			},
		});
	}

	_showDuplicationNotice(line: Line, duplicate: Line) {
		new Notice(
			`Duplicate line inserted: ${line.number} -- ${duplicate.number}`,
			5000
		);
	}
}

const pluginSpec: PluginSpec<EditorExtensionPlugin> = {
	decorations: (value: EditorExtensionPlugin) => value.decorations,
};
export const editorExtension = ViewPlugin.fromClass(
	EditorExtensionPlugin,
	pluginSpec
);
