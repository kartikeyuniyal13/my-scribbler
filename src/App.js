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
  const [elementType, setElementType] = useState()
  const [selection, setSelection] = useState(false)
  const [resize,setResize]=useState(false)
  const [moving, setMoving] = useState(false);
  const [selectedElement, setSelectedElement] = useState()
  const [offset, setOffset] = useState([0, 0, 0, 0])
  function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  const nearPoint = (x, y, x1, y1, name) => {
    return Math.abs(x - x1) < 8 && Math.abs(y - y1) < 8 ? name : null;
  };

  const cursorForPosition = (position) => {
    switch (position) {
      case "tl":
      case "br":
      case "start":
      case "end":
        return "nwse-resize";
      case "tr":
      case "bl":
        return "nesw-resize";
      default:
        return "move";
    }
  };
  
  


  const selectElementFunc = (x, y, element) => {
    const { type, x1, x2, y1, y2 } = element;

    if (type === "rectangle") {
      const topLeft = nearPoint(x, y, x1, y1, "tl");
      const topRight = nearPoint(x, y, x2, y1, "tr");
      const bottomLeft = nearPoint(x, y, x1, y2, "bl");
      const bottomRight = nearPoint(x, y, x2, y2, "br");
      const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
      const position = topLeft || topRight || bottomLeft || bottomRight;
      return { ...element, position: position, inside: inside }
    } else {
      const a = { x: x1, y: y1 };
      const b = { x: x2, y: y2 };
      const c = { x, y };
      const dist =
      Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) /
      Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);

      const start = nearPoint(x, y, x1, y1, "start");
      const end = nearPoint(x, y, x2, y2, "end");
      const position = start || end;
      const inside = Math.abs(dist) < 5 ? "inside" : null;
      return { ...element, position: position, inside: inside }
    }
  };

  function calMinDist(x, y, element) {
    const { x1, y1, x2, y2, id, type } = element;

    if (type === "Line") {
      const dist = Math.abs(
        (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1
      ) / Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);

      return { ...element, dist: dist };
    } else if (type === "rectangle") {
      const dist = Math.min(
        distance(x, y, x, y1),
        distance(x, y, x, y2),
        distance(x, y, x1, y),
        distance(x, y, x2, y)
      );
      return { ...element, dist:dist };
    }
  }

  function handleSelectElement(e) {
    const { clientX, clientY } = e;

console.log("Cursor Coordinates:", clientX, clientY);
    console.log("Elements", elements);
    const elementPos = elements.map((element) =>
    selectElementFunc(clientX, clientY, element)
    );
    console.log("Element Positions:", elementPos);
    let finalElement = elementPos.find((element) => element.position !==null )

    if (finalElement == null) {
      const foundElementsWithDist = elementPos.filter((element) => (element.inside !== null)).map((element) =>
        calMinDist(clientX, clientY, element)
      );
      console.log("Found Elements with Distance:", foundElementsWithDist);

      if (foundElementsWithDist.length > 0) {
        finalElement = foundElementsWithDist.reduce((minElement, currentElement) =>
          currentElement.dist < minElement.dist ? currentElement : minElement
        );
      }
    }
    if (finalElement) {
     
      setSelectedElement(finalElement);
      console.log("Final Selected Element:", finalElement);
      console.log("Final Selected Element:", selectedElement);
      
      const { x1, y1, x2, y2, id, type, position } = finalElement;
      if (position != null) {
             setResize(true);
      }
      else {
        setOffset([e.clientX - x1, e.clientY - y1, x2 - e.clientX, y2 - e.clientY]);
        setMoving(true);
      }
    }
  }

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas');

console.log(selectedElement)
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const rc = rough.canvas(canvas);
      elements.forEach(({ roughElement }) => rc.draw(roughElement));
    }
  }, [elements, selection, offset]);


  const handleMouseDown = (e) => {
    
    if (selection) {
      handleSelectElement(e);
      e.target.style.cursor = selectedElement && resize
        ? cursorForPosition(selectedElement.position)
        : "default";
    }
    else {
      setDrawing(true);
      const element = createElement(uuidv4(), e.clientX, e.clientY, e.clientX, e.clientY, elementType);
      setElements((prevState) => [...prevState, element]);
      setSelectedElement(element)
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
  const resizeCoordinates = (clientX, clientY, position, x1, y1, x2, y2) => {
    switch (position) {
      case "tl":
      case "start":
        return { x1: clientX, y1: clientY, x2, y2 };
      case "tr":
        return { x1, y1: clientY, x2: clientX, y2 };
      case "bl":
        return { x1: clientX, y1, x2, y2: clientY };
      case "br":
      case "end":
        return { x1, y1, x2: clientX, y2: clientY };
      default:
        return null;
    }
  };
  
  
  
  const handleMouseMove = (e) => {
    if (drawing && !selection) {
      const lastElementIndex = elements.length - 1;
      const { x1, y1, id, type } = elements[lastElementIndex];
      updateElement(id, x1, y1, e.clientX, e.clientY, type);
    }
    if (selection && selectedElement && moving) {
      const { id, type } = selectedElement;
      const [startX, startY, endX, endY] = offset;
  
      const newX1 = e.clientX - startX;
      const newY1 = e.clientY - startY;
      const newX2 = e.clientX + endX;
      const newY2 = e.clientY + endY;
  
      updateElement(id, newX1, newY1, newX2, newY2, type);
    }
    if (selection && selectedElement && resize) {
      let { id, type, position, x1, x2, y1, y2 } = selectedElement;
  
      // Update the coordinates based on the resize position
      ({ x1, x2, y1, y2 } = resizeCoordinates(e.clientX, e.clientY, position, x1, x2, y1, y2));
  
      updateElement(id, x1, y1, x2, y2, type);
    }
  };
  
  const adjustElementCoordinates = element => {
    const { type, x1, y1, x2, y2 } = element;
    if (type === "rectangle") {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      return { x1: minX, y1: minY, x2: maxX, y2: maxY };
    } else {
      if (x1 < x2 || (x1 === x2 && y1 < y2)) {
        return { x1, y1, x2, y2 };
      } else {

        return { x1: x2, y1: y2, x2: x1, y2: y1 };
      }
    }
  };

  const handleMouseUp = () => {
   
  
   
      const adjustedCoordinates = adjustElementCoordinates(selectedElement);
      const { x1, y1, x2, y2,id,type} = adjustedCoordinates;

      updateElement(id, x1, y1, x2, y2, type);
    
  
    setDrawing(false);
    setSelectedElement(null)
    setOffset([]);
    setMoving(false);
    setResize(false)
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
