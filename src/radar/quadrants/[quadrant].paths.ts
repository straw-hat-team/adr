import { quadrants } from '../../../.vitepress/radar';

export default {
  paths() {
    return quadrants.map((quadrant) => ({
      params: {
        quadrant: quadrant.id,
        name: quadrant.name,
        description: quadrant.description,
      },
    }));
  },
};
