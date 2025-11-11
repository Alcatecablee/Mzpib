import "dotenv/config";
import fs from "fs";

const data = JSON.parse(fs.readFileSync('all-videos-complete.json', 'utf-8'));

// Extract potential artist names from titles
const artistCounts = new Map<string, number>();

// Common patterns for artist names
const patterns = [
  // Direct artist mentions
  /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,  // Title case at start
  /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/,    // Any title case name
  /@(\w+)/,                              // @username
  /u\/(\w+)/,                            // u/username
  /by\s+([A-Za-z\s]+)/i,                 // "by Artist"
  /ft\.?\s+([A-Za-z\s]+)/i,              // "ft Artist"
];

// Known artist names to look for
const knownArtists = [
  'Xoli Mfeka', 'Premlly Prem', 'Premly Prem', 'Kira', 'Simplypiiper', 
  'Pipipiper', 'Hailee Starr', 'KiraJord', 'MochiW', 'Will25'
];

console.log(`Analyzing ${data.videos.length} video titles...\n`);

for (const video of data.videos) {
  const title = video.title.toLowerCase();
  
  // Check for known artists
  for (const artist of knownArtists) {
    if (title.includes(artist.toLowerCase())) {
      artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
    }
  }
}

// Sort by count
const sorted = Array.from(artistCounts.entries())
  .sort((a, b) => b[1] - a[1]);

console.log("Artists found in video titles:");
console.log("=".repeat(80));
sorted.forEach(([artist, count], i) => {
  console.log(`${i + 1}. ${artist}: ${count} videos`);
});

console.log("\n" + "=".repeat(80));
console.log(`Total unique artists found: ${sorted.length}`);
console.log("=".repeat(80));

// Show sample titles from largest folders
console.log("\n\nSample titles from 'Onyfans PorninBlack' folder (1154 videos):");
const pornInBlack = data.videos.filter((v: any) => v.folderName === 'Onyfans PorninBlack');
pornInBlack.slice(0, 50).forEach((v: any, i: number) => {
  console.log(`  ${i + 1}. ${v.title}`);
});

console.log("\n\nSample titles from 'Mzansi OnlyFans' folder (429 videos):");
const mzansi = data.videos.filter((v: any) => v.folderName === 'Mzansi OnlyFans');
mzansi.slice(0, 50).forEach((v: any, i: number) => {
  console.log(`  ${i + 1}. ${v.title}`);
});
