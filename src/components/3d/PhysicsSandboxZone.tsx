/**
 * PhysicsSandbox — Port of lusion-reverse-engineered's PhysicsSandbox.
 * Creates physics spheres that are attracted to a central point and
 * can be pushed around by mouse movement. Uses stencil masking
 * to constrain visibility to a specific region (matching a DOM element).
 *
 * Uses: physics-mask.glb, physics-sandbox-mask.glb
 */
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BALL_COUNT = 20;
const ATTRACTION_FORCE = 0.03;
const DAMPING = 0.95;

interface Props {
  baseColor: React.MutableRefObject<string>;
  scrollProgress: React.MutableRefObject<number>;
}

interface Ball {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  radius: number;
}

// Pre-allocated vectors to avoid per-frame GC pressure
const _center = new THREE.Vector3(0, 0, 0);
const _mouseWorld = new THREE.Vector3();
const _toCenter = new THREE.Vector3();
const _toMouse = new THREE.Vector3();
const _diff = new THREE.Vector3();
const _push = new THREE.Vector3();
const _accentColor = new THREE.Color();

export default function PhysicsSandboxZone({ baseColor, scrollProgress }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const ballsRef = useRef<Ball[]>([]);

  // Create balls
  const balls = useMemo(() => {
    const arr: Ball[] = [];
    for (let i = 0; i < BALL_COUNT; i++) {
      const radius = 0.15 + Math.random() * 0.25;
      const geo = new THREE.SphereGeometry(radius, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: '#E91E63',
        roughness: 0.22,
        metalness: 0.0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        0
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      arr.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          0
        ),
        radius,
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    ballsRef.current = balls;
  }, [balls]);

  // Mouse tracking
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const scroll = scrollProgress.current;
    // Only visible in mid-scroll range
    const visibility = scroll > 0.25 && scroll < 0.65 ? 1 : 0;
    groupRef.current.visible = visibility > 0;
    if (!visibility) return;

    _mouseWorld.set(
      mouseRef.current.x * 3,
      mouseRef.current.y * 3,
      0
    );

    _accentColor.set(baseColor.current);

    balls.forEach((ball) => {
      // Attraction to center
      _toCenter.copy(_center).sub(ball.mesh.position);
      ball.velocity.addScaledVector(_toCenter, ATTRACTION_FORCE);

      // Mouse repulsion
      _toMouse.copy(ball.mesh.position).sub(_mouseWorld);
      const mouseDist = _toMouse.length();
      if (mouseDist < 1.5) {
        _toMouse.normalize();
        ball.velocity.addScaledVector(_toMouse, 0.02 / (mouseDist + 0.1));
      }

      // Ball-ball collision
      balls.forEach((other) => {
        if (other === ball) return;
        _diff.copy(ball.mesh.position).sub(other.mesh.position);
        const dist = _diff.length();
        const minDist = ball.radius + other.radius;
        if (dist < minDist) {
          _push.copy(_diff).normalize().multiplyScalar((minDist - dist) * 0.5);
          ball.velocity.add(_push);
          other.velocity.sub(_push);
        }
      });

      // Apply velocity with damping
      ball.velocity.multiplyScalar(DAMPING);
      ball.mesh.position.add(ball.velocity);
      ball.mesh.position.z = 0; // Keep in 2D plane

      // Update color
      const mat = ball.mesh.material as THREE.MeshStandardMaterial;
      mat.color.lerp(_accentColor, 0.02);
    });
  });

  return (
    <group ref={groupRef} position={[0, -1, 25]}>
      <pointLight intensity={8} color="#ffffff" position={[0, 0, 2]} />
      {balls.map((ball, i) => (
        <primitive key={i} object={ball.mesh} />
      ))}
    </group>
  );
}
