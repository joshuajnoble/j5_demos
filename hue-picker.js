var HuePicker = function(container, options) {
    this.container = container;

    this.width = options.width;
    this.height = options.height;

    this.marker = null;
    this.markerRadius = options.markerRadius || 5;
    this.markerX = 0;

    this.init();
};

/**
 * Initialize HuePicker widget and bind its events.
 */
HuePicker.prototype.init = function() {
    this._createCanvas();
    this.marker = this._createMarker();

    var self = this;
    $("circle")
        .draggable({ cursor: 'pointer' })
        .bind('drag', function(e, ui) {
            self._moveMarker(ui.position.left);
        });
};

/**
 * Return currently selected color.
 * @returns {string}
 */
HuePicker.prototype.getValue = function() {
    var currentColor = this.context.getImageData(this.markerX, 0, 1, 1);

    return this._convertPixelArrayToHexadecimalCode(currentColor.data);
};

/**
 * Create a canvas element and fill it with rainbow colors.
 * @private
 */
HuePicker.prototype._createCanvas= function() {
    // Let enough space to display marker correctly
    var width = this.width - 2 * this.markerRadius;
    var canvas = $('<canvas width="' + width + '" height="' + this.height + '">');
    canvas.css("margin-left", this.markerRadius);

    this.container.append(canvas);

    this.context = canvas.get(0).getContext("2d");
    this.context.fillStyle = this._getRainbowGradient();
    this.context.fillRect(0, 0, this.width, this.height);
};

/**
 * Return a canvas gradient containing all rainbow colors.
 * @returns {CanvasGradient}
 * @private
 */
HuePicker.prototype._getRainbowGradient = function() {
    var rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];

    var gradient = this.context.createLinearGradient(0, 0, this.width, 0);
    for (var i = 0, c = rainbowColors.length ; i < c ; i++) {
        gradient.addColorStop(i/c, rainbowColors[i]);
    }

    return gradient;
}

/**
 * Create SVG marker and return it.
 * @returns {*|jQuery|HTMLElement}
 * @private
 */
HuePicker.prototype._createMarker = function() {
    var svg  = '<svg>';
        svg += '<g id="marker">';
        svg += '    <line x1="' + this.markerRadius + '" y1="0" x2="' + this.markerRadius + '" y2="' + (this.height + 3 * this.markerRadius) + '"></line>';
        svg += '    <circle fill="red" cx="' + this.markerRadius + '" cy="' + (this.height + 15) + '" r="' + this.markerRadius + '"></circle>';
        svg += '</g>';

    this.container.append(svg);

    return $('#marker', svg);
}

/**
 * Move marker to specified position and emit required events.
 * @param x
 * @private
 */
HuePicker.prototype._moveMarker = function(x) {
    if (x < 0 || x >= this.width - 2 * this.markerRadius) {
        return;
    }

    this.markerX = x;
    $("#marker").attr("transform", "translate(" + x + ")");
    $(this).trigger("changeColor", [this.getValue()]);
}

/**
 * Convert a pixel value ([255, 0, 0, 255]) into its RGB equivalent (#ff0000).
 * @param pixelValue
 * @returns {string}
 */
HuePicker.prototype._convertPixelArrayToHexadecimalCode = function(pixelValue) {
    var hexadecimalColor = "#";
    for (var i = 0 ; i < 3 ; i++) {
        var hexadecimalPart = pixelValue[i].toString(16);
        if (hexadecimalPart.length == 1) {
            hexadecimalPart = "0" + hexadecimalPart;
        }

        hexadecimalColor += hexadecimalPart;
    }

    return hexadecimalColor;
}
