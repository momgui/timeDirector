import { Goal, Step } from '../types';
import { GEMINI_API_KEY } from '../config';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

export const generateSteps = async (goalTitle: string, deadline: Date): Promise<Step[]> => {
    // Placeholder for AI generation
    // In a real app, you would call the Gemini API here

    // Mock response for MVP if no API key
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        console.log('Using mock AI response');
        return generateMockSteps(goalTitle, deadline);
    }

    try {
        const prompt = `
      I have a goal: "${goalTitle}".
      The deadline is: ${deadline.toDateString()}.
      Break this down into daily actionable steps starting from today.
      Return ONLY a JSON array of objects with fields: "title", "description", "date" (YYYY-MM-DD).
    `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
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

        const data = await response.json();
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
    const diffTime = Math.abs(deadline.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    for (let i = 0; i < Math.min(diffDays, 5); i++) {
        const stepDate = new Date(today);
        stepDate.setDate(today.getDate() + i + 1);
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
