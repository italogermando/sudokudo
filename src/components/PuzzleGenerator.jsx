'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Printer } from "lucide-react";

const generateSudoku = (difficulty = 'easy', seed = 0) => {
  // Use a seeded random number generator for consistent initial state
  const seededRandom = (seed) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const grid = Array(9).fill().map(() => Array(9).fill(0));
  
  const isValid = (num, pos) => {
    const [row, col] = pos;
    
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }
    
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true;
  };
  
  const fillGrid = (position = [0, 0]) => {
    const [row, col] = position;
    
    if (row === 9) return true;
    
    const nextPos = col === 8 ? [row + 1, 0] : [row, col + 1];
    
    if (grid[row][col] !== 0) return fillGrid(nextPos);
    
    const nums = [1,2,3,4,5,6,7,8,9];
    for (let i = 0; i < 9; i++) {
      const idx = Math.floor(seededRandom(seed + i + row * 9 + col) * nums.length);
      const num = nums[idx];
      nums.splice(idx, 1);
      
      if (isValid(num, [row, col])) {
        grid[row][col] = num;
        if (fillGrid(nextPos)) return true;
        grid[row][col] = 0;
      }
    }
    
    return false;
  };
  
  fillGrid();
  
  const cellsToRemove = {
    easy: 30,
    medium: 40,
    hard: 50
  };
  
  const puzzle = grid.map(row => [...row]);
  let removed = 0;
  while (removed < cellsToRemove[difficulty]) {
    const row = Math.floor(seededRandom(seed + removed) * 9);
    const col = Math.floor(seededRandom(seed + removed + 100) * 9);
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }
  
  return { puzzle, solution: grid };
};

const SudokuGrid = React.memo(({ puzzle, index, isSmall = false }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      {index !== undefined && (
        <div className="text-lg font-semibold">
          Puzzle #{index + 1}
        </div>
      )}
      <div 
        className={`grid grid-cols-9 gap-px bg-gray-300 p-1 ${isSmall ? 'w-64' : 'w-96'}`}
        suppressHydrationWarning
      >
        {puzzle.map((row, i) => 
          row.map((cell, j) => (
            <div 
              key={`${i}-${j}`}
              className={`
                flex items-center justify-center
                bg-white
                ${isSmall ? 'h-7 w-7 text-sm' : 'h-10 w-10 text-lg'}
                font-semibold
                ${j % 3 === 2 && j !== 8 ? 'border-r-2 border-gray-400' : ''}
                ${i % 3 === 2 && i !== 8 ? 'border-b-2 border-gray-400' : ''}
              `}
              suppressHydrationWarning
            >
              {cell !== 0 ? cell : ''}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

const PuzzlePreview = React.memo(({ puzzles, solutions, config }) => {
  if (!puzzles.length) return null;
  
  return (
    <div className="print:block hidden bg-white w-full">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Thinkloop Sudoku</h1>
          <p className="text-gray-600">
            Fill in the blank squares so that every row, column, and 3x3 box
            contains the numbers 1 to 9.
          </p>
        </div>

        <div 
          className={`grid ${config.layout === '4' ? 'grid-cols-2' : 'grid-cols-1'} gap-8`}
          suppressHydrationWarning
        >
          {puzzles.map((puzzle, index) => (
            <SudokuGrid 
              key={index}
              puzzle={puzzle}
              index={index}
            />
          ))}
        </div>

        {solutions.length > 0 && (
          <>
            <div className="page-break-before mt-8 mb-4">
              <h2 className="text-2xl font-bold text-center">Solutions</h2>
            </div>
            <div 
              className="grid grid-cols-2 gap-4"
              suppressHydrationWarning
            >
              {solutions.map((solution, index) => (
                <SudokuGrid 
                  key={index}
                  puzzle={solution}
                  index={index}
                  isSmall
                />
              ))}
            </div>
          </>
        )}

        <div 
          className="text-center text-sm text-gray-500 mt-8"
          suppressHydrationWarning
        >
          © {typeof window !== 'undefined' ? new Date().getFullYear() : 2024} Thinkloop
        </div>
      </div>
    </div>
  );
});

const PuzzleGenerator = () => {
    console.log('PuzzleGenerator renderizado');
  const [config, setConfig] = useState({
    gridSize: '9x9',
    difficulty: 'easy',
    font: 'sans-serif',
    puzzleCount: '1',
    layout: '1',
    outputFormat: 'pdf',
    uniqueSolution: true
  });

  // Use useMemo to ensure consistent initial puzzle generation
  const initialPuzzle = useMemo(() => generateSudoku('easy', 0), []);
  const [currentPuzzle, setCurrentPuzzle] = useState(initialPuzzle);
  const [puzzles, setPuzzles] = useState([]);
  const [solutions, setSolutions] = useState([]);

  // Ensure client-side only rendering for date-dependent operations
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update puzzle when difficulty changes
  useEffect(() => {
    setCurrentPuzzle(generateSudoku(config.difficulty, 0));
  }, [config.difficulty]);
  
  const handleGenerate = useCallback(() => {
    setCurrentPuzzle(generateSudoku(config.difficulty, 0));
  }, [config.difficulty]);
  
  const handleConfigChange = useCallback((key, value) => {
    setConfig(prev => ({...prev, [key]: value}));
  }, []);
  
  const handleGeneratePrint = useCallback(() => {
    if (!isClient) return;

    const newPuzzles = Array(parseInt(config.puzzleCount)).fill(null)
      .map((_, index) => generateSudoku(config.difficulty, index));
    
    setPuzzles(newPuzzles.map(p => p.puzzle));
    setSolutions(newPuzzles.map(p => p.solution));
    
    setTimeout(() => window.print(), 100);
  }, [config.puzzleCount, config.difficulty, isClient]);
  
  return (
    <>
      <Card className="w-full max-w-4xl print:hidden">
        <CardHeader>
          <CardTitle>Thinkloop Sudoku Generator</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col gap-4 w-full md:w-1/3">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Grid:</label>
                <Select 
                  value={config.gridSize}
                  onValueChange={(value) => handleConfigChange('gridSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9x9">9 x 9</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Level:</label>
                <Select 
                  value={config.difficulty}
                  onValueChange={(value) => handleConfigChange('difficulty', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Font:</label>
                <Select 
                  value={config.font}
                  onValueChange={(value) => handleConfigChange('font', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans-serif">Sans Serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium">Print options:</h3>
              
              <div>
                <label className="text-sm font-medium mb-1 block">No. of Puzzles:</label>
                <Select 
                  value={config.puzzleCount}
                  onValueChange={(value) => handleConfigChange('puzzleCount', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Layout:</label>
                <Select 
                  value={config.layout}
                  onValueChange={(value) => handleConfigChange('layout', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 per page</SelectItem>
                    <SelectItem value="4">4 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unique"
                  checked={config.uniqueSolution}
                  onCheckedChange={(checked) => handleConfigChange('uniqueSolution', checked)}
                />
                <label htmlFor="unique" className="text-sm font-medium">
                  Generate unique solution puzzles
                </label>
              </div>
              
              <Button className="w-full" onClick={handleGeneratePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Generate and Print
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <SudokuGrid puzzle={currentPuzzle.puzzle} />
            <Button onClick={handleGenerate}>
              Generate New Puzzle
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <PuzzlePreview 
        puzzles={puzzles}
        solutions={solutions}
        config={config}
      />
    </>
  );
};

export default PuzzleGenerator;