'use client'

import { useEffect, useRef, useState } from 'react'

const vertexSource = `
  attribute vec2 position;
  varying vec2 vTexCoord;
  void main() {
    vTexCoord = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fragmentSource = `
  precision mediump float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  varying vec2 vTexCoord;

  float scanline(vec2 uv) {
    return sin(uv.y * uResolution.y * 0.8) * 0.04;
  }

  float noise(vec2 point) {
    return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vTexCoord;
    vec3 color = vec3(0.01, 0.04, 0.01);
    color += noise(uv + uTime * 0.01) * 0.02;
    color -= scanline(uv);
    color *= clamp(1.0 - length(uv - 0.5) * 1.2, 0.0, 1.0);
    float bar = smoothstep(0.01, 0.0, abs(fract(uv.y - uTime * 0.1) - 0.02));
    color += bar * vec3(0.0, 0.1, 0.0);
    vec2 mouse = uMouse / uResolution;
    float glow = smoothstep(0.2, 0.0, distance(uv, vec2(mouse.x, 1.0 - mouse.y))) * 0.05;
    color += glow * vec3(0.0, 1.0, 0.0);
    gl_FragColor = vec4(color, 1.0);
  }
`

function createShader(
  context: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = context.createShader(type)
  if (!shader) return null

  context.shaderSource(shader, source)
  context.compileShader(shader)
  return context.getShaderParameter(shader, context.COMPILE_STATUS)
    ? shader
    : null
}

export function TerminalEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [effectsEnabled, setEffectsEnabled] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotionPreference = () => {
      setEffectsEnabled(!reducedMotion.matches)
    }

    syncMotionPreference()
    reducedMotion.addEventListener('change', syncMotionPreference)

    return () => {
      reducedMotion.removeEventListener('change', syncMotionPreference)
    }
  }, [])

  useEffect(() => {
    if (!effectsEnabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('webgl')
    if (!context) return

    const vertexShader = createShader(
      context,
      context.VERTEX_SHADER,
      vertexSource,
    )
    const fragmentShader = createShader(
      context,
      context.FRAGMENT_SHADER,
      fragmentSource,
    )
    if (!vertexShader || !fragmentShader) return

    const program = context.createProgram()
    if (!program) return

    context.attachShader(program, vertexShader)
    context.attachShader(program, fragmentShader)
    context.linkProgram(program)
    if (!context.getProgramParameter(program, context.LINK_STATUS)) return

    const buffer = context.createBuffer()
    const positionLocation = context.getAttribLocation(program, 'position')
    const timeLocation = context.getUniformLocation(program, 'uTime')
    const resolutionLocation = context.getUniformLocation(
      program,
      'uResolution',
    )
    const mouseLocation = context.getUniformLocation(program, 'uMouse')
    if (
      !buffer ||
      positionLocation < 0 ||
      !timeLocation ||
      !resolutionLocation ||
      !mouseLocation
    )
      return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animationFrame = 0
    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(window.innerWidth * pixelRatio)
      canvas.height = Math.floor(window.innerHeight * pixelRatio)
      context.viewport(0, 0, canvas.width, canvas.height)
    }

    const draw = (time: number) => {
      context.useProgram(program)
      context.bindBuffer(context.ARRAY_BUFFER, buffer)
      context.bufferData(
        context.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        context.STATIC_DRAW,
      )
      context.enableVertexAttribArray(positionLocation)
      context.vertexAttribPointer(
        positionLocation,
        2,
        context.FLOAT,
        false,
        0,
        0,
      )
      context.uniform1f(timeLocation, time / 1000)
      context.uniform2f(resolutionLocation, canvas.width, canvas.height)
      context.uniform2f(mouseLocation, mouseX, mouseY)
      context.drawArrays(context.TRIANGLE_STRIP, 0, 4)

      if (!reducedMotion.matches)
        animationFrame = window.requestAnimationFrame(draw)
    }

    const trackPointer = (event: PointerEvent) => {
      mouseX = event.clientX
      mouseY = event.clientY
    }

    resize()
    draw(0)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', trackPointer, { passive: true })

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', trackPointer)
      context.deleteBuffer(buffer)
      context.deleteProgram(program)
      context.deleteShader(vertexShader)
      context.deleteShader(fragmentShader)
    }
  }, [effectsEnabled])

  return (
    <div
      className={
        effectsEnabled
          ? 'terminal-effects'
          : 'terminal-effects effects-disabled'
      }
    >
      <canvas ref={canvasRef} className="shader-canvas" aria-hidden="true" />
      <div className="crt-overlay" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />
      <div className="flicker-overlay" aria-hidden="true" />
      <button
        type="button"
        className="effects-toggle"
        aria-label={
          effectsEnabled ? 'Pause terminal effects' : 'Resume terminal effects'
        }
        aria-pressed={effectsEnabled}
        onClick={() => setEffectsEnabled((enabled) => !enabled)}
      >
        {effectsEnabled ? 'Pause terminal effects' : 'Resume terminal effects'}
      </button>
    </div>
  )
}
