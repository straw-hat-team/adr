import { createUrlFor } from '@straw-hat/next-sdk/dist/link';
import { PATH_ADRS_SLUG } from '@/constants/routes';
import { RouteQuery } from '@/routes/adrs/routes/[slug]';

export const routeAdrsAdr = createUrlFor<RouteQuery>(PATH_ADRS_SLUG);
