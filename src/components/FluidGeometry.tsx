import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import './FluidGeometry.css'

interface ProblemData {
  id: number
  title: string
  description: string
  shapeType: 'triangle' | 'rectangle' | 'circle' | 'polygon'
}

interface FluidGeometryProps {
  problemData: ProblemData | null
}

function FluidGeometry({ problemData }: FluidGeometryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const renderRef = useRef<Matter.Render | null>(null)
  const [properties, setProperties] = useState({
    area: 0,
    perimeter: 0,
    vertices: 0
  })
  const [isFluidMode, setIsFluidMode] = useState(false)
  const shapeRef = useRef<Matter.Body | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !problemData) return

    // Module aliases
    const { Engine, Render, Runner, Bodies, Composite, Body, Mouse, MouseConstraint, Events } = Matter

    // Create engine
    const engine = Engine.create({
      gravity: { x: 0, y: 0.3, scale: 0.001 }
    })
    engineRef.current = engine

    // Create renderer
    const render = Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: 336,
        height: 600,
        wireframes: false,
        background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)'
      }
    })
    renderRef.current = render

    // Create boundaries
    const walls = [
      Bodies.rectangle(168, 0, 336, 20, { isStatic: true, render: { fillStyle: '#ddd' } }),
      Bodies.rectangle(168, 600, 336, 20, { isStatic: true, render: { fillStyle: '#ddd' } }),
      Bodies.rectangle(0, 300, 20, 600, { isStatic: true, render: { fillStyle: '#ddd' } }),
      Bodies.rectangle(336, 300, 20, 600, { isStatic: true, render: { fillStyle: '#ddd' } })
    ]

    // Create main shape based on problem type
    let shape: Matter.Body

    switch (problemData.shapeType) {
      case 'triangle':
        shape = createFluidTriangle(168, 150, 80)
        break
      case 'rectangle':
        shape = createFluidRectangle(168, 150, 100, 80)
        break
      case 'circle':
        shape = createFluidCircle(168, 150, 50)
        break
      case 'polygon':
        shape = createFluidPolygon(168, 150, 6, 60)
        break
      default:
        shape = createFluidTriangle(168, 150, 80)
    }

    shapeRef.current = shape

    // Add all bodies to the world
    Composite.add(engine.world, [...walls, shape])

    // Add mouse control
    const mouse = Mouse.create(render.canvas)
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    })
    Composite.add(engine.world, mouseConstraint)

    // Keep the mouse in sync with rendering
    render.mouse = mouse

    // Update properties on every engine update
    Events.on(engine, 'afterUpdate', () => {
      if (shapeRef.current) {
        updateProperties(shapeRef.current)
      }
    })

    // Run the engine and renderer
    const runner = Runner.create()
    Runner.run(runner, engine)
    Render.run(render)

    // Cleanup
    return () => {
      Render.stop(render)
      Runner.stop(runner)
      Engine.clear(engine)
      render.canvas.remove()
      render.textures = {}
    }
  }, [problemData])

  // Create fluid triangle using soft body simulation
  function createFluidTriangle(x: number, y: number, size: number): Matter.Body {
    const { Bodies, Body, Composites } = Matter

    // Create a soft body triangle using connected particles
    const particleOptions = {
      friction: 0.05,
      frictionAir: 0.01,
      render: {
        fillStyle: '#667eea',
        strokeStyle: '#764ba2',
        lineWidth: 2
      }
    }

    // Create triangle vertices
    const vertices = [
      { x: x, y: y - size },
      { x: x - size * 0.866, y: y + size * 0.5 },
      { x: x + size * 0.866, y: y + size * 0.5 }
    ]

    // Create a polygon body
    const triangle = Bodies.fromVertices(x, y, [vertices], {
      ...particleOptions,
      restitution: 0.8
    })

    return triangle
  }

  // Create fluid rectangle
  function createFluidRectangle(x: number, y: number, width: number, height: number): Matter.Body {
    const { Bodies } = Matter

    return Bodies.rectangle(x, y, width, height, {
      friction: 0.05,
      frictionAir: 0.01,
      restitution: 0.8,
      render: {
        fillStyle: '#667eea',
        strokeStyle: '#764ba2',
        lineWidth: 2
      }
    })
  }

  // Create fluid circle
  function createFluidCircle(x: number, y: number, radius: number): Matter.Body {
    const { Bodies } = Matter

    return Bodies.circle(x, y, radius, {
      friction: 0.05,
      frictionAir: 0.01,
      restitution: 0.8,
      render: {
        fillStyle: '#667eea',
        strokeStyle: '#764ba2',
        lineWidth: 2
      }
    })
  }

  // Create fluid polygon
  function createFluidPolygon(x: number, y: number, sides: number, radius: number): Matter.Body {
    const { Bodies } = Matter

    return Bodies.polygon(x, y, sides, radius, {
      friction: 0.05,
      frictionAir: 0.01,
      restitution: 0.8,
      render: {
        fillStyle: '#667eea',
        strokeStyle: '#764ba2',
        lineWidth: 2
      }
    })
  }

  // Calculate and update geometric properties
  function updateProperties(body: Matter.Body) {
    const area = body.area
    const vertices = body.vertices.length

    // Calculate perimeter
    let perimeter = 0
    for (let i = 0; i < body.vertices.length; i++) {
      const v1 = body.vertices[i]
      const v2 = body.vertices[(i + 1) % body.vertices.length]
      const dx = v2.x - v1.x
      const dy = v2.y - v1.y
      perimeter += Math.sqrt(dx * dx + dy * dy)
    }

    setProperties({
      area: Math.round(area),
      perimeter: Math.round(perimeter),
      vertices
    })
  }

  // Toggle fluid mode
  const toggleFluidMode = () => {
    if (!engineRef.current || !shapeRef.current) return

    setIsFluidMode(!isFluidMode)

    if (!isFluidMode) {
      // Activate fluid mode - reduce stiffness and increase air resistance
      Matter.Body.set(shapeRef.current, {
        friction: 0.001,
        frictionAir: 0.05,
        restitution: 0.95
      })

      // Apply random forces to create fluid effect
      const interval = setInterval(() => {
        if (shapeRef.current) {
          const force = {
            x: (Math.random() - 0.5) * 0.01,
            y: (Math.random() - 0.5) * 0.01
          }
          Matter.Body.applyForce(shapeRef.current, shapeRef.current.position, force)
        }
      }, 100)

      // Store interval ID for cleanup
      setTimeout(() => {
        clearInterval(interval)
        if (shapeRef.current) {
          Matter.Body.set(shapeRef.current, {
            friction: 0.05,
            frictionAir: 0.01,
            restitution: 0.8
          })
        }
        setIsFluidMode(false)
      }, 5000)
    }
  }

  // Shake the shape
  const shakeShape = () => {
    if (!shapeRef.current) return

    const force = {
      x: (Math.random() - 0.5) * 0.05,
      y: (Math.random() - 0.5) * 0.05
    }
    Matter.Body.applyForce(shapeRef.current, shapeRef.current.position, force)
  }

  return (
    <div className="fluid-geometry-container">
      <div className="geometry-header">
        <h3>🌊 Fluid Geometry</h3>
        {problemData && <p>{problemData.title}</p>}
      </div>

      <canvas ref={canvasRef} className="geometry-canvas" />

      <div className="properties-panel">
        <h4>📐 기하학적 성질</h4>
        <div className="property-grid">
          <div className="property-item">
            <span className="property-label">면적</span>
            <span className="property-value">{properties.area}</span>
          </div>
          <div className="property-item">
            <span className="property-label">둘레</span>
            <span className="property-value">{properties.perimeter}</span>
          </div>
          <div className="property-item">
            <span className="property-label">꼭짓점</span>
            <span className="property-value">{properties.vertices}</span>
          </div>
        </div>
        <div className="property-note">
          💡 도형이 움직여도 이 값들은 거의 유지됩니다!
        </div>
      </div>

      <div className="control-buttons">
        <button
          className={`control-btn ${isFluidMode ? 'active' : ''}`}
          onClick={toggleFluidMode}
          disabled={isFluidMode}
        >
          {isFluidMode ? '🌊 유체 모드 활성화 중...' : '🌊 유체 모드'}
        </button>
        <button className="control-btn" onClick={shakeShape}>
          ✨ 흔들기
        </button>
      </div>
    </div>
  )
}

export default FluidGeometry
