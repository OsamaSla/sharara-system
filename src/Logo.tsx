import defaultLogoSrc from './assets/logo.png';

export const Logo = ({ width = 180, height = 70, customLogo }: { width?: number, height?: number, customLogo?: string }) => (
  <img src={customLogo || defaultLogoSrc} alt="שרארה" className="cl-logo-img" width={width} height={height} />
);
