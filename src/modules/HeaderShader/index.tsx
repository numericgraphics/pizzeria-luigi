'use client'

import { useEffect, useRef } from 'react'
import starsData from '@/data/stars.json'
import vertexShaderSource from './shader.vert'
import fragmentShaderSource from './shader.frag'
import './styles.css'

// SVG viewBox dimensions
const SVG_SIZE = 734.08

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext, vert: WebGLShader, frag: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return null
  }
  return program
}

export default function HeaderShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false })
    if (!gl) return

    // Compile shaders
    const vert = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vert || !frag) return

    const program = createProgram(gl, vert, frag)
    if (!program) return

    // Attribute/uniform locations
    const aPosition = gl.getAttribLocation(program, 'a_position')
    const aSize = gl.getAttribLocation(program, 'a_size')
    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uCenter = gl.getUniformLocation(program, 'u_center')
    const uRotation = gl.getUniformLocation(program, 'u_rotation')
    const uAlpha = gl.getUniformLocation(program, 'u_alpha')

    // Build geometry from stars.json — scale from SVG space to canvas space
    const positions: number[] = []
    const sizes: number[] = []

    const stars = starsData as Array<{ x: number; y: number; size: number }>

    for (const star of stars) {
      positions.push(star.x, star.y)
      sizes.push(star.size)
    }

    const posBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    const sizeBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW)

    const starCount = stars.length

    // Resize canvas to match its CSS display size
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Animation loop
    let rafId: number
    const startTime = performance.now()

    const render = () => {
      const elapsed = (performance.now() - startTime) / 1000
      const rotation = elapsed * 0.08 // rad/s — slow, elegant

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      gl.useProgram(program)

      // Scale star positions from SVG space to canvas pixel space
      const w = canvas.width
      const h = canvas.height
      const scale = Math.max(w, h) / SVG_SIZE * 1.1
      const offsetX = (w - SVG_SIZE * scale) / 2
      const offsetY = (h - SVG_SIZE * scale) / 2

      // Upload uniforms
      gl.uniform2f(uResolution, w, h)
      gl.uniform2f(uCenter,
        SVG_SIZE / 2 * scale + offsetX,
        SVG_SIZE / 2 * scale + offsetY
      )
      gl.uniform1f(uRotation, rotation)
      gl.uniform1f(uAlpha, 0.55)

      // Upload scaled positions per frame (small array, negligible cost)
      const scaledPositions = new Float32Array(positions.length)
      for (let i = 0; i < positions.length; i += 2) {
        scaledPositions[i]     = positions[i]     * scale + offsetX
        scaledPositions[i + 1] = positions[i + 1] * scale + offsetY
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, scaledPositions, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(aPosition)
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

      // Scaled sizes
      const scaledSizes = new Float32Array(sizes.map(s => s * scale))
      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, scaledSizes, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(aSize)
      gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0)

      gl.drawArrays(gl.POINTS, 0, starCount)

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      gl.deleteProgram(program)
      gl.deleteShader(vert)
      gl.deleteShader(frag)
      gl.deleteBuffer(posBuffer)
      gl.deleteBuffer(sizeBuffer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="header-shader"
      aria-hidden="true"
    />
  )
}
