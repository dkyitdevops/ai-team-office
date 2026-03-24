/**
 * AI Team Office - Animation Utilities
 * Smooth 60fps animations and micro-interactions
 */

const AnimationUtils = {
    // Easing functions
    easings: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    },
    
    // Animate element with FLIP technique
    flip(element, callback, duration = 300) {
        const first = element.getBoundingClientRect();
        
        callback();
        
        const last = element.getBoundingClientRect();
        
        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;
        const deltaW = first.width / last.width;
        const deltaH = first.height / last.height;
        
        element.animate([
            { transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})` },
            { transform: 'none' }
        ], {
            duration,
            easing: this.easings.out
        });
    },
    
    // Stagger animation for multiple elements
    stagger(elements, animation, delay = 50) {
        elements.forEach((el, i) => {
            setTimeout(() => {
                el.animate(animation, {
                    duration: 400,
                    easing: this.easings.out,
                    fill: 'forwards'
                });
            }, i * delay);
        });
    },
    
    // Smooth scroll to element
    scrollTo(target, offset = 80) {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
            
        if (!element) return;
        
        const top = element.getBoundingClientRect().top + window.scrollY - offset;
        
        window.scrollTo({
            top,
            behavior: 'smooth'
        });
    },
    
    // Parallax effect
    parallax(element, speed = 0.5) {
        let ticking = false;
        
        const update = () => {
            const scrolled = window.scrollY;
            const rate = scrolled * speed;
            element.style.transform = `translate3d(0, ${rate}px, 0)`;
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });
    },
    
    // Intersection Observer for scroll animations
    observeOnScroll(elements, callback, options = {}) {
        const defaultOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            ...options
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, defaultOptions);
        
        elements.forEach(el => observer.observe(el));
        
        return observer;
    },
    
    // Magnetic button effect
    magnetic(element, strength = 0.3) {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            element.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translate(0, 0)';
        });
    },
    
    // Typewriter effect
    typewriter(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };
        
        type();
    },
    
    // Count up animation
    countUp(element, target, duration = 2000) {
        const start = 0;
        const startTime = performance.now();
        
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeProgress);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        
        requestAnimationFrame(update);
    },
    
    // Ripple effect for buttons
    createRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    },
    
    // Reveal animation variants
    reveal: {
        fadeUp: [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ],
        fadeIn: [
            { opacity: 0 },
            { opacity: 1 }
        ],
        scaleIn: [
            { opacity: 0, transform: 'scale(0.9)' },
            { opacity: 1, transform: 'scale(1)' }
        ],
        slideLeft: [
            { opacity: 0, transform: 'translateX(-30px)' },
            { opacity: 1, transform: 'translateX(0)' }
        ],
        slideRight: [
            { opacity: 0, transform: 'translateX(30px)' },
            { opacity: 1, transform: 'translateX(0)' }
        ]
    }
};

// Add ripple keyframes to document
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

export default AnimationUtils;
