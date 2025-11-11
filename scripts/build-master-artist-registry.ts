import fs from "fs";

// Master artist registry with canonical names and variations
const MASTER_ARTIST_REGISTRY = {
  // South African Artists
  "Xoli Mfeka": ["xoli mfeka", "xolisile", "big booty xoli"],
  "Premlly Prem": ["premlly prem", "premly prem", "limpopo porn star premly"],
  "Cataleya": ["cataleya", "sa porn star cataleya", "johannesburg based cataleya"],
  "Simplypiiper": ["simplypiiper", "simplypiper", "pipipiper", "pipi"],
  "Kira": ["kira", "kirajord"],
  "Hailee Starr": ["hailee starr"],
  "Anelay Ndlovu": ["anelay ndlovu", "anelay"],
  "Petite Tumi": ["petite tumi"],
  "Fezile Phillips": ["fezile phillips"],
  "Phatkittykat": ["phatkittykat"],
  "Amkonly": ["amkonly", "amkonlyf", "big booty amkonly"],
  "Queen Tahshaar": ["queen tahshaar"],
  "Ndindi": ["ndindi"],
  "Wbloee": ["wbloee", "wbloe"],
  "Black Star Za": ["black star za"],
  "Lady P": ["lady p"],
  
  // International Artists  
  "Briana Monique": ["briana monique"],
  "Emmanuel Lustin": ["emmanuel lustin"],
  "Jayla Page": ["jayla page", "jaylapage"],
  "Gogo Fukme": ["gogo fukme"],
  "Gem Jewels": ["gem jewels", "big booty gem jewels"],
  "Perfect Price": ["perfect price"],
  "Sly Diggler": ["sly diggler"],
  "We Want Diamond": ["we want diamond", "wwdiamond"],
  "Free Pressure": ["free pressure"],
  "Zaysthewayvip": ["zaysthewayvip", "zay"],
  "Melatoninthroat": ["melatoninthroat"],
  "Ebonysashaa": ["ebonysashaa"],
  "Lalanow": ["lalanow"],
  "Thick Ass Daphne": ["thick ass daphne"],
  "Kat Von Don": ["kat von don"],
  "Diamond Banks": ["diamond banks"],
  "Ny Ny Lew": ["ny ny lew"],
  "Muva Phoenix": ["muva phoenix"],
  "Famous Ryleigh": ["famous ryleigh", "luxeisme"],
  "GGwiththewap": ["ggwiththewap"],
  "TheStrokexxx": ["thestrokexxx"],
  "Bblcommunity": ["bblcommunity"],
  "Equatorial Guinea Official": ["equatorial guinea official"],
};

// Load the extracted data
const extracted = JSON.parse(fs.readFileSync('proper-artists-extracted.json', 'utf-8'));
const allVideos = JSON.parse(fs.readFileSync('all-videos-complete.json', 'utf-8'));

// Match videos to artists
const artistVideoMap = new Map<string, Set<any>>();

for (const canonicalName in MASTER_ARTIST_REGISTRY) {
  artistVideoMap.set(canonicalName, new Set());
}

// Add "Needs Manual Review" category
artistVideoMap.set("Needs Manual Review", new Set());

// Match each video to an artist
for (const video of allVideos.videos) {
  const titleLower = video.title.toLowerCase();
  let matched = false;
  
  for (const [canonicalName, variations] of Object.entries(MASTER_ARTIST_REGISTRY)) {
    for (const variation of variations) {
      if (titleLower.includes(variation)) {
        artistVideoMap.get(canonicalName)!.add(video.id);
        matched = true;
        break;
      }
    }
    if (matched) break;
  }
  
  // If no match, add to "Needs Manual Review"
  if (!matched) {
    artistVideoMap.get("Needs Manual Review")!.add(video.id);
  }
}

// Create summary
const summary: any[] = [];
for (const [artist, videoIds] of artistVideoMap.entries()) {
  if (videoIds.size > 0) {
    summary.push({
      artist,
      videoCount: videoIds.size,
      videoIds: Array.from(videoIds)
    });
  }
}

// Sort by video count
summary.sort((a, b) => b.videoCount - a.videoCount);

console.log("\n" + "=".repeat(100));
console.log("MASTER ARTIST REGISTRY - ORGANIZATION PLAN");
console.log("=".repeat(100) + "\n");

summary.forEach((item, i) => {
  console.log(`${(i + 1).toString().padStart(3)}. ${item.artist.padEnd(35)} : ${item.videoCount.toString().padStart(4)} videos`);
});

console.log("\n" + "=".repeat(100));
console.log(`Total Artists: ${summary.length - 1} (+ Manual Review category)`);
console.log(`Total Videos Mapped: ${allVideos.videos.length}`);
console.log("=".repeat(100));

// Save the mapping
fs.writeFileSync('master-artist-mapping.json', JSON.stringify({
  totalArtists: summary.length - 1,
  totalVideos: allVideos.videos.length,
  artistMapping: summary
}, null, 2));

console.log("\n✓ Saved to: master-artist-mapping.json");
