/**
 * AI Team Office - Component Library
 * Reusable UI components for the application
 */

// === BUTTON COMPONENT ===
class AIButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    static get observedAttributes() {
        return ['variant', 'size', 'disabled'];
    }
    
    connectedCallback() {
        this.render();
    }
    
    attributeChangedCallback() {
        this.render();
    }
    
    render() {
        const variant = this.getAttribute('variant') || 'primary';
        const size = this.getAttribute('size') || 'md';
        const disabled = this.hasAttribute('disabled');
        
        const sizeClasses = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base'
        };
        
        const variantClasses = {
            primary: 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-500/30',
            secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
            ghost: 'text-white/70 hover:text-white hover:bg-white/5'
        };
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: inline-block; }
                button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    border-radius: 9999px;
                    font-weight: 500;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    cursor: pointer;
                    border: none;
                    outline: none;
                }
                button:hover:not(:disabled) {
                    transform: translateY(-2px);
                }
                button:active:not(:disabled) {
                    transform: translateY(0);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                button:focus-visible {
                    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
                }
            </style>
            <button class="${variantClasses[variant]} ${sizeClasses[size]}" ${disabled ? 'disabled' : ''}>
                <slot></slot>
            </button>
        `;
    }
}

// === BADGE COMPONENT ===
class AIBadge extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    static get observedAttributes() {
        return ['variant'];
    }
    
    connectedCallback() {
        this.render();
    }
    
    attributeChangedCallback() {
        this.render();
    }
    
    render() {
        const variant = this.getAttribute('variant') || 'default';
        
        const variantStyles = {
            default: 'bg-white/10 text-white/80 border-white/10',
            success: 'bg-green-500/15 text-green-400 border-green-500/30',
            warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
            error: 'bg-red-500/15 text-red-400 border-red-500/30',
            info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
        };
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: inline-flex; }
                span {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.75rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    border-radius: 9999px;
                    border: 1px solid;
                }
            </style>
            <span class="${variantStyles[variant]}">
                <slot></slot>
            </span>
        `;
    }
}

// === CARD COMPONENT ===
class AICard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    static get observedAttributes() {
        return ['variant', 'hover'];
    }
    
    connectedCallback() {
        this.render();
    }
    
    render() {
        const variant = this.getAttribute('variant') || 'glass';
        const hover = this.hasAttribute('hover');
        
        const variantStyles = {
            glass: 'bg-white/[0.03] backdrop-blur-xl border-white/10',
            solid: 'bg-[#1a1a2e] border-white/5',
            gradient: 'bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-violet-500/20'
        };
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .card {
                    border-radius: 1rem;
                    border: 1px solid;
                    padding: 1.5rem;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .card.hover:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(139, 92, 246, 0.15);
                }
            </style>
            <div class="card ${variantStyles[variant]} ${hover ? 'hover' : ''}">
                <slot></slot>
            </div>
        `;
    }
}

// === AGENT AVATAR COMPONENT ===
class AIAvatar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    static get observedAttributes() {
        return ['emoji', 'status', 'size'];
    }
    
    connectedCallback() {
        this.render();
    }
    
    attributeChangedCallback() {
        this.render();
    }
    
    render() {
        const emoji = this.getAttribute('emoji') || '🤖';
        const status = this.getAttribute('status') || 'offline';
        const size = this.getAttribute('size') || 'md';
        
        const sizeClasses = {
            sm: 'w-8 h-8 text-sm',
            md: 'w-10 h-10 text-base',
            lg: 'w-14 h-14 text-xl',
            xl: 'w-20 h-20 text-3xl'
        };
        
        const statusColors = {
            online: 'bg-green-500 shadow-green-500/50',
            working: 'bg-green-500 shadow-green-500/50',
            resting: 'bg-amber-500 shadow-amber-500/50',
            offline: 'bg-gray-500 shadow-gray-500/50'
        };
        
        const statusAnimation = status === 'working' ? 'animate-bounce' : '';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: inline-block; }
                .avatar {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(15, 15, 26, 0.8);
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                }
                .status-indicator {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 25%;
                    height: 25%;
                    border-radius: 50%;
                    border: 2px solid rgba(15, 15, 26, 0.8);
                    box-shadow: 0 0 10px;
                }
                .status-indicator.online,
                .status-indicator.working {
                    animation: pulse 2s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }
                .animate-bounce {
                    animation: bounce 2s ease-in-out infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
            </style>
            <div class="avatar ${sizeClasses[size]}">
                ${emoji}
                <div class="status-indicator ${statusColors[status]} ${statusAnimation}"></div>
            </div>
        `;
    }
}

// === PROGRESS BAR COMPONENT ===
class AIProgress extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    static get observedAttributes() {
        return ['value', 'max', 'variant'];
    }
    
    connectedCallback() {
        this.render();
    }
    
    attributeChangedCallback() {
        this.render();
    }
    
    render() {
        const value = parseInt(this.getAttribute('value') || '0');
        const max = parseInt(this.getAttribute('max') || '100');
        const variant = this.getAttribute('variant') || 'primary';
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));
        
        const variantColors = {
            primary: 'from-violet-500 to-fuchsia-500',
            success: 'from-green-500 to-emerald-500',
            warning: 'from-amber-500 to-orange-500',
            info: 'from-cyan-500 to-blue-500'
        };
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .progress-container {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 9999px;
                    overflow: hidden;
                }
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, var(--gradient-from), var(--gradient-to));
                    border-radius: 9999px;
                    transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
                }
            </style>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${percentage}%; --gradient-from: inherit; --gradient-to: inherit; background: linear-gradient(90deg, ${variantColors[variant].replace('from-', '').replace(' to-', ', ')})`"></div>
            </div>
        `;
    }
}

// === TOOLTIP COMPONENT ===
class AITooltip extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
        this.setupEvents();
    }
    
    render() {
        const text = this.getAttribute('text') || '';
        const position = this.getAttribute('position') || 'top';
        
        const positionStyles = {
            top: 'bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-8px);',
            bottom: 'top: 100%; left: 50%; transform: translateX(-50%) translateY(8px);',
            left: 'right: 100%; top: 50%; transform: translateY(-50%) translateX(-8px);',
            right: 'left: 100%; top: 50%; transform: translateY(-50%) translateX(8px);'
        };
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: inline-block; position: relative; }
                .tooltip {
                    position: absolute;
                    ${positionStyles[position]}
                    padding: 0.5rem 0.75rem;
                    background: rgba(15, 15, 26, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0.5rem;
                    font-size: 0.75rem;
                    color: white;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.2s ease;
                    z-index: 1000;
                    pointer-events: none;
                }
                .tooltip.visible {
                    opacity: 1;
                    visibility: visible;
                }
            </style>
            <slot></slot>
            <div class="tooltip">${text}</div>
        `;
    }
    
    setupEvents() {
        const slot = this.shadowRoot.querySelector('slot');
        const tooltip = this.shadowRoot.querySelector('.tooltip');
        
        this.addEventListener('mouseenter', () => tooltip.classList.add('visible'));
        this.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
        this.addEventListener('focus', () => tooltip.classList.add('visible'));
        this.addEventListener('blur', () => tooltip.classList.remove('visible'));
    }
}

// Register all components
customElements.define('ai-button', AIButton);
customElements.define('ai-badge', AIBadge);
customElements.define('ai-card', AICard);
customElements.define('ai-avatar', AIAvatar);
customElements.define('ai-progress', AIProgress);
customElements.define('ai-tooltip', AITooltip);

export { AIButton, AIBadge, AICard, AIAvatar, AIProgress, AITooltip };
