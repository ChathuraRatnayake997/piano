# Mini Piano

A minimal two-octave piano that runs entirely in the browser. Play it with your computer keyboard, your mouse, or your fingers on a touchscreen. No build step, no dependencies, no audio files — the sound is synthesized live with the Web Audio API.

## Record your playing

Click **Record** under the piano, play, then click **Stop**. A few moments later a **Download WAV** button appears with the length and size of the take.

- Audio is saved as 16-bit stereo WAV at your device's sample rate.
- The take is normalized to a healthy level, and it captures the piano mix before the volume slider, so speaker volume does not affect the file.
- A single take can be up to 10 minutes long; starting a new recording replaces the previous take.
- Everything stays in your browser — nothing is uploaded anywhere.

## Learn a song

Click **Learn a song** next to Record, then pick a tune from the menu in the guide header:

- **Happy Birthday**
- **Hot Cross Buns** — 3 notes, a good first song
- **Ode to Joy**
- **Twinkle Twinkle**

The guide:

- shows the whole melody as chips with the key to press and its note name,
- marks the next key on the piano with a pulsing ring,
- advances when you play the right note (keyboard or tap), with a small pop/flash on each finished note,
- **shows a timing bar on the next note** that fills over the length of the note just played — play the note when the bar fills to keep the song's rhythm,
- **turns sustain on automatically** when the guide starts (and restores your previous setting when you close it),
- gives a gentle “Heard … — press …” hint on a wrong note, without blocking free play,
- has a **Loop** toggle that restarts the song after each complete pass, for continuous practice,
- resets to the beginning when you switch songs, and closes with `Esc` or the × button.

Happy Birthday in C major:

```
G  G  A  G  C  B
G  G  A  G  D  C
G  G  G  E  C  B  A
F  F  E  C  D  C
```

The on-screen chips show the actual key letters for this keyboard layout (for example, `G` for G4, `H` for A4), so you can follow along without reading music.

## Notes

- Audio starts on the first note you play, because browsers require a user gesture before playing sound.
- Sound is generated with oscillators and a synthesized reverb, so it is lightweight but not a sampled grand piano.
- Works in current versions of Chrome, Firefox, Safari, and Edge.
