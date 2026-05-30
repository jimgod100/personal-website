/**
 * EnvironmentSetup — Sets up HDR environment maps for realistic reflections.
 * Uses studio_small_08_1k.hdr for controlled, soft environment lighting
 * that complements glass/crystal and iridescent materials.
 */
import React from 'react';
import { Environment } from '@react-three/drei';

interface Props {
  scrollProgress: React.MutableRefObject<number>;
}

export default function EnvironmentSetup({ scrollProgress }: Props) {
  return (
    <>
      {/* Studio HDRI for soft, controlled reflections */}
      <Environment
        files="/hdri/studio_small_08_1k.hdr"
        background={false}
        environmentIntensity={0.8}
      />
    </>
  );
}
