var os = require('os');
var fs = require('fs-extra')
var path = require('path');
var program = require('commander');
var lodash = require('lodash');
var request = require('request');
var Vibrant = require('node-vibrant');
var DeltaE = require('delta-e');
var convert = require('./convert.js')
var palette = JSON.parse(fs.readFileSync(path.join(__dirname, 'palette.json'),
    'utf8'));

var DELTAE_THRESHOLD = 10.0;

program
    .version('0.0.1')
    .option('-p, --path <path>', 'Image path')
    .option('-l, --lab', 'Print Lab values')
    .option('-r, --rgb', 'Print RGB values')
    .option('-h, --hex', 'Print hex values')
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
            process.exit(1);
        }

        if (program.lab) {
            findColorLabs(swatches);
        } else if (program.rgb) {
            findColorRGBs(swatches);
        } else if (program.hex) {
            findColorHex(swatches);
        } else {
            findColorTags(swatches);
        }

        if (pathIsURL) {
            try {
                fs.removeSync(filePath);
            } catch (e) {}
        }
    });
}

function findColorLabs(swatches) {
    var labs = [];
    lodash.forEach(swatches, function(swatch) {
        if (swatch) {
            var lab = convert.rgb2lab(swatch['rgb']);
            labs.push(lab.join(','));
        }
    });
    console.log(labs.join('\n'));
}

function findColorHex(swatches) {
    var hexes = [];
    lodash.forEach(swatches, function(swatch) {
        if (swatch) {
            var hex = convert.rgb2hex(swatch['rgb']);
            hexes.push(hex);
        }
    });
    console.log(hexes.join('\n'));
}

function findColorRGBs(swatches) {
    var rgbs = [];
    lodash.forEach(swatches, function(swatch) {
        if (swatch) {
            rgbs.push(swatch['rgb'].join(','));
        }
    });
    console.log(rgbs.join('\n'));
}

function findColorTags(swatches) {
    var tags = [];
    lodash.forEach(swatches, function(swatch) {
        if (swatch) {
            closestColor = findClosestColorLabel(swatch[
                'rgb']);
            if (DELTAE_THRESHOLD) {
                tags.push(closestColor);
            }
        }
    });

    tags = lodash.unique(tags);
    console.log(tags.join('\n'));
}

function findClosestColorLabel(rgb) {
    var lab = convert.rgb2lab(rgb);
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

function labArr2obj(arr) {
    return {
        L: arr[0],
        A: arr[1],
        B: arr[2]
    }
}
