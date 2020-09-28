# A D3 library for drawing a piano

Configurable SVG piano drawn with generated events for key press and release using [D3](https://d3js.org/). Implemented using [TypeScript](https://www.typescriptlang.org/).

### Installation

```
npm install --save @phbalance/d3-piano
npm install --save d3-select # peer dependency
npm install --save d3-scale # peer dependency
```

### Use

The drawing of the piano into an SVG element is achieved by calling `drawPiano`. Provide the svg element, a callback to be invoked when an action is performed on a key (i.e. event generated for "key" pressed or depressed), and configuration details. The configuration includes: 

```typescript
export interface IPianoDrawConfig {
	steps: string[];
	octaves: number[];
	invalidNotes: string[];

	stopKeyPressWithExit: boolean;

	width: number;
}
```

# Configuration Parameters
`steps` is an array of the names of the keys starting from left most (lowest frequency) key.
`octaves` is an array of which octaves to draw.
`invalidNotes` is a list of notes to exclude from the provided set of steps and octaves.
`width` is the width of the piano drawn in the svg in pixels.
`stopKeyPressWithExit` indicates if `mouseout` events should be bound to the keys. If `true`, if the mouse cursor leaves the bounds of the piano key it will be the same as if the key were no longer pressed even if the mouse is still held down. If `false` there is no `mouseout` event and by pushing the mouse down, moving the cursor out of that key, and then releasing the mouse you will not generate a key released message. You can use this approach to crudely generate chords.


#### Example
An example of use:
```typescript
import { drawPiano, PianoKeyAction, IKey } from "@phbalance/d3-piano";

...

const svgToDrawInto = do something to create the SVG you want the piano to be drawn into

function keyAction(action: PianoKeyAction, keyInfo: IKey): void {
    if(action === PianoKeyAction.PRESS_START) {
        // Do stuff. Perhaps generate a tone.
    } else {
        // Do stuff. Perhaps turn off a tone.
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
    width: 800
};

// Note, if you're using a class method as the passed in callback you may need to do something like this.keyAction.bind(this)
drawPiano(svgToDrawInto, keyAction, config);
```

### Reporting Issues

You can report [bugs here](https://github.com/phBalance/d3-piano/issues). Feel free to make suggestions as well.