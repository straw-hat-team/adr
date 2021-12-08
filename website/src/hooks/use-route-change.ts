import * as React from 'react';
import { useRouter } from 'next/router';

export function useRouteChange() {
  const router = useRouter();

  React.useEffect(() => {
    function onRouteChangeComplete(newRoute: string) {
      console.log(newRoute);
    }

    router.events.on('routeChangeComplete', onRouteChangeComplete);

    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, [router]);
}
