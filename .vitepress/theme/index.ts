import './index.css';

import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import MyLayout from './MyLayout.vue';
import RadarBoard from './RadarBoard.vue';

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp({ app }) {
    app.component('RadarBoard', RadarBoard);
  },
} satisfies Theme;
