import NextImage, { ImageProps } from 'next/image';
import clsx from 'clsx';

export function Image(props: ImageProps) {
  const { className, ...restProps } = props;
  return (
    <div className={clsx(className, 'relative')}>
      <NextImage {...restProps} />
    </div>
  );
}
