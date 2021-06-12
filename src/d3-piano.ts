import { scaleLinear } from "d3-scale";
import {
	create,
	event as d3Event,
	select,
	Selection
} from "d3-selection";

import {
	getKeyboard,
	IKey,
	Keyboard
} from "./piano";

// Reexport IKey since we use this file to generate the declaration file for this package.
export { IKey } from "./piano";

export type CreatePianoKeyActionFunction = (containingSvgEle: SVGSVGElement, note: string, octave?: number) => void;
export interface ICreatePianoKeyActions {
	press: CreatePianoKeyActionFunction;
	release: CreatePianoKeyActionFunction;
}

export enum PianoKeyAction {
	PRESS_START = 0,
	PRESS_END = 1,
}

export enum PianoKeyLabel {
	NONE = 0,
	SIMPLE = 1,
	FULL = 2,
}

export interface IPianoDrawConfig {
	steps: string[];
	octaves: number[];
	invalidNotes: string[];

	stopKeyPressWithExit: boolean;

	keyLabel: PianoKeyLabel;

	width: number;
}

// NOTE: Only expected to be called one time since there is no update or remove.
export function drawPiano(
	svgEle: SVGSVGElement,
	noteActionCb: (action: PianoKeyAction, keyInfo: IKey) => void,
	config: IPianoDrawConfig)
	: ICreatePianoKeyActions {
	const pianoKeys: Keyboard = getKeyboard(config.steps, config.octaves, config.invalidNotes);

	// NOTE: Typical piano with 88 keys dimenions:
	// https://music.stackexchange.com/questions/20290/is-there-a-standard-width-for-piano-keys
	// https://en.wikipedia.org/wiki/Musical_keyboard
	const keyWidthRatio = 0.7; // Black to white. Real piano is ~ 23.5mm to 13.7mm or ~0.58.
	const keyHeightRatio = 0.6; // Black to white. Probably about right but guessing.
	const widthToHeightRatio = 0.15; // For full 88 keys

	const sizeHeight = config.width * widthToHeightRatio;

	// Need a small margin to handle key outlines
	const margin = {
		top: 1,
		bottom: 1,
		left: 1,
		right: 1,
	};

	const width = config.width - margin.left - margin.right;
	const height = sizeHeight - margin.top - margin.bottom;

	const svg: Selection<SVGSVGElement, undefined, null, undefined> = svgEle ? select(svgEle) : create("svg");
	svg.classed("piano", true);

	if(!svg.attr("viewBox")) {
		svg
			.attr("viewBox", `0 0 ${config.width} ${sizeHeight}`)
			.attr("perserveAspectRatio", "xMinYMin meet");
	}

	const maxX = 1 + pianoKeys.reduce((prev, curr) => {
		return prev > curr.position ? prev : curr.position;
	}, 0);
	const minX = pianoKeys.reduce((prev, curr) => {
		return prev < curr.position ? prev : curr.position;
	}, maxX);

	const xScale = scaleLinear().range([0, width]).domain([minX, maxX]);
	const yScale = scaleLinear().range([0, height]).domain([0, 1]);

	const keyboardGroup = svg
		.append("g")
			.attr("class", "keyboard")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("font-size", "8px")
			.attr("text-anchor", "middle");

	const keyGroup = keyboardGroup
		.selectAll("g")
		.data<IKey>(pianoKeys)
		.enter()
			.append("g")
				.attr("class", "key");

	keyGroup
		.append("rect")
			.attr("class", keyClass)
			.attr("stroke", "black")
			.attr("fill", keyColour)
			.attr("x", function drawKeyPosition(d) {
				return xScale(d.position + (d.position % 1) * (1 - keyWidthRatio)) || null; // d.position is x.5 for black keys
			})
			.attr("y", function(d) {
				return yScale(0) || null;
			})
			.attr("width", function drawKeyWidth(d) {
				return xScale(minX + (d.white ? 1 : keyWidthRatio)) || null;
			})
			.attr("height", function(d) {
				return yScale(d.white ? 1 : keyHeightRatio) || null;
			})
			.call(bindEvents, config.stopKeyPressWithExit);

	if(config.keyLabel !== PianoKeyLabel.NONE) {
		keyGroup
			.append("text")
				.attr("class", "key-label")
				.text((d) => {
					if(config.keyLabel === PianoKeyLabel.SIMPLE) {
						return d.step + d.sign;
					}

					return d.keyId;
				})
				.attr("fill", labelColour)
				.attr("pointer-events", "none")
				.attr("x", (d) => {
					return xScale(d.position + 0.5) || null;
				})
				.attr("y", (d) => {
					return yScale(0.9 * (d.white ? 1 : keyHeightRatio)) || null;
				});
	}

	function keyColour(d: IKey): string {
		return d.white ? "white" : "black";
	}

	function labelColour(d: IKey): string {
		return d.white ? "black" : "white";
	}

	function keyClass(d: IKey): string {
		return `key-${keyColour(d)} key-note-${d.note} key-octave-${d.octave}`;
	}

	function generateKeyPress(containingSvgEle: SVGSVGElement, note: string, octave?: number): void {
		const mouseDownEvent = new MouseEvent("mousedown");

		generateKeyEvent(containingSvgEle, mouseDownEvent, note, octave);
	}

	function generateKeyRelease(containingSvgEle: SVGSVGElement, note: string, octave?: number): void {
		const mouseUpEvent = new MouseEvent("mouseup");

		generateKeyEvent(containingSvgEle, mouseUpEvent, note, octave);
	}

	function generateKeyEvent(containingSvgEle: SVGSVGElement, mouseEvent: MouseEvent, note: string, octave?: number): void {
		const keyRectEles = containingSvgEle.querySelectorAll(`rect.key-note-${note}${octave ? ".key-octave-" + octave : ""}`);

		keyRectEles.forEach((keyRectEle) => {
			keyRectEle.dispatchEvent(mouseEvent);
		})
	}

	function notePress(rect: Selection<SVGRectElement, IKey, null, undefined>): void {
		noteActionCb(PianoKeyAction.PRESS_START, rect.datum());

		rect.attr("fill", "red");
	}

	function noteRelease(rect: Selection<SVGRectElement, IKey, null, undefined>): void {
		noteActionCb(PianoKeyAction.PRESS_END, rect.datum());

		rect.attr("fill", keyColour);
	}

	function bindEvents(selection: any, stopKeyPressWithExit: boolean) {
		const keyUpNoteEvents = `mouseup pointerup${stopKeyPressWithExit ? "  pointerout mouseout" : ""}`;

		selection
			.on("mousedown pointerdown", function keyPressEvent(this: any, event2x: MouseEvent | PointerEvent) {
				// Since we're registering 2 handlers, for compability with mouse and pointer events, we don't want
				// this to fire twice.
				// Provide backwards compatibility to version 1 and 2 of selection. Version 1.x provides the
				// event via a global (which is what requires the peer dependency). Version 2.x provides the
				// event via a parameter.
				const ev = d3Event || event2x;
				ev.preventDefault();

				const rect: Selection<SVGRectElement, IKey, null, undefined> = select(this);
				notePress(rect);
			})
			.on(keyUpNoteEvents, function noteReleaseEvent(this: any, event2x: MouseEvent | PointerEvent) {
				// Since we're registering 2 handlers, for compability with mouse and pointer events, we don't want
				// this to fire twice.
				// Provide backwards compatibility to version 1 and 2 of selection. Version 1.x provides the
				// event via a global (which is what requires the peer dependency). Version 2.x provides the
				// event via a parameter.
				const ev = d3Event || event2x;
				ev.preventDefault();

				const rect: Selection<SVGRectElement, IKey, null, undefined> = select(this);
				noteRelease(rect);
			})
	}

	return {
		press: generateKeyPress,
		release: generateKeyRelease,
	}
}
