import { useId } from "react";
import type { Creator } from "./data";
export function Portrait({
  creator: c,
  scene = false,
}: {
  creator: Creator;
  scene?: boolean;
}) {
  const id = useId();
  return (
    <svg
      viewBox={scene ? "0 0 600 340" : "170 20 260 260"}
      className="portrait-art"
      role="img"
      aria-label={`${c.name}, an original virtual creator`}
    >
      <defs>
        <linearGradient id={id} x2="1" y2="1">
          <stop stopColor={c.accent} />
          <stop offset="1" stopColor="#222239" />
        </linearGradient>
        <pattern
          id={`${id}-grid`}
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <path d="M32 0H0V32" fill="none" stroke="white" strokeOpacity=".07" />
        </pattern>
      </defs>
      <rect width="600" height="340" fill={`url(#${id})`} />
      <rect width="600" height="340" fill={`url(#${id}-grid)`} />
      {scene && (
        <>
          <circle cx="450" cy="110" r="110" fill={c.accent} opacity=".35" />
          <rect
            x="25"
            y="28"
            width="175"
            height="240"
            rx="80"
            fill="#151725"
            opacity=".45"
          />
          <text
            x="48"
            y="86"
            fill={c.accent}
            fontSize="24"
            fontFamily="monospace"
          >
            {c.jp}
          </text>
          <text x="48" y="122" fill="white" fontSize="27" fontWeight="800">
            {c.category === "gaming"
              ? "PLAY"
              : c.category === "music"
                ? "SING"
                : c.category === "art"
                  ? "CREATE"
                  : "CHILL"}
          </text>
          <text x="48" y="153" fill="white" fontSize="27" fontWeight="800">
            WITH ME.
          </text>
          <path d="M49 184h83m-83 12h54" stroke={c.accent} strokeWidth="3" />
          <text x="49" y="237" fontSize="27" fill={c.accent}>
            ✦ + ♡
          </text>
        </>
      )}
      <g transform={scene ? "translate(78,10)" : ""}>
        <path
          d="M216 144Q178 33 291 20Q400 3 394 134L414 320H192Z"
          fill={c.hair}
        />
        <path d="M225 211Q292 183 361 215L402 340H181Z" fill="#20232f" />
        <path d="M240 212L288 276L347 210L362 340H226Z" fill={c.accent} />
        <path d="M263 175L263 224Q289 250 315 223L314 173Z" fill="#f3c6ba" />
        <ellipse cx="288" cy="124" rx="70" ry="83" fill="#ffe3d5" />
        <path
          d="M211 105Q198 18 289 17Q378 11 368 108L338 76L327 111L294 60Z"
          fill={c.hair}
        />
        <path
          d="M215 112L222 66Q275 7 348 57L365 115L329 83L321 104L293 66L279 104L264 82L233 126L232 80Z"
          fill={c.hair}
        />
        <path
          d="M237 129Q253 116 268 131M304 130Q321 114 338 127"
          fill="none"
          stroke="#40364c"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse cx="255" cy="136" rx="9" ry="13" fill={c.accent} />
        <ellipse cx="321" cy="134" rx="9" ry="13" fill={c.accent} />
        <ellipse cx="256" cy="137" rx="4" ry="8" fill="#383047" />
        <ellipse cx="321" cy="135" rx="4" ry="8" fill="#383047" />
        <circle cx="258" cy="131" r="3" fill="white" />
        <circle cx="323" cy="128" r="3" fill="white" />
        <path d="M278 169Q288 180 300 167" fill="#d67986" />
        <ellipse
          cx="243"
          cy="158"
          rx="13"
          ry="5"
          fill="#ed9fa8"
          opacity=".45"
        />
        <ellipse
          cx="331"
          cy="156"
          rx="13"
          ry="5"
          fill="#ed9fa8"
          opacity=".45"
        />
        <path
          d="M206 89Q195 5 291 4Q388 0 378 96"
          fill="none"
          stroke="#242735"
          strokeWidth="16"
        />
        <rect x="199" y="82" width="23" height="58" rx="10" fill="#303443" />
        <rect x="357" y="80" width="24" height="58" rx="10" fill="#303443" />
        <path d="M206 92v36M371 89v38" stroke={c.accent} strokeWidth="5" />
        {c.index % 2 === 0 && (
          <>
            <path
              d="M219 41L214 1L253 24M322 22L359 0L361 44"
              fill="#272b38"
              stroke={c.accent}
              strokeWidth="3"
            />
          </>
        )}
        <path
          d="M221 222L253 277L232 301M351 220L326 280L348 304"
          fill="none"
          stroke={c.accent}
          strokeWidth="3"
        />
        <path d="M282 268v62" stroke="#20232f" strokeWidth="5" />
        <circle cx="288" cy="249" r="8" fill="#fff" />
      </g>
      {scene && (
        <>
          <rect
            x="448"
            y="266"
            width="110"
            height="43"
            rx="8"
            fill="#131722"
            opacity=".8"
          />
          <text
            x="462"
            y="293"
            fontSize="18"
            fontFamily="monospace"
            fill={c.accent}
          >
            LV.{c.level} ✦
          </text>
          <path
            d="M480 44v24m-12-12h24M534 113v14m-7-7h14"
            stroke="white"
            strokeWidth="3"
            opacity=".7"
          />
        </>
      )}
    </svg>
  );
}
