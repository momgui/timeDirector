import { Goal, Step, SlotCategory } from '../types';
import { GEMINI_API_KEY } from '../config';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

// Helper to reliably parse JSON from AI response
const parseAIResponse = (text: string) => {
    try {
        // 1. Remove markdown code blocks
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // 2. Try parsing directly
        try {
            return JSON.parse(cleanText);
        } catch (e) {
            // 3. If failed, try to extract the JSON object/array
            const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw e;
        }
    } catch (error) {
        console.error('JSON Parse Error. Raw text:', text);
        throw error;
    }
};

const fetchWithRetry = async (url: string, body: any, retries = 3) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`AI API Warning (Attempt ${i + 1}):`, JSON.stringify(errorData));
                if (response.status >= 500 && i < retries - 1) {
                    await new Promise(res => setTimeout(res, 1000 * (i + 1))); // exponential backoff
                    continue;
                }
                throw new Error(`AI API request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            lastError = error;
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, 1000 * (i + 1)));
                continue;
            }
        }
    }
    throw lastError;
};

export const generateQuestions = async (goalTitle: string, deadline: Date, context: string = ''): Promise<string[]> => {
    const today = new Date();
    const diffTime = Math.abs(deadline.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let numQuestions = 3;
    if (diffDays <= 3) numQuestions = 1;
    else if (diffDays <= 7) numQuestions = 2;
    else numQuestions = 3;

    // Mock response for MVP if no API key
    if (!GEMINI_API_KEY) {
        console.log('Using mock AI questions');
        return [
            "What is your main motivation?",
            "Do you have any specific constraints?",
            "What is the first small step you can take?"
        ].slice(0, numQuestions);
    }

    try {
        const prompt = `
      I have a goal: "${goalTitle}".
      The deadline is: ${deadline.toDateString()}.
      I have ${diffDays} days to complete it.
            ${context ? `Additional context/constraints: "${context}".` : ''}
      
      Generate ${numQuestions} short, specific questions to help me clarify the scope and break this down into actionable tasks.
      
      IMPORTANT CONSTRAINTS:
        1. Do NOT ask about the deadline, start date, or duration. I have already provided this.
        2. If the goal seems to be an ongoing habit or continuous learning (e.g., learning a language, exercising), focus questions on the *tools* (e.g., Duolingo, gym class), *frequency*, and *routine* to establish.
        3. If the goal is a finite project, focus on the *content*, *resources*, *preferences*, or *sub-goals*.
      
      Return ONLY a JSON array of strings.Example: ["Question 1?", "Question 2?"]
    `;

        const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        const text = data.candidates[0].content.parts[0].text;
        return parseAIResponse(text);

    } catch (error) {
        console.warn('AI Question Generation Warning:', error);
        return [
            "What is the most important outcome?",
            "Are there any blockers?",
            "How much time can you dedicate daily?"
        ].slice(0, numQuestions);
    }
};

export const generateSteps = async (goalTitle: string, deadline: Date, contextAnswers: { question: string, answer: string }[] = [], initialContext: string = ''): Promise<{ steps: Step[], category: SlotCategory }> => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1); // Start from tomorrow

    const diffTime = Math.abs(deadline.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Logic to determine appropriate task count - FEWER TASKS, BIGGER CHECKPOINTS
    const maxTasks = Math.max(1, Math.ceil(diffDays / 2)); // Max 1 task every 2 days
    const idealTasks = Math.max(1, Math.ceil(diffDays / 3)); // Aim for 1 task every 3 days

    // Mock response for MVP if no API key
    if (!GEMINI_API_KEY) {
        console.log('Using mock AI response');
        return generateMockSteps(goalTitle, deadline);
    }

    try {
        const contextStr = contextAnswers.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n');

        const prompt = `
      **ROLE:** You are a **Strategic Goal Architect**. Your purpose is to deconstruct high-level goals into a coherent, sequential roadmap of major **MILESTONES**.

      **INPUT DATA:**
      - **Goal:** "${goalTitle}"
      - **Deadline:** ${deadline.toDateString()}
      - **Start Date:** ${startDate.toDateString()}
      - **Total Duration:** ${diffDays} days
      - **Initial Context:** "${initialContext}"
      - **User Q&A Context:**
      ${contextStr}

      **OBJECTIVE:**
      Create a strategic plan consisting of **${Math.max(1, Math.floor(idealTasks * 0.5))} to ${maxTasks}** distinct MILESTONES.
      
      **CRITICAL REASONING & CONSTRAINTS:**
      1.  **Analyze the User's Intent (Project vs Habit):**
          - IS THIS A FINITE PROJECT? (e.g., "Build a website", "Read 5 books"). If so, create logical PHASES or deliverables (e.g., "Design mockups", "Book 1").
          - IS THIS A CONTINUOUS HABIT/LEARNING GOAL? (e.g., "Learn Japanese", "Exercise more"). If so, create milestones based on TIME or CONSISTENCY (e.g., "Week 1: Establish Routine", "Month 1: 20 days of consistent practice"). Do NOT decompose the learning content itself (e.g., "Learn basic vocabulary") for habit goals.
          - **CRITICAL - USER METHODS:** Read the Initial Context and User Q&A Context carefully. If the user specifies particular methods, tools, or resources (e.g., "Duolingo", "Read books", "Anki"), your milestones MUST strictly reflect the usage of those specific tools (e.g., "Use Duolingo for 7 consecutive days", "Read first 50 pages"). NEVER invent generic milestones like "Master basic grammar" or "Learn vocabulary" if the user has provided their own methods.
      
      2.  **Milestone Definition:**
          - A "Milestone" is a **significant checkpoint**, **deliverable**, or a **consistency target**.
          - **Bad:** "Open the app today" (Too small for a milestone)
          - **Good (Project):** "Complete Chapter 1-3 & Exercises" (Substantial deliverable)
          - **Good (Habit):** "Complete 14 consecutive days of practice" (Consistency target)
      
      3.  **Time Estimation:**
          - Assign an \`estimatedMinutes\` value to each milestone.
          - This represents the *total effort* to reach that checkpoint.
          - For substantial milestones, this should be **60 minutes or more**.
      
      4.  **Categorization:**
          - Assign the ENTIRE goal to one of these categories: ' WORK ', 'PROJECTS', 'PERSONAL', 'STUDY'.

      5.  **Output Format:**
          - Return ONLY a valid JSON object.
          - Schema:
            {
              "category": "string",
              "steps": [
                {
                  "title": "string (Action-oriented, clear)",
                  "description": "string (What is achieved here?)",
                  "effort": number (1-5),
                  "estimatedMinutes": number
                }
              ]
            }
    `;

        const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Invalid AI response format:', data);
            throw new Error('Invalid AI response format');
        }

        const text = data.candidates[0].content.parts[0].text;
        const parsedData = parseAIResponse(text);

        const steps = parsedData.steps.map((s: any, index: number) => ({
            id: uuidv4(),
            goalId: '', // Will be assigned when saving
            title: s.title,
            description: s.description,
            sequenceOrder: index, // Maintain order
            isCompleted: false,
            effort: s.effort || 3,
            estimatedMinutes: s.estimatedMinutes || 60, // Default to 60m if missing
            category: parsedData.category as SlotCategory,
            isMilestone: true,
        }));

        // --- Proportional Scheduling Logic ---
        // 1. Calculate total estimated minutes (of milestones)
        const totalMinutes = steps.reduce((sum: number, step: any) => sum + (step.estimatedMinutes || 60), 0);

        // 2. Calculate total available duration in milliseconds
        const totalDurationMs = deadline.getTime() - startDate.getTime();

        // 3. Assign dates based on proportion
        let accumulatedMinutes = 0;
        steps.forEach((step: any) => {
            const stepMinutes = step.estimatedMinutes || 60;

            // Calculate the proportion of time this step takes relative to the total work
            // Then map that proportion to the total calendar duration
            // We place the milestone at the END of its proportional block
            accumulatedMinutes += stepMinutes;
            const proportion = accumulatedMinutes / totalMinutes;
            const timeOffsetMs = proportion * totalDurationMs;

            const scheduledDate = new Date(startDate.getTime() + timeOffsetMs);

            // Assign as fixed date
            step.date = scheduledDate;
        });

        return { steps, category: parsedData.category as SlotCategory };

    } catch (error) {
        console.warn('AI Generation Warning:', error);
        return generateMockSteps(goalTitle, deadline);
    }
};

const generateMockSteps = (goalTitle: string, deadline: Date): { steps: Step[], category: SlotCategory } => {
    const steps: Step[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1); // Start from tomorrow

    const diffTime = Math.abs(deadline.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Mock logic: 1 checkpoint every 3 days
    const numSteps = Math.max(1, Math.ceil(diffDays / 3));

    for (let i = 0; i < numSteps; i++) {
        steps.push({
            id: uuidv4(),
            goalId: '',
            title: `Checkpoint ${i + 1}: ${goalTitle}`,
            description: `Major milestone to achieve`,
            // date: undefined,
            sequenceOrder: i,
            isCompleted: false,
            effort: Math.floor(Math.random() * 3) + 3, // Higher effort for checkpoints
            estimatedMinutes: 120, // Mock estimate
            isMilestone: true,
        });
    }
    return { steps, category: 'PERSONAL' };
};

export const generateSubtasks = async (milestoneTitle: string, milestoneDescription: string, totalMinutes: number, parentId: string, category: SlotCategory = ' WORK ', parentEffort: number = 2): Promise<Step[]> => {
    // Deterministic splitting logic
    // Split into chunks of max 120 minutes
    const MAX_DURATION = 120;
    const count = Math.ceil(totalMinutes / MAX_DURATION);

    const timePerTask = Math.floor(totalMinutes / count);
    const remainder = totalMinutes % count;

    return Array.from({ length: count }).map((_, i) => {
        // Distribute remainder minutes to the first few tasks
        const extraMinute = i < remainder ? 1 : 0;
        const duration = timePerTask + extraMinute;

        return {
            id: uuidv4(),
            parentId,
            title: `${milestoneTitle} (${i + 1}/${count})`,
            description: milestoneDescription || `Part ${i + 1} of ${milestoneTitle}`,
            sequenceOrder: i,
            isCompleted: false,
            effort: parentEffort, // Inherit parent effort
            estimatedMinutes: duration,
            category: category,
            isMilestone: false,
        };
    });
};

export const splitMilestone = async (title: string, description: string, totalMinutes: number, category: string, parentId: string = '', mode: 'ai' | 'generic' = 'ai', parentEffort: number = 2, goalTitle: string = '', goalContext: string = '', previousMilestoneContext: string = ''): Promise<Step[]> => {
    if (mode === 'generic') {
        return generateSubtasks(title, description, totalMinutes, parentId, category as SlotCategory, parentEffort);
    }

    if (!GEMINI_API_KEY) {
        throw new Error('Problem with the Gemini API key');
    }

    try {
        const prompt = `
            **ROLE:** You are a **Tactical Task Decomposer**. Your mission is to break down a specific Milestone into a precise, executable sequence of **Sub-Tasks**.

            **INPUT CONTEXT:**
            - **Milestone:** "${title}"
            - **Description:** "${description}"
            - **Total Time Budget:** ${totalMinutes} minutes
            - **CATEGORY:** "${category}"
            - **PARENT GOAL:** "${goalTitle}"
            - **ADDITIONAL CONTEXT:** "${goalContext}"
            ${previousMilestoneContext ? `- **PREVIOUS HABITS TO CONTINUE:** "${previousMilestoneContext}"` : ''}

            **OBJECTIVE:**
            Generate a list of sub-tasks that are **atomic**, **action-oriented**, and **chronologically ordered**.
            Use the Parent Goal and Context to tailor the tone, complexity, and specific steps to the user's actual objective.

            **STRICT CONSTRAINTS:**
            1.  **Identify the Goal Type:** Is the Parent Goal a continuous habit/learning process (e.g., learning a language using an app) or a finite project?
            2.  **Habit/Continuous Learning Logic:** If it IS a habit goal, generate sub-tasks representing the ongoing actions. These MUST be repeatable, atomic actions focused on the *routine* and *tools*, NOT the educational curriculum.
                - **CRITICAL CONTEXT ADHERENCE:** If the PARENT GOAL or ADDITIONAL CONTEXT mentions specific tools or methods (e.g., "Duolingo", "reading books"), you MUST create tasks exactly for those methods. NEVER generate generic learning tasks like "Learn grammar", "Study vocabulary", or "Review syntax".
                - If the user mentions multiple distinct methods (e.g., Duolingo AND books), create one separate habit sub-task for each distinct method. If only one method/process is mentioned or implied, generate **ONLY ONE** sub-task.
                - **Bad:** "Learn 10 new words", "Study chapters 1-3" (Content-focused)
                - **Good:** "Practice 15 minutes on Duolingo", "Read a chapter of a Portuguese book" (Action-focused)
                - For habits, do NOT create multiple steps to fill the time block. Provide the correct \\\`habitDaysOfWeek\\\` array.
                - **CRITICAL:** If there are **PREVIOUS HABITS TO CONTINUE** in the context, you MUST include them as habit sub-tasks in this milestone to ensure the user continues their routine.
            3.  **Project Logic:** If it IS a finite project, follow a logical progression (e.g., Research -> Draft -> Edit).
            4.  **Time Integrity:** For normal projects, the sum of \\\`estimatedMinutes\\\` for all sub-tasks should be CLOSE to **${totalMinutes} minutes**. For habits, \\\`estimatedMinutes\\\` should just be the duration of a single session.
            5.  **Granularity:** Tasks should range from **15 to 60 minutes**.
            6.  **Action Verbs:** Start every title with a strong, unambiguous verb.

            **OUTPUT FORMAT:**
            Return ONLY a valid JSON object.
            Schema:
            {
                "steps": [
                    {
                        "title": "string",
                        "description": "string",
                        "effort": number (1-5),
                        "estimatedMinutes": number,
                        "isHabit": boolean (true if this should be a repeating habit, optional),
                        "habitDaysOfWeek": number[] (array of days 0=Sunday to 6=Saturday, required if isHabit is true)
                    }
                ]
            }
        `;

        const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        const text = data.candidates[0].content.parts[0].text;
        const parsedData = parseAIResponse(text);

        const steps = parsedData.steps.map((s: any, index: number) => ({
            id: uuidv4(),
            parentId: parentId, // Inherit parent ID
            title: s.title,
            description: s.description,
            sequenceOrder: index,
            isCompleted: false,
            effort: parentEffort, // Inherit parent effort, overriding AI suggestion
            estimatedMinutes: s.estimatedMinutes,
            category: category as SlotCategory,
            isMilestone: false, // Sub-tasks are NOT milestones
            isHabit: s.isHabit,
            habitDaysOfWeek: s.habitDaysOfWeek,
        }));

        // Force time integrity: Adjust last step to ensure sum equals totalMinutes
        // We still do this to keep the UI consistent, even if the AI was loose
        // EXCEPT for habits, where we want to keep the single session duration
        if (steps.length > 0 && !steps.some((s: any) => s.isHabit)) {
            const currentSum = steps.reduce((sum: number, s: any) => sum + s.estimatedMinutes, 0);
            const difference = totalMinutes - currentSum;

            if (difference !== 0) {
                const lastStep = steps[steps.length - 1];
                // Ensure we don't make the task disappear or become negative
                const newDuration = Math.max(5, lastStep.estimatedMinutes + difference);

                // If the adjustment would be too drastic, we might need a better strategy, 
                // but for now, we absorb the error in the last task.
                lastStep.estimatedMinutes = newDuration;

                // If the adjustment resulted in a change (it should), we are good. 
                // If newDuration was clamped to 5, the total might still be off, but it's safer than negative.
            }
        }

        return steps;

    } catch (error) {
        console.warn('AI Split Warning:', error);
        throw error;
    }
};
