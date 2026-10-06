import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SERVICES } from "@/lib/site-content";

interface ServiceOverviewProps {
  detailed?: boolean;
}

export function ServiceOverview({ detailed = false }: ServiceOverviewProps) {
  return (
    <div className={`service-list ${detailed ? "service-list--detailed" : ""}`}>
      {SERVICES.map((service) => (
        <article className="service-item" id={service.id} key={service.id}>
          <div className="service-item__number" aria-hidden="true">
            {service.number}
          </div>
          <div className="service-item__body">
            <h3>{service.name}</h3>
            <p className="service-item__summary">{service.summary}</p>
            {detailed ? (
              <div className="service-detail-grid">
                <div>
                  <h4>客户目前卡在哪里</h4>
                  <p>{service.clientSituation}</p>
                </div>
                <div className="service-outcome">
                  <h4>完成后得到什么</h4>
                  <p>{service.outcome}</p>
                </div>
                <div>
                  <h4>如何共同完成</h4>
                  <ul className="check-list">
                    {service.scope.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>代表性交付</h4>
                  <ul className="inline-list">
                    {service.deliverables.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>客户需要准备</h4>
                  <ul className="check-list">
                    {service.clientInputs.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>交付可用于</h4>
                  <ul className="inline-list">
                    {service.useCases.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="service-limitations">
                  <h4>服务限制</h4>
                  <ul>
                    {service.limitations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <>
                <p className="service-item__best-for">
                  <strong>适合从这里开始：</strong>
                  {service.clientSituation}
                </p>
                <ul className="inline-list">
                  {service.deliverables.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
            {!detailed ? (
              <Link className="editorial-link" href={`/media#${service.id}`}>
                <span>了解服务范围</span>
                <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
