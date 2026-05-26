import { useState } from 'react'

import './App.css'
import {useCells, useCellsStatus} from "./hooks/useCell.ts";

function App() {
  const [count, setCount] = useState(0)
    const { data: cells, isLoading: isLoadingCells } = useCells()
    const { data, isLoading } = useCellsStatus()

    if(isLoading || isLoadingCells){
        return <div>Loading...</div>
    }

  return (
      <section id="center">
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
          {data && data.map((cell) => (
              <div key={cell.cellId} className={`cell-card ${cell.state.toLowerCase()}`}>
                  <h2>{cell.cellId}</h2>
                  <p>State: <strong>{cell.state}</strong></p>
                  <p>Since: {new Date(cell.since).toLocaleTimeString()}</p>
              </div>
          ))}
          {cells && cells.map((cellId) => (
              <div key={cellId}>
                  <h2>{cellId}</h2>
              </div>
          ))}
      </section>
  )
}

export default App
