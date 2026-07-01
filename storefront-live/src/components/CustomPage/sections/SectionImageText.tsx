'use client';
import React from 'react';
import { ImageTextData } from '../types';

export function SectionImageText({ data }: { data: ImageTextData }) {
  const reversed = data.image_side === 'left';
  return (
    <section className="cp-sec">
      <div className="cp-con">
        <div className="cp-imgtxt" style={{ flexDirection: reversed ? 'row-reverse' : 'row' }}>
          <div className="cp-imgtxt-img">
            <img src={data.image_url} alt={data.title || ''} />
          </div>
          <div className="cp-imgtxt-body">
            {data.title && <h2 className="cp-sec-title">{data.title}</h2>}
            <p className="cp-p">{data.text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
