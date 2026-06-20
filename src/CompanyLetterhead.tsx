import { Logo } from './Logo';

export interface CompanyDetails {
  name: string;
  engName: string;
  subtitle: string;
  website: string;
  email: string;
  address: string;
  phone: string;
  fax: string;
  mobile: string;
  pobox: string;
  services: string[];
  serviceLines?: string[];
}

function renderServiceLine(line: string) {
  const parts = line.split('*').map((part, index, arr) => (
    <span key={index}>
      {part.trim()}
      {index < arr.length - 1 && <span className="cl-service-sep"> * </span>}
    </span>
  ));
  return parts;
}

function getServiceLines(details: CompanyDetails): string[] {
  if (details.serviceLines?.length) {
    return details.serviceLines.filter(Boolean);
  }
  if (details.services.length >= 6) {
    return [
      details.services.slice(0, 3).join(' * '),
      details.services.slice(3, 6).join(' * '),
      details.services.slice(6).join(' * '),
    ].filter(Boolean);
  }
  return [details.services.join(' | ')];
}

interface CompanyLetterheadProps {
  details: CompanyDetails;
  subtitleOverride?: string;
  className?: string;
}

export default function CompanyLetterhead({
  details,
  subtitleOverride,
  className = '',
}: CompanyLetterheadProps) {
  const serviceLines = getServiceLines(details);
  const subtitle = subtitleOverride ?? details.subtitle;

  return (
    <div className={`company-letterhead ${className}`.trim()} dir="rtl" lang="he">
      <div className="cl-top">
        <div className="cl-brand-row">
          <Logo width={140} height={56} />
        </div>
        <h1 className="cl-name">{details.name}</h1>
        <p className="cl-subtitle">{subtitle}</p>
      </div>

      <div className="cl-links">
        <span dir="ltr">{details.website}</span>
        <span>
          E-mail:{' '}
          <a href={`mailto:${details.email}`} dir="ltr">
            {details.email}
          </a>
        </span>
      </div>

      <div className="cl-bottom">
        <div className="cl-services">
          {serviceLines.map((line, index) => (
            <div key={index} className="cl-service-line">
              {renderServiceLine(line)}
            </div>
          ))}
        </div>
        <div className="cl-contact">
          <div><b>משרד ראשי ומפעל:</b> {details.address}</div>
          <div>
            <b>טל:</b> <span dir="ltr">{details.phone}</span>
            {' | '}
            <b>פקס:</b> <span dir="ltr">{details.fax}</span>
            {' | '}
            <b>נייד:</b> <span dir="ltr">{details.mobile}</span>
          </div>
          <div><b>דואר למשלוחים:</b> {details.pobox}</div>
        </div>
      </div>
    </div>
  );
}