import React from 'react';

export const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    fill="none"
    {...props}
  >
    <path
      d="M0 75L100 75L100 80L0 80L0 75Z"
      fill="url(#paint0_linear_1_2)"
    />
    <path
      d="M50 0C22.3858 0 0 22.3858 0 50C0 61.127 4.01844 71.2152 10.6382 78.8589C10.2081 76.582 10 74.2413 10 71.8182C10 48.7214 27.9086 31.8182 50 31.8182C72.0914 31.8182 90 48.7214 90 71.8182C90 74.2413 89.7919 76.582 89.3618 78.8589C95.9816 71.2152 100 61.127 100 50C100 22.3858 77.6142 0 50 0Z"
      fill="hsl(var(--secondary))"
    />
    <defs>
      <linearGradient
        id="paint0_linear_1_2"
        x1="50"
        y1="75"
        x2="50"
        y2="80"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#74A3C9" />
        <stop offset="1" stopColor="#5875AD" />
      </linearGradient>
    </defs>
  </svg>
);
