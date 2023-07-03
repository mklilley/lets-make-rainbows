# lets-make-rainbows

An interactive digital experiment to simulate the physics of rainbows. For more context on the why, [visit my blog](https://mattlilley.com/posts/lets-make-rainbows/).

## Physics

The app includes refraction, dispersion and total internal reflection. This is enough for a first iteration. Some obvious missing/incorrect bits include:

- Reflection - standard reflection is completely absent because each reflection spawns a new light ray to keep track of and I was not prepared to deal with an explosion of light rays in this version.
- Circular prism is not actually a circle - I opted for a prism with many faces to simplify the refraction calculation by pre-calculating the “normal” vectors to the prism.
- Exaggerated differences between the colours - Otherwise refraction would hardly be visible on screen.

## Code

The workhorse for this app is the [p5.js library](https://p5js.org/). I use it in 3 places in the app:

- `ui.js` - creates a transparent UI layer that allows users to draw their own prisms
- `prism.js` - creates a transparent layer to display the prisms
- `photons.js` - creates a black layer upon which the light rays are drawn

Having multiple p5 canvases allows the light rays, prisms and UI to be independently cleared.

`photons.js` is primarily responsible for evolving the light rays and drawing them on screen.

`prism.js` is primarily responsible defining a prism, its boundaries and it's normal vectors and drawing prisms on screen.

`ui.js` is primarily responsible for intermediating the user interaction. This involves dealing with DOM element events and canvas interactions, e.g. clicks, drags, long holds.

`globalState.js` defines data that's shared across p5 instances and facilitates the saving of state in the URL.

This code evolved out of a small play thing over the course of a couple of weeks. I hope therefore that you'll forgive the many best practices that I've definitely violated. It was my intention to try and separate things that could be separated, but as I built out more and more UI it all got mixed up as I sped towards my self imposed deadline.
