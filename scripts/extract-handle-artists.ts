import fs from "fs";

const allVideos = JSON.parse(fs.readFileSync('all-videos-complete.json', 'utf-8'));

// Classify and extract handles
const handleCounts = new Map<string, number>();
const handleVideos = new Map<string, any[]>();

function classifyAndExtractHandle(title: string): { type: string; handle: string | null } {
  const clean = title.replace(/\.(mp4|m4v|mov|avi)$/i, '');
  
  // UUID patterns - ignore these
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(clean)) return { type: 'uuid', handle: null };
  if (/^[0-9a-f]{32}$/i.test(clean)) return { type: 'hash', handle: null };
  if (/^0_[0-9a-f]{32}$/i.test(clean)) return { type: 'hash', handle: null };
  
  // Hex ID folders (ignore)
  if (/^[0-9a-f]{8}$/i.test(clean)) return { type: 'hex-id', handle: null };
  
  // Short handle pattern (2-12 characters, mixed case or has capitals)
  // Examples: "BaWillow", "MayMi", "KDBarb", "gHenny", "vdfx", "PrdaB"
  if (/^[A-Za-z0-9]{2,12}$/.test(clean)) {
    // Prefer handles with at least one capital or 4+ chars
    if (/[A-Z]/.test(clean) || clean.length >= 4) {
      return { type: 'handle', handle: clean };
    }
    // Very short lowercase might be noise, but include for now
    return { type: 'handle', handle: clean };
  }
  
  // Multi-word descriptive title
  if (clean.includes(' ') || clean.length > 15) {
    return { type: 'descriptive', handle: null };
  }
  
  return { type: 'unknown', handle: null };
}

for (const video of allVideos.videos) {
  const { type, handle } = classifyAndExtractHandle(video.title);
  
  if (handle) {
    handleCounts.set(handle, (handleCounts.get(handle) || 0) + 1);
    if (!handleVideos.has(handle)) {
      handleVideos.set(handle, []);
    }
    handleVideos.get(handle)!.push(video);
  }
}

// Filter handles: keep those with 2+ videos
const MIN_VIDEOS = 2;
const validHandles = Array.from(handleCounts.entries())
  .filter(([handle, count]) => count >= MIN_VIDEOS)
  .sort((a, b) => b[1] - a[1]);

console.log("\n" + "=".repeat(100));
console.log("ARTIST HANDLES EXTRACTED FROM SHORT-CODE FILENAMES");
console.log(`(Handles with ${MIN_VIDEOS}+ videos)`);
console.log("=".repeat(100) + "\n");

validHandles.forEach(([handle, count], i) => {
  const samples = handleVideos.get(handle)!.slice(0, 3).map(v => v.title).join(', ');
  console.log(`${(i + 1).toString().padStart(3)}. ${handle.padEnd(15)} : ${count.toString().padStart(3)} videos`);
});

console.log("\n" + "=".repeat(100));
console.log(`Total Handles Found: ${validHandles.length}`);
console.log("=".repeat(100));

// Also count single-video handles (potential noise or rare artists)
const singleVideoHandles = Array.from(handleCounts.entries())
  .filter(([handle, count]) => count === 1);

console.log(`\nHandles with only 1 video: ${singleVideoHandles.length} (will go to "Needs Manual Review")`);

// Save
fs.writeFileSync('extracted-handle-artists.json', JSON.stringify({
  validHandles: validHandles.map(([handle, count]) => ({
    handle,
    count,
    videos: handleVideos.get(handle)!.map(v => ({ id: v.id, title: v.title, folderName: v.folderName }))
  })),
  singleVideoHandles: singleVideoHandles.map(([handle, count]) => ({ handle, count }))
}, null, 2));

console.log("\n✓ Saved to: extracted-handle-artists.json");
