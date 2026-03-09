import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const REVIEW_SYSTEM = `You are an expert code reviewer. Analyze the code and return valid JSON with:
- scores: { quality: 0-100, performance: 0-100, security: 0-100 }
- summary: string (2-3 sentences)
- bugs: [{severity:"critical"|"high"|"medium"|"low", title, description, fix?}]
- securityIssues: [{severity, title, description, recommendation}]
- suggestions: [{type:"performance"|"readability"|"bestpractice"|"refactor", title, description, originalCode?, optimizedCode?}]
- complexity: {level:"low"|"medium"|"high"|"very_high", explanation}
Return only valid JSON.`;

const QUIZ_QUESTIONS = [
  // Python
  { id: "p1", topic: "Python", question: "What is the output of list(range(2,10,3))?", options: ["[2,5,8]","[2,4,6,8]","[2,3,4]","[2,6,9]"], correct: 0, explanation: "range(start, stop, step): starts at 2, increments by 3: 2, 5, 8" },
  { id: "p2", topic: "Python", question: "Which data structure is immutable in Python?", options: ["List","Dictionary","Tuple","Set"], correct: 2, explanation: "Tuples cannot be modified after creation, making them immutable." },
  { id: "p3", topic: "Python", question: "What does the 'yield' keyword do?", options: ["Returns a value and exits","Creates a generator function","Pauses execution forever","Raises an exception"], correct: 1, explanation: "yield makes a function a generator, pausing and resuming execution." },
  { id: "p4", topic: "Python", question: "What is a list comprehension?", options: ["A loop inside a list","A concise way to create lists","A sorting method","A class method"], correct: 1, explanation: "[expr for item in iterable] creates lists concisely." },
  { id: "p5", topic: "Python", question: "What is the time complexity of dict lookup?", options: ["O(n)","O(log n)","O(1)","O(n²)"], correct: 2, explanation: "Python dicts use hash tables giving O(1) average lookup time." },
  // DSA
  { id: "d1", topic: "DSA", question: "What is the time complexity of binary search?", options: ["O(n)","O(n²)","O(log n)","O(1)"], correct: 2, explanation: "Binary search halves the search space each step: O(log n)." },
  { id: "d2", topic: "DSA", question: "Which data structure uses LIFO order?", options: ["Queue","Stack","Array","Linked List"], correct: 1, explanation: "Stack = Last In, First Out (LIFO)." },
  { id: "d3", topic: "DSA", question: "What is the space complexity of merge sort?", options: ["O(1)","O(log n)","O(n)","O(n log n)"], correct: 2, explanation: "Merge sort needs O(n) auxiliary space for merging." },
  { id: "d4", topic: "DSA", question: "Which traversal visits root last?", options: ["Inorder","Preorder","Postorder","Level order"], correct: 2, explanation: "Postorder: left → right → root." },
  { id: "d5", topic: "DSA", question: "A min-heap has what property?", options: ["Root is maximum","Root is minimum","Random order","Sorted array"], correct: 1, explanation: "In a min-heap, parent nodes are always smaller than children." },
  // AI/ML
  { id: "a1", topic: "AI", question: "What does 'overfitting' mean?", options: ["Model performs poorly on all data","Model memorizes training data too well","Model has too few parameters","Model trains too slowly"], correct: 1, explanation: "Overfitting: model learns noise in training data, poor generalization." },
  { id: "a2", topic: "AI", question: "What is a neural network activation function?", options: ["A loss function","A function adding non-linearity","A training algorithm","A data preprocessor"], correct: 1, explanation: "Activation functions like ReLU/sigmoid add non-linearity to networks." },
  { id: "a3", topic: "AI", question: "What does CNN stand for?", options: ["Centralized Neural Network","Convolutional Neural Network","Connected Node Network","Cyclic Neural Network"], correct: 1, explanation: "CNNs use convolution layers, ideal for image processing." },
  { id: "a4", topic: "AI", question: "What is gradient descent?", options: ["A data structure","An optimization algorithm","A neural layer type","A dataset format"], correct: 1, explanation: "Gradient descent iteratively minimizes the loss function." },
  { id: "a5", topic: "AI", question: "What is the purpose of dropout in neural networks?", options: ["Speed up training","Prevent overfitting","Increase model size","Reduce learning rate"], correct: 1, explanation: "Dropout randomly deactivates neurons during training to prevent overfitting." },
  // OS
  { id: "o1", topic: "OS", question: "What is a deadlock?", options: ["System overheating","Processes waiting for each other forever","Memory overflow","CPU bottleneck"], correct: 1, explanation: "Deadlock: circular wait where processes hold resources needed by each other." },
  { id: "o2", topic: "OS", question: "What is virtual memory?", options: ["GPU memory","RAM extension using disk space","Cache memory","ROM type"], correct: 1, explanation: "Virtual memory extends RAM by using disk as additional memory." },
  { id: "o3", topic: "OS", question: "What does FCFS stand for in CPU scheduling?", options: ["First Come First Served","Fast CPU File System","File Control For Scheduling","First CPU For Server"], correct: 0, explanation: "FCFS schedules processes in arrival order." },
  // DBMS
  { id: "db1", topic: "DBMS", question: "What does ACID stand for?", options: ["Array, Cache, Index, Data","Atomicity, Consistency, Isolation, Durability","Access, Control, Index, Database","Automatic, Concurrent, Integrated, Durable"], correct: 1, explanation: "ACID properties ensure reliable database transactions." },
  { id: "db2", topic: "DBMS", question: "What is a primary key?", options: ["A foreign key reference","A unique row identifier","An index type","A data type"], correct: 1, explanation: "Primary key uniquely identifies each record in a table." },
  { id: "db3", topic: "DBMS", question: "What is normalization?", options: ["Encrypting data","Organizing data to reduce redundancy","Indexing tables","Compressing records"], correct: 1, explanation: "Normalization organizes data to eliminate redundancy and dependency." },
];

const DSA_PROBLEMS = [
  { id: "arr1", title: "Two Sum", difficulty: "Easy", topic: "arrays", description: "Given an array of integers and a target, return indices of two numbers that add up to the target.", examples: "Input: [2,7,11,15], target=9\nOutput: [0,1]", hint: "Use a hash map to store complements." },
  { id: "arr2", title: "Best Time to Buy Stock", difficulty: "Easy", topic: "arrays", description: "Find the maximum profit from buying and selling a stock once. Given prices array.", examples: "Input: [7,1,5,3,6,4]\nOutput: 5", hint: "Track minimum price seen so far." },
  { id: "arr3", title: "Maximum Subarray", difficulty: "Medium", topic: "arrays", description: "Find the contiguous subarray with the largest sum (Kadane's Algorithm).", examples: "Input: [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6", hint: "Use Kadane's algorithm with dp[i] = max(nums[i], dp[i-1]+nums[i])." },
  { id: "str1", title: "Valid Palindrome", difficulty: "Easy", topic: "strings", description: "Check if a string is a palindrome, considering only alphanumeric characters.", examples: "Input: 'A man a plan a canal Panama'\nOutput: true", hint: "Use two pointers from both ends." },
  { id: "str2", title: "Longest Substring Without Repeating", difficulty: "Medium", topic: "strings", description: "Find the length of the longest substring without repeating characters.", examples: "Input: 'abcabcbb'\nOutput: 3", hint: "Use sliding window with a hash set." },
  { id: "tree1", title: "Maximum Depth of Binary Tree", difficulty: "Easy", topic: "trees", description: "Find the maximum depth of a binary tree.", examples: "Input: [3,9,20,null,null,15,7]\nOutput: 3", hint: "Use DFS recursion: 1 + max(left, right)." },
  { id: "tree2", title: "Invert Binary Tree", difficulty: "Easy", topic: "trees", description: "Invert a binary tree (mirror it).", examples: "Input: [4,2,7,1,3,6,9]\nOutput: [4,7,2,9,6,3,1]", hint: "Swap left and right children recursively." },
  { id: "tree3", title: "Lowest Common Ancestor", difficulty: "Medium", topic: "trees", description: "Find the lowest common ancestor of two nodes in a BST.", examples: "Input: root=[6,2,8], p=2, q=8\nOutput: 6", hint: "If both values are smaller/larger, go left/right; else current node is LCA." },
  { id: "graph1", title: "Number of Islands", difficulty: "Medium", topic: "graphs", description: "Count the number of islands in a 2D grid of '1's and '0's.", examples: "Input: grid with connected 1s\nOutput: count of islands", hint: "Use DFS/BFS to mark visited cells." },
  { id: "graph2", title: "Clone Graph", difficulty: "Medium", topic: "graphs", description: "Deep clone a connected undirected graph.", examples: "Input: adjacency list graph\nOutput: cloned graph", hint: "Use BFS with a hash map of original→copy nodes." },
  { id: "dp1", title: "Climbing Stairs", difficulty: "Easy", topic: "dp", description: "Count ways to climb n stairs, taking 1 or 2 steps at a time.", examples: "Input: n=5\nOutput: 8", hint: "dp[i] = dp[i-1] + dp[i-2] (Fibonacci pattern)." },
  { id: "dp2", title: "Coin Change", difficulty: "Medium", topic: "dp", description: "Find the minimum number of coins to make up the amount.", examples: "Input: coins=[1,5,11], amount=15\nOutput: 3", hint: "dp[i] = min(dp[i], dp[i-coin]+1) for each coin." },
  { id: "dp3", title: "Longest Common Subsequence", difficulty: "Medium", topic: "dp", description: "Find the LCS length of two strings.", examples: "Input: 'abcde', 'ace'\nOutput: 3", hint: "2D DP: if chars match, dp[i][j]=dp[i-1][j-1]+1, else max of neighbors." },
  { id: "bfs1", title: "Binary Tree Level Order Traversal", difficulty: "Medium", topic: "bfsdfs", description: "Return level-order traversal of binary tree nodes' values.", examples: "Input: [3,9,20,null,null,15,7]\nOutput: [[3],[9,20],[15,7]]", hint: "Use a queue, process level by level." },
  { id: "bfs2", title: "Word Ladder", difficulty: "Hard", topic: "bfsdfs", description: "Find shortest transformation sequence from beginWord to endWord.", examples: "Input: beginWord='hit', endWord='cog', wordList=[...]\nOutput: 5", hint: "BFS with each transformation as an edge." },
];

export async function registerRoutes(app: Express): Promise<Server> {
  // Code Review
  app.post("/api/review", async (req, res) => {
    try {
      const { code, language } = req.body;
      if (!code) return res.status(400).json({ error: "Code is required" });
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: REVIEW_SYSTEM },
          { role: "user", content: `Review this ${language || "code"}:\n\`\`\`${language || ""}\n${code}\n\`\`\`` },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });
      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      return res.json(result);
    } catch (e) {
      console.error("Review error:", e);
      return res.status(500).json({ error: "Failed to review code" });
    }
  });

  // Quiz Questions
  app.get("/api/quiz/questions", (req, res) => {
    const { topic, count = "10" } = req.query as { topic?: string; count?: string };
    let questions = topic ? QUIZ_QUESTIONS.filter(q => q.topic === topic) : QUIZ_QUESTIONS;
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return res.json(shuffled.slice(0, parseInt(count)));
  });

  // DSA Problems
  app.get("/api/problems", (req, res) => {
    const { topic } = req.query as { topic?: string };
    const problems = topic ? DSA_PROBLEMS.filter(p => p.topic === topic) : DSA_PROBLEMS;
    return res.json(problems.map(p => ({ ...p, hint: undefined })));
  });

  app.get("/api/problems/:id/hint", (req, res) => {
    const problem = DSA_PROBLEMS.find(p => p.id === req.params.id);
    if (!problem) return res.status(404).json({ error: "Not found" });
    return res.json({ hint: problem.hint });
  });

  // AI Interview
  app.post("/api/interview/question", async (req, res) => {
    try {
      const { topic = "data structures", difficulty = "medium", previousQuestions = [] } = req.body;
      const prev = previousQuestions.length > 0 ? `Already asked: ${previousQuestions.join(", ")}. Ask something different.` : "";
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `Generate one technical interview question about ${topic} at ${difficulty} level. ${prev} Return JSON: {"question": "...", "expectedPoints": ["point1", "point2", "point3"], "topic": "${topic}", "difficulty": "${difficulty}"}`,
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 512,
      });
      return res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch (e) {
      console.error("Interview question error:", e);
      return res.status(500).json({ error: "Failed to generate question" });
    }
  });

  app.post("/api/interview/evaluate", async (req, res) => {
    try {
      const { question, answer, expectedPoints } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `Evaluate this interview answer. Question: "${question}". Answer: "${answer}". Expected points: ${JSON.stringify(expectedPoints)}. Return JSON: {"score": 0-10, "grade": "Excellent"|"Good"|"Fair"|"Poor", "feedback": "...", "missedPoints": ["..."], "strengths": ["..."]}`,
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });
      return res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch (e) {
      console.error("Evaluation error:", e);
      return res.status(500).json({ error: "Failed to evaluate" });
    }
  });

  // Career Advisor
  app.post("/api/career/advice", async (req, res) => {
    try {
      const { skills, problemsSolved, quizAvg, interests } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `Based on: skills=${JSON.stringify(skills)}, problems solved=${problemsSolved}, quiz avg=${quizAvg}%, interests="${interests}". Give career advice. Return JSON: {"topPath": {"title":"...","description":"...","salary":"...","companies":["..."]}, "paths": [{"title":"...","match":0-100,"description":"...","nextSteps":["..."]}], "linkedinTips": ["..."], "linkedinPost": "...", "skillGaps": ["..."]}`,
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });
      return res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch (e) {
      console.error("Career advice error:", e);
      return res.status(500).json({ error: "Failed to get career advice" });
    }
  });

  // Learning Roadmap
  app.post("/api/roadmap/generate", async (req, res) => {
    try {
      const { level, skills, goals } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `Create a 7-day learning roadmap for a ${level} programmer with skills: ${JSON.stringify(skills)}, goals: "${goals}". Return JSON: {"overview": "...", "days": [{"day":1,"title":"...","tasks":["..."],"resources":["..."],"estimatedHours":number}], "tips": ["..."]}`,
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 3000,
      });
      return res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch (e) {
      console.error("Roadmap error:", e);
      return res.status(500).json({ error: "Failed to generate roadmap" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
