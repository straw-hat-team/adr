import { defineLoader } from 'vitepress';
import { loadRadar, type RadarData } from '../radar';

export declare const data: RadarData;

export default defineLoader({
  watch: ['../../src/radar/items/*.md'],
  async load(): Promise<RadarData> {
    return loadRadar();
  },
});
