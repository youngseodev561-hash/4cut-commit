import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 키오스크 카메라는 HTTPS 또는 localhost에서만 동작한다.
  poweredByHeader: false,
  // 같은 폴더에서 dev 서버를 두 개 띄울 때 빌드 폴더를 나눠 쓰기 위함
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
