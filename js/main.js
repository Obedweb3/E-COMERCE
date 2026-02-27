// Cart State
let cart = [];
let currentTotal = 0;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initScrollAnimations();
    initCounters();
    initProjectFilter();
    initPaymentMethods();
    loadCartFromStorage();
});

// Navigation
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 2px 20px rgba(0, 212, 255, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.service-card, .project-card, .pricing-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Counter Animation
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}

// Project Filter
function initProjectFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projects = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            projects.forEach(project => {
                if (filter === 'all' || project.getAttribute('data-category') === filter) {
                    project.style.display = 'block';
                    setTimeout(() => {
                        project.style.opacity = '1';
                        project.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    project.style.opacity = '0';
                    project.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        project.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Cart Functions
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        showNotification('Item already in cart!', 'warning');
        return;
    }

    cart.push({ id, name, price, quantity: 1 });
    updateCart();
    showNotification('Added to cart successfully!', 'success');
    toggleCart();
    saveCartToStorage();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
    saveCartToStorage();
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.getElementById('cartTotal');
    
    cartCount.textContent = cart.length;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        cartTotal.textContent = 'KES 0';
        currentTotal = 0;
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">KES ${item.price.toLocaleString()}</div>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    currentTotal = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = 'KES ' + currentTotal.toLocaleString();
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    cartSidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Payment Methods
function initPaymentMethods() {
    const methods = document.querySelectorAll('.payment-method');
    const forms = document.querySelectorAll('.payment-form');

    methods.forEach(method => {
        method.addEventListener('click', () => {
            const selectedMethod = method.getAttribute('data-method');
            
            methods.forEach(m => m.classList.remove('active'));
            method.classList.add('active');
            
            forms.forEach(form => form.classList.remove('active'));
            document.getElementById(selectedMethod + 'Form').classList.add('active');
        });
    });
}

function openPaymentModal() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    document.getElementById('paymentAmount').textContent = 'KES ' + currentTotal.toLocaleString();
    document.getElementById('paymentModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    toggleCart();
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function closeAllModals() {
    closePaymentModal();
    closeStatusModal();
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// M-Pesa STK Push Integration
async function initiateSTKPush() {
    const phoneInput = document.getElementById('mpesaPhone');
    const phone = phoneInput.value.trim();
    
    // Validation
    if (!phone || phone.length !== 12 || !phone.startsWith('254')) {
        showNotification('Please enter a valid phone number (2547XXXXXXXX)', 'error');
        phoneInput.focus();
        return;
    }

    // Show processing modal
    showStatusModal('processing', 'Initiating Payment...', 'Please wait while we process your request.');
    
    try {
        // Prepare payment data
        const paymentData = {
            phone: phone,
            amount: currentTotal,
            accountReference: 'OBEDTECH' + Date.now(),
            transactionDesc: 'Payment for services',
            cartItems: cart.map(item => item.name).join(', ')
        };

        // Call your backend API
        const response = await fetch('api/mpesa.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
        });

        const data = await response.json();

        if (data.ResponseCode === "0") {
            showStatusModal('success', 'STK Push Sent!', 
                'Please check your phone and enter your M-Pesa PIN to complete the payment.');
            
            // Start polling for payment status
            pollPaymentStatus(data.CheckoutRequestID);
        } else {
            showStatusModal('error', 'Payment Failed', 
                data.errorMessage || 'Unable to initiate payment. Please try again.');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showStatusModal('error', 'Connection Error', 
            'Unable to connect to payment server. Please check your internet connection.');
    }
}

function pollPaymentStatus(checkoutRequestID) {
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes (10 seconds interval)
    
    const pollInterval = setInterval(async () => {
        attempts++;
        
        if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            showStatusModal('error', 'Payment Timeout', 
                'Payment confirmation timed out. Please contact support if you completed the payment.');
            return;
        }

        try {
            const response = await fetch(`api/mpesa.php?checkoutRequestID=${checkoutRequestID}`);
            const data = await response.json();

            if (data.ResultCode === "0") {
                clearInterval(pollInterval);
                showStatusModal('success', 'Payment Successful!', 
                    'Thank you for your payment. We will contact you shortly to confirm your order.');
                clearCart();
            } else if (data.ResultCode && data.ResultCode !== "0") {
                clearInterval(pollInterval);
                showStatusModal('error', 'Payment Failed', 
                    data.ResultDesc || 'Payment was cancelled or failed.');
            }
            // If no ResultCode yet, continue polling
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 10000); // Poll every 10 seconds
}

function showStatusModal(type, title, message) {
    const modal = document.getElementById('statusModal');
    const icon = document.getElementById('statusIcon');
    const titleEl = document.getElementById('statusTitle');
    const messageEl = document.getElementById('statusMessage');
    const closeBtn = document.getElementById('closeStatusBtn');
    
    // Set icon based on type
    let iconHtml = '';
    let iconClass = '';
    
    switch(type) {
        case 'processing':
            iconHtml = '<i class="fas fa-spinner fa-spin"></i>';
            iconClass = '';
            closeBtn.style.display = 'none';
            break;
        case 'success':
            iconHtml = '<i class="fas fa-check-circle"></i>';
            iconClass = 'success';
            closeBtn.style.display = 'block';
            break;
        case 'error':
            iconHtml = '<i class="fas fa-times-circle"></i>';
            iconClass = 'error';
            closeBtn.style.display = 'block';
            break;
    }
    
    icon.innerHTML = iconHtml;
    icon.className = 'status-icon ' + iconClass;
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    modal.classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#00f5d4' : type === 'error' ? '#ff006e' : '#00d4ff'};
        color: ${type === 'success' ? '#0a0e27' : '#fff'};
        padding: 1rem 1.5rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 5000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function clearCart() {
    cart = [];
    updateCart();
    saveCartToStorage();
    closePaymentModal();
}

function saveCartToStorage() {
    localStorage.setItem('obedtech_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('obedtech_cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCart();
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Contact Form Handler
document.getElementById('contactForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        message: document.getElementById('message').value
    };
    
    // Here you would normally send to your backend
    console.log('Form submitted:', formData);
    showNotification('Message sent successfully! We will contact you soon.', 'success');
    this.reset();
});
