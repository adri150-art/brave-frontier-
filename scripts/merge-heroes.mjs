import fs from 'fs';

const heroes = fs.readFileSync('heroes.html', 'utf8');
let index = fs.readFileSync('index.html', 'utf8');

// 1. Extract CSS
const styleMatch = heroes.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) throw new Error("Could not find <style> in heroes.html");
const css = styleMatch[1];

index = index.replace(
  /<style id="units-screen-style">[\s\S]*?<\/style>/,
  `<style id="units-screen-style">\n${css}\n</style>`
);

// 2. Extract HTML
const htmlStartMarker = '<div class="units-container">';
const htmlStartIndex = heroes.indexOf(htmlStartMarker);
if (htmlStartIndex === -1) throw new Error("Could not find units-container in heroes.html");

let htmlEndIndex = -1;
let openDivs = 0;
for (let i = htmlStartIndex; i < heroes.length; i++) {
  if (heroes.substr(i, 4) === '<div') openDivs++;
  if (heroes.substr(i, 5) === '</div') {
    openDivs--;
    if (openDivs === 0) {
      htmlEndIndex = i + 6;
      break;
    }
  }
}
if (htmlEndIndex === -1) throw new Error("Could not find end of units-container");
let htmlContent = heroes.slice(htmlStartIndex, htmlEndIndex);

// Add the other HTML pieces (overlay, toast, artwork-overlay)
// Only match the outer overlay div
const overlayMatch = heroes.match(/<div class="overlay" id="overlay">[\s\S]*?<\/div>\s*<\/div>/);
if(overlayMatch) {
  htmlContent += '\n\n' + overlayMatch[0];
} else {
  // Try simpler match if the first one fails
  const simplerOverlayMatch = heroes.match(/<div class="overlay" id="overlay">[\s\S]*?<\/div>/);
  if (simplerOverlayMatch) htmlContent += '\n\n' + simplerOverlayMatch[0];
}

const toastMatch = heroes.match(/<div class="toast" id="toast"><\/div>/);
if(toastMatch) htmlContent += '\n\n' + toastMatch[0];

const artworkMatch = heroes.match(/<div id="artwork-overlay"><\/div>/);
if(artworkMatch) htmlContent += '\n\n' + artworkMatch[0];

// Replace in index.html
const indexHtmlStartRegex = /<!-- ====== NOUVEL ÉCRAN UNITÉS \(squad \+ unités\) ====== -->\s*<div id="units-screen">/;
const indexHtmlStartMatch = index.match(indexHtmlStartRegex);
if (!indexHtmlStartMatch) throw new Error("Could not find units-screen start in index.html");
const indexHtmlStartIndex = indexHtmlStartMatch.index;

let indexHtmlEndIndex = -1;
openDivs = 0;
const startSearchFrom = indexHtmlStartIndex + indexHtmlStartMatch[0].length - 20; // back up a bit to catch <div id="units-screen">
for (let i = startSearchFrom; i < index.length; i++) {
  if (index.substr(i, 4) === '<div') openDivs++;
  if (index.substr(i, 5) === '</div') {
    openDivs--;
    if (openDivs === 0) {
      indexHtmlEndIndex = i + 6;
      break;
    }
  }
}
if (indexHtmlEndIndex === -1) throw new Error("Could not find units-screen end in index.html");

index = index.substring(0, indexHtmlStartIndex) +
  '<!-- ====== NOUVEL ÉCRAN UNITÉS (squad + unités) ====== -->\n<div id="units-screen">\n' +
  htmlContent +
  '\n</div>' +
  index.substring(indexHtmlEndIndex);

// 3. Extract JS
const jsMatch = heroes.match(/<script>\s*\/\* MOTEUR DE STATS[\s\S]*?<\/script>/);
if (!jsMatch) throw new Error("Could not find script in heroes.html");
let jsContent = jsMatch[0].replace('<script>', '').replace('</script>', '').trim();

// Replace in index.html
const indexJsStartMarker = '/* ===== ÉCRAN UNITÉS (porté de heroes.html, isolé) ===== */';
const indexJsStartIndex = index.indexOf(indexJsStartMarker);
if (indexJsStartIndex === -1) throw new Error("Could not find script start in index.html");

// find the end of the IIFE by looking for "})();"
let indexJsEndIndex = index.indexOf('})();', indexJsStartIndex);
if (indexJsEndIndex === -1) throw new Error("Could not find script end in index.html");

index = index.substring(0, indexJsStartIndex) +
  '/* ===== ÉCRAN UNITÉS (porté de heroes.html, isolé) ===== */\n' +
  jsContent +
  '\n  ' +
  index.substring(indexJsEndIndex);

fs.writeFileSync('index.html', index);
console.log("Merge completed successfully!");
