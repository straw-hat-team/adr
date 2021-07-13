import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/outline';

import { useMounted } from '@/hooks/use-mounted';

function useThemeToggler() {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

  function onToggleTheme() {
    return setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  return { mounted, resolvedTheme, onToggleTheme };
}

function ThemeIcon(props) {
  return (
    <div className="w-4 h-4 text-gray-800 dark:text-gray-200">
      {props.theme === 'dark' ? <SunIcon fill="currentColor" /> : <MoonIcon fill="currentColor" />}
    </div>
  );
}

export function ThemeToggler() {
  const controller = useThemeToggler();
  return (
    <button
      aria-label={`Toggle Theme Mode`}
      type="button"
      className="w-10 h-10 p-3 bg-gray-200 rounded dark:bg-gray-800"
      onClick={controller.onToggleTheme}
    >
      {controller.mounted && <ThemeIcon theme={controller.resolvedTheme} />}
    </button>
  );
}
