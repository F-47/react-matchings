# react-matchings

A React component for interactive question-answer matching. Create engaging quiz and assessment interfaces where users can drag and drop connections between questions and answers.

## Features

- 🎯 **Drag and Drop Interface** - Intuitive drag-and-drop matching experience
- 🎨 **Highly Customizable** - Customize colors, styling, and behavior through props
- ♿ **Accessible** - Built with accessibility in mind
- 🎭 **Dynamic Styling** - Apply conditional styles based on component state
- 📱 **Responsive** - Works across different screen sizes
- 🎪 **Interactive Feedback** - Visual feedback during dragging and matching

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

## Basic Usage

First, import the component, its types, and CSS:

```tsx
import { Matching, type TMatch } from "react-matchings";
import "react-matchings/dist/index.css";

function App() {
  const questions = [
    { id: 1, text: "What is React?" },
    { id: 2, text: "What is TypeScript?" },
    { id: 3, text: "What is JavaScript?" },
  ];

  const answers = [
    { id: 1, text: "A JavaScript library for building UIs" },
    { id: 2, text: "A typed superset of JavaScript" },
    { id: 3, text: "A programming language" },
  ];

  const handleMatchChange = (matches: TMatch[]): void => {
    console.log("Current matches:", matches);
    // matches format: [{ questionId: 1, answerId: 1 }, ...]
  };

  return (
    <Matching
      questions={questions}
      answers={answers}
      onChange={handleMatchChange}
    />
  );
}
```

## Props

### Required Props

#### `questions`

Array of question objects to display on the left side.

**Type:** `{ id: number; text: string }[]`

**Example:**

```tsx
const questions = [
  { id: 1, text: "Capital of France?" },
  { id: 2, text: "Capital of Japan?" },
  { id: 3, text: "Capital of Australia?" },
];
```

---

#### `answers`

Array of answer objects to display on the right side.

**Type:** `{ id: number; text: string }[]`

**Example:**

```tsx
const answers = [
  { id: 1, text: "Paris" },
  { id: 2, text: "Tokyo" },
  { id: 3, text: "Canberra" },
];
```

**Note:** The number of questions and answers don't need to match. Users can connect any question to any answer.

---

### Optional Props

#### `onChange`

Callback function that is called whenever the matches change.

**Type:** `(matches: TMatch[]) => void`

**Default:** `undefined`

**Note:** Import `TMatch` type from the package: `import { type TMatch } from "react-matchings";`

**Example:**

```tsx
import { Matching, type TMatch } from "react-matchings";

const handleChange = (matches: TMatch[]): void => {
  // matches is an array of connections
  // Example: [{ questionId: 1, answerId: 2 }, { questionId: 2, answerId: 1 }]
  console.log("Matches updated:", matches);
  // Save to state, send to API, etc.
};

<Matching onChange={handleChange} ... />
```

**Note:** This prop is optional. If not provided, the component will still function but won't notify parent components of changes.

---

#### `className`

Additional CSS classes to apply to the container element.

**Type:** `string`

**Default:** `undefined`

**Example:**

```tsx
<Matching
  className="my-8 p-6 border border-gray-300 rounded-lg"
  questions={questions}
  answers={answers}
  onChange={handleChange}
/>
```

---

#### `questionClassName`

Custom CSS classes for question buttons.

**Type:** `string`

**Default:** `undefined`

**Example:**

```tsx
<Matching
  questionClassName="bg-blue-500 hover:bg-blue-600 text-white font-bold"
  questions={questions}
  answers={answers}
  onChange={handleChange}
/>
```

---

#### `answerClassName`

Custom CSS classes for answer buttons.

**Type:** `string`

**Default:** `undefined`

**Example:**

```tsx
<Matching
  answerClassName="bg-purple-500 hover:bg-purple-600 text-white"
  questions={questions}
  answers={answers}
  onChange={handleChange}
/>
```

---

#### `lineColor`

Color of the connecting lines.

**Type:** `string`

**Default:** `"black"`

**Example:**

```tsx
<Matching
  lineColor="#3b82f6"  // blue
  questions={questions}
  answers={answers}
  onChange={handleChange}
/>

// Or use CSS color names
<Matching
  lineColor="rgb(59, 130, 246)"
  questions={questions}
  answers={answers}
  onChange={handleChange}
/>
```

---

#### `circleColor`

Color of the circles at the ends of the connecting lines.

**Type:** `string`

**Default:** `"white"`

**Example:**

```tsx
<Matching
  circleColor="#f3f4f6" // light gray
  questions={questions}
  answers={answers}
  onChange={handleChange}
/>
```

---

#### `circleRadius`

Radius of the circles at the ends of the connecting lines, in pixels.

**Type:** `number`

**Default:** `8`

**Example:**

```tsx
<Matching
  circleRadius={12}
  questions={questions}
  answers={answers}
  onChange={handleChange}
/>
```

---

#### `offset`

Offset distance from the edges where lines connect, in pixels. Controls how far from the edge the connection points are.

**Type:** `number`

**Default:** `10`

**Example:**

```tsx
<Matching
  offset={15}
  questions={questions}
  answers={answers}
  onChange={handleChange}
/>
```

---

#### `disabled`

Whether the component is disabled. When disabled, users cannot create or remove matches.

**Type:** `boolean`

**Default:** `false`

**Example:**

```tsx
const [isDisabled, setIsDisabled] = useState(false);

<Matching
  disabled={isDisabled}
  questions={questions}
  answers={answers}
  onChange={handleChange}
/>

<button onClick={() => setIsDisabled(!isDisabled)}>
  {isDisabled ? "Enable" : "Disable"} Matching
</button>
```

---

## Complete Examples

### Example 1: Basic Quiz Component

```tsx
import { useState } from "react";
import { Matching, type TMatch } from "react-matchings";
import "react-matchings/dist/index.css";

function QuizApp() {
  const questions = [
    { id: 1, text: "What is the capital of France?" },
    { id: 2, text: "What is the capital of Japan?" },
    { id: 3, text: "What is the capital of Australia?" },
  ];

  const answers = [
    { id: 1, text: "Paris" },
    { id: 2, text: "Tokyo" },
    { id: 3, text: "Canberra" },
  ];

  const [matches, setMatches] = useState<TMatch[]>([]);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (): void => {
    setSubmitted(true);
    // Check answers, calculate score, etc.
    console.log("Submitted matches:", matches);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Geography Quiz</h1>

      <Matching
        questions={questions}
        answers={answers}
        onChange={setMatches}
        disabled={submitted}
      />

      <button
        onClick={handleSubmit}
        disabled={submitted || matches.length === 0}
        className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        Submit Answers
      </button>
    </div>
  );
}
```

### Example 2: Custom Styled Component

```tsx
import { Matching, type TMatch } from "react-matchings";
import "react-matchings/dist/index.css";

function StyledMatching() {
  const questions = [
    { id: 1, text: "Question 1" },
    { id: 2, text: "Question 2" },
  ];

  const answers = [
    { id: 1, text: "Answer 1" },
    { id: 2, text: "Answer 2" },
  ];

  const handleChange = (matches: TMatch[]): void => {
    console.log(matches);
  };

  return (
    <Matching
      questions={questions}
      answers={answers}
      onChange={handleChange}
      className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg"
      questionClassName="p-4 rounded-lg font-semibold transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600"
      answerClassName="p-4 rounded-lg font-semibold transition-all duration-200 bg-purple-500 text-white hover:bg-purple-600"
      lineColor="#8b5cf6"
      circleColor="#e9d5ff"
      circleRadius={10}
      offset={12}
    />
  );
}
```

### Example 3: With Initial Matches

```tsx
import { useState, useEffect } from "react";
import { Matching, type TMatch } from "react-matchings";
import "react-matchings/dist/index.css";

function MatchingWithInitialState() {
  const questions = [
    { id: 1, text: "React" },
    { id: 2, text: "Vue" },
    { id: 3, text: "Angular" },
  ];

  const answers = [
    { id: 1, text: "Facebook" },
    { id: 2, text: "Evan You" },
    { id: 3, text: "Google" },
  ];

  const [matches, setMatches] = useState<TMatch[]>([]);

  // Load initial matches (e.g., from localStorage or API)
  useEffect(() => {
    const savedMatches = localStorage.getItem("matches");
    if (savedMatches) {
      try {
        const parsed: TMatch[] = JSON.parse(savedMatches);
        setMatches(parsed);
      } catch (error) {
        console.error("Failed to parse saved matches:", error);
      }
    }
  }, []);

  // Save matches when they change
  const handleMatchChange = (newMatches: TMatch[]): void => {
    setMatches(newMatches);
    localStorage.setItem("matches", JSON.stringify(newMatches));
  };

  return (
    <Matching
      questions={questions}
      answers={answers}
      onChange={handleMatchChange}
    />
  );
}
```

### Example 4: Assessment with Validation

```tsx
import { useState, useMemo } from "react";
import { Matching, type TMatch } from "react-matchings";
import "react-matchings/dist/index.css";

function AssessmentComponent() {
  const questions = [
    { id: 1, text: "Primary color" },
    { id: 2, text: "Secondary color" },
    { id: 3, text: "Tertiary color" },
  ];

  const answers = [
    { id: 1, text: "Red, Blue, Yellow" },
    { id: 2, text: "Orange, Green, Purple" },
    { id: 3, text: "Red-Orange, Yellow-Green, Blue-Purple" },
  ];

  // Correct answers
  const correctMatches: TMatch[] = [
    { questionId: 1, answerId: 1 },
    { questionId: 2, answerId: 2 },
    { questionId: 3, answerId: 3 },
  ];

  const [matches, setMatches] = useState<TMatch[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);

  const score = useMemo(() => {
    if (!showResults) return null;
    const correct = matches.filter((match) =>
      correctMatches.some(
        (cm) =>
          cm.questionId === match.questionId && cm.answerId === match.answerId
      )
    ).length;
    return { correct, total: questions.length };
  }, [matches, showResults]);

  return (
    <div className="p-8">
      <Matching
        questions={questions}
        answers={answers}
        onChange={setMatches}
        disabled={showResults}
      />

      {showResults && score && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <p className="text-lg font-semibold">
            Score: {score.correct} / {score.total}
          </p>
        </div>
      )}

      <button
        onClick={() => setShowResults(true)}
        disabled={showResults || matches.length < questions.length}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded"
      >
        Check Answers
      </button>
    </div>
  );
}
```

## How It Works

1. **Drag to Connect**: Click and hold on a question, then drag to an answer and release to create a connection.

2. **Remove Connection**: Click on a matched question to remove its connection.

3. **Visual Feedback**:

   - Dragging shows a dashed line following your cursor
   - Matched items are visually distinguished
   - Hovering over answers while dragging highlights them

4. **State Management**: The `onChange` callback receives an array of all current matches whenever they change.

## Styling

The component uses Tailwind CSS for styling. Make sure to import the CSS file:

```tsx
import "react-matchings/dist/index.css";
```

You can override default styles using the className props, or customize the colors using the color props.

## TypeScript Support

This package includes full TypeScript definitions. Import types for type-safe usage:

```tsx
import { Matching, type TMatch } from "react-matchings";

// Use the TMatch type for type safety
const handleChange = (matches: TMatch[]): void => {
  // matches is properly typed as TMatch[]
  // Each match has questionId: number and answerId: number
  matches.forEach((match) => {
    console.log(match.questionId, match.answerId);
  });
};
```

The `TMatch` type is defined as:

```tsx
type TMatch = {
  questionId: number;
  answerId: number;
};
```

## Accessibility

The component includes accessibility features:

- Proper ARIA attributes (`aria-pressed`)
- Keyboard-friendly interactions
- Focus management
- Semantic HTML structure

## Browser Support

Works in all modern browsers that support:

- React 18+
- CSS Grid
- SVG
- Drag and Drop API

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Fares Galal
