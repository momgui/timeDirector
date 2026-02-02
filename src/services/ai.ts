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
        1. Do NOT ask about the deadline, start date, or duration.I have already provided this.
      2. Focus on the * content *, * resources *, * preferences *, or * sub - goals *.
      
      Return ONLY a JSON array of strings.Example: ["Question 1?", "Question 2?"]
    `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`AI API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        return parseAIResponse(text);

    } catch (error) {
        console.error('AI Question Generation Error:', error);
        return [
            "What is the most important outcome?",
            "Are there any blockers?",
            "How much time can you dedicate daily?"
        ].slice(0, numQuestions);
    }
};

export const generateSteps = async (goalTitle: string, deadline: Date, contextAnswers: { question: string, answer: string }[] = [], initialContext: string = '', autoSplit: boolean = true): Promise<{ steps: Step[], category: SlotCategory }> => {
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
      1.  **Analyze the User's Intent:**
          - IF the user provides specific numbers (e.g., "Read 5 books"), your milestones MUST reflect this structure (e.g., "Book 1", "Book 2").
          - IF the goal is broad (e.g., "Learn Python"), create logical PHASES (e.g., "Basics", "Advanced Concepts", "Project Build").
      
      2.  **Milestone Definition:**
          - A "Milestone" is a **significant checkpoint** or **deliverable**, NOT a small daily chore.
          - **Bad:** "Open the book" (Too small)
          - **Good:** "Complete Chapter 1-3 & Exercises" (Substantial)
      
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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('AI API Error:', errorData);
            throw new Error(`AI API request failed with status ${response.status}`);
        }

        const data = await response.json();

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
            isMilestone: true,
        }));

        // --- Deterministic Subtask Splitting ---
        const allSteps: Step[] = [];

        if (autoSplit) {
            for (let i = 0; i < steps.length; i++) {
                const milestone = steps[i];
                allSteps.push(milestone);

                if (i === 0) {
                    const subtasks = await splitMilestone(
                        milestone.title,
                        milestone.description || '',
                        milestone.estimatedMinutes || 60,
                        parsedData.category,
                        milestone.id,
                        'ai',
                        milestone.effort || 2
                    );
                    allSteps.push(...subtasks);
                }
            }

        } else {
            allSteps.push(...steps);
        }

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

        return { steps: allSteps, category: parsedData.category as SlotCategory };

    } catch (error) {
        console.error('AI Generation Error:', error);
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
        };
    });
};

export const splitMilestone = async (title: string, description: string, totalMinutes: number, category: string, parentId: string = '', mode: 'ai' | 'generic' = 'ai', parentEffort: number = 2): Promise<Step[]> => {
    if (mode === 'generic') {
        return generateSubtasks(title, description, totalMinutes, parentId, category as SlotCategory, parentEffort);
    }

    if (!GEMINI_API_KEY) {
        console.log('Using mock AI splitting (No API Key)');
        return generateSubtasks(title, description, totalMinutes, parentId, category as SlotCategory, parentEffort);
    }

    try {
        const prompt = `
            **ROLE:** You are a **Tactical Task Decomposer**. Your mission is to break down a specific Milestone into a precise, executable sequence of **Sub-Tasks**.

            **INPUT CONTEXT:**
            - **Milestone:** "${title}"
            - **Description:** "${description}"
            - **Total Time Budget:** ${totalMinutes} minutes
            - **Category:** "${category}"

            **OBJECTIVE:**
            Generate a list of sub-tasks that are **atomic**, **action-oriented**, and **chronologically ordered**.

            **STRICT CONSTRAINTS:**
            1.  **Time Integrity:** The sum of \`estimatedMinutes\` for all sub-tasks MUST equal EXACTLY **${totalMinutes} minutes**. This is non-negotiable.
            2.  **Granularity:**
                - Tasks should typically range from **15 to 60 minutes**.
                - If the milestone is short (< 30m), 1-2 tasks are fine.
                - If long (> 2h), break it down further.
            3.  **Action Verbs:** Start every title with a strong verb (e.g., "Draft", "Research", "Compile", "Review").
            4.  **Logical Flow:** Ensure the steps follow a natural progression (e.g., Research -> Draft -> Edit).

            **OUTPUT FORMAT:**
            Return ONLY a valid JSON object.
            Schema:
            {
                "steps": [
                    {
                        "title": "string",
                        "description": "string",
                        "effort": number (1-5),
                        "estimatedMinutes": number
                    }
                ]
            }
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`AI API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const parsedData = parseAIResponse(text);

        return parsedData.steps.map((s: any, index: number) => ({
            id: uuidv4(),
            parentId: parentId, // Inherit parent ID
            title: s.title,
            description: s.description,
            sequenceOrder: index,
            isCompleted: false,
            effort: parentEffort, // Inherit parent effort, overriding AI suggestion
            estimatedMinutes: s.estimatedMinutes,
            isMilestone: true, // Sub-milestones are also milestones
        }));

    } catch (error) {
        console.error('AI Split Error:', error);
        // Fallback to deterministic
        return generateSubtasks(title, description, totalMinutes, parentId, category as SlotCategory, parentEffort);
    }
};
