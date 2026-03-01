const fs = require('fs');
const file = './node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt';
let lines = fs.readFileSync(file, 'utf8').split('\n');
let insideMethod = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (!insideMethod && line.match(/@ReactMethod/)) {
        let sigIdx = i + 1;
        while (sigIdx < lines.length && !lines[sigIdx].includes('= scope.launch {')) {
            if (lines[sigIdx].match(/@ReactMethod/)) break; // next method
            if (lines[sigIdx].includes('{') && !lines[sigIdx].includes('= scope.launch {')) break; // standard method
            sigIdx++;
        }
        if (sigIdx < lines.length && lines[sigIdx].includes('= scope.launch {')) {
            lines[sigIdx] = lines[sigIdx].replace('= scope.launch {', ': Unit { scope.launch {');
            insideMethod = true;
            // Original brace count is exactly 1 from the "{" of scope.launch
            // We pretend we didn't add the outer method brace yet
            braceCount = 1;
            i = sigIdx;
            continue;
        }
    }

    if (insideMethod) {
        for (let char of lines[i]) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
        }
        if (braceCount === 0) {
            // Append the closing brace for the outer method
            lines[i] = lines[i] + ' }';
            insideMethod = false;
        }
    }
}
fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed MusicModule.kt again successfully.');
