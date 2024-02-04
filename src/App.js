import React, { useState, useLayoutEffect } from 'react';
import rough from 'roughjs';

const generator = rough.generator();

function createElement(x1, y1, x2, y2,type) {
  if(type==="Line"){

    const roughElement = generator.line(x1, y1, x2, y2);
    return { x1, y1, x2, y2, roughElement };

  }
  else{
    const roughElement = generator.rectangle(x1, y1, x2-x1, y2-y1);
    return { x1, y1, x2, y2, roughElement };
  }
}

const App = () => {
  const [elements, setElements] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [elementType,setElementType]=useState("line")

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas');

    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const rc = rough.canvas(canvas);
      elements.forEach(({ roughElement }) => rc.draw(roughElement));
    }
  }, [elements]);

  const handleMouseDown = (e) => {
    setDrawing(true);
    const element = createElement(e.clientX, e.clientY, e.clientX, e.clientY,elementType);
    setElements((prevState) => [...prevState, element]);
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const lastElementIndex = elements.length - 1;
    const { x1, y1 } = elements[lastElementIndex];
    const updatedElement = createElement(x1, y1, e.clientX, e.clientY,elementType);
    const elementsCopy = [...elements];
    elementsCopy[lastElementIndex] = updatedElement;
    setElements(elementsCopy);


    /*const handleMouseMove = (event) => {
  if (!drawing) return;

  const { clientX, clientY } = event;
  const index = elements.length - 1;

  setElements((prevElements) =>
    prevElements.map((element, i) =>
      i === index ? createElement(element.x1, element.y1, clientX, clientY) : element
    )
  );
};
 */

  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  return (
    <div>
      <div style={{ position: "fixed" }}>
  <input
    type="radio"
    id="Line"
    checked={elementType === "Line"} // Corrected the checked attribute
    onChange={() => setElementType("Line")}
  />
  <label htmlFor="Line">Line</label>

  <input
    type="radio"
    id="rectangle"
    checked={elementType === "rectangle"} // Corrected the checked attribute
    onChange={() => setElementType("rectangle")}
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
};

export default App;
