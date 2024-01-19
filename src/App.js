
import './App.css';

function App() {
  return (
    <div className="App">
   <canvas id='draw' width='700' height='700' className=' border border-gray-950' onClick={(event)=>{
    console.log('clicked');
    //console.log(event)
    }}
   onMouseDown={(event)=>{console.log('mouse downn')
   //console.log(event)
  }}
   
   onMouseMove={(event)=>{console.log('mouse move')
   console.log(event)}}/>
    </div>
  );
}

export default App;
