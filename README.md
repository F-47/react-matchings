# react-matchings

A React component for building question-and-answer matching interactions. It renders two columns of items and lets users connect questions to answers by dragging between them.

Default styles are included automatically when the component is imported. Consumers do not need to import a separate CSS file.

[View the package on npm](https://www.npmjs.com/package/react-matchings)

## Features

- Drag-to-connect matching interaction
- Pointer support for mouse, touch, and pen input
- Automatic scrolling while dragging near a scroll container edge
- One-to-one answers by default, with optional answer reuse
- Controlled matches and change callback for saving or validating answers
- Image or text content for questions and answers
- Custom classes for the container, question buttons, and answer buttons
- Configurable connector line color, endpoint color, radius, and offset
- Per-match styles for validation feedback
- Disabled state for submitted or read-only flows
- TypeScript definitions included

## Installation

```bash
npm install react-matchings
```

```bash
yarn add react-matchings
```

```bash
pnpm add react-matchings
```

## Usage

```tsx
import { Matching, type TMatch } from "react-matchings";

function App() {
  const questions = [
    { id: 1, text: "What is React?" },
    { id: 2, text: "What is TypeScript?" },
    { id: 3, text: "What is JavaScript?" },
  ];

  const answers = [
    { id: 1, text: "A JavaScript library for building user interfaces" },
    { id: 2, text: "A typed superset of JavaScript" },
    { id: 3, text: "A programming language for the web" },
  ];

  const handleChange = (matches: TMatch[]) => {
    console.log(matches);
  };

  return (
    <Matching questions={questions} answers={answers} onChange={handleChange} />
  );
}
```

Set `image` on a question or answer to render an image instead of its `text` (used for `alt`):

```tsx
const questions = [{ id: 1, text: "React logo", image: "/react-logo.png" }];
```

## Props

| Prop                | Type                             | Default     | Description                                                  |
| ------------------- | -------------------------------- | ----------- | ------------------------------------------------------------ |
| `questions`         | `{ id: number; text: string; image?: string }[]` | Required    | Items rendered in the left column. Set `image` to render an image instead of `text`. |
| `answers`           | `{ id: number; text: string; image?: string }[]` | Required    | Items rendered in the right column. Set `image` to render an image instead of `text`. |
| `matches`           | `TMatch[]`                       | `undefined` | Controlled match list. Use with `onChange` to own state.     |
| `defaultMatches`    | `TMatch[]`                       | `undefined` | Initial match list for uncontrolled usage.                   |
| `onChange`          | `(matches: TMatch[]) => void`    | `undefined` | Called whenever the user creates or removes a match.         |
| `className`         | `string`                         | `undefined` | Additional classes for the root container.                   |
| `questionClassName` | `string`                         | `undefined` | Additional classes for question buttons.                     |
| `answerClassName`   | `string`                         | `undefined` | Additional classes for answer buttons.                       |
| `lineColor`         | `string`                         | `"black"`   | CSS color value for connector lines.                         |
| `circleColor`       | `string`                         | `"white"`   | CSS color value for connector endpoints.                     |
| `circleRadius`      | `number`                         | `8`         | Radius of connector endpoints in pixels.                     |
| `offset`            | `number`                         | `10`        | Distance from button edges to connector endpoints in pixels. |
| `disabled`          | `boolean`                        | `false`     | Prevents users from creating or removing matches.            |
| `allowAnswerReuse`  | `boolean`                        | `false`     | Allows multiple questions to connect to the same answer.     |
| `autoScroll`        | `boolean \| TAutoScrollOptions`  | `true`      | Scrolls the nearest overflow container while dragging near an edge. |
| `getMatchStyles`    | `(match: TMatch) => TMatchStyles \| undefined` | `undefined` | Returns connector and item styles for an established match. |

## Types

```tsx
type TMatch = {
  questionId: number;
  answerId: number;
};

type TMatchStyles = {
  lineColor?: string;
  circleColor?: string;
  questionClassName?: string;
  answerClassName?: string;
};

type TAutoScrollOptions = {
  edgeThreshold?: number;
  maxSpeed?: number;
};
```

`onChange` receives the full list of current matches:

```tsx
const handleChange = (matches: TMatch[]) => {
  // Example: [{ questionId: 1, answerId: 2 }]
};
```

Use `defaultMatches` when you only need to seed the initial state:

```tsx
<Matching
  questions={questions}
  answers={answers}
  defaultMatches={[{ questionId: 1, answerId: 2 }]}
  onChange={setMatches}
/>
```

Use `matches` when the parent owns the current value:

```tsx
const [matches, setMatches] = useState<TMatch[]>([
  { questionId: 1, answerId: 2 },
]);

<Matching
  questions={questions}
  answers={answers}
  matches={matches}
  onChange={setMatches}
/>
```

## Styling

The component ships with default styles and injects them automatically in the browser. You can override the default button and layout styles with class props:

```tsx
<Matching
  questions={questions}
  answers={answers}
  className="max-w-3xl rounded-md border border-gray-200 p-6"
  questionClassName="bg-slate-900 text-white hover:bg-slate-700"
  answerClassName="bg-white text-slate-900 border border-slate-300"
  lineColor="#2563eb"
  circleColor="#dbeafe"
/>
```

If you use Tailwind CSS in the consuming application, these classes can be regular Tailwind utilities. Standard CSS class names also work.

## Example: Validated Assessment

```tsx
import { useMemo, useState } from "react";
import { Matching, type TMatch } from "react-matchings";

const questions = [
  { id: 1, text: "Capital of France" },
  { id: 2, text: "Capital of Japan" },
  { id: 3, text: "Capital of Australia" },
];

const answers = [
  { id: 1, text: "Paris" },
  { id: 2, text: "Tokyo" },
  { id: 3, text: "Canberra" },
];

const correctMatches: TMatch[] = [
  { questionId: 1, answerId: 1 },
  { questionId: 2, answerId: 2 },
  { questionId: 3, answerId: 3 },
];

export function Assessment() {
  const [matches, setMatches] = useState<TMatch[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    return matches.filter((match) =>
      correctMatches.some(
        (correct) =>
          correct.questionId === match.questionId &&
          correct.answerId === match.answerId,
      ),
    ).length;
  }, [matches]);

  return (
    <section>
      <Matching
        questions={questions}
        answers={answers}
        matches={matches}
        onChange={setMatches}
        disabled={submitted}
        getMatchStyles={(match) =>
          submitted &&
          !correctMatches.some(
            (correct) =>
              correct.questionId === match.questionId &&
              correct.answerId === match.answerId,
          )
            ? {
                lineColor: "#ef4444",
                circleColor: "#ef4444",
                questionClassName: "bg-red-500",
                answerClassName: "bg-red-500",
              }
            : undefined
        }
      />

      <button
        type="button"
        onClick={() => setSubmitted(true)}
        disabled={submitted || matches.length < questions.length}
      >
        Submit
      </button>

      {submitted && (
        <p>
          Score: {score} / {questions.length}
        </p>
      )}
    </section>
  );
}
```

## Behavior

- Press and drag from a question to an answer to create a match.
- Drag near the edge of an overflow container to scroll it.
- Click a matched question to remove its current match.
- A question can have one answer at a time.
- An answer can have one question by default. Connecting it again replaces its previous match.
- Set `allowAnswerReuse` to `true` to connect an answer to more than one question.
- `onChange` receives the complete match list after each create or remove action.

## Local Testing

From this repository:

```bash
npm run build
npm pack
```

Then install the generated tarball in a test React application:

```bash
npm install /absolute/path/to/react-matchings/react-matchings-0.1.4.tgz
```

Import only the component:

```tsx
import { Matching } from "react-matchings";
```

No CSS import is required.

## Browser Support

The component targets modern React applications and uses standard DOM, CSS Grid, and SVG APIs.

## License

MIT

## Author

Fares Galal
