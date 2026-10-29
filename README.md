# Mini Piano

A minimal two-octave piano that runs entirely in the browser. Play it with your computer keyboard, your mouse, or your fingers on a touchscreen. No build step, no dependencies, no audio files — the sound is synthesized live with the Web Audio API.

This version adds a **guided song mode** with Happy Birthday, Hot Cross Buns, Ode to Joy, and Twinkle Twinkle.

> An earlier snapshot of the app is kept in `../piano-backup/`.

## Play

| Action | Keys |
| --- | --- |
| Lower octave (white) | `A` `S` `D` `F` `G` `H` `J` |
| Lower octave (black) | `Q` `W` `E` `R` `T` |
| Upper octave (white) | `K` `L` `C` `V` `B` `N` `M` |
| Upper octave (black) | `Y` `U` `I` `O` `P` |
| Shift octave down / up | `←` / `→` |
| Sustain pedal | hold `Space` |
| Record / stop | **Record** button under the piano |

You can also click or tap the keys directly. Multiple notes can be played at once.

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

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
# Python 3
python -m http.server 8000
# then visit http://localhost:8000
```

## Publish with GitHub Pages

1. Create a new repository on GitHub (for example `mini-piano`).
2. Add these three files to the **root** of the repository:
   - `index.html`
   - `style.css`
   - `app.js`
3. Commit and push to the `main` branch.
4. On GitHub go to **Settings → Pages**.
5. Under **Build and deployment**, set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`, then **Save**.
6. Wait a minute or two. Your piano will be live at:
   `https://<your-username>.github.io/<repo-name>/`

Because everything is static HTML/CSS/JS, no workflow, bundler, or Node.js is needed.

## Customize

- **Range / octave limits** — `MIN_OCTAVE`, `MAX_OCTAVE`, and `SEMITONES` in `app.js`.
- **Keyboard mapping** — edit the `KEY_MAP` object in `app.js` (values are semitone offsets from C).
- **Tone** — tweak the `PARTIALS` array (harmonic ratios, gains, decay times) or the reverb settings in `initAudio()`.
- **Look** — colors live in the `:root` block of `style.css`.

## Notes

- Audio starts on the first note you play, because browsers require a user gesture before playing sound.
- Sound is generated with oscillators and a synthesized reverb, so it is lightweight but not a sampled grand piano.
- Works in current versions of Chrome, Firefox, Safari, and Edge.
