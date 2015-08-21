var program = require('commander');

function processInputValue(value) {
    var values = value.split(',');
    if (values.length > 1) {
        for (var i = 0; i < values.length; i++) {
            values[i] = parseFloat(values[i]);
        }
    }
    return values;
}

exports.rgb2xyz = function rgb2xyz(rgb) {
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

exports.xyz2lab = function xyz2lab(xyz) {
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

exports.rgb2lab = function rgb2lab(rgb) {
    return this.xyz2lab(this.rgb2xyz(rgb));
}

exports.lab2xyz = function lab2xyz(lab) {
    y = (lab[0] + 16) / 116;
    x = lab[1] / 500 + y;
    z = y - lab[2] / 200;

    if (Math.pow(y, 3) > 0.008856) {
        y = Math.pow(y, 3);
    } else {
        y = (y - 16 / 116) / 7.787;
    }

    if (Math.pow(x, 3) > 0.008856) {
        x = Math.pow(x, 3);
    } else {
        x = (x - 16 / 116) / 7.787;
    }

    if (Math.pow(z, 3) > 0.008856) {
        z = Math.pow(z, 3);
    } else {
        z = (z - 16 / 116) / 7.787;
    }

    return [95.047 * x, 100.000 * y, 108.883 * z];
}

exports.xyz2rgb = function xyz2rgb(xyz) {
    x = xyz[0] / 100;
    y = xyz[1] / 100;
    z = xyz[2] / 100;

    r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    b = x * 0.0557 + y * -0.2040 + z * 1.0570;

    if (r > 0.0031308) {
        r = 1.055 * Math.pow(r, 1 / 2.4) - 0.055;
    } else {
        r *= 12.92;
    }

    if (g > 0.0031308) {
        g = 1.055 * Math.pow(g, 1 / 2.4) - 0.055;
    } else {
        g *= 12.92;
    }

    if (b > 0.0031308) {
        b = 1.055 * Math.pow(b, 1 / 2.4) - 0.055;
    } else {
        b *= 12.92;
    }

    return [r * 255, g * 255, b * 255];
}

exports.lab2rgb = function lab2rgb(lab) {
    return this.xyz2rgb(this.lab2xyz(lab));
}

exports.rgb2hex = function rgb2hex(rgb) {
    function component2hex(c) {
        c = parseInt(c);
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    return "#" + component2hex(rgb[0]) + component2hex(rgb[1]) +
        component2hex(
            rgb[2]);
}

exports.lab2hex = function lab2hex(lab) {
    return this.rgb2hex(this.lab2rgb(lab));
}

if (!module.parent) {
    program
        .version('0.0.1')
        .option('-v, --value <value>', 'Value', processInputValue)
        .option('-c, --convert <convert>', 'Convertion')
        .parse(process.argv);

    console.log(exports[program.convert](program.value));
}
