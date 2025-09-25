
import { ImageResponse } from 'next/og';
import { LogoIcon } from '@/components/icons';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'hsl(220 15% 15%)', // Un fond sombre pour la visibilité
        }}
      >
        <LogoIcon width={24} height={24} />
      </div>
    ),
    {
      ...size,
    }
  );
}
