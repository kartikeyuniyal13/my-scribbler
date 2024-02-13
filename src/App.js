import React, { useState, useLayoutEffect } from 'react';
import rough from 'roughjs';
import { v4 as uuidv4 } from 'uuid';

const generator = rough.generator();

function createElement(id, x1, y1, x2, y2, type) {
  if (type === "Line") {
    const roughElement = generator.line(x1, y1, x2, y2);
    return { id, x1, y1, x2, y2, roughElement, type };
  }
  else if (type === "rectangle") {
    const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
    return { id, x1, y1, x2, y2, roughElement, type };
  }
}
const App = () => {
  const [elements, setElements] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [elementType, setElementType] = useState("line")
  const [selection, setSelection] = useState(false)
  const [moving, setMoving] = useState(false);
  const [selectedElement, setSelectedElement] = useState()
  const [offset,setOffset]=useState([0,0,0,0])

  function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  function selectElementFunc(x, y, element) {
    const { x1, y1, x2, y2, type } = element;

    if (type === "Line") {
      const dist =
        distance(x1, y1, x2, y2) - (distance(x1, y1, x, y) + distance(x2, y2, x, y));
      return Math.abs(dist) < 1;
    } else if (type === "rectangle") {
      return x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && y >= Math.min(y1, y2) && y <= Math.max(y1, y2);
    }
    return false;
  }



  function handleSelectElement(e) {
    const { clientX, clientY } = e;
    const foundElement = elements.find((element) =>
      selectElementFunc(clientX, clientY, element)
    );
  
    if (foundElement) {
      setSelectedElement(foundElement);
  
      const { x1, y1, x2, y2, id, type } = foundElement;
  
      setOffset([
        e.clientX - x1,
        e.clientY - y1,
        x2 - e.clientX,
        y2 - e.clientY
      ]);
  
      setMoving(true);
    }
  }
  

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas');

    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const rc = rough.canvas(canvas);
      elements.forEach(({ roughElement }) => rc.draw(roughElement));
    }
  }, [elements, selection,offset]);


  const handleMouseDown = (e) => {
    if (selection) {
      handleSelectElement(e);

     
        
      
      setMoving(true);
    }
    else {
      setDrawing(true);
      const element = createElement(uuidv4(), e.clientX, e.clientY, e.clientX, e.clientY, elementType);
      setElements((prevState) => [...prevState, element]);
    }
  };

  function updateElement(id, x1, y1, x2, y2, type) {
    // const updatedElement = createElement(id,x1,y1,x2,y2,type);
    // const elementsCopy = [...elements];
    // elementsCopy[lastElementIndex] = updatedElement;
    // setElements(elementsCopy);

    setElements((prevElements) =>
      prevElements.map((element) =>
        element.id === id ? createElement(id, x1, y1, x2, y2, type) : element
      )
    );
  }
  const handleMouseMove = (e) => {
    if (drawing && !selection) {
      const lastElementIndex = elements.length - 1;
      const { x1, y1, id, type } = elements[lastElementIndex];
      updateElement(id, x1, y1, e.clientX, e.clientY, type);
    }
    if (selection && selectedElement && moving) {
      const {  id, type } = selectedElement;
       updateElement(id, e.clientX-offset[0],e.clientY-offset[1], e.clientX+offset[2], e.clientY+offset[3], type);
    }
  };


  const handleMouseUp = () => {
    setDrawing(false);
    setSelectedElement(null)
    setOffset([]);
    setMoving(false);
  };

  return (
    <div>
      <div style={{ position: "fixed" }}>
        <input
          type="radio"
          id="Selection"
          name="elementType"
          checked={elementType === null}
          onChange={() => {
            setElementType(null);
            setSelection(true);

            setDrawing(false); 
          }}
        />

        <label htmlFor="Selection">Selection</label>

        <input
          type="radio"
          id="Line"
          name="elementType"
          checked={elementType === "Line"}
          onChange={() => {
            setElementType("Line");
            setSelection(false);
          }}
        />
        <label htmlFor="Line">Line</label>

        <input
          type="radio"
          id="rectangle"
          name="elementType"
          checked={elementType === "rectangle"}
          onChange={() => {
            setElementType("rectangle")
            setSelection(false);
          }}
        />
        <label htmlFor="rectangle">Rectangle</label>
      </div>

      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      ></canvas>
    </div>
  );
}

export default App;
