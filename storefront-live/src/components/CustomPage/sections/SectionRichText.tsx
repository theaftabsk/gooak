'use client';
import React from 'react';
import { RichTextData } from '../types';

export function SectionRichText({ data }: { data: RichTextData }) {
  return (
    <section className="cp-sec">
      <div className="cp-con" style={{ maxWidth: 780 }}>
        {data.title && <h2 className="cp-sec-title">{data.title}</h2>}
        <div className="cp-rte" dangerouslySetInnerHTML={{ __html: data.html }} />
      </div>
    </section>
  );
}
