'use client'

import { useEffect, useRef } from 'react'
import starsData from '@/data/stars.json'
import vertexShaderSource from './shader.vert'
import fragmentShaderSource from './shader.frag'
import './styles.css'

const SVG_SIZE = 734.08

type Star = { x: number; y: number; size: number; depth: number; selfAngle: number; spinSpeed: number; orbitSpeed: number }

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

function makeBuffer(gl: WebGLRenderingContext, data: Float32Array): WebGLBuffer {
  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  return buf
}

export default function HeaderShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false })
    if (!gl) return

    const vert = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vert || !frag) return

    const program = createProgram(gl, vert, frag)
    if (!program) return

    // Attribute locations
    const aPosition   = gl.getAttribLocation(program, 'a_position')
    const aSize       = gl.getAttribLocation(program, 'a_size')
    const aSelfAngle  = gl.getAttribLocation(program, 'a_selfAngle')
    const aSpinSpeed  = gl.getAttribLocation(program, 'a_spinSpeed')
    const aOrbitSpeed = gl.getAttribLocation(program, 'a_orbitSpeed')
    const aDepth      = gl.getAttribLocation(program, 'a_depth')

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uCenter     = gl.getUniformLocation(program, 'u_center')
    const uRotation   = gl.getUniformLocation(program, 'u_rotation')

    const stars = starsData as Star[]
    const count = stars.length

    // Static attribute arrays (in SVG space — scaled each frame for positions)
    const svgPositions  = new Float32Array(stars.flatMap(s => [s.x, s.y]))
    const svgSizes      = new Float32Array(stars.map(s => s.size))
    const selfAngles    = new Float32Array(stars.map(s => s.selfAngle))
    const spinSpeeds    = new Float32Array(stars.map(s => s.spinSpeed))
    const orbitSpeeds   = new Float32Array(stars.map(s => s.orbitSpeed))
    const depths        = new Float32Array(stars.map(s => s.depth))

    // Static buffers (never change)
    const selfAngleBuf  = makeBuffer(gl, selfAngles)
    const spinSpeedBuf  = makeBuffer(gl, spinSpeeds)
    const orbitSpeedBuf = makeBuffer(gl, orbitSpeeds)
    const depthBuf      = makeBuffer(gl, depths)

    // Dynamic buffers (positions/sizes scaled per frame)
    const posBuf  = gl.createBuffer()!
    const sizeBuf = gl.createBuffer()!

    const bindAttr = (buf: WebGLBuffer, loc: number, size: number) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
    }

    // Resize
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width  = rect.width  * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let rafId: number
    const startTime = performance.now()

    const render = () => {
      const elapsed  = (performance.now() - startTime) / 1000
      // Orbit speed: 0.3 rad/s = ~1 full turn per 21s
      const rotation = elapsed * 0.3

      const w = canvas.width
      const h = canvas.height

      // Scale SVG space to canvas: fill the wider dimension, center on canvas
      const scale   = Math.max(w, h) / SVG_SIZE * 1.35
      const offsetX = (w - SVG_SIZE * scale) / 2
      const offsetY = (h - SVG_SIZE * scale) / 2

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(program)

      // Uniforms
      gl.uniform2f(uResolution, w, h)
      gl.uniform2f(uCenter,
        SVG_SIZE / 2 * scale + offsetX,
        SVG_SIZE / 2 * scale + offsetY
      )
      gl.uniform1f(uRotation, rotation)

      // Upload scaled positions
      const scaledPos = new Float32Array(count * 2)
      for (let i = 0; i < count; i++) {
        scaledPos[i * 2]     = svgPositions[i * 2]     * scale + offsetX
        scaledPos[i * 2 + 1] = svgPositions[i * 2 + 1] * scale + offsetY
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
      gl.bufferData(gl.ARRAY_BUFFER, scaledPos, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(aPosition)
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

      // Upload scaled sizes
      const scaledSizes = new Float32Array(svgSizes.map(s => s * scale))
      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf)
      gl.bufferData(gl.ARRAY_BUFFER, scaledSizes, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(aSize)
      gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0)

      // Static attributes
      bindAttr(selfAngleBuf,  aSelfAngle,  1)
      bindAttr(spinSpeedBuf,  aSpinSpeed,  1)
      bindAttr(orbitSpeedBuf, aOrbitSpeed, 1)
      bindAttr(depthBuf,      aDepth,      1)

      gl.drawArrays(gl.POINTS, 0, count)

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      gl.deleteProgram(program)
      gl.deleteShader(vert)
      gl.deleteShader(frag)
      gl.deleteBuffer(posBuf)
      gl.deleteBuffer(sizeBuf)
      gl.deleteBuffer(selfAngleBuf)
      gl.deleteBuffer(spinSpeedBuf)
      gl.deleteBuffer(orbitSpeedBuf)
      gl.deleteBuffer(depthBuf)
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
