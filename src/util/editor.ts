import { Editor } from "obsidian";
import { getMarkedPhrases } from "src/editor/decoration";
import { getSettings } from "src/settings";


export function getMarkedWordUnderCursor(editor: Editor) {
	const currWord = getWordByOffset(editor.posToOffset(editor.getCursor()));
	return normaliseWord(currWord);
}

export function normaliseWord(word: string) {
	if (getSettings().enableCaseSensitive)
		return word.trimStart().trimEnd();
	else
		return word.trimStart().trimEnd().toLowerCase();
}

function getWordByOffset(offset: number): string {
	const markedPhrases = getMarkedPhrases();
	let start = 0;
	let end = markedPhrases.length - 1;

	// Binary search to get marked word at provided position
	while (start <= end) {
		let mid = Math.floor((start + end) / 2);

		let currPhrase = markedPhrases[mid];
		if (offset >= currPhrase.from && offset <= currPhrase.to) {
			return currPhrase.phrase;
		}
		if (offset < currPhrase.from) {
			end = mid - 1;
		}
		if (offset > currPhrase.to) {
			start = mid + 1;
		}
	}
	return "";
}
