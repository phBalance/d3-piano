import { scaleLinear } from "d3-scale";
import { create, select, Selection } from "d3-selection";

import { getKeyboard, Keyboard, IKey } from "./piano";

export { IKey } from "./piano";

export enum PianoKeyAction {
	PRESS_START = 0,
	PRESS_END = 1,
}

export interface IPianoDrawConfig {
	steps: string[];
	octaves: number[];
	invalidNotes: string[];
	width: number;
}

export function drawPiano(svgEle: SVGSVGElement, noteActionCb: (action: PianoKeyAction, keyInfo: IKey) => void, config: IPianoDrawConfig) {
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

	const keyGroup = svg
		.append("g")
			.attr("class", "keyboard")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	const keyRects = keyGroup
			.selectAll("rect")
			.data<IKey>(pianoKeys);

	keyRects
		.enter()
			.append("rect")
				.attr("class", "key")
				.attr("stroke", "black")
				.attr("fill", colourKey)
				.attr("x", function drawKeyPosition(d) {
					return xScale(d.position + (d.position % 1) * (1 - keyWidthRatio)); // d.position is x.5 for black keys
				})
				.attr("y", function(d) {
					return yScale(0);
				})
				.attr("width", function drawKeyWidth(d) {
					return xScale(minX + (d.white ? 1 : keyWidthRatio));
				})
				.attr("height", function(d) {
					return yScale(d.white ? 1 : keyHeightRatio);
				})
				.on("mousedown.note", function notePress(d) {
					const rect: Selection<SVGRectElement, IKey, null, undefined> = select(this);

					noteActionCb(PianoKeyAction.PRESS_START, rect.datum());
				})
				// .on("mouseup.note mouseout.note", (d) => {
				.on("mouseup.note", function noteRelease(d) { // FIXME: Temporary ... make it easy to do cords
					const rect: Selection<SVGRectElement, IKey, null, undefined> = select(this);

					noteActionCb(PianoKeyAction.PRESS_END, rect.datum());
				})
				.on("mousedown.shade", function shadeKey(d) {
					const rect: Selection<SVGRectElement, IKey, null, undefined> = select(this);

					rect.attr("fill", "red");
				})
				// .on("mouseup.shade mouseout.shade", function unshadeKey(d) {
				.on("mouseup.shade", function unshadeKey(d) {
					const rect: Selection<SVGRectElement, IKey, null, undefined> = select(this);

					rect.attr("fill", colourKey);
				});

	function colourKey(d: IKey): string {
		return d.white ? "white" : "black";
	}

	// const labels = keyGroup
	// 	.append("g")
	// 		.attr("class", "labels")
	// 		.attr("font-size", "6px")
	// 		.selectAll("text")
	// 		.data(pianoKeys);

	// labels
	// 	.enter()
	// 		.append("text")
	// 			.attr("class", "key-label")
	// 			.text((d) => {
	// 				return d.keyId;
	// 			})
	// 			.attr("x", (d) => {
	// 				return xScale(d.position + (d.position % 1) * (1 - keyHeightRatio) / 2);
	// 			})
	// 			.attr("y", (d) => {
	// 				return yScale(1);
	// 			});
}
