export class WizardManager {
    constructor() {
        // ...existing code-like structure...
        this.currentStep = 1;
    }

    nextStep() {
        // ...logic to move wizard to next step...
    }

    prevStep() {
        // ...logic to move wizard to previous step...
    }

    setStepCompleted(stepNumber, isComplete) {
        // ...visual or state changes...
    }
}

window.wizardManager = new WizardManager();
