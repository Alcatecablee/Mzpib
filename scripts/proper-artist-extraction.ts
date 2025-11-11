import fs from "fs";

const data = JSON.parse(fs.readFileSync('all-videos-complete.json', 'utf-8'));

// Stopwords to ignore
const stopwords = new Set([
  'onlyfans', 'porn', 'video', 'sex', 'tape', 'leaked', 'hardcore', 'anal', 'oral',
  'threesome', 'foursome', 'fucking', 'masturbating', 'riding', 'squirting',
  'shower', 'tease', 'big', 'booty', 'ass', 'tits', 'dick', 'cock', 'pussy',
  'hot', 'ebony', 'black', 'white', 'mzansi', 'south', 'african', 'vs', 'with',
  'and', 'the', 'in', 'on', 'at', 'by', 'for', 'to', 'of', 'a', 'is', 'was',
  'thread', 'official', 'full', 'first', 'time', 'live', 'cam', 'watch'
]);

const artistCounts = new Map<string, Set<string>>();  // artist -> set of video titles

function classifyTitle(title: string): 'readable' | 'uuid' | 'code' {
  const clean = title.replace(/\.(mp4|m4v|mov|avi)$/i, '');
  
  // UUID pattern
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(clean)) return 'uuid';
  if (/^[0-9a-f]{32}$/i.test(clean)) return 'uuid';
  if (/^0_[0-9a-f]{32}$/i.test(clean)) return 'uuid';
  
  // Short code (2-6 alphanumeric chars)
  if (/^[a-z0-9]{2,6}$/i.test(clean) && clean.length < 7) return 'code';
  
  // Has spaces or multiple capital letters = readable
  if (clean.includes(' ') || /[A-Z].*[A-Z]/.test(clean)) return 'readable';
  
  return 'code';
}

function extractArtistNames(title: string): string[] {
  const artists: string[] = [];
  
  // Remove extension
  let clean = title.replace(/\.(mp4|m4v|mov|avi)$/i, '');
  
  // Pattern 1: "Artist Name OnlyFans ..."
  // Pattern 2: "Artist Name Porn ..."
  // Pattern 3: "Artist Name Vs ..."
  const patterns = [
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(?:OnlyFans|Porn|Sex|Leaked|Vs|Aka|Ft)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s/,
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:OnlyFans|Porn|Leaked|Vs)/i,
  ];
  
  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      const words = candidate.toLowerCase().split(/\s+/);
      
      // Skip if all words are stopwords
      if (words.every(w => stopwords.has(w))) continue;
      
      // Skip if contains numbers
      if (/\d/.test(candidate)) continue;
      
      // Must be 2+ words or single name > 5 chars
      if (words.length >= 2 || candidate.length > 5) {
        artists.push(candidate);
        break;
      }
    }
  }
  
  return artists;
}

console.log("Analyzing 1,692 videos for artist names...\n");

let readableCount = 0;
let uuidCount = 0;
let codeCount = 0;

for (const video of data.videos) {
  const type = classifyTitle(video.title);
  
  if (type === 'readable') {
    readableCount++;
    const artists = extractArtistNames(video.title);
    for (const artist of artists) {
      if (!artistCounts.has(artist)) {
        artistCounts.set(artist, new Set());
      }
      artistCounts.get(artist)!.add(video.title);
    }
  } else if (type === 'uuid') {
    uuidCount++;
  } else {
    codeCount++;
  }
}

console.log(`Title classification:`);
console.log(`  - Readable titles: ${readableCount}`);
console.log(`  - UUID filenames: ${uuidCount}`);
console.log(`  - Short codes: ${codeCount}`);
console.log();

// Sort by count
const sorted = Array.from(artistCounts.entries())
  .map(([name, titles]) => ({ name, count: titles.size, titles: Array.from(titles).slice(0, 5) }))
  .sort((a, b) => b.count - a.count);

console.log("TOP 100 ARTISTS FOUND:");
console.log("=".repeat(100));
sorted.slice(0, 100).forEach((artist, i) => {
  console.log(`${(i + 1).toString().padStart(3)}. ${artist.name.padEnd(35)} : ${artist.count} videos`);
  artist.titles.forEach(t => console.log(`      - ${t.substring(0, 90)}`));
});

console.log("\n" + "=".repeat(100));
console.log(`Total unique artists found: ${sorted.length}`);
console.log("=".repeat(100));

// Save results
fs.writeFileSync('proper-artists-extracted.json', JSON.stringify({
  summary: {
    totalVideos: data.videos.length,
    readableTitles: readableCount,
    uuidFilenames: uuidCount,
    shortCodes: codeCount,
    uniqueArtists: sorted.length
  },
  artists: sorted
}, null, 2));

console.log("\n✓ Saved to: proper-artists-extracted.json");
