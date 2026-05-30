import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';

const CrossGeometry = ({ color }: { color: string }) => {
  return (
    <group>
      <mesh>
        <boxGeometry args={[1, 0.2, 0.2]} />
        <meshPhysicalMaterial
          color={color}
          transmission={0.6}
          thickness={0.5}
          roughness={0.05}
          metalness={0.1}
          ior={1.5}
          envMapIntensity={1.5}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshPhysicalMaterial
          color={color}
          transmission={0.6}
          thickness={0.5}
          roughness={0.05}
          metalness={0.1}
          ior={1.5}
          envMapIntensity={1.5}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[0.2, 0.2, 1]} />
        <meshPhysicalMaterial
          color={color}
          transmission={0.6}
          thickness={0.5}
          roughness={0.05}
          metalness={0.1}
          ior={1.5}
          envMapIntensity={1.5}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

/** Individual cross with its own ref — avoids useRef inside .map() */
function PhysicsCross({
  position,
  rotation,
  scale,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
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
        <CrossGeometry color={color} />
      </group>
    </RigidBody>
  );
}

export default function HeroPhysicsZone({ baseColor }: { baseColor: React.MutableRefObject<string> | string }) {
  const getColor = () => typeof baseColor === 'string' ? baseColor : baseColor.current;
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
          color={getColor()}
        />
      ))}
    </Physics>
  );
}
