/* eslint-disable @typescript-eslint/no-explicit-any */
import { RotateCcw, Timer } from "lucide-react";
import OpenAI from "openai";
import React, { useEffect, useState } from "react";
import { ALL_CATEGORIES, getRandomOptionsForCategory } from "./categories";

interface Category {
  id: string;
  name: string;
  prompt: string;
}

interface GameConfig {
  duration: number;
  categories: Category[];
}

interface GameResult {
  prompt: string;
  correct: boolean;
}

interface GameSetupProps {
  onStartGame: (duration: number, categories: Category[]) => void;
  isLoading: boolean;
}

interface GameScreenProps {
  duration: number;
  initialPrompts: string[];
  category: Category;
  onGameEnd: (results: GameResult[]) => void;
  promptCategories: Record<string, string>;
}

interface GameEndProps {
  results: GameResult[];
  onPlayAgain: () => void;
}

interface GameState {
  availablePrompts: string[];
  usedPrompts: string[];
  isLoadingMore: boolean;
  promptCategories: Record<string, string>;
}

interface CountdownProps {
  onComplete: () => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const BASE_PROMPT = `Generate exactly {count} {category} for a game of charades.
Format: One item per line, no numbers, no extra text.
Keep items simple, and don't only include the most popular items (otherwise, it's the same every time).
Items should be easy to describe or act out.
Do not include any introductory text or explanations.
{exclusions}`;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, you should make API calls from your backend
});

const getRandomPastelTheme = () => {
  const themes = [
    {
      primary: "bg-rose-100 text-rose-800",
      secondary: "bg-rose-600 text-white",
      accent: "bg-rose-50",
      border: "border-rose-200",
      hover: "hover:bg-rose-700",
      focus: "focus:ring-rose-500 focus:border-rose-500",
      checkbox: "text-rose-600",
    },
    {
      primary: "bg-sky-100 text-sky-800",
      secondary: "bg-sky-600 text-white",
      accent: "bg-sky-50",
      border: "border-sky-200",
      hover: "hover:bg-sky-700",
      focus: "focus:ring-sky-500 focus:border-sky-500",
      checkbox: "text-sky-600",
    },
    {
      primary: "bg-violet-100 text-violet-800",
      secondary: "bg-violet-600 text-white",
      accent: "bg-violet-50",
      border: "border-violet-200",
      hover: "hover:bg-violet-700",
      focus: "focus:ring-violet-500 focus:border-violet-500",
      checkbox: "text-violet-600",
    },
    {
      primary: "bg-teal-100 text-teal-800",
      secondary: "bg-teal-600 text-white",
      accent: "bg-teal-50",
      border: "border-teal-200",
      hover: "hover:bg-teal-700",
      focus: "focus:ring-teal-500 focus:border-teal-500",
      checkbox: "text-teal-600",
    },
  ];
  return themes[Math.floor(Math.random() * themes.length)];
};

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame, isLoading }) => {
  const [duration, setDuration] = useState<number>(1);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(["misc"])
  );
  const [customCategory, setCustomCategory] = useState("");
  const theme = useState(() => getRandomPastelTheme())[0];

  const handleCategoryClick = (categoryId: string, isCheckbox: boolean) => {
    setSelectedCategories((prev) => {
      const newSelection = new Set(prev);

      if (categoryId === "misc") {
        // If "All Categories" is clicked, clear other selections and select only "misc"
        newSelection.clear();
        newSelection.add("misc");
      } else if (isCheckbox) {
        // If another category is checkbox-clicked while "misc" is selected, clear "misc"
        if (newSelection.has("misc")) {
          newSelection.delete("misc");
        }

        // Checkbox click: toggle selection
        if (newSelection.has(categoryId)) {
          newSelection.delete(categoryId);
        } else {
          newSelection.add(categoryId);
        }
      } else {
        // Text click: exclusive selection
        newSelection.clear();
        newSelection.add(categoryId);
      }

      // Ensure at least one category is selected
      if (newSelection.size === 0) {
        newSelection.add(categoryId);
      }

      return newSelection;
    });
  };

  const handleStartGame = () => {
    const selectedCategoryObjects: Category[] = ALL_CATEGORIES.filter((cat) =>
      selectedCategories.has(cat.id)
    );

    if (selectedCategories.has("custom") && customCategory.trim()) {
      const customCategoryObj = {
        id: "custom",
        name: customCategory.trim(),
        prompt: customCategory.trim(),
      };
      selectedCategoryObjects.push(customCategoryObj);
    }

    onStartGame(duration, selectedCategoryObjects);
  };

  useEffect(() => {
    // Save original body style
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // Disable scroll
    document.body.style.overflow = "hidden";

    // Cleanup function to restore scroll
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []); // Empty dependency array since we want this to run once on mount

  return (
    <div
      className={`flex flex-col items-center justify-start min-h-screen ${theme.accent} p-6`}
    >
      <div className="w-full max-w-md space-y-8">
        <h1
          className={`text-5xl font-bold text-center ${
            theme.primary.split(" ")[1]
          } tracking-tight`}
        >
          Charader
        </h1>

        <div className="space-y-6">
          <label className="block">
            <span
              className={`text-xl font-medium ${
                theme.primary.split(" ")[1]
              } mb-3 block`}
            >
              Round Duration
            </span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={`mt-2 block w-full rounded-xl py-3.5 px-4 shadow-sm ${theme.border} ${theme.focus} text-lg`}
              disabled={isLoading}
            >
              <option value={0.5}>30 seconds</option>
              <option value={1}>1 minute</option>
              <option value={2}>2 minutes</option>
              <option value={3}>3 minutes</option>
              <option value={4}>4 minutes</option>
              <option value={5}>5 minutes</option>
            </select>
          </label>

          <div className="block">
            <span
              className={`text-xl font-medium ${
                theme.primary.split(" ")[1]
              } mb-3 block`}
            >
              Categories
            </span>
            <div
              className={`max-h-72 overflow-y-auto space-y-2 ${theme.primary} rounded-xl border ${theme.border} p-4`}
            >
              {ALL_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${
                    selectedCategories.has(cat.id)
                      ? theme.accent
                      : "hover:bg-white/50"
                  } transition-colors duration-200`}
                  onClick={(e) => {
                    if (
                      e.target instanceof HTMLElement &&
                      !e.target.closest("input")
                    ) {
                      handleCategoryClick(cat.id, false);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedCategories.has("misc")
                        ? cat.id !== "custom"
                        : selectedCategories.has(cat.id)
                    }
                    disabled={
                      selectedCategories.has("misc") && cat.id !== "misc"
                    }
                    onChange={() => handleCategoryClick(cat.id, true)}
                    className={`rounded-lg w-5 h-5 ${theme.checkbox} ${theme.focus} ${theme.border}`}
                  />
                  <span
                    className={`flex-grow text-lg ${
                      selectedCategories.has("misc") && cat.id !== "misc"
                        ? "opacity-50"
                        : ""
                    }`}
                  >
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedCategories.has("custom") && (
            <label className="block">
              <span
                className={`text-xl font-medium ${
                  theme.primary.split(" ")[1]
                } mb-3 block`}
              >
                Custom Category
              </span>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter your category (e.g., Disney Characters)"
                className={`mt-2 block w-full rounded-xl py-3.5 px-4 shadow-sm ${theme.border} ${theme.focus} text-lg`}
                disabled={isLoading}
              />
            </label>
          )}
        </div>

        <button
          onClick={handleStartGame}
          disabled={
            isLoading ||
            (selectedCategories.has("custom") && !customCategory.trim())
          }
          className={`w-full py-4 px-6 text-xl font-semibold rounded-xl ${theme.secondary} ${theme.hover} focus:outline-none focus:ring-2 ${theme.focus} focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative shadow-lg transform transition-transform active:scale-[0.98]`}
        >
          {isLoading ? (
            <>
              <span className="opacity-0">Start Game</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            </>
          ) : (
            "Start Game"
          )}
        </button>
      </div>
    </div>
  );
};

const Countdown: React.FC<CountdownProps> = ({ onComplete }) => {
  const [count, setCount] = useState(3);

  const playCountdownSound = (number: number) => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (number > 0) {
      // Higher pitched "tick" sound
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );
    } else {
      // Lower pitched "start" sound
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        880,
        audioContext.currentTime + 0.1
      );
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + (number > 0 ? 0.1 : 0.2));
  };

  useEffect(() => {
    if (count > 0) {
      playCountdownSound(count);
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      playCountdownSound(0);
      onComplete();
    }
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-purple-50">
      <div className="text-center">
        <div className="text-8xl font-bold text-purple-800 animate-bounce">
          {count > 0 ? count : "GO!"}
        </div>
      </div>
    </div>
  );
};

const GameScreen: React.FC<GameScreenProps> = ({
  duration,
  initialPrompts,
  category,
  onGameEnd,
  promptCategories,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(duration * 60);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    availablePrompts: initialPrompts,
    usedPrompts: [],
    isLoadingMore: false,
    promptCategories,
  });
  const [showCountdown, setShowCountdown] = useState(true);

  useEffect(() => {
    // Check if we need to fetch more prompts
    if (
      gameState.availablePrompts.length - currentPromptIndex <= 10 &&
      !gameState.isLoadingMore
    ) {
      const fetchMorePrompts = async () => {
        setGameState((prev) => ({ ...prev, isLoadingMore: true }));
        try {
          const exclusionText =
            gameState.usedPrompts.length > 0
              ? `\nDo not include any of these items:\n${gameState.usedPrompts.join(
                  "\n"
                )}`
              : "";

          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: BASE_PROMPT.replace("{count}", "60")
                  .replace("{category}", category.prompt)
                  .replace("{exclusions}", exclusionText),
              },
            ],
            temperature: 2,
          });

          const newPrompts = shuffleArray(
            completion.choices[0].message.content
              ?.split("\n")
              .map((line) => line.replace(/^\d+\.\s*/, ""))
              .filter(Boolean) || []
          );

          setGameState((prev) => ({
            ...prev,
            availablePrompts: [...prev.availablePrompts, ...newPrompts],
            isLoadingMore: false,
          }));
        } catch (error) {
          console.error("Failed to fetch more prompts:", error);
          setGameState((prev) => ({ ...prev, isLoadingMore: false }));
        }
      };

      fetchMorePrompts();
    }
  }, [
    category.prompt,
    currentPromptIndex,
    gameState.availablePrompts.length,
    gameState.isLoadingMore,
    gameState.usedPrompts,
  ]);

  const playSound = (correct: boolean) => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (correct) {
      // Higher pitched "success" sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        1200,
        audioContext.currentTime + 0.1
      );
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );
    } else {
      // Lower pitched "skip" sound
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        200,
        audioContext.currentTime + 0.1
      );
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playCountdownBeep = () => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playGameEndSound = () => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Descending tone sequence
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.6
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.6);
  };

  const handleResult = (correct: boolean): void => {
    playSound(correct);

    const currentPrompt = gameState.availablePrompts[currentPromptIndex];

    setResults((prev) => [...prev, { prompt: currentPrompt, correct }]);
    setGameState((prev) => ({
      ...prev,
      usedPrompts: [...prev.usedPrompts, currentPrompt],
    }));

    // If we're out of prompts and still loading, don't increment the index
    if (
      currentPromptIndex >= gameState.availablePrompts.length - 1 &&
      gameState.isLoadingMore
    ) {
      return;
    }

    setCurrentPromptIndex((prev) => prev + 1);
  };

  useEffect(() => {
    if (showCountdown) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          playGameEndSound();
          onGameEnd(results);
          return 0;
        }
        if (prev <= 10) {
          playCountdownBeep();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onGameEnd, results, showCountdown]);

  useEffect(() => {
    // Save original body style
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // Disable scroll
    document.body.style.overflow = "hidden";

    // Cleanup function to restore scroll
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []); // Empty dependency array since we want this to run once on mount

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (showCountdown) {
    return <Countdown onComplete={() => setShowCountdown(false)} />;
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-purple-50">
      <div className="w-full p-4 bg-purple-600 text-white">
        <div className="flex justify-center items-center text-4xl">
          <Timer className="mr-2" />
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-4">
        {currentPromptIndex >= gameState.availablePrompts.length ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-800 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-purple-800">
              Loading more prompts...
            </h2>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-6xl font-bold text-purple-800">
              {gameState.availablePrompts[currentPromptIndex]}
            </h1>
            <div className="text-xl mt-6 text-purple-600 opacity-75">
              {
                gameState.promptCategories[
                  gameState.availablePrompts[currentPromptIndex]
                ]
              }
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-0 flex pointer-events-none">
        <button
          onClick={() => handleResult(true)}
          className="w-1/2 h-screen pointer-events-auto bg-green-500 bg-opacity-10 hover:bg-opacity-20 transition-colors duration-200"
        />
        <button
          onClick={() => handleResult(false)}
          className="w-1/2 h-screen pointer-events-auto bg-orange-500 bg-opacity-10 hover:bg-opacity-20 transition-colors duration-200"
        />
      </div>
    </div>
  );
};

const GameEnd: React.FC<GameEndProps> = ({ results, onPlayAgain }) => {
  const correctCount = results.filter((r) => r.correct).length;

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center text-purple-800">
          Game Over!
        </h1>

        <div className="text-2xl text-center text-purple-700">
          Score: {correctCount} / {results.length}
        </div>

        <div className="space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg bg-white ${
                result.correct ? "opacity-100" : "opacity-50"
              }`}
            >
              {result.prompt}
            </div>
          ))}
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full py-3 px-4 text-xl font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          <div className="flex items-center justify-center">
            <RotateCcw className="mr-2" />
            Play Again
          </div>
        </button>
      </div>
    </div>
  );
};

const isOnline = (): boolean => {
  return navigator.onLine;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<"setup" | "playing" | "end">(
    "setup"
  );
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [results, setResults] = useState<GameResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [promptCategories, setPromptCategories] = useState<
    Record<string, string>
  >({});

  const startGame = async (
    duration: number,
    categories: Category[]
  ): Promise<void> => {
    try {
      setIsLoading(true);
      const allPrompts: string[] = [];
      const promptsPerCategory = Math.ceil(50 / categories.length);
      const _promptCategories: Record<string, string> = {};

      if (categories.length === 1 && categories[0].id === "misc") {
        categories = ALL_CATEGORIES.filter(
          (c) => c.id !== "custom" && c.id !== "misc"
        );
      }

      for (const category of categories) {
        let categoryPrompts: string[] = [];

        if (category.id === "custom") {
          if (!isOnline()) {
            // In offline mode, use a default message for custom categories
            categoryPrompts = ["Custom categories require internet connection"];
          } else {
            // Use ChatGPT for custom categories when online
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: BASE_PROMPT.replace(
                    "{count}",
                    promptsPerCategory.toString()
                  )
                    .replace("{category}", category.prompt)
                    .replace("{exclusions}", ""),
                },
              ],
              temperature: 1.5,
            });

            categoryPrompts =
              completion.choices[0].message.content
                ?.split("\n")
                .map((line) => line.replace(/^\d+\.\s*/, ""))
                .filter(Boolean) || [];
          }
        } else {
          // Use predefined options for non-custom categories
          categoryPrompts = getRandomOptionsForCategory(
            category.id,
            promptsPerCategory
          );
        }

        // Add each prompt to the category mapping
        categoryPrompts.forEach((prompt) => {
          _promptCategories[prompt] = category.name;
        });

        allPrompts.push(...categoryPrompts);
      }

      const shuffledPrompts = shuffleArray(allPrompts);
      setPrompts(shuffledPrompts);
      setPromptCategories(_promptCategories);
      setGameConfig({ duration, categories });
      setGameState("playing");
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const endGame = (results: GameResult[]): void => {
    setResults(results);
    setGameState("end");
  };

  const resetGame = (): void => {
    setGameState("setup");
    setGameConfig(null);
    setPrompts([]);
    setResults([]);
  };

  return (
    <div className="min-h-screen">
      {gameState === "setup" && (
        <GameSetup onStartGame={startGame} isLoading={isLoading} />
      )}
      {gameState === "playing" && gameConfig && (
        <GameScreen
          duration={gameConfig.duration}
          initialPrompts={prompts}
          category={gameConfig.categories[0]}
          onGameEnd={endGame}
          promptCategories={promptCategories}
        />
      )}
      {gameState === "end" && (
        <GameEnd results={results} onPlayAgain={resetGame} />
      )}
    </div>
  );
};

export default App;
