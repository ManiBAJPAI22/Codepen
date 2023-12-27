let socket;
let currentPath = [];
let drawingColor = [0, 0, 0];
let eraserActive = false;
let eraserSize = 20;
let penActive = true;
let penSize = 4;
let roomCode;

function setup() {
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  createCanvas(canvasWidth, canvasHeight);

  background(255);

  socket = io("http://localhost:3001");
  socket.on("drawing", (data) => {
    drawRemote(data);
  });
  socket.on("clearCanvas", () => {
    clearCanvas();
  });
  socket.on("joinedRoom", (joinedRoomCode) => {
    console.log(`Successfully joined room: ${joinedRoomCode}`);
    roomCode = joinedRoomCode; // Set the roomCode when joined
  });
  socket.on("roomCode", (generatedRoomCode) => {
    console.log(`Room Code generated: ${generatedRoomCode}`);
    showRoomCode(generatedRoomCode);
    // You might want to call setupCanvas() here if needed
  });

  setupUI();
}

function showRoomCode(code) {
  console.log(`Room Code: ${code}`);
  // You can display the code in the UI as needed
}

function draw() {
  if (mouseIsPressed && penActive) {
    drawPen();
  } else if (mouseIsPressed && eraserActive) {
    drawEraser();
  }
}

function drawPen() {
  const point = {
    x: mouseX,
    y: mouseY,
    color: drawingColor,
    weight: penSize,
  };
  currentPath.push(point);

  stroke(point.color);
  strokeWeight(point.weight);
  noFill();
  beginShape();
  for (const p of currentPath) {
    vertex(p.x, p.y);
  }
  endShape();
}

function drawEraser() {
  const point = {
    x: mouseX,
    y: mouseY,
    color: [255, 255, 255],
    weight: eraserSize,
  };
  currentPath.push(point);

  stroke(point.color);
  strokeWeight(point.weight);
  noFill();
  beginShape();
  for (const p of currentPath) {
    vertex(p.x, p.y);
  }
  endShape();
}

function mouseReleased() {
  console.log("Mouse released. Emitting drawing event.");
  if (currentPath.length > 0 && (penActive || eraserActive)) {
    socket.emit("drawing", { room: roomCode, points: [...currentPath] });
    currentPath = [];
  }
}

function drawRemote(data) {
  stroke(data[0].color);
  strokeWeight(data[0].weight);
  noFill();
  beginShape();
  for (const point of data) {
    vertex(point.x, point.y);
  }
  endShape();
}

function clearCanvas() {
  background(255);
}

function keyPressed() {
  if (keyCode === UP_ARROW) {
    penSize++;
  } else if (keyCode === DOWN_ARROW && penSize > 1) {
    penSize--;
  }
}

function colorPickerChanged() {
  drawingColor = this.color().levels;
}

function saveDrawing() {
  saveCanvas("drawing", "png");
}

function toggleEraser() {
  eraserActive = !eraserActive;
  penActive = false;
}

function togglePen() {
  penActive = !penActive;
  eraserActive = false;
}

function setupUI() {
  const yOffset = height + 10;

  const colorPicker = createColorPicker(
    color(drawingColor[0], drawingColor[1], drawingColor[2])
  );
  colorPicker.position(10, yOffset);
  colorPicker.input(colorPickerChanged);

  const saveButton = createButton("Save");
  saveButton.position(200, yOffset);
  saveButton.mousePressed(saveDrawing);

  const clearButton = createButton("Clear Canvas");
  clearButton.position(260, yOffset);
  clearButton.mousePressed(() => {
    clearCanvas();
    socket.emit("clearCanvas", roomCode);
  });

  const eraserToggleButton = createButton("Toggle Eraser");
  eraserToggleButton.position(320, yOffset);
  eraserToggleButton.mousePressed(toggleEraser);

  const penToggleButton = createButton("Toggle Pen");
  penToggleButton.position(400, yOffset);
  penToggleButton.mousePressed(togglePen);

  const eraserSizeSlider = createSlider(1, 50, eraserSize);
  eraserSizeSlider.position(480, yOffset + 5);
  eraserSizeSlider.input(() => {
    eraserSize = eraserSizeSlider.value();
  });

  const penSizeSlider = createSlider(1, 20, penSize);
  penSizeSlider.position(600, yOffset + 5);
  penSizeSlider.input(() => {
    penSize = penSizeSlider.value();
  });
}

function generateRoom() {
  socket.emit("generateRoom");
}

function joinRoom() {
  const joinRoomContainer = document.getElementById("joinRoomContainer");
  joinRoomContainer.style.display = "block";
}

function enterRoom() {
  const roomCodeInput = document.getElementById("roomCodeInput");
  const enteredRoomCode = roomCodeInput.value.trim();
  if (enteredRoomCode) {
    socket.emit("joinRoom", enteredRoomCode);
  } else {
    alert("Please enter a valid room code.");
  }
}
