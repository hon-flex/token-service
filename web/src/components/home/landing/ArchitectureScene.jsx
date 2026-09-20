/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Code2,
  FileCode2,
  LayoutGrid,
  Network,
  Play,
  Server,
  ShieldCheck,
} from 'lucide-react';
import './architecture-scene.css';

const LEVELS = [
  { y: 146, width: 416, Icon: LayoutGrid, Scene: ApplicationScene },
  { y: 288, width: 500, Icon: Network, Scene: RoutingScene },
  { y: 430, width: 568, Icon: FileCode2, Scene: ProtocolScene },
  { y: 572, width: 626, Icon: ShieldCheck, Scene: SecurityScene },
  { y: 714, width: 686, Icon: Server, Scene: ComputeScene },
];

// The scene reveals once when the illustration itself enters the viewport.
// HomeMotionRegion still owns background-tab and reduced-motion pausing.
function useSceneEntrance() {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);
  const [active, setActive] = useState(false);
  const [established, setEstablished] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => {
      if (preference.matches) {
        setEntered(true);
        setEstablished(true);
      }
    };
    syncPreference();
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.08;
        setActive(visible);
        if (visible) setEntered(true);
      },
      { threshold: [0, 0.08] },
    );
    observer.observe(ref.current);
    preference.addEventListener('change', syncPreference);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', syncPreference);
    };
  }, []);
  const onAnimationEnd = (event) => {
    if (
      event.animationName === 'hc-ecosystem-connect' &&
      event.target.dataset.finalSupport === 'true'
    )
      setEstablished(true);
  };
  return { ref, entered, active, established, onAnimationEnd };
}

function EdgeFlow({ d, className = '', style }) {
  return (
    <path
      className={`hc-ecosystem-sweep ${className}`}
      d={d}
      pathLength='100'
      fill='none'
      stroke='#c3f6ff'
      strokeWidth='2'
      strokeLinecap='round'
      style={style}
    />
  );
}

function SceneDefinitions({ id }) {
  const gradients = {
    top: ['#c9e8ffa6', '#dbf6ffad', '#9cd3ff8f', '#e9fbffe6'],
    'core-top': ['#a1d5ffe8', '#70b8ffe0', '#88e1f9dc', '#d5f8ffe6'],
    front: ['#e5f7ffdc', '#c3e6ffa1', '#eafaffc7', '#9fcdf5b8'],
    side: ['#cbeaffb8', '#96cef9bf', '#70b3efc9'],
    column: ['#51ccf31a', '#8fe4ff99', '#f7ffffef', '#63c6ff66', '#e3fcff14'],
    blue: ['#b1f0ff', '#4db7ff', '#277bff', '#265fdc'],
    cylinder: ['#75ddff', '#3197ff', '#1d68eb', '#5fc9ff'],
    ink: ['#92c8ed', '#4f85b8', '#2a537e'],
    metal: ['#add6f0', '#73a6c8', '#3e6286'],
    window: ['#ffffffff', '#e2f3ffef', '#b8ddfbcf'],
    ribbon: ['#bcefff', '#63bffa', '#2d80e6', '#a3e7ff'],
    sheen: ['#ffffff00', '#ffffffb3', '#ffffff00', '#ffffff00'],
  };
  return (
    <defs>
      {Object.entries(gradients).map(([name, colors]) => (
        <linearGradient
          key={name}
          id={`${id}-${name}`}
          x1='0'
          y1='0'
          x2={['column', 'cylinder', 'ribbon'].includes(name) ? '1' : '.85'}
          y2={['column', 'cylinder', 'ribbon'].includes(name) ? '0' : '1'}
        >
          {colors.map((color, i) => (
            <stop
              key={i}
              offset={i / (colors.length - 1)}
              stopColor={`var(--hc-glass-${name}-${i}, ${color})`}
            />
          ))}
        </linearGradient>
      ))}
      <radialGradient id={`${id}-halo`}>
        <stop stopColor='#61c3ff' stopOpacity='.4' />
        <stop offset='.5' stopColor='#a0e8ff' stopOpacity='.2' />
        <stop offset='1' stopColor='#b1ddff' stopOpacity='0' />
      </radialGradient>
      <radialGradient id={`${id}-caustic`}>
        <stop stopColor='#f3ffff' stopOpacity='.95' />
        <stop offset='.22' stopColor='#cef9ff' stopOpacity='.7' />
        <stop offset='.58' stopColor='#73d9f5' stopOpacity='.25' />
        <stop offset='1' stopColor='#73c5ff' stopOpacity='0' />
      </radialGradient>
      <radialGradient id={`${id}-white`} cx='.3' cy='.2' r='.85'>
        <stop stopColor='#fff' />
        <stop offset='.46' stopColor='#e1f5ff' />
        <stop offset='.78' stopColor='#a5d6fd' />
        <stop offset='1' stopColor='#69b0ec' />
      </radialGradient>
      <radialGradient id={`${id}-hub`} cx='.3' cy='.15' r='.95'>
        <stop stopColor='#d5fbff' />
        <stop offset='.45' stopColor='#70cfff' />
        <stop offset='1' stopColor='#318df5' />
      </radialGradient>
      <linearGradient id={`${id}-reflection-fade`} x2='0' y2='1'>
        <stop stopColor='white' stopOpacity='0' />
        <stop offset='.75' stopColor='white' stopOpacity='.2' />
        <stop offset='1' stopColor='white' />
      </linearGradient>
      <mask id={`${id}-reflection-mask`} maskContentUnits='objectBoundingBox'>
        <rect width='1' height='1' fill={`url(#${id}-reflection-fade)`} />
      </mask>
      <filter id={`${id}-shadow`} x='-20%' y='-70%' width='140%' height='260%'>
        <feDropShadow
          dx='0'
          dy='9'
          stdDeviation='8'
          floodColor='#3d83c7'
          floodOpacity='.16'
        />
      </filter>
      <filter id={`${id}-glow`} x='-70%' y='-150%' width='240%' height='400%'>
        <feGaussianBlur stdDeviation='3.2' />
      </filter>
      <filter
        id={`${id}-reflection`}
        x='-10%'
        y='-10%'
        width='120%'
        height='130%'
      >
        <feGaussianBlur stdDeviation='.7' />
      </filter>
      <filter id={`${id}-light`} x='-60%' y='-150%' width='220%' height='400%'>
        <feGaussianBlur stdDeviation='2' />
        <feMerge>
          <feMergeNode />
          <feMergeNode in='SourceGraphic' />
        </feMerge>
      </filter>
    </defs>
  );
}

// Reuse each object's geometry for a softly faded, compressed surface reflection.
function SurfaceObject({
  id,
  name,
  x,
  y,
  baseline,
  children,
  reflection = 0.36,
  className,
}) {
  const objectId = `${id}-${name}`;
  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ '--object-phase': `${-((x * 0.013 + y * 0.007) % 5)}s` }}
    >
      <g
        opacity={reflection}
        transform={`translate(0 ${baseline * 1.34}) scale(1 -.34)`}
        filter={`url(#${id}-reflection)`}
      >
        <use href={`#${objectId}`} mask={`url(#${id}-reflection-mask)`} />
      </g>
      <g id={objectId} className={className}>
        {children}
      </g>
    </g>
  );
}

function GlassPlatform({ id, y, width, featured, foundation }) {
  const l = (720 - width) / 2;
  const r = 720 - l;
  const d = foundation ? 59 : 50;
  const outline = `M${l + 74} ${y - 89} Q${l + 78} ${y - 92} ${l + 86} ${y - 92} H${r - 86} Q${r - 78} ${y - 92} ${r - 74} ${y - 89} L${r - 3} ${y - 42} Q${r + 1} ${y - 39} ${r - 3} ${y - 35} L${r - 34} ${y - 4} Q${r - 38} ${y} ${r - 44} ${y} H${l + 44} Q${l + 38} ${y} ${l + 34} ${y - 4} L${l + 3} ${y - 35} Q${l - 1} ${y - 39} ${l + 3} ${y - 42} Z`;
  return (
    <g>
      <ellipse
        className='hc-ecosystem-platform-aura'
        cx='360'
        cy={y + d + 8}
        rx={width * 0.46}
        ry='23'
        fill={`url(#${id}-halo)`}
        opacity={featured ? '.8' : '.48'}
        style={{
          '--aura-low': featured ? 0.45 : 0.26,
          '--aura-high': featured ? 0.9 : 0.55,
        }}
      />
      <g filter={`url(#${id}-shadow)`}>
        <path
          d={`M${l} ${y - 39} L${l + 38} ${y - 1} H${r - 38} L${r} ${y - 39} V${y + d - 42} Q${r} ${y + d - 38} ${r - 4} ${y + d - 34} L${r - 34} ${y + d - 4} Q${r - 38} ${y + d} ${r - 44} ${y + d} H${l + 44} Q${l + 38} ${y + d} ${l + 34} ${y + d - 4} L${l + 4} ${y + d - 34} Q${l} ${y + d - 38} ${l} ${y + d - 42} Z`}
          fill={`url(#${id}-side)`}
          stroke='#8fc4f6'
          strokeWidth='.9'
        />
        <rect
          x={l + 35}
          y={y - 1}
          width={width - 70}
          height={d + 1}
          rx='6'
          fill={`url(#${id}-front)`}
          stroke='var(--hc-glass-edge, #eefaff)'
          strokeWidth='1.4'
        />
        <rect
          x={l + 38}
          y={y + 2}
          width={width - 76}
          height={d - 5}
          rx='4'
          fill={`url(#${id}-sheen)`}
          opacity='.5'
        />
        <path
          d={`M${l + 40} ${y + 5} V${y + d - 7} M${r - 39} ${y + 6} V${y + d - 7}`}
          stroke='var(--hc-glass-edge, #fff)'
          strokeOpacity='.6'
        />
        <path
          d={outline}
          fill={`url(#${id}-${featured ? 'core-top' : 'top'})`}
          stroke={featured ? '#65a7ff' : '#96c5f4'}
          strokeWidth='1.2'
        />
        <path
          d={outline}
          fill='none'
          stroke='var(--hc-glass-edge, #fff)'
          strokeWidth='1.15'
          transform='translate(0 -2)'
          strokeOpacity='.88'
        />
        <path
          d={`M${l + 79} ${y - 85} H${r - 79} L${r - 10} ${y - 39} L${r - 42} ${y - 8} H${l + 42} L${l + 10} ${y - 39} Z`}
          fill='none'
          stroke='var(--hc-glass-edge, #f2fcff)'
          strokeOpacity='.8'
          strokeWidth='1.2'
        />
        <path
          d={`M${l + 2} ${y - 38} L${l + 36} ${y - 3} Q${l + 39} ${y} ${l + 44} ${y} H${r - 44} Q${r - 39} ${y} ${r - 36} ${y - 3} L${r - 2} ${y - 38}`}
          stroke='var(--hc-glass-edge, #fff)'
          strokeWidth='2.2'
        />
        <path
          d={`M${l + 42} ${y + d - 2} H${r - 43}`}
          stroke='#a5d8ff'
          strokeWidth='1.2'
        />
        <path
          d={`M${l + 3} ${y - 33} V${y + d - 40} M${r - 3} ${y - 32} V${y + d - 40}`}
          stroke='#e1f5ff'
          strokeOpacity='.7'
        />
      </g>
      <ellipse
        cx='360'
        cy={y - 31}
        rx={width * 0.37}
        ry='23'
        fill={`url(#${id}-caustic)`}
        opacity={featured ? '.75' : '.35'}
      />
      <path
        d={`M${l + 63} ${y - 14} H${r - 65}`}
        stroke='#f5ffff'
        strokeWidth='2'
        opacity='.33'
      />
      <path
        className='hc-ecosystem-tier-charge'
        d={`M${l + 35} ${y - 3} H${r - 35}`}
        stroke='#83ddff'
        strokeWidth='2.6'
      />
      <EdgeFlow
        d={`M${l + 40} ${y + 2} H${r - 40}`}
        className='hc-ecosystem-platform-sweep'
      />
    </g>
  );
}

function SupportColumn({ id, x, top, bottom, rear = false, delay = 0 }) {
  const radius = rear ? 5.5 : 7;
  return (
    <g
      opacity={rear ? '.62' : '1'}
      style={{ '--column-offset': `${Math.abs(delay) * 0.16}s` }}
    >
      <ellipse
        cx={x}
        cy={bottom + 3}
        rx='21'
        ry='9'
        fill={`url(#${id}-caustic)`}
      />
      <ellipse
        cx={x}
        cy={bottom + 1}
        rx={radius + 5}
        ry='4.2'
        fill='#73bafb'
        fillOpacity='.55'
        stroke='#d3f7ff'
        strokeWidth='1.5'
      />
      <path
        d={`M${x - radius - 3} ${bottom - 3} V${bottom + 1} Q${x} ${bottom + 8} ${x + radius + 3} ${bottom + 1} V${bottom - 3}`}
        fill={`url(#${id}-cylinder)`}
        opacity='.75'
      />
      <rect
        x={x - radius}
        y={top}
        width={radius * 2}
        height={bottom - top}
        rx='3'
        fill={`url(#${id}-column)`}
      />
      <path
        d={`M${x - radius} ${top + 2} V${bottom - 2} M${x + radius} ${top + 2} V${bottom - 2}`}
        stroke='#70cef5'
        strokeWidth='.9'
      />
      <path
        d={`M${x - 2} ${top + 4} V${bottom - 3}`}
        stroke='#f2ffff'
        strokeWidth='1.6'
        opacity='.85'
      />
      <path
        className='hc-ecosystem-current'
        pathLength='100'
        d={`M${x + 2} ${bottom - 3} V${top + 3}`}
        stroke='#fff'
        strokeWidth='3'
        strokeLinecap='round'
      />
      <ellipse
        className='hc-ecosystem-contact'
        cx={x}
        cy={bottom - 3}
        rx={radius + 3}
        ry='3.6'
        fill='none'
        stroke='#e5ffff'
        strokeWidth='1.8'
      />
      <ellipse
        cx={x}
        cy={top + 2}
        rx={radius}
        ry='2.8'
        fill='#d9f7ff'
        fillOpacity='.4'
        stroke='#dff9ff'
      />
      <path
        d={`M${x - 12} ${bottom - 3} h24 M${x} ${bottom - 10} v14`}
        stroke='#edffff'
        strokeWidth='.8'
        opacity='.7'
      />
    </g>
  );
}

function TierSupports({ id, y, index }) {
  const positions = [218, 185, 158, 146];
  if (!index)
    return (
      <g>
        <SupportColumn id={id} x={237} top={32} bottom={y - 34} rear />
        <SupportColumn id={id} x={455} top={18} bottom={y - 58} rear />
        <SupportColumn id={id} x={361} top={-10} bottom={y - 51} delay={-3} />
      </g>
    );
  const x = positions[index - 1];
  // Segments meet the underside above and their own top surface below.
  return (
    <g>
      {[x + 28, 720 - x - 28].map((cx, i) => (
        <SupportColumn
          key={`rear-${cx}`}
          id={id}
          x={cx}
          top={y - 128}
          bottom={y - 73}
          rear
          delay={i * -4}
        />
      ))}
      {[x, 720 - x].map((cx, i) => (
        <SupportColumn
          key={cx}
          id={id}
          x={cx}
          top={y - 106}
          bottom={y - 31}
          delay={i * -3.7 - index}
        />
      ))}
    </g>
  );
}

function WindowPane({
  id,
  name,
  x,
  y,
  width,
  height,
  dark = false,
  blue = false,
  children,
}) {
  return (
    <SurfaceObject id={id} name={name} x={x} y={y} baseline={height + 2}>
      <ellipse
        cx={width / 2 + 4}
        cy={height + 3}
        rx={width * 0.57}
        ry='5'
        fill='#579ddd'
        opacity='.2'
      />
      <path
        d={`M4 -5 H${width + 1} Q${width + 7} -5 ${width + 7} 2 V${height - 2} Q${width + 7} ${height + 4} ${width} ${height + 5} H4 Z`}
        fill={`url(#${id}-side)`}
        stroke='#b5dfff'
      />
      <rect
        width={width}
        height={height}
        rx='5'
        fill={`url(#${id}-${dark ? 'ink' : blue ? 'blue' : 'window'})`}
        stroke='#f4fcff'
        strokeWidth='1.8'
      />
      {!blue && (
        <path
          d={`M5 1 H${width - 5} Q${width - 1} 1 ${width - 1} 5 V11 H1 V5 Q1 1 5 1`}
          fill={dark ? '#285fa5' : '#4e9dfc'}
        />
      )}
      {[7, 13, 19].map((cx) => (
        <circle key={cx} cx={cx} cy='6.5' r='1.2' fill='#eef9ff' />
      ))}
      {children}
      <path
        d={`M4 ${height - 3} H${width - 5} M${width + 3} 2 V${height - 3}`}
        stroke='#e8f8ff'
        opacity='.85'
      />
      <path
        d={`M4 14 H${width - 4} L4 ${height - 12}Z`}
        fill={`url(#${id}-sheen)`}
        opacity={dark ? '.1' : '.3'}
      />
      {blue && <circle cx={width - 5} cy={height - 5} r='1.1' fill='#c7f4ff' />}
      <EdgeFlow
        d={`M5 1 H${width - 5} Q${width - 1} 1 ${width - 1} 5 V${height - 5}`}
      />
    </SurfaceObject>
  );
}

function ApplicationScene({ id, y }) {
  return (
    <g>
      <WindowPane
        id={id}
        name='app-chat'
        x={218}
        y={y - 99}
        width={73}
        height={68}
      >
        <rect
          x='18'
          y='27'
          width='37'
          height='22'
          rx='6'
          fill='#94cbfa'
          stroke='#fff'
        />
        <path
          d='M24 49 v6 l8 -6'
          fill='#94cbfa'
          stroke='#f4fcff'
          strokeLinejoin='round'
        />
        <path
          className='hc-ecosystem-online'
          d='M25 34 H47 M25 40 H42'
          stroke='#f6fdff'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <path d='M18 19 H39' stroke='#c2e0f8' strokeWidth='2' />
      </WindowPane>
      <WindowPane
        id={id}
        name='app-dashboard'
        x={306}
        y={y - 115}
        width={91}
        height={81}
      >
        {[21, 39, 57].map((row, i) => (
          <g key={row}>
            <rect
              x='8'
              y={row}
              width='17'
              height='13'
              rx='3'
              fill={`url(#${id}-blue)`}
              opacity={0.52 - i * 0.1}
              stroke='#b6e8ff'
            />
            <rect
              x='32'
              y={row + 1}
              width={43 - i * 5}
              height='3.5'
              rx='1.7'
              fill='#8cbee9'
            />
            <rect
              x='32'
              y={row + 7}
              width={34 - i * 4}
              height='2.7'
              rx='1.3'
              fill='#bcdbf3'
            />
          </g>
        ))}
        <path d='M7 75 H80' stroke='#eefbff' />
      </WindowPane>
      <WindowPane
        id={id}
        name='app-code'
        x={409}
        y={y - 102}
        width={72}
        height={71}
        dark
      >
        {[20, 27, 34, 41, 48, 55, 62].map((row, i) => (
          <path
            key={row}
            d={`M7 ${row} h3 M15 ${row} h${8 + (i % 3) * 5}`}
            stroke={i % 2 ? '#6599db' : '#8cc6f6'}
            strokeWidth='1'
          />
        ))}
        <Code2
          x='31'
          y='28'
          width='30'
          height='29'
          color='#d0f3ff'
          strokeWidth='1.5'
        />
        <path d='M26 17 V65' stroke='#84bafa' opacity='.18' />
      </WindowPane>
      <SurfaceObject id={id} name='agent' x={516} y={y - 59} baseline={27}>
        <ellipse cy='28' rx='23' ry='5' fill='#65a5e1' opacity='.21' />
        <path
          d='M-10 14 Q-17 30 0 31 Q17 30 10 14'
          fill={`url(#${id}-white)`}
          stroke='#f2fcff'
        />
        <ellipse
          cx='-22'
          cy='1'
          rx='5'
          ry='9'
          fill='#b9e1ff'
          stroke='#effcff'
        />
        <ellipse
          cx='22'
          cy='1'
          rx='5'
          ry='9'
          fill={`url(#${id}-blue)`}
          stroke='#ccefff'
        />
        <path d='M1 -21 L5 -34' stroke='#84baff' strokeWidth='2.5' />
        <circle
          cx='5'
          cy='-36'
          r='4'
          fill={`url(#${id}-white)`}
          stroke='#69aaff'
        />
        <ellipse
          rx='23'
          ry='22'
          fill={`url(#${id}-white)`}
          stroke='#f7fdff'
          strokeWidth='1.5'
        />
        <rect
          x='-17'
          y='-10'
          width='34'
          height='21'
          rx='10'
          fill='#194789'
          stroke='#8dd8ff'
          strokeWidth='1.4'
        />
        <path d='M-11 -6 Q0 -11 11 -6' stroke='#6ba5e4' opacity='.7' />
        {[-7, 7].map((x) => (
          <ellipse
            key={x}
            className='hc-ecosystem-online'
            cx={x}
            cy='0'
            rx='2.5'
            ry='3.7'
            fill='#bafaff'
            filter={`url(#${id}-light)`}
          />
        ))}
        <path
          d='M-3 25 H3'
          stroke='#4a96e7'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <ellipse cx='-8' cy='-16' rx='7' ry='2' fill='#fff' opacity='.85' />
      </SurfaceObject>
    </g>
  );
}

function PacketNode({ id, name, x, y, size = 24 }) {
  const h = size * 0.63;
  const w = size * 1.12;
  return (
    <SurfaceObject
      id={id}
      name={name}
      x={x}
      y={y}
      baseline={h + 3}
      reflection={0.22}
      className={name.startsWith('infra-') ? 'hc-ecosystem-packet' : undefined}
    >
      <ellipse
        cx={w / 2}
        cy={h + 4}
        rx={size * 0.8}
        ry='4'
        fill='#2776c7'
        opacity='.2'
      />
      <path
        d={`M0 0 L${size * 0.5} -7 L${w} -3 L${size * 0.61} 4Z`}
        fill='#c8f5ff'
        stroke='#e0f8ff'
        strokeWidth='1.1'
      />
      <path
        d={`M0 0 L${size * 0.61} 4 V${h + 4} L0 ${h}Z`}
        fill={`url(#${id}-blue)`}
        stroke='#a7e1ff'
      />
      <path
        d={`M${size * 0.61} 4 L${w} -3 V${h - 3} L${size * 0.61} ${h + 4}Z`}
        fill='#3e9de9'
        stroke='#8ed9ff'
      />
      <path
        d={`M2 1 L${size * 0.59} 4 M${size * 0.63} 5 V${h + 2}`}
        stroke='#f2ffff'
        strokeOpacity='.75'
      />
      <circle
        className='hc-ecosystem-indicator'
        cx={size * 0.22}
        cy={h * 0.48}
        r='2'
        fill='#e7ffff'
      />
      <circle cx={size * 0.84} cy={h * 0.5} r='1' fill='#97eaff' />
    </SurfaceObject>
  );
}

function RoutingScene({ id, y }) {
  const endpoints = [
    [245, y - 71],
    [211, y - 30],
    [488, y - 72],
    [503, y - 25],
  ];
  const routes = endpoints
    .map(([x, endY]) => `M361 ${y - 42} L${x} ${endY}`)
    .join(' ');
  return (
    <g>
      <ellipse
        className='hc-ecosystem-core-glow'
        cx='361'
        cy={y - 36}
        rx='170'
        ry='42'
        fill={`url(#${id}-caustic)`}
      />
      <path
        d={routes}
        stroke='#57c7ff'
        strokeWidth='6'
        opacity='.55'
        filter={`url(#${id}-glow)`}
      />
      <path d={routes} stroke='#dbffff' strokeWidth='1.8' />
      {endpoints.map(([x, endY], index) => (
        <path
          key={x}
          className='hc-ecosystem-model-route'
          d={`M361 ${y - 42} L${x} ${endY}`}
          pathLength='100'
          stroke='#fff'
          strokeWidth='3.2'
          strokeLinecap='round'
          style={{ '--route-phase': `${index * -0.85}s` }}
        />
      ))}
      <PacketNode id={id} name='model-back-left' x={233} y={y - 76} size={25} />
      <PacketNode
        id={id}
        name='model-back-right'
        x={476}
        y={y - 78}
        size={25}
      />
      <ellipse
        className='hc-ecosystem-core-ring'
        cx='361'
        cy={y - 28}
        rx='69'
        ry='20'
        fill='none'
        stroke='#b6ffff'
        strokeWidth='2'
        filter={`url(#${id}-light)`}
      />
      <SurfaceObject
        id={id}
        name='model-hub'
        x={361}
        y={y - 53}
        baseline={35}
        reflection={0.32}
      >
        <g transform='scale(1 .78)'>
          <ellipse cy='44' rx='64' ry='17' fill='#3d94ec' opacity='.28' />
          <path
            d='M-55 0 V30 C-55 53 55 53 55 30 V0Z'
            fill={`url(#${id}-cylinder)`}
            stroke='#c4f5ff'
            strokeWidth='1.8'
          />
          <path
            d='M-51 4 V29 Q-50 37 -42 38 V12Z'
            fill='#a8efff'
            opacity='.2'
          />
          <path d='M45 7 V34' stroke='#49c4ff' strokeWidth='3' opacity='.6' />
          <ellipse
            rx='55'
            ry='18'
            fill={`url(#${id}-hub)`}
            stroke='#e5fcff'
            strokeWidth='1.6'
          />
          <ellipse
            className='hc-ecosystem-core-orbit'
            pathLength='100'
            cy='-1'
            rx='42'
            ry='12.5'
            fill='none'
            stroke='#d0f2ff'
            strokeWidth='.8'
            strokeOpacity='.65'
          />
          <path
            d='M-27 0 l12 -6 l18 2 l13 -5 l12 7 l-9 6 l-20 -2 l-12 5Z'
            fill='none'
            stroke='#d6f9ff'
            strokeWidth='1.3'
          />
          {[-26, -12, 3, 18, 28].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? -5 : 1} r='1.6' fill='#e3ffff' />
          ))}
          {[-35, -20, 0, 20, 35].map((x) => (
            <circle
              key={x}
              className='hc-ecosystem-core-status'
              cx={x}
              cy={29 - Math.abs(x) * 0.1}
              r={x ? 2.5 : 5.3}
              fill={x ? '#b0f6ff' : 'none'}
              stroke='#e4ffff'
              strokeWidth={x ? '.8' : '2'}
            />
          ))}
          <path
            className='hc-ecosystem-core-rim'
            d='M-52 31 Q0 55 52 31 M-50 36 Q0 59 50 36'
            fill='none'
            stroke='#b9ffff'
            strokeWidth='1.6'
            filter={`url(#${id}-light)`}
          />
        </g>
      </SurfaceObject>
      <SupportColumn id={id} x={361} top={y - 112} bottom={y - 53} delay={-2} />
      <PacketNode
        id={id}
        name='model-front-left'
        x={196}
        y={y - 43}
        size={28}
      />
      <PacketNode
        id={id}
        name='model-front-right'
        x={489}
        y={y - 37}
        size={28}
      />
    </g>
  );
}

function ProtocolScene({ id, y }) {
  return (
    <g>
      <SupportColumn id={id} x={361} top={y - 115} bottom={y - 39} delay={-4} />
      <path
        d={`M247 ${y - 28} Q330 ${y - 12} 414 ${y - 37} L514 ${y - 29}`}
        stroke='#9edfff'
        strokeWidth='1.3'
        opacity='.75'
      />
      <WindowPane
        id={id}
        name='infra-api'
        x={207}
        y={y - 78}
        width={64}
        height={50}
        blue
      >
        <Code2
          x='14'
          y='15'
          width='36'
          height='29'
          color='#f0fdff'
          strokeWidth='1.9'
        />
      </WindowPane>
      <SurfaceObject
        id={id}
        name='infra-stream'
        x={306}
        y={y - 46}
        baseline={16}
        reflection={0.3}
      >
        <g transform='scale(1 .76)'>
          <ellipse
            cx='53'
            cy='13'
            rx='62'
            ry='9'
            fill={`url(#${id}-caustic)`}
          />
          <path
            d='M-7 -10 C9 -35 22 -36 40 -6 S70 29 90 -6 S112 -29 126 -13 L125 -6 C108 -20 104 -13 88 10 S58 31 39 4 S13 -23 -5 -1Z'
            fill={`url(#${id}-ribbon)`}
            stroke='#c2f0ff'
            strokeWidth='.65'
          />
          <path
            d='M-7 -10 C9 -35 22 -36 40 -6 S70 29 90 -6 S112 -29 126 -13'
            stroke='#e7ffff'
            strokeWidth='1.2'
          />
          <EdgeFlow
            className='hc-ecosystem-wave-flow'
            d='M-7 -10 C9 -35 22 -36 40 -6 S70 29 90 -6 S112 -29 126 -13'
          />
          <path
            d='M-5 7 C10 31 22 13 42 -11 S74 -32 91 -6 S112 17 125 -5 L125 1 C111 30 101 24 83 1 S60 -18 43 2 S11 41 -5 15Z'
            fill={`url(#${id}-window)`}
            stroke='#eaffff'
            strokeWidth='1'
          />
          <path
            d='M-9 0 C12 -35 27 -8 45 11 S73 29 91 3 S113 -18 127 -1'
            stroke='#64c4fa'
            strokeWidth='1.2'
            opacity='.75'
          />
          <path
            d='M-4 -20 C14 -18 23 25 43 20 S77 -39 96 -22 S115 13 126 9'
            stroke='#edfaff'
            strokeWidth='1'
          />
          {[-7, 29, 66, 104, 125].map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy={i % 2 ? 13 : -17}
              r='1.5'
              fill='#edffff'
            />
          ))}
        </g>
      </SurfaceObject>
      <PacketNode
        id={id}
        name='infra-packet-back'
        x={446}
        y={y - 73}
        size={19}
      />
      <PacketNode
        id={id}
        name='infra-packet-middle'
        x={424}
        y={y - 53}
        size={18}
      />
      <PacketNode
        id={id}
        name='infra-packet-front'
        x={449}
        y={y - 32}
        size={18}
      />
      <WindowPane
        id={id}
        name='infra-video'
        x={482}
        y={y - 76}
        width={60}
        height={49}
        blue
      >
        <Play
          x='19'
          y='15'
          width='25'
          height='26'
          color='#d3f8ff'
          fill='#c6efff'
          strokeWidth='1'
        />
      </WindowPane>
    </g>
  );
}

function Token({ id, name, x, y }) {
  return (
    <SurfaceObject id={id} name={name} x={x} y={y} baseline={25}>
      <ellipse cy='25' rx='15' ry='4' fill='#4b91cc' opacity='.16' />
      <path
        d='M-12 0 V20 C-12 28 12 28 12 20 V0'
        fill={`url(#${id}-cylinder)`}
        stroke='#b1eaff'
      />
      {[18, 10, 2].map((cy) => (
        <ellipse
          key={cy}
          cy={cy}
          rx='12'
          ry='4.5'
          fill={cy === 2 ? '#bfeeff' : 'none'}
          stroke='#e2ffff'
          strokeWidth='1.5'
        />
      ))}
      <ellipse
        className='hc-ecosystem-indicator'
        cy='1'
        rx='7.5'
        ry='2.3'
        fill='#e8fbff'
      />
      <path d='M-8 5 V21' stroke='#dbfaff' opacity='.35' />
    </SurfaceObject>
  );
}

function SecurityScene({ id, y }) {
  const links = `M240 ${y - 33} H278 L351 ${y - 53} L436 ${y - 30} H507`;
  return (
    <g>
      <path
        d={links}
        stroke='#6ac9ff'
        strokeWidth='4'
        opacity='.45'
        filter={`url(#${id}-glow)`}
      />
      <path d={links} stroke='#e3fcff' strokeWidth='1.7' />
      <SurfaceObject id={id} name='chip-key' x={218} y={y - 62} baseline={29}>
        <g transform='rotate(19)'>
          <path
            d='M10 0 H50 V11 H41 V17 H34 V11 H9Z'
            fill='#398bed'
            stroke='#a7e4ff'
          />
          <path
            d='M9 -3 H50 V6 H40 V12 H34 V6 H9Z'
            fill={`url(#${id}-blue)`}
            stroke='#dcf7ff'
            strokeWidth='1.4'
          />
          <path d='M-8 8 V28 H0 V11' fill='#3d8ce7' stroke='#b9eaff' />
          <ellipse
            rx='14'
            ry='17'
            fill={`url(#${id}-white)`}
            stroke='#edfbff'
          />
          <ellipse
            cx='2'
            cy='1'
            rx='11'
            ry='14'
            fill={`url(#${id}-blue)`}
            stroke='#90caff'
          />
          <ellipse
            cx='2'
            cy='-2'
            rx='4.4'
            ry='6'
            fill='#78b7ed'
            stroke='#e2f9ff'
          />
        </g>
      </SurfaceObject>
      <Token id={id} name='chip-token-left' x={283} y={y - 52} />
      <Token id={id} name='chip-token-right' x={454} y={y - 45} />
      <SurfaceObject
        id={id}
        name='chip-shield'
        x={362}
        y={y - 59}
        baseline={49}
        reflection={0.29}
      >
        <ellipse
          className='hc-ecosystem-shield-glow'
          cy='48'
          rx='36'
          ry='7'
          fill={`url(#${id}-caustic)`}
        />
        <path
          d='M0 -23 Q16 -12 32 -11 L36 -7 V13 Q34 38 2 53 L-2 48Z'
          fill='#569bea'
          stroke='#b8e8ff'
        />
        <path
          d='M0 -25 Q16 -14 31 -14 V12 Q29 35 0 50 Q-29 35 -31 12 V-14 Q-16 -14 0 -25Z'
          fill={`url(#${id}-window)`}
          stroke='#f0ffff'
          strokeWidth='2'
        />
        <path
          d='M0 -18 Q13 -9 25 -8 V12 Q23 31 0 43 Q-23 31 -25 12 V-8 Q-13 -9 0 -18Z'
          fill={`url(#${id}-blue)`}
          stroke='#9fe3ff'
        />
        <path
          d='M0 -17 V43 Q-23 31 -25 12 V-8 Q-13 -9 0 -17Z'
          fill='#a0e2ff'
          opacity='.25'
        />
        <path
          d='M0 -22 Q-16 -11 -28 -11 V10 Q-25 32 0 47'
          stroke='#fff'
          strokeWidth='1.2'
        />
        <path
          d='M-11 10 L-2 19 L13 1'
          stroke='#cef8ff'
          strokeWidth='5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path d='M0 -16 V-3' stroke='#dcffff' strokeOpacity='.45' />
        <EdgeFlow d='M0 -25 Q16 -14 31 -14 V12 Q29 35 0 50 Q-29 35 -31 12 V-14 Q-16 -14 0 -25Z' />
      </SurfaceObject>
      <SurfaceObject
        id={id}
        name='chip-capacity'
        x={478}
        y={y - 28}
        baseline={3}
      >
        {[0, 1, 2, 3].map((i) => {
          const h = 24 + i * 9;
          return (
            <g key={i} transform={`translate(${i * 14} 0)`}>
              <path
                d={`M0 0 V${-h} l7 2 V2Z`}
                fill={`url(#${id}-blue)`}
                stroke='#bbe9ff'
                strokeWidth='.7'
              />
              <path
                d={`M7 2 V${-h + 2} l7 -5 V-3Z`}
                fill='#3b8ee4'
                stroke='#86caff'
                strokeWidth='.7'
              />
              <path
                className='hc-ecosystem-indicator'
                style={{ animationDelay: `${i * -0.65}s` }}
                d={`M0 ${-h} l7 -5 l7 2 l-7 5Z`}
                fill='#b4eaff'
                stroke='#eaffff'
                strokeWidth='.8'
              />
              <path d={`M2 -2 V${-h + 3}`} stroke='#bceeff' opacity='.8' />
            </g>
          );
        })}
      </SurfaceObject>
    </g>
  );
}

function ServerRack({ id, x, y, name }) {
  return (
    <SurfaceObject
      id={id}
      name={name}
      x={x}
      y={y}
      baseline={46}
      reflection={0.3}
    >
      <ellipse cx='39' cy='46' rx='48' ry='7' fill='#397cb9' opacity='.2' />
      <path
        d='M0 0 L21 -12 L85 -8 L67 4Z'
        fill={`url(#${id}-metal)`}
        stroke='#d3edff'
        strokeWidth='1.2'
      />
      <path
        d='M67 4 L85 -8 V31 L67 45Z'
        fill={`url(#${id}-ink)`}
        stroke='#92bce6'
      />
      <path d='M70 8 L82 0 V28 L70 37Z' fill='#244d7d' opacity='.4' />
      <path
        d='M0 0 L67 4 V45 L0 41Z'
        fill={`url(#${id}-metal)`}
        stroke='#a7cfee'
        strokeWidth='1.2'
      />
      <path
        d='M3 3 L64 7 V41 L3 37Z'
        fill='#254c79'
        stroke='#73a5d5'
        strokeWidth='.8'
      />
      {[8, 24].map((row) => (
        <g key={row}>
          <path
            d={`M7 ${row} l53 3 V${row + 13} l-53 -3Z`}
            fill={`url(#${id}-ink)`}
            stroke='#83b6e4'
            strokeWidth='.8'
          />
          <path d={`M10 ${row + 3} l32 1.8 v5 l-32 -1.8Z`} fill='#183c65' />
          {[13, 17, 21, 25, 29].map((cx) => (
            <path
              key={cx}
              d={`M${cx} ${row + 4} v2.5`}
              stroke='#6a9dcb'
              strokeWidth='.8'
            />
          ))}
          <path
            className='hc-ecosystem-server-led'
            style={{ '--led-offset': `${row * -0.075}s` }}
            d={`M46 ${row + 5} v2 M50 ${row + 5} v2 M54 ${row + 5} v2`}
            stroke='#8be9ff'
            strokeWidth='1.4'
          />
          <path
            d={`M11 ${row + 9} l29 1.6`}
            stroke='#6096c4'
            strokeWidth='.6'
          />
        </g>
      ))}
      <path
        d='M3 2 L66 6 M2 39 L65 43 M69 5 L83 -5'
        stroke='#c2e7ff'
        strokeOpacity='.75'
      />
      {[7, 37].map((cy) => (
        <g key={cy}>
          <circle cx='4.5' cy={cy} r='.8' fill='#bae3ff' />
          <circle cx='63' cy={cy + 3.5} r='.8' fill='#bae3ff' />
        </g>
      ))}
      <path d='M10 -2 L27 -10 L75 -7 L62 0Z' fill='#c6e9ff' opacity='.15' />
      <EdgeFlow
        className='hc-ecosystem-server-sweep'
        d='M3 3 L64 7 V41 L3 37Z'
      />
    </SurfaceObject>
  );
}

function ComputeScene({ id, y }) {
  const channels = `M187 ${y - 42} H529 M187 ${y - 32} H529`;
  return (
    <g>
      <path
        d={channels}
        stroke='#5dbfff'
        strokeWidth='7'
        opacity='.4'
        filter={`url(#${id}-glow)`}
      />
      <path d={channels} stroke='#e0fcff' strokeWidth='1.7' />
      <path
        className='hc-ecosystem-route'
        d={channels}
        stroke='#fff'
        strokeWidth='2.5'
      />
      <ServerRack id={id} name='energy-server-left' x={185} y={y - 77} />
      <ServerRack id={id} name='energy-server-center' x={326} y={y - 69} />
      <ServerRack id={id} name='energy-server-right' x={474} y={y - 64} />
    </g>
  );
}

export default function ArchitectureScene() {
  const { t } = useTranslation();
  const { ref, entered, active, established, onAnimationEnd } =
    useSceneEntrance();
  const id = `hc-ecosystem-${useId().replace(/:/g, '')}`;
  const copy = [
    t('应用层'),
    t('模型层'),
    t('基础设施层'),
    t('芯片层'),
    t('能源层'),
  ];
  return (
    <div
      className='hc-ecosystem'
      ref={ref}
      data-entered={entered}
      data-active={active}
      data-established={established}
      onAnimationEnd={onAnimationEnd}
    >
      <div className='hc-ecosystem-floor' aria-hidden='true' />
      <div className='hc-ecosystem-device'>
        <svg
          className='hc-ecosystem-art'
          viewBox='0 0 720 820'
          fill='none'
          aria-hidden='true'
          focusable='false'
        >
          <SceneDefinitions id={id} />
          <ellipse
            cx='365'
            cy='765'
            rx='322'
            ry='54'
            fill={`url(#${id}-halo)`}
          />
          {[...LEVELS].reverse().map(({ y, width, Scene }, reverseIndex) => (
            <g
              key={y}
              className='hc-ecosystem-tier'
              style={{
                '--tier-delay': `${reverseIndex * 0.12}s`,
                '--support-delay': `${0.64 + reverseIndex * 0.07}s`,
                '--power-delay': `${reverseIndex * 0.95}s`,
                '--layer-period': `${7 + reverseIndex * 0.6}s`,
                '--layer-phase': `${reverseIndex * -1.37}s`,
              }}
            >
              <GlassPlatform
                id={id}
                y={y}
                width={width}
                featured={y === 288}
                foundation={y === 714}
              />
              <g
                className='hc-ecosystem-supports'
                data-final-support={reverseIndex === 4}
              >
                <TierSupports
                  id={id}
                  y={y}
                  index={LEVELS.length - 1 - reverseIndex}
                />
              </g>
              <Scene id={id} y={y} />
            </g>
          ))}
        </svg>
        <ol className='hc-ecosystem-labels' aria-label={t('弘信五层架构')}>
          {LEVELS.map(({ y, Icon }, index) => (
            <li
              className='hc-ecosystem-label'
              key={y}
              style={{
                '--label-top': `${(y / 820) * 100}%`,
                '--tier-delay': `${(4 - index) * 0.12}s`,
              }}
            >
              <Icon aria-hidden='true' strokeWidth={1.8} />
              <div>
                <h4>{copy[index]}</h4>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
