"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { gameState } from "./gameState";

// Snake on a yellow grid. Pink snake, gold stars to eat.
// Steer with the arrow keys / WASD, or swipe on a phone.

const ROWS = 16; // grid rows; the number of columns follows the board's shape
const START_STEP = 150; // ms per move at the start
const MIN_STEP = 70; // fastest it gets
const SPEED_UP = 4; // ms faster per star eaten
const BEST_KEY = "coralie-snake-best";
const WIN_SCORE = 15; // stars to eat to win (so the game isn't endless)

// What it says when you crash. One is picked at random each time.
const DEATH_LINES = [
  "skill issue",
  "rest your mind, she said. relaxing, she said.",
  "game over. time to touch grass",
  "you died. but you can always try again.",
  "rip 💀",
];

// What it says when you win.
const WIN_LINES = [
  "you're now legally obligated to email me",
  "omg ur so good at this, hire me?",
];

const pick = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)];

const COLORS = {
  board: "#fff63e",
  grid: "#ece22f",
  snake: "#ff56b6",
  head: "#e5249a",
  eye: "#000",
  star: "#f5b400",
  starEdge: "#a86f00",
};

type Pt = { x: number; y: number };
type Status = "ready" | "playing" | "over" | "won";

const KEY_DIRS: Record<string, Pt> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function randomFree(snake: Pt[], cols: number, rows: number): Pt {
  let p: Pt;
  do {
    p = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
  } while (snake.some((s) => s.x === p.x && s.y === p.y));
  return p;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = COLORS.star;
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.strokeStyle = COLORS.starEdge;
  ctx.stroke();
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [line, setLine] = useState("");

  // Hooks into the game loop (set up once in the effect below).
  const startRef = useRef<() => void>(() => {});
  const turnRef = useRef<(d: Pt) => void>(() => {});
  const swipe = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const g = {
      status: "ready" as Status,
      snake: [] as Pt[],
      dir: { x: 1, y: 0 } as Pt,
      queue: [] as Pt[], // turns pressed but not yet used (so quick double-taps work)
      food: null as Pt | null,
      step: START_STEP,
      acc: 0,
      last: 0,
      raf: 0,
      score: 0,
      best: 0,
      cols: ROWS,
      rows: ROWS,
    };

    // Square board on phones, wide band on desktop: keep square cells and fit
    // as many columns as the width allows.
    function fitGrid() {
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      g.rows = ROWS;
      g.cols = Math.max(8, Math.round(w / (h / ROWS)));
    }

    try {
      g.best = Number(localStorage.getItem(BEST_KEY)) || 0;
      setBest(g.best);
    } catch {
      // Storage blocked: best score just won't be remembered.
    }

    function draw() {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (g.status !== "playing") fitGrid();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      const pw = Math.round(w * dpr);
      const ph = Math.round(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cw = w / g.cols;
      const ch = h / g.rows;
      const c = Math.min(cw, ch);

      ctx.fillStyle = COLORS.board;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < g.cols; i++) {
        const x = Math.round(i * cw) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let i = 1; i < g.rows; i++) {
        const y = Math.round(i * ch) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      if (g.food) drawStar(ctx, (g.food.x + 0.5) * cw, (g.food.y + 0.5) * ch, c * 0.48);

      g.snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? COLORS.head : COLORS.snake;
        ctx.beginPath();
        ctx.roundRect(s.x * cw + 1.5, s.y * ch + 1.5, cw - 3, ch - 3, c * 0.32);
        ctx.fill();
      });

      // Eyes, looking where it's going.
      const head = g.snake[0];
      if (head) {
        const cx = (head.x + 0.5) * cw;
        const cy = (head.y + 0.5) * ch;
        const side = { x: -g.dir.y, y: g.dir.x };
        ctx.fillStyle = COLORS.eye;
        for (const k of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(cx + g.dir.x * c * 0.15 + side.x * k * c * 0.2, cy + g.dir.y * c * 0.15 + side.y * k * c * 0.2, c * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function end(won = false) {
      g.status = won ? "won" : "over";
      gameState.setPlaying(false);
      if (g.score > g.best) {
        g.best = g.score;
        setBest(g.best);
        setNewBest(true);
        try {
          localStorage.setItem(BEST_KEY, String(g.best));
        } catch {
          // ignore
        }
      }
      setLine(pick(won ? WIN_LINES : DEATH_LINES));
      setStatus(won ? "won" : "over");
    }

    function tick() {
      const next = g.queue.shift();
      if (next) g.dir = next;
      const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };

      const eating = !!g.food && head.x === g.food.x && head.y === g.food.y;
      const body = eating ? g.snake : g.snake.slice(0, -1); // the tail moves away unless we grow
      const hitWall = head.x < 0 || head.y < 0 || head.x >= g.cols || head.y >= g.rows;
      const hitSelf = body.some((s) => s.x === head.x && s.y === head.y);
      if (hitWall || hitSelf) {
        end();
        return;
      }

      g.snake.unshift(head);
      if (eating) {
        g.score += 1;
        setScore(g.score);
        if (g.score >= WIN_SCORE) {
          end(true);
          return;
        }
        g.step = Math.max(MIN_STEP, g.step - SPEED_UP);
        g.food = randomFree(g.snake, g.cols, g.rows);
      } else {
        g.snake.pop();
      }
    }

    function loop(time: number) {
      if (g.status !== "playing") return;
      if (g.last === 0) g.last = time;
      const dt = Math.min(time - g.last, 250);
      g.last = time;
      g.acc += dt;
      while (g.acc >= g.step && g.status === "playing") {
        g.acc -= g.step;
        tick();
      }
      draw();
      if (g.status === "playing") g.raf = requestAnimationFrame(loop);
    }

    function start() {
      fitGrid();
      const mx = Math.floor(g.cols / 2);
      const my = Math.floor(g.rows / 2);
      g.snake = [
        { x: mx, y: my },
        { x: mx - 1, y: my },
        { x: mx - 2, y: my },
      ];
      g.dir = { x: 1, y: 0 };
      g.queue = [];
      g.food = randomFree(g.snake, g.cols, g.rows);
      g.step = START_STEP;
      g.acc = 0;
      g.last = 0;
      g.score = 0;
      g.status = "playing";
      gameState.setPlaying(true);
      setScore(0);
      setNewBest(false);
      setStatus("playing");
      cancelAnimationFrame(g.raf);
      g.raf = requestAnimationFrame(loop);
    }

    function turn(d: Pt) {
      if (g.status !== "playing") return;
      const last = g.queue[g.queue.length - 1] ?? g.dir;
      if (d.x === -last.x && d.y === -last.y) return; // can't reverse into itself
      if (d.x === last.x && d.y === last.y) return;
      if (g.queue.length < 3) g.queue.push(d);
    }

    startRef.current = start;
    turnRef.current = turn;

    const onKey = (e: KeyboardEvent) => {
      if (g.status !== "playing") return;
      const d = KEY_DIRS[e.key] ?? KEY_DIRS[e.key.toLowerCase()];
      if (!d) return;
      e.preventDefault(); // don't scroll the page while playing
      turn(d);
    };

    // Pause when the tab is hidden.
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(g.raf);
      } else if (g.status === "playing") {
        g.last = 0;
        g.raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    const resize = new ResizeObserver(draw);
    resize.observe(canvas);
    draw();

    return () => {
      gameState.setPlaying(false);
      cancelAnimationFrame(g.raf);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      resize.disconnect();
    };
  }, []);

  // Swipe to steer on touch screens.
  const onPointerDown = (e: ReactPointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) turnRef.current({ x: Math.sign(dx), y: 0 });
    else turnRef.current({ x: 0, y: Math.sign(dy) });
  };

  // Text in the game scales with the board: cqmin = 1% of the board's shorter
  // side, cqw = 1% of its width. The board also resets Tailwind's spacing.
  const button =
    "cursor-pointer border-0 bg-transparent px-[2cqmin] py-[1cqmin] font-title uppercase leading-none text-transparent [-webkit-text-stroke:1px_#000] hover:text-pink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black";

  return (
    <div
      className={`relative size-full select-none border-l border-t border-[#bdbdbd] bg-sunny shadow-[3px_3px_0_#e6dc2c] [--spacing:0.25rem] [container-type:size] md:border-0 md:shadow-none ${
        status === "playing" ? "touch-none" : "touch-manipulation"
      }`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block size-full" aria-hidden="true" />

      {status === "playing" && (
        <div
          className="pointer-events-none absolute inset-x-[3cqmin] top-[2.5cqmin] flex justify-between font-title text-[3.2cqmin]"
          aria-live="polite"
        >
          <span>
            stars {score}/{WIN_SCORE}
          </span>
          <span>best {best}</span>
        </div>
      )}

      {status !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            className="absolute left-[9cqw] top-1/2 flex -translate-y-1/2 flex-col font-title text-[5cqmin] leading-[1.15] md:left-[16cqw] md:text-[8cqmin]"
            aria-hidden="true"
          >
            {"SNAKE".split("").map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </p>
          <div className="flex flex-col items-center gap-[2.5cqmin] text-center">
            {status === "won" && (
              <p className="font-title text-[7cqmin] leading-none text-[#e5249a]">you win!</p>
            )}
            {(status === "over" || status === "won") && (
              <div className="flex max-w-[70cqw] flex-col items-center gap-[1.5cqmin]">
                <p className="text-[4.2cqmin] leading-[1.1]">{line}</p>
                <p className="font-title text-[3.4cqmin]">
                  score {score}
                  {newBest && <span className="text-[#e5249a]"> · new best!</span>}
                </p>
              </div>
            )}
            <button
              type="button"
              className={`${button} ${status === "ready" ? "text-[11cqw] md:text-[7.5cqw]" : "text-[6.5cqw] md:text-[4cqw]"}`}
              onClick={() => startRef.current()}
            >
              {status === "ready" ? "Play" : "Play again"}
            </button>
            <p className="text-[3.4cqmin]">eat {WIN_SCORE} stars to win · arrow keys or swipe</p>
          </div>
        </div>
      )}
    </div>
  );
}