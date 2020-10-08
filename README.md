# A D3 library for drawing a piano

Configurable SVG piano drawn with generated events for key press and release using [D3](https://d3js.org/). Implemented using [TypeScript](https://www.typescriptlang.org/).

## Installation

```
npm install --save @phbalance/d3-piano
npm install --save d3-select # peer dependency
npm install --save d3-scale # peer dependency
```

## Use

The drawing of the piano into an SVG element is achieved by calling `drawPiano`. Provide the svg element, a callback to be invoked when an action is performed on a key (i.e. event generated for "key" pressed or depressed), and configuration details. The configuration includes: 

```typescript
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
```

### Configuration Parameters
`invalidNotes` is a list of notes to exclude from the provided set of steps and octaves.

`keyLabel` indicates what kind of label the key should have: none, a simple note name, or a full name of octave plus the simple note name.

`width` is the width of the piano drawn in the svg in pixels.

`octaves` is an array of which octaves to draw.

`steps` is an array of the names of the keys starting from left most (lowest frequency) key.

`stopKeyPressWithExit` indicates if `mouseout` or `pointerout` events should be bound to the keys. PointerEvents are a consolidation of mouse and touch events. If `true`, if the mouse/pointer cursor leaves the bounds of the piano key it will be the same as if the key were no longer pressed even if the mouse is still held down. If `false` there is no `mouseout` or `pointerout` event bound. Thus by pushing the mouse down, moving the cursor out of that key, and then releasing the mouse you will not generate a key released message. For touch devices you probably just need to drag your finger a bit. You can use this approach to crudely generate chords.



### Example
An example of use:
```typescript
import { drawPiano, IKey, PianoKeyAction, PianoKeyLabel } from "@phbalance/d3-piano";

...

const svgToDrawInto = do something to create the SVG you want the piano to be drawn into

function keyAction(action: PianoKeyAction, keyInfo: IKey): void {
    if(action === PianoKeyAction.PRESS_START) {
        // Do stuff. Perhaps generate a tone?
    } else {
        // Do stuff. Perhaps turn off a tone?
    }
}

const config: IKey = {
    steps: ["C", "D", "E", "F", "G", "A", "B"],
    octaves: [3, 4, 5, 6, 7, 8], // Computer speakers probably can't reproduce octaves 0 & 1 & most of 2 so ignore them
    invalidNotes: [ // For an 88 key keyboard
        "0C", "0D", "0E", "0F", "0G",
        "8C", "8D", "8E", "8F", "8G", "8A", "8B",
    ],
    stopKeyPressWithExit: true,
    keyLabel: PianoKeyLabel.NONE,
    width: 800
};

// Note, if you're using a class method as the passed in callback you may need to do something like this.keyAction.bind(this)
drawPiano(svgToDrawInto, keyAction, config);
```

### Touch Support

Touch support via [PointerEvents ](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) was added in version 0.1.1.

## Reporting Issues

You can report [bugs here](https://github.com/phBalance/d3-piano/issues). Feel free to make suggestions as well.