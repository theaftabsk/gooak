'use client';
import React from 'react';
import { CardsData } from '../types';
import { SectionHead, hf } from '../shared';

export function SectionCards({ data }: { data: CardsData }) {
  return (
    <section className="cp-sec cp-sec-alt">
      <div className="cp-con">
        {data.title && <SectionHead title={data.title} center />}
        <div className="cp-cards">
          {data.items.map((item, i) => (
            <div key={i} className="cp-card">
              {item.icon && <div className="cp-card-icon">{item.icon}</div>}
              <h3 className="cp-card-title" style={{ fontFamily: hf(item.title_font) }}>{item.title}</h3>
              <p className="cp-card-text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
