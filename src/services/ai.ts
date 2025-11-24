import { Goal, Step } from '../types';
import { GEMINI_API_KEY } from '../config';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

export const generateQuestions = async (goalTitle: string, deadline: Date): Promise<string[]> => {
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
      Generate ${numQuestions} short, specific questions to help me clarify the scope and break this down into actionable tasks.
      Return ONLY a JSON array of strings. Example: ["Question 1?", "Question 2?"]
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
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error('AI Question Generation Error:', error);
        return [
            "What is the most important outcome?",
            "Are there any blockers?",
            "How much time can you dedicate daily?"
        ].slice(0, numQuestions);
    }
};

export const generateSteps = async (goalTitle: string, deadline: Date, context: { question: string, answer: string }[] = []): Promise<Step[]> => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1); // Start from tomorrow

    const diffTime = Math.abs(deadline.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Logic to determine appropriate task count
    const maxTasks = Math.max(1, diffDays * 2); // Max 2 tasks per day on average
    const idealTasks = Math.min(diffDays, 10); // Aim for 1 task/day or capped at 10 for clarity

    // Mock response for MVP if no API key
    if (!GEMINI_API_KEY) {
        console.log('Using mock AI response');
        return generateMockSteps(goalTitle, deadline);
    }

    try {
        const contextStr = context.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n');

        const prompt = `
      I have a goal: "${goalTitle}".
      The deadline is: ${deadline.toDateString()}.
      The start date is: ${startDate.toDateString()}.
      Duration: ${diffDays} days.
      
      Here is some context based on my answers to your questions:
      ${contextStr}

      Please generate a plan with the following STRICT constraints:
      1. **Start Date:** The first task MUST be scheduled on or after ${startDate.toDateString()}. DO NOT schedule anything before this date.
      2. **Task Count:** Generate between ${Math.max(1, Math.floor(diffDays / 2))} and ${maxTasks} tasks. Do not overwhelm the user. Adapt the number of tasks to the complexity of the goal and the available time.
      3. **Distribution:** Distribute tasks logically over the available days.
      4. **Format:** Return ONLY a JSON array of objects with fields: "title", "description", "date" (YYYY-MM-DD).
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
        // Basic parsing, might need more robustness
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedSteps = JSON.parse(jsonStr);

        return parsedSteps.map((s: any) => ({
            id: uuidv4(),
            goalId: '', // Will be assigned when saving
            title: s.title,
            description: s.description,
            date: new Date(s.date),
            isCompleted: false,
        }));

    } catch (error) {
        console.error('AI Generation Error:', error);
        return generateMockSteps(goalTitle, deadline);
    }
};

const generateMockSteps = (goalTitle: string, deadline: Date): Step[] => {
    const steps: Step[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1); // Start from tomorrow

    const diffTime = Math.abs(deadline.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    for (let i = 0; i < Math.min(diffDays, 5); i++) {
        const stepDate = new Date(startDate);
        stepDate.setDate(startDate.getDate() + i);
        steps.push({
            id: uuidv4(),
            goalId: '',
            title: `Step ${i + 1} for ${goalTitle}`,
            description: `Do something productive on ${stepDate.toDateString()}`,
            date: stepDate,
            isCompleted: false,
        });
    }
    return steps;
};
