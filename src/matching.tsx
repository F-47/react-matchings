import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "./lib/utils";

export type TMatch = {
  questionId: number;
  answerId: number;
};

export type TMatchStyles = {
  lineColor?: string;
  circleColor?: string;
  questionClassName?: string;
  answerClassName?: string;
};

export type TAutoScrollOptions = {
  edgeThreshold?: number;
  maxSpeed?: number;
};

export type MatchingProps = {
  questions: { id: number; text: string }[];
  answers: { id: number; text: string }[];
  matches?: TMatch[];
  defaultMatches?: TMatch[];
  className?: string;
  questionClassName?: string;
  answerClassName?: string;
  lineColor?: string;
  circleColor?: string;
  circleRadius?: number;
  offset?: number;
  disabled?: boolean;
  allowAnswerReuse?: boolean;
  autoScroll?: boolean | TAutoScrollOptions;
  getMatchStyles?: (match: TMatch) => TMatchStyles | undefined;
  onChange?: (matches: TMatch[]) => void;
};

type Point = { x: number; y: number };

type Line = TMatch & {
  start: Point;
  end: Point;
};

const DEFAULT_EDGE_THRESHOLD = 64;
const DEFAULT_MAX_SCROLL_SPEED = 16;

function toMatches(matches: Record<number, number>): TMatch[] {
  return Object.entries(matches).map(([questionId, answerId]) => ({
    questionId: Number(questionId),
    answerId,
  }));
}

function toMatchRecord(matches: TMatch[] | undefined): Record<number, number> {
  return (matches ?? []).reduce<Record<number, number>>((record, match) => {
    record[match.questionId] = match.answerId;
    return record;
  }, {});
}

function findScrollableAncestor(element: HTMLElement): HTMLElement {
  let current = element.parentElement;

  while (current) {
    const { overflowY } = window.getComputedStyle(current);
    if (/(auto|scroll|overlay)/.test(overflowY) && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }

  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

export function Matching({
  questions,
  answers,
  matches: controlledMatches,
  defaultMatches,
  className,
  questionClassName,
  answerClassName,
  lineColor = "black",
  circleColor = "white",
  circleRadius = 8,
  offset = 10,
  disabled,
  allowAnswerReuse = false,
  autoScroll = true,
  getMatchStyles,
  onChange,
}: MatchingProps) {
  const [uncontrolledMatches, setUncontrolledMatches] = useState<Record<number, number>>(() =>
    toMatchRecord(defaultMatches)
  );
  const [lines, setLines] = useState<Line[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragLine, setDragLine] = useState<{ start: Point; end: Point } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const answerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const pointerRef = useRef<{ id: number; clientX: number; clientY: number } | null>(null);
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const isControlled = controlledMatches !== undefined;
  const matches = useMemo(
    () => (isControlled ? toMatchRecord(controlledMatches) : uncontrolledMatches),
    [controlledMatches, isControlled, uncontrolledMatches]
  );

  const setMatches = useCallback(
    (next: Record<number, number>) => {
      if (!isControlled) {
        setUncontrolledMatches(next);
      }
      queueMicrotask(() => onChange?.(toMatches(next)));
    },
    [isControlled, onChange]
  );

  const getElementCenter = useCallback(
    (element: HTMLElement | null, isAnswer = false) => {
      if (!element || !containerRef.current) return null;
      const rect = element.getBoundingClientRect();
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

  const refreshLines = useCallback(() => {
    const nextLines = toMatches(matches)
      .map(({ questionId, answerId }) => {
        const start = getElementCenter(questionRefs.current[questionId]);
        const end = getElementCenter(answerRefs.current[answerId], true);
        return start && end ? { questionId, answerId, start, end } : null;
      })
      .filter((line): line is Line => line !== null);

    setLines(nextLines);
  }, [getElementCenter, matches]);

  const refreshDragLine = useCallback(() => {
    if (dragging == null || !containerRef.current || !pointerRef.current) return;
    const start = getElementCenter(questionRefs.current[dragging]);
    if (!start) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragLine({
      start,
      end: {
        x: pointerRef.current.clientX - rect.left,
        y: pointerRef.current.clientY - rect.top,
      },
    });
  }, [dragging, getElementCenter]);

  const refreshLayout = useCallback(() => {
    refreshLines();
    refreshDragLine();
  }, [refreshDragLine, refreshLines]);

  const stopAutoScroll = useCallback(() => {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = null;
    scrollElementRef.current = null;
  }, []);

  const runAutoScroll = useCallback(() => {
    scrollFrameRef.current = null;
    if (autoScroll === false || dragging == null || !pointerRef.current) return;

    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    const isDocument = scrollElement === document.scrollingElement;
    const rect = isDocument
      ? { top: 0, bottom: window.innerHeight }
      : scrollElement.getBoundingClientRect();
    const edgeThreshold =
      typeof autoScroll === "object"
        ? (autoScroll.edgeThreshold ?? DEFAULT_EDGE_THRESHOLD)
        : DEFAULT_EDGE_THRESHOLD;
    const maxSpeed =
      typeof autoScroll === "object"
        ? (autoScroll.maxSpeed ?? DEFAULT_MAX_SCROLL_SPEED)
        : DEFAULT_MAX_SCROLL_SPEED;
    const { clientY } = pointerRef.current;
    let speed = 0;

    if (clientY < rect.top + edgeThreshold) {
      speed = -maxSpeed * (1 - Math.max(0, clientY - rect.top) / edgeThreshold);
    } else if (clientY > rect.bottom - edgeThreshold) {
      speed = maxSpeed * (1 - Math.max(0, rect.bottom - clientY) / edgeThreshold);
    }

    if (speed !== 0) {
      const previousScrollTop = scrollElement.scrollTop;
      scrollElement.scrollTop += speed;
      if (scrollElement.scrollTop !== previousScrollTop) {
        refreshLines();
        refreshDragLine();
      }
    }

    scrollFrameRef.current = requestAnimationFrame(runAutoScroll);
  }, [autoScroll, dragging, refreshDragLine, refreshLines]);

  const cancelDragging = useCallback(() => {
    setDragging(null);
    setDragLine(null);
    pointerRef.current = null;
    stopAutoScroll();
  }, [stopAutoScroll]);

  const handlePointerDown = (event: React.PointerEvent, questionId: number) => {
    if (disabled || !containerRef.current) return;
    event.preventDefault();
    pointerRef.current = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY };
    scrollElementRef.current = findScrollableAncestor(containerRef.current);
    setDragging(questionId);
  };

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (dragging == null || pointerRef.current?.id !== event.pointerId) return;
      pointerRef.current = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY };
      refreshDragLine();
    },
    [dragging, refreshDragLine]
  );

  const handlePointerUp = (event: React.PointerEvent, answerId: number) => {
    if (dragging != null && pointerRef.current?.id === event.pointerId) {
      const next = { ...matches };
      if (!allowAnswerReuse) {
        for (const [questionId, matchedAnswerId] of Object.entries(next)) {
          if (matchedAnswerId === answerId) delete next[Number(questionId)];
        }
      }
      next[dragging] = answerId;
      setMatches(next);
    }
    cancelDragging();
  };

  const removeMatch = (questionId: number) => {
    const next = { ...matches };
    delete next[questionId];
    setMatches(next);
  };

  useLayoutEffect(() => {
    refreshLayout();
  }, [refreshLayout, questions, answers, disabled, allowAnswerReuse]);

  useEffect(() => {
    if (dragging == null) return;
    refreshDragLine();
    if (autoScroll !== false && scrollFrameRef.current === null) {
      scrollFrameRef.current = requestAnimationFrame(runAutoScroll);
    }

    const handleUp = (event: PointerEvent) => {
      if (pointerRef.current?.id === event.pointerId) cancelDragging();
    };
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleUp);
      stopAutoScroll();
    };
  }, [
    autoScroll,
    cancelDragging,
    dragging,
    handlePointerMove,
    refreshDragLine,
    runAutoScroll,
    stopAutoScroll,
  ]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      refreshLayout();
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [refreshLayout]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      refreshLayout();
    });
    return () => cancelAnimationFrame(frame);
  }, [refreshLayout]);

  useEffect(() => {
    window.addEventListener("resize", refreshLines);
    return () => window.removeEventListener("resize", refreshLines);
  }, [refreshLines]);

  return (
    <div
      className={cn("grid relative grid-cols-2 gap-10 select-none", className)}
      ref={containerRef}
    >
      <svg className="absolute z-20 w-full h-full pointer-events-none">
        {lines.map((line) => {
          const styles = getMatchStyles?.(line);
          return (
            <g key={`${line.questionId}-${line.answerId}`}>
              <line
                x1={line.start.x}
                y1={line.start.y}
                x2={line.end.x}
                y2={line.end.y}
                stroke={styles?.lineColor ?? lineColor}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <circle
                cx={line.start.x}
                cy={line.start.y}
                r={circleRadius}
                fill={styles?.circleColor ?? circleColor}
              />
              <circle
                cx={line.end.x}
                cy={line.end.y}
                r={circleRadius}
                fill={styles?.circleColor ?? circleColor}
              />
            </g>
          );
        })}
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
            <circle cx={dragLine.start.x} cy={dragLine.start.y} r={circleRadius} fill={circleColor} />
            <circle cx={dragLine.end.x} cy={dragLine.end.y} r={circleRadius} fill={circleColor} />
          </g>
        )}
      </svg>

      <div className="relative z-10 space-y-3">
        {questions.map((question) => {
          const answerId = matches[question.id];
          const styles =
            answerId === undefined
              ? undefined
              : getMatchStyles?.({ questionId: question.id, answerId });
          return (
            <button
              key={question.id}
              ref={(element) => void (questionRefs.current[question.id] = element)}
              type="button"
              disabled={disabled}
              onPointerDown={(event) => handlePointerDown(event, question.id)}
              onClick={() => answerId !== undefined && removeMatch(question.id)}
              className={cn(
                "p-4 rounded bg-black text-white w-full touch-none font-medium focus:outline-none focus:ring-2 focus:ring-gray-500",
                answerId !== undefined && "bg-gray-700",
                questionClassName,
                styles?.questionClassName
              )}
            >
              {question.text}
            </button>
          );
        })}
      </div>

      <div className="relative z-10 space-y-3">
        {answers.map((answer) => {
          const answerMatches = toMatches(matches).filter((match) => match.answerId === answer.id);
          return (
            <button
              key={answer.id}
              ref={(element) => void (answerRefs.current[answer.id] = element)}
              type="button"
              disabled={disabled}
              onPointerUp={(event) => handlePointerUp(event, answer.id)}
              className={cn(
                "p-4 rounded bg-black text-white w-full touch-none font-medium focus:outline-none focus:ring-2 focus:ring-gray-500",
                answerMatches.length > 0 && "bg-gray-700",
                answerClassName,
                answerMatches.map((match) => getMatchStyles?.(match)?.answerClassName)
              )}
            >
              {answer.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
