import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/solid';

import { useMounted } from '@/hooks/use-mounted';

enum Theme {
  Dark = 'dark',
  Light = 'light',
}

function useThemeToggler() {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

  function onToggleTheme() {
    return setTheme(resolvedTheme === 'dark' ? Theme.Light : Theme.Dark);
  }

  return {
    mounted,
    resolvedTheme: resolvedTheme as Theme,
    onToggleTheme,
  };
}

function ThemeIcon(props: { theme: Theme }) {
  return props.theme === Theme.Dark ? (
    <SunIcon className="w-4 h-4" role="img" aria-hidden="true" />
  ) : (
    <MoonIcon className="w-4 h-4" role="img" aria-hidden="true" />
  );
}

export function ThemeToggler() {
  const controller = useThemeToggler();
  return (
    <button
      aria-label={`Toggle Theme Mode`}
      type="button"
      className="w-10 h-10 p-3 bg-gray-200 rounded dark:bg-gray-900 text-gray-800 dark:text-gray-200"
      onClick={controller.onToggleTheme}
    >
      {controller.mounted && <ThemeIcon theme={controller.resolvedTheme} />}
    </button>
  );
}
