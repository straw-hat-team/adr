import './index.css';

import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import MyLayout from './MyLayout.vue';

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
} satisfies Theme;
