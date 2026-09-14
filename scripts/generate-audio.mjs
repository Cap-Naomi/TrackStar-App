import fs from 'node:fs';
import path from 'node:path';

const sampleRate = 22050;
const durationSec = 8;
const frameCount = sampleRate * durationSec;
const outputDirectory = path.resolve('assets/audio');
fs.mkdirSync(outputDirectory, { recursive: true });

function makeLoop(bpm, filename, rootHz) {
  const samples = new Int16Array(frameCount);
  const beatSec = 60 / bpm;
  for (let frame = 0; frame < frameCount; frame += 1) {
    const t = frame / sampleRate;
    const beatPhase = t % beatSec;
    const beatIndex = Math.floor(t / beatSec);
    const barPhase = t % (beatSec * 4);
    const kick = beatPhase < 0.13
      ? Math.sin(2 * Math.PI * (88 - beatPhase * 320) * beatPhase) * Math.exp(-beatPhase * 28) * 0.62
      : 0;
    const hatPhase = t % (beatSec / 2);
    const noise = (((frame * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const hat = hatPhase < 0.035 ? noise * Math.exp(-hatPhase * 90) * 0.09 : 0;
    const chordRoot = rootHz * (beatIndex % 4 === 3 ? 1.122 : 1);
    const pad =
      (Math.sin(2 * Math.PI * chordRoot * t) +
        0.45 * Math.sin(2 * Math.PI * chordRoot * 1.5 * t) +
        0.25 * Math.sin(2 * Math.PI * chordRoot * 2 * t)) *
      (0.06 + 0.025 * Math.sin((2 * Math.PI * barPhase) / (beatSec * 4)));
    const value = Math.max(-1, Math.min(1, kick + hat + pad));
    samples[frame] = Math.round(value * 32767);
  }

  const byteLength = 44 + samples.byteLength;
  const buffer = Buffer.alloc(byteLength);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(byteLength - 8, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.byteLength, 40);
  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(samples[index], 44 + index * 2);
  }
  fs.writeFileSync(path.join(outputDirectory, filename), buffer);
}

makeLoop(145, 'pulse-145.wav', 98);
makeLoop(164, 'pulse-164.wav', 110);
makeLoop(172, 'pulse-172.wav', 123.47);
makeLoop(178, 'pulse-178.wav', 130.81);
