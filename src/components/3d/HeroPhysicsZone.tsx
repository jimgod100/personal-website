import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';

const CrossGeometry = ({ color }: { color: string }) => (
  <group>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1, 0.2, 0.2]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.2, 1, 0.2]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.2, 0.2, 1]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
    </mesh>
  </group>
);

export default function HeroPhysicsZone({ baseColor }: { baseColor: string }) {
  const crosses = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 6, 
        10 + Math.random() * 20, // Start high
        (Math.random() - 0.5) * 4 - 2 // z near 0
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
        <RigidBody 
          key={i} 
          colliders="hull" 
          position={props.position} 
          rotation={props.rotation} 
          restitution={0.5} 
          friction={0.5}
        >
          <group scale={props.scale}>
            <CrossGeometry color={baseColor} />
          </group>
        </RigidBody>
      ))}
    </Physics>
  );
}
