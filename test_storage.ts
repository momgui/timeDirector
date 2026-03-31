import { saveSteps, getSteps } from './src/services/storage';
import { Step } from './src/types';
import { v4 as uuidv4 } from 'uuid';

async function run() {
    const newSteps: Step[] = [{
        id: uuidv4(),
        title: "Test Brain Dump Task",
        date: new Date(),
        isCompleted: false,
        effort: 1,
        category: 'PERSONAL',
        type: 'task'
    }];
    console.log("Saving new steps...", newSteps);
    await saveSteps(newSteps);
    const loadedSteps = await getSteps();
    console.log("Loaded Steps:", loadedSteps.filter(s => s.title === "Test Brain Dump Task"));
}

run().catch(console.error);
