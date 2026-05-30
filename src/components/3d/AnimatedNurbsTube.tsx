/**
 * AnimatedNurbsTube — Port of lusion-reverse-engineered's AnimatedTube.
 * Renders a metallic tube that follows a NURBS curve path.
 * The tube "draws" itself as the user scrolls, using a DataTexture
 * to drive vertex displacement along the curve.
 *
 * Uses: nurbs-canxerian.json, environment HDR
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { NURBSCurve } from 'three/examples/jsm/curves/NURBSCurve.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface Props {
  scrollProgress: React.MutableRefObject<number>;
  color: React.MutableRefObject<string>;
}

export default function AnimatedNurbsTube({ scrollProgress, color }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniformsRef = useRef({
    curveTexture: { value: null as THREE.DataTexture | null },
    stretchRatio: { value: 0 },
  });

  const [nurbsData, setNurbsData] = React.useState<any>(null);

  // Load NURBS data
  useEffect(() => {
    fetch('/nurbs-canxerian.json')
      .then((r) => r.json())
      .then(setNurbsData)
      .catch(() => console.warn('NURBS data not found'));
  }, []);

  const { geometry, dataTexture } = useMemo(() => {
    if (!nurbsData) return { geometry: null, dataTexture: null };

    // Create NURBS curve
    const nurbsDegree = 4;
    const nurbsPoints = nurbsData[0].points.map(
      (p: any) => new THREE.Vector4(p.x, p.y, p.z, p.weight)
    );
    const nurbsKnots: number[] = [];

    for (let i = 0; i <= nurbsDegree; i++) nurbsKnots.push(0);
    for (let i = 0, j = nurbsPoints.length; i < j; i++) {
      const knot = (i + 1) / (j - nurbsDegree);
      nurbsKnots.push(THREE.MathUtils.clamp(knot, 0, 1));
    }

    const curve = new NURBSCurve(nurbsDegree, nurbsKnots, nurbsPoints);

    // Create data texture for vertex shader
    const data: number[] = [];
    const texSize = 1024;
    const pData = curve.getSpacedPoints(texSize - 1);
    const ffData = curve.computeFrenetFrames(texSize - 1);

    pData.forEach((v) => data.push(v.x, v.y, v.z, 0));
    ffData.tangents.forEach((v) => data.push(v.x, v.y, v.z, 0));
    ffData.normals.forEach((v) => data.push(v.x, v.y, v.z, 0));
    ffData.binormals.forEach((v) => data.push(v.x, v.y, v.z, 0));

    const dt = new THREE.DataTexture(
      new Float32Array(data),
      texSize,
      4, // 4 rows: points, tangents, normals, binormals
      THREE.RGBAFormat,
      THREE.FloatType
    );
    dt.needsUpdate = true;

    // Create tube geometry
    const radius = 0.11;
    const cylinderSegments = 800;
    const radialSegments = 64;

    const geo = mergeGeometries([
      new THREE.SphereGeometry(
        radius, radialSegments, radialSegments * 0.5,
        0, Math.PI * 2, 0, Math.PI * 0.5
      ).translate(0, 0.5, 0),
      new THREE.CylinderGeometry(
        radius, radius, 1, radialSegments, cylinderSegments, true
      ),
      new THREE.SphereGeometry(
        radius, radialSegments, radialSegments * 0.5,
        0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5
      ).translate(0, -0.5, 0),
    ]);

    if (geo) {
      geo.rotateZ(-Math.PI * 0.5);
      geo.rotateY(Math.PI * 0.5);
    }

    return { geometry: geo, dataTexture: dt };
  }, [nurbsData]);

  // Set data texture uniform
  useEffect(() => {
    if (dataTexture) {
      uniformsRef.current.curveTexture.value = dataTexture;
    }
  }, [dataTexture]);

  // Animate
  useFrame(() => {
    // Map scroll progress to draw amount
    // The tube starts drawing at ~20% scroll and fully draws by ~60%
    const targetDraw = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(scrollProgress.current, 0.15, 0.55, 0, 1),
      0, 1
    );
    uniformsRef.current.stretchRatio.value = THREE.MathUtils.lerp(
      uniformsRef.current.stretchRatio.value,
      targetDraw,
      0.05
    );
  });

  if (!geometry) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[-6, -3, -1]}
      frustumCulled={false}
    >
      <meshPhysicalMaterial
        color="#6366f1"
        emissive="#6366f1"
        emissiveIntensity={0.15}
        roughness={0.1}
        metalness={0.85}
        iridescence={0.4}
        iridescenceIOR={1.3}
        clearcoat={0.6}
        clearcoatRoughness={0.08}
        onBeforeCompile={(shader) => {
          shader.uniforms.curveTexture = uniformsRef.current.curveTexture;
          shader.uniforms.stretchRatio = uniformsRef.current.stretchRatio;
          shader.vertexShader = `
            uniform sampler2D curveTexture;
            uniform float stretchRatio;
            ${shader.vertexShader}
          `.replace(
            `#include <beginnormal_vertex>`,
            `#include <beginnormal_vertex>
            vec3 pos = position;
            vec3 cpos = vec3(0.);
            vec3 ctan = vec3(0.);
            vec3 cnorm = vec3(0.);
            vec3 cbin = vec3(0.);
            float a = clamp(pos.z + 0.5, 0., 1.) * stretchRatio;
            if(pos.z < -0.5) {
              cpos = vec3(texture(curveTexture, vec2(0., 0.125)));
              ctan = vec3(texture(curveTexture, vec2(0., 0.375)));
              cnorm = vec3(texture(curveTexture, vec2(0., 0.625)));
              cbin = vec3(texture(curveTexture, vec2(0., 0.875)));
              pos.z += 0.5;
            } else {
              cpos = vec3(texture(curveTexture, vec2(a, 0.125)));
              ctan = vec3(texture(curveTexture, vec2(a, 0.375)));
              cnorm = vec3(texture(curveTexture, vec2(a, 0.625)));
              cbin = vec3(texture(curveTexture, vec2(a, 0.875)));
              pos.z = (pos.z > 0.5) ? (pos.z - 0.5) : 0.;
            }
            
            // Build Frenet frame rotation and apply to normals
            vec3 N = normalize(cnorm);
            vec3 B = normalize(cbin);
            objectNormal = normalize(N * normal.x + B * normal.y);
          `
          ).replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
            // Apply Frenet frame rotation and curve displacement
            transformed = normalize(cnorm) * pos.x + normalize(cbin) * pos.y + cpos;
          `
          );
        }}
      />
    </mesh>
  );
}
