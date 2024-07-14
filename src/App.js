import React, { useState, useLayoutEffect } from 'react';
import rough from 'roughjs';
import { v4 as uuidv4 } from 'uuid';
import LoginButton from './Components/LoginButton';
import LogoutButton from './Components/LogoutButton';
import { useAuth0 } from '@auth0/auth0-react';

const generator = rough.generator();

function createElement(id, x1, y1, x2, y2, type) {
  if (type === "Line") {
    const roughElement = generator.line(x1, y1, x2, y2);
    return { id, x1, y1, x2, y2, roughElement, type };
  }
  if (type === "rectangle") {
    const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
    return { id, x1, y1, x2, y2, roughElement, type };
  }
}


  const useHistory = (initialState) => {
    const [history, setHistory] = useState([initialState]);
    const [index, setIndex] = useState(0);
  
    const setState = (action, overwrite = false) => {
      const newState = typeof action === 'function' ? action(history[index]) : action;
      setHistory((prevHistory) => {
        const updatedHistory = overwrite
          ? [...prevHistory.slice(0, index), newState, ...prevHistory.slice(index + 1)]
          : [...prevHistory.slice(0, index + 1), newState];
        return updatedHistory;
      });
      if (!overwrite) setIndex(index + 1);
    };
  
    const undo = () => { index > 0 && setIndex(index - 1); };
    const redo = () => { index < history.length - 1 && setIndex(index + 1); };
  
    return [history[index], setState, undo, redo];
  };

const App = () => {
  const [elements, setElements, undo, redo] = useHistory([]);
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [elementType, setElementType] = useState();
  const [selectedElement, setSelectedElement] = useState();
  const [drawing, setDrawing] = useState(false);
  const [selection, setSelection] = useState(false);
  const [resize, setResize] = useState(false);
  const [moving, setMoving] = useState(false);
  const [offset, setOffset] = useState([0, 0, 0, 0]);

  function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  const nearPoint = (x, y, x1, y1, name) => {
    return Math.abs(x - x1) < 8 && Math.abs(y - y1) < 8 ? name : null;
  };

  const cursorForPosition = position => {
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
      return { ...element, position: position, inside: inside };
    } else {
      const a = { x: x1, y: y1 };
      const b = { x: x2, y: y2 };
      const c = { x, y };
      const distToSegment = Math.abs(distance(a.x, a.y, b.x, b.y) - (distance(a.x, a.y, c.x, c.y) + distance(b.x, b.y, c.x, c.y)));
      const inside = distToSegment < 0.5 ? "inside" : null;
      if (inside) {
        const start = nearPoint(x, y, x1, y1, "start");
        const end = nearPoint(x, y, x2, y2, "end");
        const position = start || end;
        return { ...element, position: position, inside: inside };
      } else {
        return { ...element, position: null, inside: null };
      }
    }
  };

  function calMinDist(x, y, element) {
    const { x1, y1, x2, y2, id, type } = element;
    if (type === "Line") {
      const a = { x: x1, y: y1 };
      const b = { x: x2, y: y2 };
      const c = { x, y };
      const offset = distance(a.x, a.y, b.x, b.y) - (distance(a.x, a.y, c.x, c.y) + distance(b.x, b.y, c.x, c.y));
      const dist = Math.abs(offset);
      return { ...element, dist: dist };
    } else if (type === "rectangle") {
      const dist = Math.min(
        distance(x, y, x1, y1), 
        distance(x, y, x1, y2),
        distance(x, y, x2, y1), 
        distance(x, y, x2, y2)  
      );
      return { ...element, dist: dist };
    }
  }

  async function handleSelectElement(e) {
    const { clientX, clientY } = e;
    const elementPos = elements.map((element) => selectElementFunc(clientX, clientY, element));
    let finalElement = elementPos.find((element) => element.position !== null);

    if (finalElement == null) {
      const foundElementsWithDist = elementPos.filter((element) => (element.inside !== null)).map((element) =>
        calMinDist(clientX, clientY, element)
      );

      if (foundElementsWithDist.length > 0) {
        finalElement = foundElementsWithDist.reduce((minElement, currentElement) =>
          currentElement.dist < minElement.dist ? currentElement : minElement
        );
      }
    }
    if (finalElement) {
      setSelectedElement(finalElement);

      const { x1, y1, x2, y2, id, type, position } = finalElement;
      if (position != null) {
        setResize(true);
      } else {
        setOffset([e.clientX - x1, e.clientY - y1, x2 - e.clientX, y2 - e.clientY]);
        setMoving(true);
      }
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
  }, [elements, selection, offset]);

  const handleMouseDown = async (e) => {
    if (selection) {
      await handleSelectElement(e);
      e.target.style.cursor = selectedElement
        ? cursorForPosition(selectedElement.position)
        : "default";
    } else {
      setDrawing(true);
      const element = createElement(uuidv4(), e.clientX, e.clientY, e.clientX, e.clientY, elementType);
      setElements(prevState => [...prevState, element]);
      setSelectedElement(element);
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
      const { id, type, position, x1, x2, y1, y2 } = selectedElement;
      let newX1 = x1, newX2 = x2, newY1 = y1, newY2 = y2;
      switch (position) {
        case "tl":
        case "start":
          newX1 = e.clientX;
          newY1 = e.clientY;
          break;
        case "tr":
          newX2 = e.clientX;
          newY1 = e.clientY;
          break;
        case "bl":
          newX1 = e.clientX;
          newY2 = e.clientY;
          break;
        case "br":
        case "end":
          newX2 = e.clientX;
          newY2 = e.clientY;
          break;
        default:
          break;
      }
      updateElement(id, newX1, newY1, newX2, newY2, type);
      e.target.style.cursor = cursorForPosition(position);
    }
  };

  const handleMouseUp = () => {
    if (selectedElement) {
      const element = findElement(selectedElement.id);

      if (element) {
        const { id, type } = element;
        const adjustedCoordinates = adjustElementCoordinates(element);
        const { x1, y1, x2, y2 } = adjustedCoordinates;

        updateElement(id, x1, y1, x2, y2, type);
      }
    }

    if (drawing) {
      setDrawing(false);
      setSelection(true);
    }

    setSelectedElement(null);
    setOffset([]);
    setMoving(false);
    setResize(false);
  };

  const updateElement = (id, x1, y1, x2, y2, type) => {
    setElements(prevElements =>
      prevElements.map(element =>
        element.id === id ? createElement(id, x1, y1, x2, y2, type) : element
      ), true
    );
  };

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

  const findElement = (id) => {
    return elements.find((element) => element.id === id) || null;
  };

  const handleUndo = () => {
    setDrawing(false);
    setSelection(true);
    undo();
  };
  
  const handleRedo = () => {
    setDrawing(false);
    setSelection(true);
    redo();
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
            setElementType("rectangle");
            setSelection(false);
          }}
        />
        <label htmlFor="rectangle">Rectangle</label>

        <button style={{ backgroundColor: 'blue', color: 'white' }}>
          {isAuthenticated ? <LogoutButton /> : <LoginButton />}
        </button>
      </div>
      <div style={{ position: "fixed", bottom: 0, padding: 10 }}>
      <button onClick={handleUndo}>Undo</button>
      <button onClick={handleRedo}>Redo</button>
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
