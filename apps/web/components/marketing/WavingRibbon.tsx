'use client';

import React, { useEffect, useRef } from 'react';

// Exact Framer undulating S-wave path extracted from the BrightPath reference
const WAVE_PATH_D =
  'M 32.0,150.0 L 39.7,153.9 L 47.4,157.7 L 55.0,161.5 L 62.7,165.3 L 70.4,169.0 L 78.1,172.6 L 85.8,176.1 L 93.4,179.6 L 101.1,182.9 L 108.8,186.1 L 116.5,189.1 L 124.2,192.0 L 131.8,194.8 L 139.5,197.3 L 147.2,199.7 L 154.9,201.8 L 162.6,203.8 L 170.2,205.6 L 177.9,207.1 L 185.6,208.4 L 193.3,209.5 L 201.0,210.3 L 208.6,210.9 L 216.3,211.3 L 224.0,211.4 L 231.7,211.3 L 239.4,210.9 L 247.0,210.3 L 254.7,209.5 L 262.4,208.4 L 270.1,207.1 L 277.8,205.6 L 285.4,203.8 L 293.1,201.8 L 300.8,199.7 L 308.5,197.3 L 316.2,194.8 L 323.8,192.0 L 331.5,189.1 L 339.2,186.1 L 346.9,182.9 L 354.6,179.6 L 362.2,176.1 L 369.9,172.6 L 377.6,169.0 L 385.3,165.3 L 393.0,161.5 L 400.6,157.7 L 408.3,153.9 L 416.0,150.0 L 423.7,146.1 L 431.4,142.3 L 439.0,138.5 L 446.7,134.7 L 454.4,131.0 L 462.1,127.4 L 469.8,123.9 L 477.4,120.4 L 485.1,117.1 L 492.8,113.9 L 500.5,110.9 L 508.2,108.0 L 515.8,105.2 L 523.5,102.7 L 531.2,100.3 L 538.9,98.2 L 546.6,96.2 L 554.2,94.4 L 561.9,92.9 L 569.6,91.6 L 577.3,90.5 L 585.0,89.7 L 592.6,89.1 L 600.3,88.7 L 608.0,88.6 L 615.7,88.7 L 623.4,89.1 L 631.0,89.7 L 638.7,90.5 L 646.4,91.6 L 654.1,92.9 L 661.8,94.4 L 669.4,96.2 L 677.1,98.2 L 684.8,100.3 L 692.5,102.7 L 700.2,105.2 L 707.8,108.0 L 715.5,110.9 L 723.2,113.9 L 730.9,117.1 L 738.6,120.4 L 746.2,123.9 L 753.9,127.4 L 761.6,131.0 L 769.3,134.7 L 777.0,138.5 L 784.6,142.3 L 792.3,146.1 L 800.0,150.0 L 807.7,153.9 L 815.4,157.7 L 823.0,161.5 L 830.7,165.3 L 838.4,169.0 L 846.1,172.6 L 853.8,176.1 L 861.4,179.6 L 869.1,182.9 L 876.8,186.1 L 884.5,189.1 L 892.2,192.0 L 899.8,194.8 L 907.5,197.3 L 915.2,199.7 L 922.9,201.8 L 930.6,203.8 L 938.2,205.6 L 945.9,207.1 L 953.6,208.4 L 961.3,209.5 L 969.0,210.3 L 976.6,210.9 L 984.3,211.3 L 992.0,211.4 L 999.7,211.3 L 1007.4,210.9 L 1015.0,210.3 L 1022.7,209.5 L 1030.4,208.4 L 1038.1,207.1 L 1045.8,205.6 L 1053.4,203.8 L 1061.1,201.8 L 1068.8,199.7 L 1076.5,197.3 L 1084.2,194.8 L 1091.8,192.0 L 1099.5,189.1 L 1107.2,186.1 L 1114.9,182.9 L 1122.6,179.6 L 1130.2,176.1 L 1137.9,172.6 L 1145.6,169.0 L 1153.3,165.3 L 1161.0,161.5 L 1168.6,157.7 L 1176.3,153.9 L 1184.0,150.0 L 1191.7,146.1 L 1199.4,142.3 L 1207.0,138.5 L 1214.7,134.7 L 1222.4,131.0 L 1230.1,127.4 L 1237.8,123.9 L 1245.4,120.4 L 1253.1,117.1 L 1260.8,113.9 L 1268.5,110.9 L 1276.2,108.0 L 1283.8,105.2 L 1291.5,102.7 L 1299.2,100.3 L 1306.9,98.2 L 1314.6,96.2 L 1322.2,94.4 L 1329.9,92.9 L 1337.6,91.6 L 1345.3,90.5 L 1353.0,89.7 L 1360.6,89.1 L 1368.3,88.7 L 1376.0,88.6 L 1383.7,88.7 L 1391.4,89.1 L 1399.0,89.7 L 1406.7,90.5 L 1414.4,91.6 L 1422.1,92.9 L 1429.8,94.4 L 1437.4,96.2 L 1445.1,98.2 L 1452.8,100.3 L 1460.5,102.7 L 1468.2,105.2 L 1475.8,108.0 L 1483.5,110.9 L 1491.2,113.9 L 1498.9,117.1 L 1506.6,120.4 L 1514.2,123.9 L 1521.9,127.4 L 1529.6,131.0 L 1537.3,134.7 L 1545.0,138.5 L 1552.6,142.3 L 1560.3,146.1 L 1568.0,150.0';

const REPEATED_PHRASE =
  'Source-Grounded Citations | Step-by-Step Derivations | Active Recall Flashcards | AI Lecture Synthesis | Exam-Ready Practice | Personalized Study Plans   ·   ';

// Repeated enough times to span beyond any visible screen width
const TICKER_TEXT = Array(8).fill(REPEATED_PHRASE).join('');

export function WavingRibbon() {
  const textPathRef = useRef<SVGTextPathElement>(null);
  const meterRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    let animId: number;
    let offset = 0;

    // Dynamically compute exact text phrase length for completely seamless looping
    let cycleLength = 1350;
    if (meterRef.current) {
      try {
        const measured = meterRef.current.getComputedTextLength();
        if (measured > 400) {
          cycleLength = measured;
        }
      } catch {
        // Fallback default
      }
    }

    const tick = () => {
      offset -= 0.65; // Smooth cinematic ticker speed
      if (offset <= -cycleLength) {
        offset += cycleLength;
      }
      if (textPathRef.current) {
        textPathRef.current.setAttribute('startOffset', `${offset}px`);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen min-w-[1600px] overflow-visible pointer-events-none z-0">
      <div className="w-full flex items-center justify-center -rotate-[4deg]">
        <svg
          width="100%"
          height="300"
          viewBox="0 0 1600 300"
          className="w-full max-w-[2100px] overflow-visible select-none"
          style={{ willChange: 'transform' }}
          aria-hidden="true"
        >
          <defs>
            <path id="heroWavePath" d={WAVE_PATH_D} />
          </defs>

          {/* Hidden meter to calculate exact phrase length in the browser font engine */}
          <text
            ref={meterRef}
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '1px',
              visibility: 'hidden',
              position: 'absolute',
            }}
            x="0"
            y="-9999"
            aria-hidden="true"
          >
            {REPEATED_PHRASE}
          </text>

          {/* Green Wave Ribbon Background Stroke (42px thick) */}
          <path
            d={WAVE_PATH_D}
            fill="none"
            stroke="#497E64"
            strokeWidth="42"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Scrolling Ticker Text on Curved Path */}
          <text
            dy="6.5"
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '1px',
            }}
            fill="#F4F0E5"
          >
            <textPath
              ref={textPathRef}
              href="#heroWavePath"
              startOffset="0"
              method="align"
              spacing="auto"
            >
              {TICKER_TEXT}
            </textPath>
          </text>
        </svg>
      </div>
    </div>
  );
}
