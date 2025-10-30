import { getDefFileManager } from "src/core/def-file-manager";
import { PTreeNode, PTreeTraverser } from "./prefix-tree";
import { getSettings } from "src/settings";

// Information of phrase that can be used to add decorations within the editor
export interface PhraseInfo {
	from: number;
	to: number;
	phrase: string;
}

export class LineScanner {
	prefixTree: PTreeNode;

	private cnLangRegex = /\p{Script=Han}/u;
	private terminatingCharRegex = /[!@#$%^&*()\+={}[\]:;"'<>,.?\/|\\\r\n （）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､　、〃〈〉《》「」『』【】〔〕〖〗〘〙〚〛〜〝〞〟—‘’‛“”„‟…‧﹏﹑﹔·。]/;

	constructor(pTree?: PTreeNode) {
		this.prefixTree = pTree ? pTree : getDefFileManager().getPrefixTree();
	}


	scanLine(line: string, offset?: number): PhraseInfo[] {
		let traversers: PTreeTraverser[] = [];
		const phraseInfos: PhraseInfo[] = [];

		for (let i = 0; i < line.length; i++) {
			let c="";
			if (getSettings().enableCaseSensitive) {
				c = line.charAt(i);
			}
			else {
				c = line.charAt(i).toLowerCase();
			}
			if (this.isValidStart(line, i)) {
				traversers.push(new PTreeTraverser(this.prefixTree));
			}

			traversers.forEach(traverser => {
				traverser.gotoNext(c);
				if (traverser.isWordEnd() && this.isValidEnd(line, i)) {
					const phrase = traverser.getWord();
					phraseInfos.push({
						phrase: phrase,
						from: (offset ?? 0) + i - phrase.length + 1,
						to: (offset ?? 0) + i + 1,
					});
				}
			});

			// Collect garbage traversers that hit a dead-end
			traversers = traversers.filter(traverser => {
				return !!traverser.currPtr;
			});
		}
		return phraseInfos;
	}

	private isValidEnd(line: string, ptr: number): boolean {
		let c="";
		if (getSettings().enableCaseSensitive) {
			c = line.charAt(ptr);
		}
		else {
			c = line.charAt(ptr).toLowerCase();
		}
		if (this.isNonSpacedLanguage(c)) {
			return true;
		}
		// If EOL, then it is a valid end
		if (ptr === line.length - 1) {
			return true;
		}
		// Check if next character is a terminating character
		return this.terminatingCharRegex.test(line.charAt(ptr+1));
	}

	// Check if this character is a valid start of a word depending on the context
	private isValidStart(line: string, ptr: number): boolean {
		let c="";
		if (getSettings().enableCaseSensitive) {
			c = line.charAt(ptr);
		}
		else {
			c = line.charAt(ptr).toLowerCase();
		}
		if (c == " ") {
			return false;
		}
		if (ptr === 0 || this.isNonSpacedLanguage(c)) {
			return true;
		}
		// Check if previous character is a terminating character
		return this.terminatingCharRegex.test(line.charAt(ptr-1))
	}

	private isNonSpacedLanguage(c: string): boolean {
		return this.cnLangRegex.test(c);
	}
}

