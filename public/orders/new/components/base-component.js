class BaseComponent {
    constructor(containerId, manager) {
        this.container = document.getElementById(containerId);
        this.manager = manager;
        this.state = {};
        
        if (!this.container) {
            console.error(`Container not found: ${containerId}`);
            return;
        }
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        throw new Error('render() must be implemented');
    }

    setupEventListeners() {
        // Override when needed
    }

    setState(newState) {
        this.state = {...this.state, ...newState};
        this.render();
    }

    emit(eventName, data) {
        document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }

    validate() {
        return true;
    }

    showError(message) {
        this.manager.showError(message);
    }
}
