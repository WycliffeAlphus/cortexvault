/**
 * Generates a minimal valid EDF (European Data Format) file.
 * One EEG channel (Fp1), 256 Hz, 10-second recording, 10Hz alpha-band sine wave.
 * Output: public/demo-eeg/demo-motor-imagery.edf
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/demo-eeg");
const OUT_FILE = join(OUT_DIR, "demo-motor-imagery.edf");

const SAMPLE_RATE = 256;   // samples per second
const DURATION_S = 10;     // 10 data records × 1 second each
const NUM_SIGNALS = 1;
const HEADER_BYTES = 256 + NUM_SIGNALS * 256;

function pad(str, len) {
  return String(str).padEnd(len, " ").slice(0, len);
}

// ── General header (256 bytes) ───────────────────────────────────────────────
const general = Buffer.alloc(256, 0x20); // fill with spaces
general.write(pad("0", 8),          0);   // version
general.write(pad("Anonymous F M 01-JAN-1990 CortexVault-Demo", 80), 8);  // patient id
general.write(pad("Startdate 29-MAR-2026 CortexVault Motor-Imagery", 80), 88); // recording id
general.write(pad("29.03.26", 8),   168); // startdate
general.write(pad("00.00.00", 8),   176); // starttime
general.write(pad(HEADER_BYTES, 8), 184); // bytes in header
general.write(pad("EDF+C", 44),     192); // reserved (EDF+C = continuous)
general.write(pad(DURATION_S, 8),   236); // number of data records
general.write(pad("1", 8),          244); // duration of each record (seconds)
general.write(pad(NUM_SIGNALS, 4),  252); // number of signals

// ── Signal header (256 bytes per signal) ─────────────────────────────────────
const signal = Buffer.alloc(NUM_SIGNALS * 256, 0x20);

// Each field is written at offset = field_offset_within_signal_header * NUM_SIGNALS + signal_index * field_size
// For 1 signal it's straightforward:
let o = 0;
signal.write(pad("EEG Fp1", 16),   o);        o += 16;  // label
signal.write(pad("", 80),          o);        o += 80;  // transducer type
signal.write(pad("uV", 8),         o);        o += 8;   // physical dimension
signal.write(pad("-3276.8", 8),    o);        o += 8;   // physical min
signal.write(pad("3276.7", 8),     o);        o += 8;   // physical max
signal.write(pad("-32768", 8),     o);        o += 8;   // digital min
signal.write(pad("32767", 8),      o);        o += 8;   // digital max
signal.write(pad("HP:0.1Hz LP:40Hz", 80), o); o += 80; // prefiltering
signal.write(pad(SAMPLE_RATE, 8),  o);        o += 8;   // samples per record
signal.write(pad("", 32),          o);                  // reserved

// ── Data records ─────────────────────────────────────────────────────────────
// 10Hz alpha sine wave + 1Hz slow drift + small noise
const dataBuffers = [];
for (let rec = 0; rec < DURATION_S; rec++) {
  const buf = Buffer.alloc(SAMPLE_RATE * 2); // 2 bytes per 16-bit sample
  for (let s = 0; s < SAMPLE_RATE; s++) {
    const t = rec + s / SAMPLE_RATE;
    const alpha = Math.sin(2 * Math.PI * 10 * t);       // 10Hz alpha band
    const drift = 0.3 * Math.sin(2 * Math.PI * 1 * t); // 1Hz slow drift
    const noise = (Math.random() - 0.5) * 0.1;
    const amplitude = (alpha + drift + noise) * 800;    // scale to ~±1000 digital units
    const digital = Math.max(-32768, Math.min(32767, Math.round(amplitude)));
    buf.writeInt16LE(digital, s * 2);
  }
  dataBuffers.push(buf);
}

// ── Write file ────────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, Buffer.concat([general, signal, ...dataBuffers]));

const size = (HEADER_BYTES + DURATION_S * SAMPLE_RATE * 2) / 1024;
console.log(`✓ Generated: ${OUT_FILE}`);
console.log(`  Channels: 1 (EEG Fp1) | Duration: ${DURATION_S}s | Rate: ${SAMPLE_RATE}Hz | Size: ${size.toFixed(1)}KB`);
