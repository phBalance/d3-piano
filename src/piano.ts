// With help from http://next.plnkr.co/plunk/fumcmx
export type Keyboard  = IKey[];
export interface IKey {
	keyId: string;
	note: string;
	step: string;
	octave: number;
	sign: string;
	white: boolean;
	exists: boolean;
	position: number;
	frequency: number; // in Hz
	keyNum: number; // Based on 88 key piano
}

const sharp = "\u266f";

export function getKeyboard(steps: string[], octaves: number[], invalidNotes: string[]): Keyboard {
	const keyboard: Keyboard = [];

	// push whiteKeys
	let position = 0;
	octaves.forEach(function(octave) {
		steps.forEach(function(step) {
			const whiteKey = genKeyboardKey(position, octave, step, "", true, true);
			if (invalidNotes.indexOf(whiteKey.note) === -1) { // push only valid keys
				keyboard.push(whiteKey);
			}
			position += 1;
		});
	});

	// push blackKeys
	position = 0.5;
	octaves.forEach(function(octave) {
		steps.forEach(function(step) {
			const blackKey = genKeyboardKey(position, octave, step, sharp, false, true);
			if (invalidNotes.indexOf(blackKey.note) === -1) { // push only valid keys
				if (blackKey.step === "E" || blackKey.step === "B" || blackKey.note === "8C") {
					blackKey.exists = false;
				}
				keyboard.push(blackKey);
			}
			position += 1;
		});
	});

	return keyboard.filter((key) => {
		return key.exists;
	});
}

// on piano the octave numbering starts with C
const noteToKeyInOctave = {
	C: 0,
	["C" + sharp]: 1,
	D: 2,
	["D" + sharp]: 3,
	E: 4,
	F: 5,
	["F" + sharp]: 6,
	G: 7,
	["G" + sharp]: 8,
	A: 9,
	["A" + sharp]: 10,
	B: 11,
};

// helper function genKeyBoardKey
function genKeyboardKey(position: number, octave: number, step: string, sign: string, white: boolean, exists: boolean) {
	const keyId = octave + step + sign;
	const note = step + sign;
	const keyNum = (octave * 12) + (noteToKeyInOctave[note] - noteToKeyInOctave.A) + 1;

	const key: IKey = {
		keyId,
		note,
		step,
		octave,
		sign,
		white,
		exists,
		position,
		frequency: Math.pow(2, (keyNum - 49) / 12) * 440,
		keyNum,
	};

	return key;
}
