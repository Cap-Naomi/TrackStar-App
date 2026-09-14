import fs from 'node:fs';
import zlib from 'node:zlib';

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const output = Buffer.alloc(data.length + 12);
  output.writeUInt32BE(data.length, 0);
  name.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8);
  return output;
}

function writePng(filename, size, transparent = false, monochrome = false) {
  const rows = Buffer.alloc((size * 4 + 1) * size);
  const center = size / 2;
  const radius = size * 0.3;
  const pulse = [
    [0.22, 0.51], [0.36, 0.51], [0.43, 0.36], [0.51, 0.66],
    [0.59, 0.42], [0.66, 0.51], [0.78, 0.51],
  ].map(([x, y]) => [x * size, y * size]);

  const distanceToSegment = (x, y, ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
  };

  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    rows[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = row + 1 + x * 4;
      const distance = Math.hypot(x - center, y - center);
      let color = transparent ? [0, 0, 0, 0] : [8, 10, 9, 255];
      if (!transparent && distance < size * 0.44) {
        const glow = Math.max(0, 1 - distance / (size * 0.44));
        color = [Math.round(8 + glow * 27), Math.round(10 + glow * 36), Math.round(9 + glow * 7), 255];
      }
      if (distance <= radius) color = monochrome ? [255, 255, 255, 255] : [200, 255, 85, 255];
      const onPulse = pulse.slice(1).some(([bx, by], index) => {
        const [ax, ay] = pulse[index];
        return distanceToSegment(x, y, ax, ay, bx, by) < size * 0.025;
      });
      if (onPulse && distance < radius * 1.12) color = monochrome ? [0, 0, 0, 255] : [17, 25, 7, 255];
      rows[offset] = color[0];
      rows[offset + 1] = color[1];
      rows[offset + 2] = color[2];
      rows[offset + 3] = color[3];
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([signature, chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(filename, png);
}

writePng('assets/icon.png', 1024);
writePng('assets/splash-icon.png', 512, true);
writePng('assets/favicon.png', 64);
writePng('assets/android-icon-foreground.png', 432, true);
writePng('assets/android-icon-monochrome.png', 432, true, true);
