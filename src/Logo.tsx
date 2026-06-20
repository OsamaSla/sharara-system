import logoSrc from './assets/logo.png';

export const Logo = ({ width = 180, height = 70 }: { width?: number, height?: number }) => (
  <img src={logoSrc} alt="שרארה" className="cl-logo-img" width={width} height={height} />
);
