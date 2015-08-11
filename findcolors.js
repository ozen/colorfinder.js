var os = require('os');
var fs = require('fs-extra')
var path = require('path');
var program = require('commander');
var lodash = require('lodash');
var request = require('request');
var Vibrant = require('node-vibrant');
var DeltaE = require('delta-e');
var palette = JSON.parse(fs.readFileSync(path.join(__dirname, 'palette.json'),
    'utf8'));

program
    .version('0.0.1')
    .option('-p, --path <path>', 'Image path')
    .parse(process.argv);

var filePath;
var pathIsURL = lodash.startsWith(program.path, 'http');

if (pathIsURL) {
    filePath = path.join(os.tmpDir(), 'colorfinderjs', (new Date()).getTime().toString())
    request(program.path).pipe(fs.createOutputStream(filePath)).on('close',
        findColors);
} else {
    filePath = program.path;
    findColors();
}

function findColors() {
    v = new Vibrant(filePath);

    v.getSwatches(function(err, swatches) {
        if (err) {
            console.log("Got error: " + err.message);
            process.exit();
        }

        var tags = [];
        lodash.forEach(swatches, function(swatch) {
            if (swatch) {
                tags.push(findClosestColor(swatch['rgb']));
            }
        });

        tags = lodash.unique(tags);

        if (pathIsURL) {
            try {
                fs.removeSync(filePath);
            } catch (e) {}
        }

        console.log(tags.join(','));
    });
}

function findClosestColor(rgb) {
    var lab = rgb2lab(rgb);
    var minDiff = Number.MAX_VALUE;
    var label;

    lodash.forEach(palette, function(color) {
        var diff = DeltaE.getDeltaE00(labArr2obj(color['lab']),
            labArr2obj(lab));
        if (diff < minDiff) {
            minDiff = diff;
            label = color['label'];
        }
    });

    return label;
}

function rgb2xyz(rgb) {
    var R = (rgb[0] / 255);
    var G = (rgb[1] / 255);
    var B = (rgb[2] / 255);

    if (R > 0.04045) R = Math.pow(((R + 0.055) / 1.055), 2.4);
    else R = R / 12.92;
    if (G > 0.04045) G = Math.pow(((G + 0.055) / 1.055), 2.4);
    else G = G / 12.92;
    if (B > 0.04045) B = Math.pow(((B + 0.055) / 1.055), 2.4);
    else B = B / 12.92;

    R = R * 100;
    G = G * 100;
    B = B * 100;

    //Observer. = 2°, Illuminant = D65
    var X = R * 0.4124 + G * 0.3576 + B * 0.1805;
    var Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
    var Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

    return [X, Y, Z];
}

function xyz2lab(xyz) {
    // Observer= 2°, Illuminant= D65
    var X = xyz[0] / 95.047;
    var Y = xyz[1] / 100.000;
    var Z = xyz[2] / 108.883;

    if (X > 0.008856) X = Math.pow(X, (1 / 3));
    else X = (7.787 * X) + (16 / 116);
    if (Y > 0.008856) Y = Math.pow(Y, (1 / 3));
    else Y = (7.787 * Y) + (16 / 116);
    if (Z > 0.008856) Z = Math.pow(Z, (1 / 3));
    else Z = (7.787 * Z) + (16 / 116);

    var L = (116 * Y) - 16;
    var a = 500 * (X - Y);
    var b = 200 * (Y - Z);

    return [L, a, b];
}

function rgb2lab(rgb) {
    return xyz2lab(rgb2xyz(rgb));
}

function labArr2obj(arr) {
    return {
        L: arr[0],
        A: arr[1],
        B: arr[2]
    }
}
