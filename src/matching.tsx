import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "./lib/utils";

type TMatch = {
  questionId: number | string;
  answerId: number | string;
};

type Props = {
  questions: { id: number; text: string }[];
  answers: { id: number; text: string }[];
  onChange: (matches: TMatch[]) => void;
  className?: string;
  questionClassName?:
    | string
    | ((state: { isMatched: boolean; isDragging: boolean }) => string);
  answerClassName?:
    | string
    | ((state: { isMatched: boolean; isHovering: boolean }) => string);
  lineClassName?: string;
  lineColor?: string;
  circleColor?: string;
  circleRadius?: number;
  offset?: number;
  disabled?: boolean;
};

function Matching({
  questions,
  answers,
  onChange,
  className,
  questionClassName,
  answerClassName,
  lineClassName,
  lineColor = "black",
  circleColor = "white",
  circleRadius = 8,
  offset = 10,
  disabled,
}: Props) {
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragLine, setDragLine] = useState<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    questionId: number;
  } | null>(null);
  const [lines, setLines] = useState<
    {
      qId: string;
      aId: string;
      start: { x: number; y: number };
      end: { x: number; y: number };
    }[]
  >([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<Record<number, HTMLElement | null>>({});
  const answerRefs = useRef<Record<number, HTMLElement | null>>({});

  const getElementCenter = (element: HTMLElement | null, isAnswer = false) => {
    if (!element || !containerRef.current) return null;
    const rect = element.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    return {
      x: isAnswer
        ? rect.left - containerRect.left + circleRadius + offset
        : rect.right - containerRect.left - circleRadius - offset,
      y: rect.top + rect.height / 2 - containerRect.top,
    };
  };

  const handleMouseDown = (qId: number) => {
    if (disabled) return;
    setDragging(qId);

    requestAnimationFrame(() => {
      const start = getElementCenter(questionRefs.current[qId]);
      if (start) {
        setDragLine({ start, end: start, questionId: qId });
      }
    });
  };

  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!dragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const end = {
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    };
    setDragLine((prev) => {
      if (!prev) return null;
      return { ...prev, end };
    });
  };

  const handleMouseUp = (aId: number) => {
    if (dragging != null) {
      const newMatches = Object.fromEntries(
        Object.entries(matches).filter(([, ansId]) => ansId !== aId)
      );

      newMatches[dragging] = aId;
      setMatches(newMatches);
    }
    setDragging(null);
    setDragLine(null);
  };

  const handleGlobalMouseUp = () => {
    setDragging(null);
    setDragLine(null);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    const connections: TMatch[] = Object.entries(matches).map(([qId, aId]) => ({
      questionId: Number(qId),
      answerId: Number(aId),
    }));
    onChange(connections);
  }, [matches, onChange]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const newLines = Object.entries(matches)
      .map(([qId, aId]) => {
        const startEl = questionRefs.current[Number(qId)];
        const endEl = answerRefs.current[aId];
        if (!startEl || !endEl) return null;

        const start = getElementCenter(startEl, false);
        const end = getElementCenter(endEl, true);
        if (!start || !end) return null;

        return { qId, aId: aId.toString(), start, end };
      })
      .filter(Boolean) as {
      qId: string;
      aId: string;
      start: { x: number; y: number };
      end: { x: number; y: number };
    }[];

    setLines(newLines);
  }, [matches]);

  const removeMatch = (qId: number) => {
    if (disabled) return;
    const newMatches = { ...matches };
    delete newMatches[qId];
    setMatches(newMatches);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative grid grid-cols-2 gap-10 select-none bg-none",
        className
      )}
    >
      <svg
        className={cn(
          "absolute pointer-events-none z-20 w-full h-full",
          lineClassName
        )}
      >
        {lines.map(({ qId, aId, start, end }) => (
          <g key={`${qId}-${aId}`}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={lineColor}
              strokeWidth="3"
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
              strokeWidth="3"
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
      <div className="space-y-3 relative z-10">
        {questions.map((q) => {
          const isMatched = matches[q.id] !== undefined;
          return (
            <button
              key={q.id}
              type="button"
              ref={(el) => {
                questionRefs.current[q.id] = el;
              }}
              aria-pressed={isMatched}
              onMouseDown={() => handleMouseDown(q.id)}
              onClick={() => isMatched && removeMatch(q.id)}
              className={cn(
                "p-4 rounded transition-all duration-200 bg-black text-white font-medium w-full focus:outline-none focus:ring-2 focus:ring-gray-500",
                dragging === q.id && "bg-gray-800 border-gray-600",
                isMatched && "bg-gray-700 border-gray-500",
                disabled ? "cursor-default bg-gray-500" : "cursor-pointer",
                typeof questionClassName === "function"
                  ? questionClassName({
                      isMatched,
                      isDragging: dragging === q.id,
                    })
                  : questionClassName
              )}
            >
              {q.text}
            </button>
          );
        })}
      </div>
      <div className="space-y-3 relative z-10">
        {answers.map((a) => {
          const matchedQuestion = Object.keys(matches).find(
            (qId) => matches[Number(qId)] === a.id
          );
          const isMatched = matchedQuestion !== undefined;
          const isHovering = dragging != null && dragLine != null;

          return (
            <button
              key={a.id}
              type="button"
              ref={(el) => {
                answerRefs.current[a.id] = el;
              }}
              aria-pressed={isMatched}
              onMouseUp={() => handleMouseUp(a.id)}
              onMouseEnter={() => {
                if (!dragging) return;
                const end = getElementCenter(answerRefs.current[a.id], true);
                if (!end) return;
                setDragLine((prev) => {
                  if (!prev) return null;
                  return { ...prev, end };
                });
              }}
              className={cn(
                "p-4 ps-7 rounded transition-all duration-200 bg-black text-white font-medium w-full focus:outline-none focus:ring-2 focus:ring-gray-500",
                isHovering && !isMatched && "bg-gray-800 border-gray-600",
                isMatched && "bg-gray-700 border-gray-600",
                disabled ? "cursor-default bg-gray-500" : "cursor-pointer",
                typeof answerClassName === "function"
                  ? answerClassName({ isMatched, isHovering })
                  : answerClassName
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

export { Matching };
