/* 钱进 v0.4.3 原创“带薪仓鼠”SVG：圆角米团轮廓、储粮腮囊与红围巾。 */
(function (global) {
  'use strict';
  function svg(mood) {
    const state = ['work', 'coding', 'rest', 'sleep'].includes(mood) ? mood : 'work';
    const eyes = state === 'rest' || state === 'sleep'
      ? '<path d="M55 63q7 7 14 0M91 63q7 7 14 0" class="qj-line"/>'
      : '<g class="qj-blink-l"><ellipse cx="62" cy="62" rx="5" ry="6" class="qj-eye"/><circle cx="64" cy="60" r="1.6" fill="#fff"/></g><g class="qj-blink-r"><ellipse cx="98" cy="62" rx="5" ry="6" class="qj-eye"/><circle cx="100" cy="60" r="1.6" fill="#fff"/></g>';
    const arm = state === 'coding'
      ? '<g class="qj-typing"><ellipse class="qj-type-left" cx="52" cy="105" rx="10" ry="8" fill="#D98A45" stroke="#6D4025" stroke-width="3"/><ellipse class="qj-type-right" cx="108" cy="105" rx="10" ry="8" fill="#D98A45" stroke="#6D4025" stroke-width="3"/></g>'
      : state === 'sleep'
      ? '<path d="M119 105q15 10 20-2" fill="none" stroke="#F2B865" stroke-width="14" stroke-linecap="round"/><circle cx="139" cy="103" r="9" fill="#D98A45" stroke="#6D4025" stroke-width="3"/>'
      : '<g class="qj-wave"><path d="M119 103q20-12 17-36" fill="none" stroke="#F2B865" stroke-width="14" stroke-linecap="round"/><circle cx="136" cy="61" r="10" fill="#D98A45" stroke="#6D4025" stroke-width="3"/></g>';
    const sleepMarks = state === 'sleep' ? '<g class="qj-zzz" fill="#8D6AB8" font-family="sans-serif" font-weight="900"><text x="119" y="36" font-size="16">Z</text><text x="135" y="24" font-size="12">z</text></g>' : '';
    const deskTool = state === 'coding'
      ? '<g class="qj-laptop"><path d="M45 96h70l-6 30H51z" fill="#52697A" stroke="#6D4025" stroke-width="3" stroke-linejoin="round"/><rect x="52" y="101" width="56" height="17" rx="4" fill="#EAF8F0"/><path d="M62 106l-5 4 5 4m10-8h18m-18 5h28" fill="none" stroke="#2D9464" stroke-width="2" stroke-linecap="round"/><path d="M43 125h74l8 8H35z" fill="#8FA5B3" stroke="#6D4025" stroke-width="3" stroke-linejoin="round"/><path d="M68 129h24" stroke="#DCE8ED" stroke-width="2" stroke-linecap="round"/></g>'
      : '<g class="qj-seed"><ellipse cx="80" cy="113" rx="10" ry="7" fill="#FFD45C" stroke="#A66724" stroke-width="2"/><path d="M75 113h10" stroke="#A66724" stroke-width="2"/></g>';
    const aria = state === 'coding' ? '正在努力敲代码的带薪仓鼠' : state === 'sleep' ? '正在带薪午休的仓鼠' : '带薪仓鼠';
    return `<svg class="qj-hamster" data-mood="${state}" viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${aria}"><style>.qj-line{fill:none;stroke:#6d4025;stroke-width:3;stroke-linecap:round}.qj-eye{fill:#47301f}</style>
      <ellipse class="qj-floor-shadow" cx="80" cy="136" rx="49" ry="8" fill="rgba(87,50,20,.14)"/>
      <g class="qj-breathe">
      <circle cx="44" cy="40" r="20" fill="#D98A45" stroke="#6D4025" stroke-width="4"/>
      <circle cx="116" cy="40" r="20" fill="#D98A45" stroke="#6D4025" stroke-width="4"/>
      <circle cx="44" cy="40" r="10" fill="#F7C4B3"/>
      <circle cx="116" cy="40" r="10" fill="#F7C4B3"/>
      <path d="M80 22c35 0 57 24 57 59 0 38-22 56-57 56S23 119 23 81c0-35 22-59 57-59z" fill="#F2B865" stroke="#6D4025" stroke-width="4"/>
      <path d="M51 100c18-12 40-12 58 0l-5 31c-14 7-34 8-48 0z" fill="#07C160"/>
      <path d="M53 101c17 8 37 8 54 0" fill="none" stroke="#FFD45C" stroke-width="4" stroke-linecap="round"/>
      <path d="M80 101v31" stroke="#FFD45C" stroke-width="3" opacity=".8"/>
      <ellipse class="qj-cheek qj-cheek-left" cx="49" cy="82" rx="18" ry="16" fill="#FFD6A4"/>
      <ellipse class="qj-cheek qj-cheek-right" cx="111" cy="82" rx="18" ry="16" fill="#FFD6A4"/>
      <ellipse cx="47" cy="82" rx="8" ry="5" fill="#F38C8E" opacity=".46"/>
      <ellipse cx="113" cy="82" rx="8" ry="5" fill="#F38C8E" opacity=".46"/>
      ${eyes}
      <path d="M76 72q4 4 8 0" fill="#6D4025" stroke="#6D4025" stroke-width="3" stroke-linecap="round"/>
      <path d="M80 75v4m0 0q-6 7-12 0m12 0q6 7 12 0" class="qj-line"/>
      </g>
      ${state === 'coding' ? '' : '<circle cx="39" cy="111" r="10" fill="#D98A45" stroke="#6D4025" stroke-width="3"/>'}
      ${state === 'coding' ? deskTool : ''}
      ${arm}
      ${state === 'coding' ? '' : deskTool}
      <g class="qj-coin"><circle cx="137" cy="43" r="11" fill="#FFD45C" stroke="#C47B26" stroke-width="2"/><text x="137" y="48" text-anchor="middle" font-size="13" font-weight="900" fill="#9A571D" font-family="sans-serif">¥</text></g>
      ${sleepMarks}
    </svg>`;
  }
  global.QJHamster = { svg };
})(typeof globalThis !== 'undefined' ? globalThis : this);
