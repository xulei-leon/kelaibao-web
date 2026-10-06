interface QrCodeCardProps {
  src: string;
  alt: string;
  title: string;
  description: string;
}

export function QrCodeCard({
  src,
  alt,
  title,
  description,
}: QrCodeCardProps) {
  return (
    <article className="qr-code-card">
      <div className="qr-code-card__image">
        {/* Native images preserve long-press and save behavior in WeChat. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={alt} height="750" loading="lazy" src={src} width="750" />
      </div>
      <div className="qr-code-card__copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}
