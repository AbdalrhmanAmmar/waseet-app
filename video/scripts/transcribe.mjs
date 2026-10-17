// Local Arabic transcription with whisper.cpp → src/reel/data/whisper-words.json (word timings).
// Caption wording lives in src/reel/transcript.ts; re-running this only refreshes timings.
// Run: node scripts/transcribe.mjs [footage.mp4] [out.json]   (defaults: the reel's source and data file)
import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } from '@remotion/install-whisper-cpp';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const whisperPath = path.join(root, 'whisper');
const VERSION = '1.5.5';
const MODEL = 'large-v3';
const input = path.resolve(root, process.argv[2] ?? 'public/footage/waseet-talk.mp4');
const output = path.resolve(root, process.argv[3] ?? 'src/reel/data/whisper-words.json');
const wav = path.join(root, 'public/footage/voice-16k.wav');

execFileSync('npx', ['remotion', 'ffmpeg', '-v', 'error', '-y', '-i', input, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav], { cwd: root, stdio: 'inherit' });
await installWhisperCpp({ to: whisperPath, version: VERSION });
await downloadWhisperModel({ model: MODEL, folder: whisperPath });
const json = await transcribe({
  inputPath: wav,
  whisperPath,
  whisperCppVersion: VERSION,
  model: MODEL,
  tokenLevelTimestamps: true,
  language: 'ar',
  splitOnWord: true,
});
const { captions } = toCaptions({ whisperCppOutput: json });
writeFileSync(output, JSON.stringify(captions, null, 1));
console.log(captions.map((c) => c.text).join(''));
