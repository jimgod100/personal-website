import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';

// Shared material instance — avoids 45 separate MeshPhysicalMaterial allocations
const sharedCrossMaterial = new THREE.MeshPhysicalMaterial({
  color: '#2dd4bf',
  transmission: 0.6,
  thickness: 0.5,
  roughness: 0.05,
  metalness: 0.1,
  ior: 1.5,
  envMapIntensity: 1.5,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
});

// Shared geometries — 3 box geometries reused across all crosses
const geoH = new THREE.BoxGeometry(1, 0.2, 0.2);
const geoV = new THREE.BoxGeometry(0.2, 1, 0.2);
const geoD = new THREE.BoxGeometry(0.2, 0.2, 1);

const CrossGeometry = () => {
  return (
    <group>
      <mesh geometry={geoH} material={sharedCrossMaterial} />
      <mesh geometry={geoV} material={sharedCrossMaterial} />
      <mesh geometry={geoD} material={sharedCrossMaterial} />
    </group>
  );
};

/** Individual cross with its own ref — avoids useRef inside .map() */
function PhysicsCross({
  position,
  rotation,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}) {
  const rbRef = useRef<any>(null);

  const handlePointerEnter = () => {
    if (rbRef.current) {
      rbRef.current.applyImpulse(
        { x: (Math.random() - 0.5) * 2, y: 5, z: (Math.random() - 0.5) * 2 },
        true
      );
      rbRef.current.applyTorqueImpulse(
        { x: Math.random() * 2, y: Math.random() * 2, z: Math.random() * 2 },
        true
      );
    }
  };

  return (
    <RigidBody
      ref={rbRef}
      colliders="hull"
      position={position}
      rotation={rotation}
      restitution={0.5}
      friction={0.5}
      onPointerEnter={handlePointerEnter}
      onClick={handlePointerEnter}
    >
      <group scale={scale}>
        <CrossGeometry />
      </group>
    </RigidBody>
  );
}

export default function HeroPhysicsZone({ baseColor }: { baseColor: React.MutableRefObject<string> | string }) {
  // Update shared material color reactively via ref check
  const lastColor = useRef('');
  const getColor = () => typeof baseColor === 'string' ? baseColor : baseColor.current;

  // Sync material color when baseColor changes (checked per-render)
  const currentColor = getColor();
  if (currentColor !== lastColor.current) {
    lastColor.current = currentColor;
    sharedCrossMaterial.color.set(currentColor);
  }

  const crosses = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 6,
        10 + Math.random() * 20,
        (Math.random() - 0.5) * 4 - 2
      ] as [number, number, number],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ] as [number, number, number],
      scale: 0.5 + Math.random() * 0.5,
    }));
  }, []);

  return (
    <Physics gravity={[0, -3, 0]}>
      {/* Invisible floor */}
      <RigidBody type="fixed" position={[0, -5, 0]}>
        <CuboidCollider args={[20, 1, 20]} />
      </RigidBody>
      
      {/* Invisible walls */}
      <RigidBody type="fixed" position={[-5, 0, 0]}>
        <CuboidCollider args={[1, 20, 10]} />
      </RigidBody>
      <RigidBody type="fixed" position={[5, 0, 0]}>
        <CuboidCollider args={[1, 20, 10]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0, -5]}>
        <CuboidCollider args={[10, 20, 1]} />
      </RigidBody>

      {crosses.map((props, i) => (
        <PhysicsCross
          key={i}
          position={props.position}
          rotation={props.rotation}
          scale={props.scale}
        />
      ))}
    </Physics>
  );
}
