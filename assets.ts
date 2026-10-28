import type { Mood } from './dialogue';
/**
 * HOW TO REPLACE THE PLACEHOLDER ART WITH YOUR OWN ILLUSTRATIONS
 * 1. Put PNG files (transparent background, about 600x600) in assets/characters/, e.g. asta-idle.png.
 * 2. Add a line below for each mood, e.g.:
 *      idle: require('../../assets/characters/asta-idle.png'),
 * 3. Moods with no entry keep using the built-in placeholder drawing.
 * Only add a line AFTER the file really exists, or the build will fail.
 */
export const ASTA_IMAGES: Partial<Record<Mood, number>> = {
};
