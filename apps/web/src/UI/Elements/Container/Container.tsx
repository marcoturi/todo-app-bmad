import { Container as RadixContainer } from '@radix-ui/themes';
import { cn } from '@/shared/helpers/style.utils';

export function Container({
  className,
  ...props
}: React.ComponentProps<typeof RadixContainer>) {
  return (
    <RadixContainer
      className={cn(
        'w-full !max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10',
        className,
      )}
      {...props}
    />
  );
}
