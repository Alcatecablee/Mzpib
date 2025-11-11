import fs from "fs";

const data = JSON.parse(fs.readFileSync('all-videos-complete.json', 'utf-8'));

// Extract all unique base names (remove .mp4, .m4v extensions and numbers)
const artistNames = new Set<string>();
const artistVideoCounts = new Map<string, number>();

for (const video of data.videos) {
  let name = video.title;
  
  // Remove extensions
  name = name.replace(/\.(mp4|m4v|mov|avi)$/i, '');
  
  // Skip hex/UUID filenames
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(name)) continue;
  if (/^[0-9a-f]{8,}$/i.test(name)) continue;
  if (/^0_[0-9a-f]{32}$/i.test(name)) continue;
  
  // For short codes (3-6 chars, all lowercase/uppercase), these might be artist codes
  if (/^[a-z0-9]{2,6}$/i.test(name)) {
    artistNames.add(name);
    artistVideoCounts.set(name, (artistVideoCounts.get(name) || 0) + 1);
    continue;
  }
  
  // Extract names from descriptive titles
  // Look for patterns like "Artist Name [rest of title]"
  const patterns = [
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+/,  // "Xoli Mfeka Something"
    /^([A-Za-z]+)\s+/,                        // "Premly Something"
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      const artistName = match[1].trim();
      if (artistName.length > 2) {
        artistNames.add(artistName);
        artistVideoCounts.set(artistName, (artistVideoCounts.get(artistName) || 0) + 1);
        break;
      }
    }
  }
}

// Sort by video count
const sorted = Array.from(artistVideoCounts.entries())
  .sort((a, b) => b[1] - a[1]);

console.log("ALL UNIQUE ARTISTS/CODES FOUND:");
console.log("=".repeat(80));
sorted.forEach(([artist, count], i) => {
  console.log(`${(i + 1).toString().padStart(3)}. ${artist.padEnd(30)} : ${count} videos`);
});

console.log("\n" + "=".repeat(80));
console.log(`Total unique artists/codes: ${sorted.length}`);
console.log("=".repeat(80));

// Save complete list
fs.writeFileSync('all-artists-extracted.json', JSON.stringify({
  totalArtists: sorted.length,
  artists: sorted.map(([name, count]) => ({ name, count }))
}, null, 2));

console.log("\n✓ Saved to: all-artists-extracted.json");
