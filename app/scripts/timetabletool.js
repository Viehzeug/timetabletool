function wordwrap(str, int_width, str_break, cut)
{
  //  discuss at: http://phprowCoordinates.org/functions/wordwrap/
  // original by: rowCoordinateonas Raoni Soares Silva (http://www.rowCoordinatesfromhell.com)
  // improved by: Nick Callen
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Sakimori
  //  revised by: rowCoordinateonas Raoni Soares Silva (http://www.rowCoordinatesfromhell.com)
  // bugfixed by: Michael Grier
  // bugfixed by: Feras ALHAEK
  //   example 1: wordwrap('Kevin van Zonneveld', 6, '|', true);
  //   returns 1: 'Kevin |van |Zonnev|eld'
  //   example 2: wordwrap('The quick brown fox rowCoordinateumped over the lazy dog.', 20, '<br />\n');
  //   returns 2: 'The quick brown fox <br />\nrowCoordinateumped over the lazy<br />\n dog.'
  //   example 3: wordwrap('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');
  //   returns 3: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod \ntempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim \nveniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea \ncommodo consequat.'

  var m = ((arguments.length >= 2) ? arguments[1] : 75);
  var b = ((arguments.length >= 3) ? arguments[2] : '\n');
  var c = ((arguments.length >= 4) ? arguments[3] : false);

  var i, rowCoordinate, l, s, r;

  str += '';

  if (m < 1) {
  return str;
  }

  for (i = -1, l = (r = str.split(/\r\n|\n|\r/))
  .length; ++i < l; r[i] += s) {
  for (s = r[i], r[i] = ''; s.length > m; r[i] += s.slice(0, rowCoordinate) + ((s = s.slice(rowCoordinate))
      .length ? b : '')) {
    rowCoordinate = c == 2 || (rowCoordinate = s.slice(0, m + 1)
      .match(/\S*(\s)?$/))[1] ? m : rowCoordinate.input.length - rowCoordinate[0].length || c == 1 && m || rowCoordinate.input.length + (rowCoordinate = s.slice(
        m)
      .match(/^\S*/))[0].length;
  }
  }

  return r.join('\n');
}

//http://stackoverflow.com/a/728694
function clone(obj)
{
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function TimeTableTool(data, defaultValues, setupHandles, store)
{
	this.data = data;
	this.s = Snap('#svgTarget');
	this.rectWidth = defaultValues.width;
	this.rectHeight = defaultValues.height;
	this.fontSize = defaultValues.fontSize;
	this.fontSizeHeader = defaultValues.fontSizeHeader;
	this.strokeWidth = defaultValues.strokeWidth;
	this['fill-opacity'] = defaultValues['fill-opacity'];
	this.startTime = defaultValues.startTime;
	this.endTime = defaultValues.endTime;
	this.wordwrap = defaultValues.wordwrap;
    this.lineHeight = defaultValues.lineHeight;
	this.timeTableMatrix = [];
	this.timeTableMatrixCopyMap = false;
	this.timeTableContinuetyMap = [];
	this.idChart = {};
	this.colorChart = {};
	this.currId = 0;
	this.rects = []; //structure of rect: [row][col]
    this.colheaders = ['Montag', 'Dienstag', 'Mitwoch', 'Donnerstag', 'Freitag'];
	this.nrCols = this.colheaders.length+1;
	this.nrRows = this.endTime - this.startTime + 1;
	this.setupHandles = setupHandles;
	this.store = store;

	this.setup();
    this.render();
}

TimeTableTool.prototype.setup = function(){
	this.timeTableMatrix = [];
	this.timeTableContinuetyMap = [];
	this.idChart = {};
	this.colorChart = {};
	this.timeTableMatrixCopyMap = false;
	this.currId = 0;
	this.rects = []; //structure of rect: [row][col]
	this.nrCols = 5+1;
	this.nrRows = this.endTime - this.startTime + 1;
	var self = this;

	for (var i = 0; i < this.nrRows-1; i ++)
	{
		this.timeTableMatrix.push(new Array(this.nrCols - 1));
	}

	if(this.data)
	{
	    var rowCoordinatecalData = ICAL.parse(this.data);
	    var comp = new ICAL.Component(rowCoordinatecalData);
	    var events = comp.getAllSubcomponents("vevent");
	    events.forEach(function(e){
	        var data =
	        {
	            name: e.getFirstPropertyValue("summary")
	                   .replace('Ã¼', 'ü'),
	            start: e.getFirstPropertyValue("dtstart").hour,
	            end: e.getFirstPropertyValue("dtend").hour,
	            dayOfWeek: e.getFirstPropertyValue("dtstart").dayOfWeek(),
	            description: e.getFirstPropertyValue("description"),
	            location: e.getFirstPropertyValue("location"),
	            id: 0
	        };
	        data.id = self.generateId(data.name);
            data.useDefaultFontSize = true;
            data.fontSize = self.fontSize;
            data.useDefaultDisplayText = true;
	        data.displayName = self.generateDisplayName(data.name, data.location);

	        self.addEntry(data);
	    });
	}
    this.store(this.toJSON());
}

TimeTableTool.prototype.generateDisplayName = function(name, location)
{
    return wordwrap(name, this.wordwrap).
           replace(/(\(.\))/, '$1\n').
           concat(['\n', location]).
           split('\n').
           map(function(e){return e.replace(/(\s*,\s*)(.*)(\s*)/, '$2').trim();});   
}

TimeTableTool.prototype.addEntry = function(data){
	var self = this;

	if(this.timeTableMatrixCopyMap)
	{
		for (var i = 0; i < this.nrRows -1; i++) {
			for (var j = 0; j < this.nrCols -1; j++) {
				if (this.timeTableMatrix[i][j])
				{
					if (this.timeTableMatrix[i][j].length == 0)
					{
						this.timeTableMatrix[i][j] = undefined;
					} else
					{
						this.timeTableMatrix[i][j] = $.extend(true, [], this.timeTableMatrix[i][j]);
					}
				}
			}
		}
		this.timeTableContinuetyMap = false;
	}	


    for(var i = data.start; i < data.end; ++i)
    {
        var newEntry = clone(data); //deep copy of data
        if (i-self.startTime < 0) continue;
        var currentEntry = self.timeTableMatrix[i-self.startTime][data.dayOfWeek-2];
        if (currentEntry == undefined)
        {
           self.timeTableMatrix[i-self.startTime][data.dayOfWeek-2] = [newEntry]; 
        } else
        {
            var testArray = currentEntry.filter(function(e){return e.name == data.name});
            if(testArray.length == 0) //element not yet contained
            {
                currentEntry.push(newEntry);
                currentEntry.sort(function(a, b){ return a.name.localeCompare(b.name);});
            } //else element is already there -> do nothing
        }
    }
    this.store(this.toJSON());
}

TimeTableTool.prototype.computeContinuetyMap = function(){
	this.timeTableContinuetyMap = [];
	var self = this;
	for (var i = 0; i < this.nrRows-1; i ++)
	{
		this.timeTableContinuetyMap.push(Array.apply(null, Array(this.nrCols - 1)).map(Number.prototype.valueOf,1)); //1 filled array
	}

	for(var j = 0; j < self.nrCols - 1; j++)
	    for (var i = 0; i < self.nrRows - 1;)
	    {
	        var k = i+1;
	        for(; k < self.nrRows - 1; k++)
	        {
	            if(self.timeTableMatrix[i][j] == undefined ||
	               self.timeTableMatrix[k][j] == undefined) break;
	            if(self.timeTableMatrix[i][j].length != self.timeTableMatrix[k][j].length) break;
	            var equal = true;
	            for (var l = 0; l < self.timeTableMatrix[i][j].length; l++)
	                equal = equal && (self.timeTableMatrix[i][j][l].name == self.timeTableMatrix[k][j][l].name);
	            if (!equal) break;
	        }
	        for(var l = i; l < k; l++)
	        {
	            self.timeTableContinuetyMap[l][j] = k - i;
	            self.timeTableMatrix[l][j] = self.timeTableMatrix[i][j];
	        }
	        i += k - i;
	    }
	this.timeTableMatrixCopyMap = true;
	this.store(this.toJSON());
};


TimeTableTool.prototype.getWidth = function(){
	return this.nrCols*this.rectWidth;
};

TimeTableTool.prototype.getHeight = function(){
	return this.nrRows*this.rectHeight;
};

TimeTableTool.prototype.setStartTime = function(startTime){
	this.startTime = startTime;
	this.setup();
}

TimeTableTool.prototype.setEndTime = function(endTime){
	this.endTime = endTime;
	this.setup();
}

TimeTableTool.prototype.render = function()
{
	var self = this;
	this.computeContinuetyMap();
	this.s.clear();
	this.rects = [];
    var rowheades = []; //todo move to this
    for(var i = this.startTime; i <= this.endTime; ++i )
    {
        rowheades[i-this.startTime] = i + ' - ' + (i+1);
    }

	for (var i = 0; i < this.nrRows; i++) {
		var row = [];
		for (var j = 0; j < this.nrCols; j++) {
		    row.push(this.buildRect(i, j, 1));
		}
		this.rects.push(row);
	}

    for (var i = 0; i < rowheades.length-1; ++i)
    {
        this.fillText(i+1, 0, 1, rowheades[i], undefined, this.fontSizeHeader);   
    }
    for (var j = 0; j < this.colheaders.length; ++j)
    {
        this.fillText(0, j+1, 1, this.colheaders[j], undefined, this.fontSizeHeader);   
    }

    for(var j = 0; j < this.nrCols - 1; ++j)
    {
        for(var i = 0; i < this.nrRows - 1; ++i)
        {
            var d = this.timeTableMatrix[i][j];
            if (d && d.length > 0)
            {
                var displayNames = d.map(function(e){
                                            if (e.useDefaultDisplayText)
                                                return self.generateDisplayName(e.name, e.location);
                                            else
                                                return e.displayName;
                                        });
                var colors = d.map(function(e){return self.colorChart[e.id];});
                var fontSizes = d.map(function(e){
                                        if (e.useDefaultFontSize)
                                            return self.fontSize;
                                        else
                                            return e.fontSize;
                                        });
                if (displayNames.length == 1)
                {
                    this.fillText(i+1, j+1, this.timeTableContinuetyMap[i][j], displayNames[0], colors, fontSizes[0]);
                } else if (displayNames.length == 2)
                {
                    this.fill2Texts(i+1, j+1, this.timeTableContinuetyMap[i][j], displayNames, colors, fontSizes);
                } else if (displayNames.length == 3)
                {
                    this.fill3Texts(i+1, j+1, this.timeTableContinuetyMap[i][j], displayNames, colors, fontSizes);
                } else {
                    this.fillText(i+1, j+1, this.timeTableContinuetyMap[i][j], "Cannot display more than 3 parallel lectures", Snap.rgb(255, 0, 0), this.fontSize);                    
                }

                i += this.timeTableContinuetyMap[i][j]-1;
            }
        }
    }
	$('#svgTarget').get(0).setAttribute("viewBox", "0 0 " + this.nrCols*this.rectWidth + " " + this.nrRows*this.rectHeight);
	this.setupHandles();
}

TimeTableTool.prototype.generateId = function(name)
{
	var m = name.match(/(.*)\(.\)/);
    name = (m && m.length > 0? m[1] : name).trim();
    if (this.idChart[name] == undefined)
    {
        this.idChart[name] = this.currId++;
        this.colorChart[this.idChart[name]] = Snap.rgb(Math.random()*255,
                                  				  	   Math.random()*255,
                                  				  	   Math.random()*255);
    }
    return this.idChart[name];
}

TimeTableTool.prototype.buildRect = function(rowCoordinate, colCoordinate, heightUnits)
{
    var r = this.s.rect(colCoordinate*this.rectWidth,rowCoordinate*this.rectHeight, this.rectWidth, this.rectHeight*heightUnits);
    r.attr({
        fill: "#fff",
        stroke: "#000",
        strokeWidth: this.strokeWidth,
        'myttt:rowCoordinate': rowCoordinate,
        'myttt:colCoordinate': colCoordinate
    });
    return r;
}

TimeTableTool.prototype.buildTriangle = function(rowCoordinate, colCoordinate, heightUnits, upperleft)
{
    var triangle;
    if (upperleft)
    {
        triangle = this.s.polygon(colCoordinate*this.rectWidth, rowCoordinate*this.rectHeight,
                             colCoordinate*this.rectWidth + this.rectWidth, rowCoordinate*this.rectHeight,
                             colCoordinate*this.rectWidth, rowCoordinate*this.rectHeight + this.rectHeight*heightUnits);
    } else //lower right
    {
        triangle = this.s.polygon(colCoordinate*this.rectWidth + this.rectWidth, rowCoordinate*this.rectHeight,
                             colCoordinate*this.rectWidth, rowCoordinate*this.rectHeight + this.rectHeight*heightUnits,
                             colCoordinate*this.rectWidth + this.rectWidth, rowCoordinate*this.rectHeight + this.rectHeight*heightUnits);
    }
    
    triangle.attr({
        fill: "#fff",
        stroke: "#000",
        strokeWidth: this.strokeWidth,
        'myttt:rowCoordinate': rowCoordinate,
        'myttt:colCoordinate': colCoordinate
    });
    return triangle;
}


TimeTableTool.prototype.fillText = function(rowCoordinate, colCoordinate, length, text, color, fontSize) //TODO rename length -> #timeUnits
{
    if (color == undefined) color = "#fff";
    if(length > 1)
    {
        var r = this.buildRect(rowCoordinate, colCoordinate, length);
        r.attr({fill:color, 'fill-opacity': this['fill-opacity']});
        for (var k = 0; k < length; k++) {
            this.rects[rowCoordinate+k][colCoordinate].remove();
            this.rects[rowCoordinate+k][colCoordinate] = r;
        }
    } else
    {
        this.rects[rowCoordinate][colCoordinate].attr({fill:color, 'fill-opacity': this['fill-opacity']});   
    }
    var lines = 1;
    if (text.constructor === Array) lines = text.length;
    var x = colCoordinate*this.rectWidth + this.rectWidth/2;
    var y = rowCoordinate*this.rectHeight + (length*this.rectHeight)/2 - (this.fontSize*this.lineHeight)*(lines-2)/2;
    var t = this.s.text(x, y, text).attr({fill: '#000',
    									  fontFamily: 'Helvetica Neue',
    									  'text-anchor':'middle',
    									  'font-size': fontSize,
								          'myttt:rowCoordinate': rowCoordinate,
        								  'myttt:colCoordinate': colCoordinate});
    var self = this;
    if (text.constructor === Array)
    t.selectAll("tspan").forEach(function(tspan, k){
        tspan.attr({x:x, y: y+(self.fontSize*self.lineHeight)*k});
    });
}

TimeTableTool.prototype.fill3Texts = function(rowCoordinate, colCoordinate, heightUnits, texts, colors, fontSizes)
{
    // fillText(s, i, rowCoordinate, length, texts.rowCoordinateoin(), color);
    // if (color == undefined) color = "#fff";
    var r1 = this.s.rect(colCoordinate*this.rectWidth,rowCoordinate*this.rectHeight, this.rectWidth/3., this.rectHeight*heightUnits);
    r1.attr({
        fill: "#fff",
        stroke: "#000",
        strokeWidth: this.strokeWidth,
        'myttt:rowCoordinate': rowCoordinate,
        'myttt:colCoordinate': colCoordinate
    });
    var r2 = this.s.rect(colCoordinate*this.rectWidth + this.rectWidth/3,rowCoordinate*this.rectHeight, this.rectWidth/3., this.rectHeight*heightUnits);
    r2.attr({
        fill: "#fff",
        stroke: "#000",
        strokeWidth: this.strokeWidth,
        'myttt:rowCoordinate': rowCoordinate,
        'myttt:colCoordinate': colCoordinate
    });
    var r3 = this.s.rect(colCoordinate*this.rectWidth + 2* this.rectWidth/3,rowCoordinate*this.rectHeight, this.rectWidth/.3, this.rectHeight*heightUnits);
    r3.attr({
        fill: "#fff",
        stroke: "#000",
        strokeWidth: this.strokeWidth,
        'myttt:rowCoordinate': rowCoordinate,
        'myttt:colCoordinate': colCoordinate
    });

    var lines = texts.map(function(e){
        var l = 1;
        if (e.constructor === Array) l = e.length;
        return l;
    });

    r1.attr({fill:colors[0], 'fill-opacity': this['fill-opacity']});
    r2.attr({fill:colors[1], 'fill-opacity': this['fill-opacity']});
    r3.attr({fill:colors[2], 'fill-opacity': this['fill-opacity']});
    for (var k = 0; k < heightUnits; k++) {
        this.rects[rowCoordinate+k][colCoordinate].remove();
        this.rects[rowCoordinate+k][colCoordinate] = [r1, r2, r3];
    }

    var y1 = rowCoordinate*this.rectHeight + (length*this.rectHeight)/2 + (this.fontSize*this.lineHeight)*(lines[0]-2)/2;
    var y2 = rowCoordinate*this.rectHeight + (length*this.rectHeight)/2 + (this.fontSize*this.lineHeight)*(lines[1]-2)/2;
    var y3 = rowCoordinate*this.rectHeight + (length*this.rectHeight)/2 + (this.fontSize*this.lineHeight)*(lines[2]-2)/2;
    var x1 = colCoordinate*this.rectWidth + (this.fontSize + 2)/2;
    var x2 = colCoordinate*this.rectWidth + 3*this.rectWidth/6;
    var x3 = colCoordinate*this.rectWidth + this.rectWidth - (this.fontSize + 2)/2;
    var t1 = this.s.text(x1, y1, texts[0]).attr({fill: '#000',
                                          fontFamily: 'Helvetica Neue',
                                          'text-anchor':'start',
                                          'font-size': fontSizes[0],
                                          'myttt:rowCoordinate': rowCoordinate,
                                          'myttt:colCoordinate': colCoordinate,
                                          'myttt:arrayCoordinate': 0});
    var t2 = this.s.text(x2, y2, texts[1]).attr({fill: '#000',
                                          fontFamily: 'Helvetica Neue',
                                          'text-anchor':'middle',
                                          'font-size': fontSizes[1],
                                          'myttt:rowCoordinate': rowCoordinate,
                                          'myttt:colCoordinate': colCoordinate,
                                          'myttt:arrayCoordinate': 1});
    var t3 = this.s.text(x3, y3, texts[2]).attr({fill: '#000',
                                          fontFamily: 'Helvetica Neue',
                                          'text-anchor':'end',
                                          'font-size': fontSizes[2],
                                          'myttt:rowCoordinate': rowCoordinate,
                                          'myttt:colCoordinate': colCoordinate,
                                          'myttt:arrayCoordinate': 2});
    var self = this;
    if (texts[0].constructor === Array)
    t1.selectAll("tspan").forEach(function(tspan, k){
        tspan.attr({x:x1, y: y1+(self.fontSize*self.lineHeight)*k});
    });
    if (texts[1].constructor === Array)
    t2.selectAll("tspan").forEach(function(tspan, k){
        tspan.attr({x:x2, y: y2+(self.fontSize*self.lineHeight)*k});
    });
    if (texts[2].constructor === Array)
    t3.selectAll("tspan").forEach(function(tspan, k){
        tspan.attr({x:x3, y: y3+(self.fontSize*self.lineHeight)*k});
    });

}

TimeTableTool.prototype.fill2Texts = function(rowCoordinate, colCoordinate, length, texts, colors, fontSizes)
{
    // fillText(s, i, rowCoordinate, length, texts.rowCoordinateoin(), color);
    // if (color == undefined) color = "#fff";
    var t1 = this.buildTriangle(rowCoordinate, colCoordinate, length, true);
    var t2 = this.buildTriangle(rowCoordinate, colCoordinate, length, false);
    t1.attr({fill:colors[0], 'fill-opacity': this['fill-opacity']});
    t2.attr({fill:colors[1], 'fill-opacity': this['fill-opacity']});
    for (var k = 0; k < length; k++) {
        this.rects[rowCoordinate+k][colCoordinate].remove();
        this.rects[rowCoordinate+k][colCoordinate] = [t1, t2];
    }

    var x1 = colCoordinate*this.rectWidth + (this.fontSize + 2)/2;
    var y1 = rowCoordinate*this.rectHeight + (this.fontSize + 2);
    var x2 = (colCoordinate+1)*this.rectWidth - (this.fontSize + 2)/2;
    var y2 = (rowCoordinate+length)*this.rectHeight - (this.fontSize + 2);

    var t1 = this.s.text(x1, y1, texts[0]).attr({fill: '#000',
                                                 fontFamily: 'Helvetica Neue',
                                                 'text-anchor':'start',
                                                 'font-size':fontSizes[0],
                                                 'myttt:rowCoordinate': rowCoordinate,
                                                 'myttt:colCoordinate': colCoordinate,
                                                 'myttt:arrayCoordinate': 0});
    var t2 = this.s.text(x2, y2, texts[1]).attr({fill: '#000',
                                                 fontFamily: 'Helvetica Neue',
                                                 'text-anchor':'end',
                                                 'font-size':fontSizes[1],
                                                 'myttt:rowCoordinate': rowCoordinate,
                                                 'myttt:colCoordinate': colCoordinate,
                                                 'myttt:arrayCoordinate': 1});
    // t.attr({fill:"black", fontSize:"18px"});
    var self = this;
    if (texts[0].constructor === Array)
    t1.selectAll("tspan").forEach(function(tspan, k){
        tspan.attr({x:x1, y: y1+(self.fontSize*self.lineHeight)*k});
    });
    if (texts[1].constructor === Array)
    t2.selectAll("tspan").forEach(function(tspan, k){
        tspan.attr({x:x2, y: y2-(self.fontSize*self.lineHeight)*(t2.selectAll("tspan").items.length - k -1)});
    });
}

TimeTableTool.prototype.toJSON = function()
{
	var obj = {};
	var fields = ['data',
				  'rectWidth',
				  'rectHeight',
				  'fontSize',
				  'fontSizeHeader',
				  'strokeWidth',
				  'fill-opacity',
				  'startTime',
				  'endTime',
				  'wordwrap',
				  'timeTableMatrix',
				  'timeTableMatrixCopyMap',
				  'timeTableContinuetyMap',
				  'idChart',
				  'colorChart',
				  'currId',
				  'nrCols',
				  'nrRows'];
	for (var i in fields)
	{
		obj[fields[i]] = this[fields[i]];
	}
	return JSON.stringify(obj);
}

TimeTableTool.prototype.loadFromState = function(data)
{
	this.setup();
	var fields = ['data',
				  'rectWidth',
				  'rectHeight',
				  'fontSize',
				  'fontSizeHeader',
				  'strokeWidth',
				  'fill-opacity',
				  'startTime',
				  'endTime',
				  'wordwrap',
				  'timeTableMatrix',
				  'timeTableMatrixCopyMap',
				  'timeTableContinuetyMap',
				  'idChart',
				  'colorChart',
				  'currId',
				  'nrCols',
				  'nrRows'];
	for (var i in fields)
	{
		this[fields[i]] = clone(data[fields[i]]);
	}
	this.render();
}