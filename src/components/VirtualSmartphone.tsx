import { useState } from 'react'
import VectorProblem from './VectorProblem'
import './VirtualSmartphone.css'

const VirtualSmartphone = () => {
  return (
    <div className="smartphone-container">
      <div className="smartphone">
        <div className="smartphone-notch"></div>
        <div className="smartphone-screen">
          <VectorProblem />
        </div>
        <div className="smartphone-home-indicator"></div>
      </div>
    </div>
  )
}

export default VirtualSmartphone
