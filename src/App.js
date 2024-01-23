import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const canvas = useRef(null);
  const ctx = useRef(null);
  const prevMouse = useRef({ x: null, y: null });
  const [mouseDown, setMouseDown] = useState(false);
  const [eraserOn, setEraserOn] = useState(false);
  const [size, setSize] = useState({ width: 10, height: 10 });
  const [lineWidthCustom, setLineWidthCustom] = useState(1);
  const [drawingRect, setDrawingRect] = useState(false);

  const DrawingCanvas = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
    const [endPosition, setEndPosition] = useState({ x: 0, y: 0 });
  
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
  
      const drawRectangle = () => {
        const width = endPosition.x - startPosition.x;
        const height = endPosition.y - startPosition.y;
  
        ctx.clearRect(0, 0, canvas.width, can

  useEffect(() => {
    // Initialize the canvas context after the component is mounted
    ctx.current = canvas.current.getContext('2d');
  
    // Set the fill color to blue
   // ctx.current.fillStyle = 'blue';
  
    // Draw a filled rectangle covering the entire canvas
    //ctx.current.fillRect(0, 0, canvas.current.width, canvas.current.height);
  }, []);
  
  function drawRectangle(event){

    console.log(event)

   // ctx.current.fillRect(0, 0, canvas.current.width, canvas.current.height);
  }

  function eraser(event) {
    if (!ctx.current) return;
  
    const { clientX, clientY } = event;
    const x0 = prevMouse.current.x;
    const y0 = prevMouse.current.y;
  
    if (x0 !== null && y0 !== null) {
      const dx = clientX - x0;
      const dy = clientY - y0;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(distance / 5));
  
      for (let i = 0; i <= steps; i++) {
        const x = x0 + (dx * i) / steps;
        const y = y0 + (dy * i) / steps;
        ctx.current.clearRect(x, y, size.width, size.height);
      }
    }
  
    prevMouse.current.x = clientX;
    prevMouse.current.y = clientY;
  }
  
  function drawLine(event) {
    if (!ctx.current) return; // Check if the context is initialized

    ctx.current.beginPath();
    if (prevMouse.current.x === null) {
      ctx.current.arc(event.clientX, event.clientY, 1, 0, Math.PI * 2, true);
    } else {
      ctx.current.moveTo(prevMouse.current.x, prevMouse.current.y);
      ctx.current.lineTo(event.clientX, event.clientY);
    }

    ctx.current.strokeStyle = 'blue';
    ctx.current.lineWidth = lineWidthCustom;
    ctx.current.stroke();

    prevMouse.current.x = event.clientX;
    prevMouse.current.y = event.clientY;
  }

  return (
    <div className="App">
      <canvas
        id="draw"
        width="700"
        height="700"
        className="border border-gray-950"
        ref={canvas}
        onClick={() => {
          console.log('clicked');
        }}
        onMouseDown={() => {
          console.log('mouse down');
          setMouseDown(true);
        }}
        onMouseUp={() => {
          console.log('mouse up');
          setMouseDown(false);
          prevMouse.current = { x: null, y: null };
        }}
        onMouseMove={(event) => {
          if (eraserOn && mouseDown) {
            eraser(event);
          } else if (mouseDown) {
            drawLine(event);
          } else if(drawingRect)
          {
            drawRectangle(event);
          }
        }}
      />
      <button
        className='border border-cyan-400'
        onClick={() => {
          setEraserOn(!eraserOn);
        }}
      >
        eraser
      </button>
      <button
        className='border border-cyan-400'
        onClick={() => {
          setSize({ width: size.width + 10, height: size.height + 10 });
        }}
      >
        eraser size ++
      </button>
      <button
        className='border border-cyan-400'
        onClick={() => {
          setSize({ width: size.width - 10, height: size.height - 10 });
        }}
      >
        eraser size --
      </button>
      <button className='border border-cyan-400' onClick={()=>{setLineWidthCustom(lineWidthCustom+1)}}>Line Width++</button>

      <button className='border border-cyan-400' onClick={()=>{setLineWidthCustom(lineWidthCustom-1)}}>Line Width--</button>

      <button className='border border-cyan-400' onClick={()=>{setDrawingRect(!drawingRect)}}>Draw rectangle</button>

    </div>
  );
}

export default App;
