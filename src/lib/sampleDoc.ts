/**
 * Plain-English Note:
 * This helper generates a sample educational PDF document directly in the browser
 * so you can test the Reader, Dictionary Lookup, and PDF Tools right away!
 */

import { convertTextToPDF } from './fileConverter';

export async function createSamplePDF(): Promise<{ buffer: ArrayBuffer; fileName: string }> {
  const sampleContent = `# Introduction to Astrophysics and Deep Space Exploration

Astrophysics is a branch of space science that applies the laws of physics and chemistry to explain the birth, life, and death of stars, planets, galaxies, nebulae, and other objects in the universe. It is closely aligned with astronomy and cosmology.

## The Life Cycle of Stellar Phenomena

A star begins its life inside a vast, dense interstellar cloud known as a nebula. Over millions of years, gravity compresses hydrogen gas until nuclear fusion ignites in the core. The equilibrium between gravitational collapse and thermal expansion allows stars to shine steadily for billions of years.

### Key Vocabulary & Scientific Concepts:

1. Supernova: A monumental stellar explosion that occurs during the last evolutionary stages of a massive star, releasing enormous amounts of luminosity and energy.
2. Singularity: A point in spacetime where gravitational forces cause matter to have an infinite density and zero volume, commonly found at the center of black holes.
3. Photosynthesis: The biological process by which plants and other organisms convert light energy into chemical energy to fuel their metabolic activities.
4. Equilibrium: A state in which opposing forces or influences are balanced, maintaining structural stability.
5. Nebula: An interstellar cloud of dust, hydrogen, helium, and other ionized gases.

## Navigating the Cosmos with Spectrometry

By analyzing the electromagnetic spectrum of distant celestial bodies, astrophysicists can determine their chemical composition, surface temperature, atmospheric pressure, velocity, and distance from Earth.

Select any word in this document (such as "Singularity", "Astrophysics", or "Supernova") to see its definition, pronunciation, and Google search options instantly without leaving this app!`;

  const uint8 = await convertTextToPDF(sampleContent, 'Astrophysics_Primer_Sample.pdf');
  return {
    buffer: uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer,
    fileName: 'Astrophysics_Primer_Sample.pdf',
  };
}
