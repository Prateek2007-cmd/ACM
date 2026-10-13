import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SIMPLEX } from './glsl';
import { useInView } from './useInView';
import { reducedMotion, webgl } from '../../lib/store';
import FxBoundary from './FxBoundary';

/**
 * Moving, noise-displaced gradient surface — inspired by ruucm/shadergradient
 * ("waterPlane" style). A dense plane is displaced by 3D simplex noise in the
 * vertex shader; the fragment shader blends three colours by height and adds
 * soft film grain. Renders only while on screen.
 */

const vert = /* glsl */ `
uniform float uTime; uniform float uSpeed; uniform float uStrength; uniform float uDensity;
varying float vH; varying vec2 vUv;
${SIMPLEX}
void main(){
  vUv = uv;
  vec3 p = position;
  float t = uTime * uSpeed;
  float h = snoise(vec3(p.x * uDensity * 0.35, p.y * uDensity * 0.35, t)) * uStrength
          + snoise(vec3(p.x * uDensity, p.y * uDensity, t * 1.6)) * uStrength * 0.25;
  p.z += h;
  vH = h / max(uStrength, 0.001);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const frag = /* glsl */ `
precision highp float;
uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform float uTime; uniform float uGrain;
varying float vH; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  float k = clamp(vH * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uC1, uC2, smoothstep(0.0, 0.6, k + vUv.x * 0.25));
  col = mix(col, uC3, smoothstep(0.55, 1.0, k + vUv.y * 0.15));
  // specular sheen on crests
  col += pow(max(k - 0.55, 0.0) * 2.2, 3.0) * 0.35;
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}`;

type Props = {
  colors: [string, string, string];
  speed?: number;
  strength?: number;
  density?: number;
  grain?: number;
  rotation?: [number, number, number];
  className?: string;
};

function Plane({ colors, speed = 0.25, strength = 2.2, density = 1.2, grain = 0.05, rotation = [-0.9, 0, 0.4] }: Omit<Props, 'className'>) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeed: { value: speed },
    uStrength: { value: strength },
    uDensity: { value: density },
    uGrain: { value: grain },
    uC1: { value: new THREE.Color(colors[0]) },
    uC2: { value: new THREE.Color(colors[1]) },
    uC3: { value: new THREE.Color(colors[2]) },
  }), [colors, speed, strength, density, grain]);
  useFrame((_, dt) => { if (mat.current && !reducedMotion) mat.current.uniforms.uTime.value += dt; });
  return (
    <mesh rotation={rotation} scale={1.6}>
      <planeGeometry args={[14, 14, 160, 160]} />
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
    </mesh>
  );
}

export default function ShaderGradient({ className = '', ...props }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>('150px');
  const fallback = <div className="gradient-fallback" style={{ background: `radial-gradient(80% 70% at 30% 20%, ${props.colors[2]}, transparent 60%), radial-gradient(70% 60% at 80% 80%, ${props.colors[1]}, transparent 65%), ${props.colors[0]}` }} />;
  if (!webgl) return <div ref={ref} className={className} aria-hidden="true">{fallback}</div>;
  return (
    <div ref={ref} className={className} aria-hidden="true">
      <FxBoundary fallback={fallback}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        frameloop={inView && !reducedMotion ? 'always' : 'demand'}
        style={{ width: '100%', height: '100%' }}
      >
        <Plane {...props} />
      </Canvas>
      </FxBoundary>
    </div>
  );
}
