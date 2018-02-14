class TotalisticCA {
  constructor(width, height) {
    this.initialize(width, height);
  }

  initialize(width, height) {
    this._width = width * 3;
    this._height = height * 3;

    this._rule = 9;

    this.cell = [];
    for (var i = 0; i < this._width; ++i)
      this.cell.push(new Array(this._height).fill(0));

    this.drawGrid();

    this.backCell = [];
    this.copyToBackCell();
  }

  set rule(rule) {
    this._rule = Math.min(Math.max(rule, 0), 255);
  }

  get rule() {
    return this._rule;
  }

  set width(value) {
    this.initialize(value, this._height / 3);
  }

  get width() {
    return this._width;
  }

  set height(value) {
    this.initialize(this._width / 3, value);
  }

  get height() {
    return this._height;
  }

  changeSize(width, height) {
    this.initialize(width, height);
  }

  at(x, y) {
    return this.cell[x][y];
  }

  copyToBackCell() {
    for (var i = 0; i < this.cell.length; ++i)
      this.backCell[i] = this.cell[i].slice();
  }

  drawGrid() {
    var gridWidth = this._width / 3
    var gridHeight = this._height / 3
    for (var x = 0; x < this._width; ++x) {
      for (var y = 0; y < this._height; ++y) {
        if ((x % gridWidth) == 0 || (y % gridHeight) == 0)
          this.cell[x][y] = 1;
        else
          this.cell[x][y] = 0;
      }
    }
  }

  next() {
    this.copyToBackCell();

    for (var x = 0; x < this._width; ++x) {
      for (var y = 0; y < this._height; ++y) {
        var sum = this.sumNM(x, y);

        if (sum == 0)
          this.cell[x][y] = 0;
        else
          this.cell[x][y] = Math.floor(this._rule / Math.pow(2, sum - 1)) % 2;
      }
    }
  }

  mod(a, b) {
    if (b < 0)
      return null;
    else if (a < 0)
      return b + a;
    else
      return a % b;
  }

  sumNM(xPos, yPos) {
    const R = 1;

    var sum = 0;
    for (var x = -R; x <= R; ++x) {
      for (var y = -R; y <= R; ++y) {
        if (x == 0 && y == 0)
          continue;

        if (this.backCell[this.mod(xPos + x, this._width)][this.mod(yPos + y, this._height)])
          sum += 1;
      }
    }
    return sum;
  }
}

// canvas設定 //
var canvasBig = document.getElementById('canvasBig');
var canvasImg = document.getElementById("canvasImg");
canvasBig.getContext('2d').imageSmoothingEnabled = false;

var ca = new TotalisticCA(16, 16);

refresh();

// UI //
function refresh() {
  onChangeNumberRule(document.getElementById("numberRule").value);
  onClickButtonCA(0, 0);
}

function removeAllChild(elem) {
  while (elem.firstChild)
    elem.removeChild(elem.firstChild);
}

function onChangeNumberRule(rule) {
  var imglist = document.getElementById("imglist");

  removeAllChild(imglist);

  ca.rule = rule;
  ca.drawGrid();

  if (rule && 0 <= rule && rule < 256) {
    var ol = imglist.appendChild(document.createElement("ol"));
    for (var gen = 1; gen <= 1000; ++gen) {
      ca.next();

      var li = ol.appendChild(document.createElement("li"));

      var figure = li.appendChild(document.createElement("figure"));

      var input = figure.appendChild(document.createElement("canvas"));
      //input.type = "image";
      input.width = ca.width;
      input.height = ca.height;

      var strRule = ("00" + rule).substr(-3);
      var strGen; // ファイル名変更の可能性あり
      if (gen < 1000)
        strGen = ("00" + gen.toString()).substr(-3);
      else
        strGen = gen.toString();
      input.dataset.rule = rule.toString();
      input.dataset.generation = gen.toString();
      input.addEventListener("click", function () { onClickButtonCA(this.dataset.rule, this.dataset.generation) }, false);

      input.getContext('2d').imageSmoothingEnabled = false;
      updateCanvas(input, false);

      var figcaption = figure.appendChild(document.createElement("figcaption"));
      figcaption.textContent = strGen;
    }
  }
  else {
    var p = imglist.appendChild(document.createElement("p"));
    p.textContent = "Ruleの値を0~255の範囲で指定してください。"
  }
}

function onChangeNumberWidth(gridwidth) {
  gridWidth = parseInt(gridwidth);
  ca.width = gridWidth;

  var canvasWidth = gridWidth * 60;
  canvasBig.width = canvasWidth;
  canvasImg.width = canvasWidth;
  refresh();
}

function onChangeNumberHeight(gridHeight) {
  gridHeight = parseInt(gridHeight);
  ca.height = gridHeight;

  var canvasHeight = gridHeight * 60;
  canvasBig.height = canvasHeight;
  canvasImg.height = canvasHeight;
  refresh();
}

function onClickButtonCA(rule, generation) {
  var CACanvasText = document.getElementById("CACanvasText");
  CACanvasText.textContent = ("Rule " + rule.toString() + ", Generation " + generation.toString());

  ca.rule = rule;
  ca.drawGrid();

  for (var i = 0; i < generation; ++i) {
    ca.next();
  }

  updateCanvas(canvasBig, true);

  // 画像に変換して表示
  canvasImg.src = canvasBig.toDataURL();
}

function updateCanvas(_canvas, grid) {
  var width = _canvas.width;
  var height = _canvas.height;

  var scale = { x: width / ca.width, y: height / ca.height };
  var gridSize = scale;

  var context = _canvas.getContext('2d');
  var imageData = context.getImageData(0, 0, width, height);
  var pixels = imageData.data;

  for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
      var state = ca.at(Math.floor(x / scale.x), Math.floor(y / scale.y));

      if (grid) {
        // グリッド線の描画
        if ((x % gridSize.x) == 0 || (y % gridSize.y) == 0)
          state = 2;
        else if (x == (width - 1) || y == (height - 1))
          state = 2;
      }

      var color = palette(state);

      var index = (y * width + x) * 4;
      pixels[index + 0] = color.r; // R
      pixels[index + 1] = color.g; // G
      pixels[index + 2] = color.b; // B
      pixels[index + 3] = 255; // A
    }
  }

  context.putImageData(imageData, 0, 0);
}

function palette(state) {
  if (state == 0) {
    // 死んでいるセルの色
    return {
      r: 255,
      g: 255,
      b: 255
    };
  }
  else if (state == 1) {
    // 生きているセルの色
    return {
      r: 150,
      g: 150,
      b: 250
    };
  }
  else if (state == 2) {
    // グリッドの色
    return {
      r: 127,
      g: 127,
      b: 127
    };
  }
  else {
    // 正しく描画されないときの色
    return {
      r: 0,
      g: 0,
      b: 0
    };
  }
}
