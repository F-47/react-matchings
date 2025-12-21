import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "./lib/utils";

export type TMatch = {
  questionId: number;
  answerId: number;
};

type Props = {
  questions: { id: number; text: string }[];
  answers: { id: number; text: string }[];
  className?: string;
  questionClassName?: string;
  answerClassName?: string;
  lineColor?: string;
  circleColor?: string;
  circleRadius?: number;
  offset?: number;
  disabled?: boolean;
  onChange?: (matches: TMatch[]) => void;
};

type Line = {
  qId: string;
  aId: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
};

export function Matching({
  questions,
  answers,
  className,
  questionClassName,
  answerClassName,
  lineColor = "black",
  circleColor = "white",
  circleRadius = 8,
  offset = 10,
  disabled,
  onChange,
}: Props) {
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [lines, setLines] = useState<Line[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragLine, setDragLine] = useState<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    questionId: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const answerRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const getElementCenter = useCallback(
    (el: HTMLElement | null, isAnswer = false) => {
      if (!el || !containerRef.current) return null;
      const rect = el.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      return {
        x: isAnswer
          ? rect.left - containerRect.left + circleRadius + offset
          : rect.right - containerRect.left - circleRadius - offset,
        y: rect.top + rect.height / 2 - containerRect.top,
      };
    },
    [circleRadius, offset]
  );

  const handleMouseDown = (qId: number) => {
    if (disabled) return;
    setDragging(qId);
    requestAnimationFrame(() => {
      const start = getElementCenter(questionRefs.current[qId]);
      if (start) setDragLine({ start, end: start, questionId: qId });
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDragLine((prev) =>
        prev
          ? {
              ...prev,
              end: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            }
          : null
      );
    },
    [dragging]
  );

  const handleMouseUp = (aId: number) => {
    if (dragging != null) {
      setMatches((prev) => {
        const newMatches = { ...prev, [dragging]: aId };
        if (onChange) {
          // notify parent immediately on every change
          queueMicrotask(() =>
            onChange(
              Object.entries(newMatches).map(([qId, aId]) => ({
                questionId: Number(qId),
                answerId: aId,
              }))
            )
          );
        }
        return newMatches;
      });
    }
    setDragging(null);
    setDragLine(null);
  };

  const removeMatch = (qId: number) => {
    setMatches((prev) => {
      const newMatches = { ...prev };
      delete newMatches[qId];
      if (onChange) {
        queueMicrotask(() =>
          onChange(
            Object.entries(newMatches).map(([qId, aId]) => ({
              questionId: Number(qId),
              answerId: aId,
            }))
          )
        );
      }
      return newMatches;
    });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleUp = () => {
      setDragging(null);
      setDragLine(null);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, handleMouseMove]);

  useEffect(() => {
    if (!containerRef.current) return;

    const newLines: Line[] = Object.entries(matches)
      .map(([qId, aId]) => {
        const startEl = questionRefs.current[Number(qId)];
        const endEl = answerRefs.current[Number(aId)];
        if (!startEl || !endEl) return null;
        const start = getElementCenter(startEl, false);
        const end = getElementCenter(endEl, true);
        if (!start || !end) return null;
        return { qId, aId: aId.toString(), start, end };
      })
      .filter(Boolean) as Line[];

    setLines(newLines);
  }, [matches, getElementCenter]);

  return (
    <div
      className={cn("grid relative grid-cols-2 gap-10 select-none", className)}
      ref={containerRef}
    >
      <svg className="absolute z-20 w-full h-full pointer-events-none">
        {lines.map(({ qId, aId, start, end }) => (
          <g key={`${qId}-${aId}`}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={lineColor}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle
              cx={start.x}
              cy={start.y}
              r={circleRadius}
              fill={circleColor}
            />
            <circle cx={end.x} cy={end.y} r={circleRadius} fill={circleColor} />
          </g>
        ))}
        {dragLine && (
          <g>
            <line
              x1={dragLine.start.x}
              y1={dragLine.start.y}
              x2={dragLine.end.x}
              y2={dragLine.end.y}
              stroke={lineColor}
              strokeWidth={3}
              strokeDasharray="5,5"
              strokeLinecap="round"
            />
            <circle
              cx={dragLine.start.x}
              cy={dragLine.start.y}
              r={circleRadius}
              fill={circleColor}
            />
            <circle
              cx={dragLine.end.x}
              cy={dragLine.end.y}
              r={circleRadius}
              fill={circleColor}
            />
          </g>
        )}
      </svg>

      <div className="relative z-10 space-y-3">
        {questions.map((q) => {
          const isMatched = matches[q.id] !== undefined;
          return (
            <button
              key={q.id}
              ref={(el) => void (questionRefs.current[q.id] = el)}
              type="button"
              onMouseDown={() => handleMouseDown(q.id)}
              onClick={() => isMatched && removeMatch(q.id)}
              className={cn(
                "p-4 rounded bg-black text-white w-full font-medium focus:outline-none focus:ring-2 focus:ring-gray-500",
                isMatched && "bg-gray-700",
                questionClassName
              )}
            >
              {q.text}
            </button>
          );
        })}
      </div>

      <div className="relative z-10 space-y-3">
        {answers.map((a) => {
          const isMatched = Object.values(matches).includes(a.id);
          return (
            <button
              key={a.id}
              ref={(el) => void (answerRefs.current[a.id] = el)}
              type="button"
              onMouseUp={() => handleMouseUp(a.id)}
              className={cn(
                "p-4 rounded bg-black text-white w-full font-medium focus:outline-none focus:ring-2 focus:ring-gray-500",
                isMatched && "bg-gray-700",
                answerClassName
              )}
            >
              {a.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
