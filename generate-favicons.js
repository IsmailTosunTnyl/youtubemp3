const sharp = require('sharp');
const fs = require('fs').promises;

async function generateFavicons() {
    const svg = await fs.readFile('favicon.svg', 'utf8');
    
    // Generate PNG favicons
    await sharp(Buffer.from(svg))
        .resize(32, 32)
        .png()
        .toFile('favicon-32x32.png');

    await sharp(Buffer.from(svg))
        .resize(16, 16)
        .png()
        .toFile('favicon-16x16.png');

    // Generate ICO file
    await sharp(Buffer.from(svg))
        .resize(32, 32)
        .toFormat('ico')
        .toFile('favicon.ico');
}

generateFavicons().catch(console.error); 