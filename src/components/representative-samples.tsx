import { ArrowUpRight, FileCheck2 } from "lucide-react";
import { REPRESENTATIVE_SAMPLES } from "@/lib/site-content";

export function RepresentativeSampleStack() {
  return (
    <div className="sample-stack" aria-labelledby="sample-stack-title">
      <div className="sample-stack__header">
        <div>
          <span>代表性交付</span>
          <p id="sample-stack-title">先看可使用的结构</p>
        </div>
        <span>非客户案例</span>
      </div>
      <div className="sample-stack__documents">
        {REPRESENTATIVE_SAMPLES.map((sample) => (
          <article className="sample-document" key={sample.id}>
            <span className="sample-document__number">{sample.number}</span>
            <div>
              <h2>{sample.title}</h2>
              <ul aria-label={`${sample.title}包含字段`}>
                {sample.previewItems.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <FileCheck2 aria-hidden="true" size={20} strokeWidth={1.6} />
          </article>
        ))}
      </div>
      <p className="sample-stack__note">
        示例结构，不代表真实客户案例或效果证明。
      </p>
    </div>
  );
}

export function RepresentativeSamples() {
  return (
    <div className="sample-gallery">
      {REPRESENTATIVE_SAMPLES.map((sample) => (
        <article className="sample-card" id={sample.id} key={sample.id}>
          <header>
            <span>示例 {sample.number}</span>
            <FileCheck2 aria-hidden="true" size={22} strokeWidth={1.6} />
          </header>
          <h3>{sample.title}</h3>
          <p>{sample.summary}</p>
          <div className="sample-card__preview">
            {sample.previewItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="sample-card__uses">
            <strong>可用于</strong>
            <ul>
              {sample.useCases.map((item) => (
                <li key={item}>
                  {item}
                  <ArrowUpRight aria-hidden="true" size={14} />
                </li>
              ))}
            </ul>
          </div>
          <small>{sample.disclaimer}</small>
        </article>
      ))}
    </div>
  );
}
